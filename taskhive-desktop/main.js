import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } from 'electron'
import activeWin from 'active-win'
import db, { insertLog } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@demo.com',
    password: 'admin123',
    user: {
      id: 'demo-admin',
      name: 'Demo Admin',
      email: 'admin@demo.com',
      role: 'admin',
      department: 'Management',
      companyName: 'Blackroth Group'
    }
  },
  employee: {
    email: 'employee@demo.com',
    password: 'emp123',
    user: {
      id: 'demo-employee',
      name: 'Demo Employee',
      email: 'employee@demo.com',
      role: 'employee',
      department: 'Engineering'
    }
  }
}

const PRODUCTIVE_APPS = ['code', 'visual studio', 'intellij', 'figma', 'terminal', 'powershell', 'cmd']
const PRODUCTIVE_SITES = ['github.com', 'jira.atlassian.com', 'chatgpt.com', 'gemini.google.com', 'mail.google.com', 'outlook.office.com']
const UNPRODUCTIVE_SITES = ['youtube.com']

function findFirstExistingPath(candidates) {
  return candidates.find((candidatePath) => fs.existsSync(candidatePath)) || null
}

function resolveIconPath() {
  return findFirstExistingPath([
    path.join(__dirname, '../build/icon.ico'),
    path.join(process.resourcesPath, 'build/icon.ico'),
    path.join(process.cwd(), 'build/icon.ico'),
    path.join(process.cwd(), 'public/favicon.ico')
  ])
}

function resolveRuntimeIconPath() {
  return findFirstExistingPath([
    path.join(__dirname, '../web-dist/favicon.ico'),
    path.join(process.resourcesPath, 'web-dist/favicon.ico'),
    path.join(__dirname, '../../public/favicon.ico'),
    path.join(process.cwd(), '../public/favicon.ico'),
    path.join(process.cwd(), 'web-dist/favicon.ico'),
    path.join(process.cwd(), 'build/icon.ico')
  ])
}

function resolveRendererIndexPath() {
  return findFirstExistingPath([
    path.join(__dirname, '../web-dist/index.html'),
    path.join(process.resourcesPath, 'web-dist/index.html'),
    path.join(__dirname, '../../dist/index.html'),
    path.join(__dirname, '../dist/index.html')
  ])
}

const iconPath = resolveIconPath()
const runtimeIconPath = resolveRuntimeIconPath() || iconPath
const rendererDevUrl = process.env.TASKHIVE_WEB_URL || process.env.ELECTRON_RENDERER_URL || 'http://127.0.0.1:5173'

let mainWindow = null
let widgetWindow = null
let tray = null
let isQuitting = false
let trackingInterval = null
let widgetTimer = null

let lastApp = null
let lastWebsite = null
let lastStart = Date.now()

let isLoggedIn = false
let timerRunning = false
let timerStartedAt = null
let elapsedSeconds = 0
let widgetExpanded = false
let currentUser = null

function formatDuration(seconds) {
  const total = Math.max(0, seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function normalizeRoute(targetPath = '/') {
  const withLeadingSlash = targetPath.startsWith('/') ? targetPath : `/${targetPath}`
  return withLeadingSlash === '/admin' ? '/admin/dashboard'
    : withLeadingSlash === '/employee' ? '/employee/dashboard'
    : withLeadingSlash
}

function getRendererEntry(targetPath = '/') {
  const normalizedPath = normalizeRoute(targetPath)
  const rendererIndexPath = resolveRendererIndexPath()

  if (!app.isPackaged && (process.env.TASKHIVE_WEB_URL || process.env.ELECTRON_RENDERER_URL)) {
    return new URL(normalizedPath, `${rendererDevUrl}/`).toString()
  }

  if (!rendererIndexPath) {
    if (!app.isPackaged) {
      return new URL(normalizedPath, `${rendererDevUrl}/`).toString()
    }

    throw new Error('TaskHive web build not found. Build the web app before packaging Electron.')
  }

  const indexUrl = new URL(`file://${rendererIndexPath}`)
  indexUrl.hash = normalizedPath
  return indexUrl.toString()
}

function getTrackingStatus() {
  if (!lastApp) {
    return {
      app: 'Waiting for activity...',
      site: 'No active website',
      duration: '0s'
    }
  }

  return {
    app: lastApp,
    site: lastWebsite || 'Desktop app',
    duration: formatDuration(Math.floor((Date.now() - lastStart) / 1000))
  }
}

function getElapsedSeconds() {
  if (!timerRunning || !timerStartedAt) return elapsedSeconds
  return elapsedSeconds + Math.floor((Date.now() - timerStartedAt) / 1000)
}

function getWidgetState() {
  const tracking = getTrackingStatus()

  return {
    loggedIn: isLoggedIn,
    userName: currentUser?.name || '',
    userRole: currentUser?.role || '',
    running: timerRunning,
    elapsed: formatDuration(getElapsedSeconds()),
    app: tracking.app,
    site: tracking.site,
    trackingFor: tracking.duration
  }
}

function getRendererBaseUrl() {
  if (!mainWindow || mainWindow.isDestroyed()) return getRendererEntry('/login')
  return mainWindow.webContents.getURL() || getRendererEntry('/login')
}

function buildAppUrl(targetPath = '/') {
  const normalizedPath = normalizeRoute(targetPath)
  const baseUrl = getRendererBaseUrl()
  const currentUrl = new URL(baseUrl)

  if (currentUrl.protocol === 'file:') {
    currentUrl.hash = normalizedPath
    return currentUrl.toString()
  }

  return new URL(normalizedPath, `${currentUrl.origin}/`).toString()
}

function waitForMainWindowReady() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return Promise.reject(new Error('Main window is not available'))
  }

  if (!mainWindow.webContents.isLoadingMainFrame()) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    mainWindow.webContents.once('did-finish-load', resolve)
  })
}

async function runInRenderer(script) {
  await waitForMainWindowReady()
  return mainWindow.webContents.executeJavaScript(script, true)
}

function broadcastRendererEvent(eventName) {
  return `window.dispatchEvent(new CustomEvent(${JSON.stringify(eventName)}));`
}

function getRendererLoginScript(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase()

  return `(() => {
    const email = ${JSON.stringify(normalizedEmail)};
    const password = ${JSON.stringify(password)};
    const demoCredentials = ${JSON.stringify(DEMO_CREDENTIALS)};

    const toAuthUser = (user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      companyName: user.companyName
    });

    const createSession = (user) => {
      const authUser = toAuthUser(user);
      const now = new Date().toISOString();
      localStorage.setItem('taskhive_user', JSON.stringify(authUser));
      localStorage.setItem('taskhive_session', JSON.stringify({
        userId: authUser.id,
        loginTime: now,
        lastActivity: now,
        isActive: true
      }));
      ${broadcastRendererEvent('taskhive:auth-sync')}
      return authUser;
    };

    if (email === demoCredentials.admin.email && password === demoCredentials.admin.password) {
      return { success: true, user: createSession(demoCredentials.admin.user) };
    }

    if (email === demoCredentials.employee.email && password === demoCredentials.employee.password) {
      return { success: true, user: createSession(demoCredentials.employee.user) };
    }

    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('taskhive_users') || '[]');
    } catch (_error) {
      users = [];
    }

    const foundUser = users.find((user) => String(user.email || '').toLowerCase() === email);

    if (!foundUser) {
      return { success: false, error: 'User not found. Please check your email.' };
    }

    if (foundUser.status === 'inactive') {
      return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
    }

    if (String(foundUser.password || '') !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    return { success: true, user: createSession(foundUser) };
  })()`
}

async function loginRendererUser(email, password) {
  return runInRenderer(getRendererLoginScript(email, password))
}

async function clearRendererSession() {
  try {
    await runInRenderer(`(() => {
      localStorage.removeItem('taskhive_user');
      localStorage.removeItem('taskhive_session');
      ${broadcastRendererEvent('taskhive:auth-sync')}
      return true;
    })()`)
  } catch (_error) {
    // Ignore cleanup failures if the renderer is not reachable.
  }
}

async function navigateRendererToUserHome(user) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const nextPath = user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'
  await mainWindow.loadURL(buildAppUrl(nextPath))
}

function resetDesktopSession() {
  timerRunning = false
  timerStartedAt = null
  elapsedSeconds = 0
  isLoggedIn = false
  currentUser = null
  lastApp = null
  lastWebsite = null
  lastStart = Date.now()
}

function categorizeActivity(appName, website) {
  const normalizedApp = String(appName || '').toLowerCase()
  const normalizedSite = String(website || '').toLowerCase()

  if (UNPRODUCTIVE_SITES.some((site) => normalizedSite.includes(site))) {
    return 'unproductive'
  }

  if (PRODUCTIVE_SITES.some((site) => normalizedSite.includes(site)) || PRODUCTIVE_APPS.some((appNamePart) => normalizedApp.includes(appNamePart))) {
    return 'productive'
  }

  return 'neutral'
}

async function syncRendererTimerState() {
  if (!currentUser) return

  const timerState = {
    userId: currentUser.id,
    projectId: null,
    taskId: null,
    startTime: timerStartedAt ? new Date(timerStartedAt).toISOString() : new Date().toISOString(),
    elapsedSeconds: getElapsedSeconds(),
    isRunning: timerRunning,
    isPaused: false,
    isBreak: false,
    description: `${currentUser.role === 'admin' ? 'Admin' : 'Desktop'} tracker`,
    isManual: true
  }

  try {
    await runInRenderer(`(() => {
      const key = 'taskhive_timer_state';
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      states[${JSON.stringify(currentUser.id)}] = ${JSON.stringify(timerState)};
      localStorage.setItem(key, JSON.stringify(states));
      ${broadcastRendererEvent('taskhive:timer-sync')}
      return true;
    })()`)
  } catch (_error) {
    // Renderer sync is best effort.
  }
}

async function clearRendererTimerState(userId) {
  if (!userId) return

  try {
    await runInRenderer(`(() => {
      const key = 'taskhive_timer_state';
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      delete states[${JSON.stringify(userId)}];
      localStorage.setItem(key, JSON.stringify(states));
      ${broadcastRendererEvent('taskhive:timer-sync')}
      return true;
    })()`)
  } catch (_error) {
    // Renderer sync is best effort.
  }
}

async function appendRendererActivity(entry) {
  try {
    await runInRenderer(`(() => {
      const key = 'taskhive_activities';
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      items.unshift(${JSON.stringify(entry)});
      localStorage.setItem(key, JSON.stringify(items.slice(0, 500)));
      ${broadcastRendererEvent('taskhive:data-sync')}
      return true;
    })()`)
  } catch (_error) {
    // Renderer sync is best effort.
  }
}

async function appendRendererTimeEntry(entry) {
  try {
    await runInRenderer(`(() => {
      const key = 'taskhive_time_entries';
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      items.unshift(${JSON.stringify(entry)});
      localStorage.setItem(key, JSON.stringify(items));
      ${broadcastRendererEvent('taskhive:data-sync')}
      return true;
    })()`)
  } catch (_error) {
    // Renderer sync is best effort.
  }
}

async function persistDesktopTimeEntry(startMs, endMs) {
  if (!currentUser || !startMs || endMs <= startMs) return

  const durationMinutes = Math.max(1, Math.floor((endMs - startMs) / 60000))
  const startTime = new Date(startMs)
  const endTime = new Date(endMs)

  await appendRendererTimeEntry({
    id: `te-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    projectId: '',
    projectName: 'Desktop Tracking',
    taskId: '',
    taskName: timerRunning ? 'Desktop Session' : 'Completed Desktop Session',
    startTime: startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    endTime: endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    duration: durationMinutes,
    description: `${lastApp || 'Desktop'}${lastWebsite ? ` • ${lastWebsite}` : ''}`,
    date: startTime.toISOString().split('T')[0]
  })
}

function updateWidgetStatus() {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  widgetWindow.webContents.send('taskhive:widget-state', getWidgetState())
}

async function flushCurrentActivity(endTime = Date.now()) {
  if (!lastApp || !currentUser) return

  const durationSeconds = Math.floor((endTime - lastStart) / 1000)
  if (durationSeconds < 3) return

  insertLog(
    lastApp,
    lastWebsite,
    new Date(lastStart).toISOString(),
    new Date(endTime).toISOString(),
    durationSeconds
  )

  await appendRendererActivity({
    id: `a-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    type: lastWebsite ? 'site' : 'app',
    name: lastWebsite || lastApp,
    duration: Math.max(1, Math.floor(durationSeconds / 60)),
    timestamp: new Date(lastStart).toISOString().replace('T', ' ').slice(0, 16),
    category: categorizeActivity(lastApp, lastWebsite)
  })
}

async function trackActivity() {
  if (!isLoggedIn || !timerRunning) return

  const win = await activeWin()
  if (!win) return

  const appName = win.owner.name
  const title = win.title || ''
  let website = null

  const isBrowser = (
    appName.toLowerCase().includes('edge') ||
    appName.toLowerCase().includes('chrome') ||
    appName.toLowerCase().includes('firefox')
  )

  if (isBrowser) {
    const cleanTitle = title
      .replace(/ - Microsoft Edge| â€“ Microsoft Edge| - Google Chrome| â€“ Google Chrome| - Personal| â€“ Personal/i, '')
      .trim()

    const lower = cleanTitle.toLowerCase()

    if (lower.includes('outlook') || lower.includes('office.com')) {
      website = 'outlook.office.com'
    } else if ((lower.includes('mail.google.com') || lower.includes('gmail')) && lower.includes('inbox')) {
      website = 'mail.google.com'
    } else if (lower.includes('github')) {
      website = 'github.com'
    } else if (lower.includes('chatgpt')) {
      website = 'chatgpt.com'
    } else if (lower.includes('gemini') || lower.includes('google ai')) {
      website = 'gemini.google.com'
    } else if (lower.includes('youtube')) {
      website = 'youtube.com'
    } else if (lower.includes('jira') || lower.includes('atlassian')) {
      website = 'jira.atlassian.com'
    } else if (lower.includes('google')) {
      website = 'google.com'
    } else if (cleanTitle.includes('.') && !cleanTitle.includes('â€“')) {
      website = cleanTitle
    }
  }

  const appChanged = lastApp !== appName
  const siteChanged = isBrowser && website !== lastWebsite && lastWebsite !== null

  if (appChanged || siteChanged) {
    const now = Date.now()
    await flushCurrentActivity(now)
    lastApp = appName
    lastWebsite = website
    lastStart = now
  }

  updateWidgetStatus()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    show: false,
    autoHideMenuBar: true,
    icon: runtimeIconPath || iconPath || undefined,
    webPreferences: {
      contextIsolation: true
    }
  })

  mainWindow.loadURL(getRendererEntry('/login'))

  mainWindow.on('close', () => {
    if (isQuitting) return
    isQuitting = true
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.destroy()
    }
    if (tray) {
      tray.destroy()
      tray = null
    }
    app.quit()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (trackingInterval) clearInterval(trackingInterval)
  trackingInterval = setInterval(() => {
    trackActivity().catch(() => {})
  }, 3000)
}

function createWidget() {
  widgetWindow = new BrowserWindow({
    width: 52,
    height: 52,
    x: 20,
    y: 20,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    hasShadow: false,
    icon: runtimeIconPath || iconPath || undefined,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  widgetWindow.setAlwaysOnTop(true, 'screen-saver')
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  let iconUrl = ''
  if (runtimeIconPath) {
    try {
      const iconBuffer = fs.readFileSync(runtimeIconPath)
      const isPng = iconBuffer[0] === 0x89 && iconBuffer[1] === 0x50 && iconBuffer[2] === 0x4E && iconBuffer[3] === 0x47
      const mimeType = isPng ? 'image/png' : 'image/x-icon'
      iconUrl = `data:${mimeType};base64,${iconBuffer.toString('base64')}`
    } catch (_error) {
      iconUrl = ''
    }
  }

  const widgetHtml = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>TaskHive Widget</title>
      <style>
        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, sans-serif;
          overflow: hidden;
          background: transparent;
        }
        .icon {
          width: 52px;
          height: 52px;
          margin: 0;
          padding: 0;
          border: 0;
          cursor: pointer;
          background: transparent;
          overflow: hidden;
          line-height: 0;
          position: relative;
          -webkit-app-region: no-drag;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon img,
        .icon .fallback {
          width: 100%;
          height: 100%;
          border-radius: 18px;
          display: block;
        }
        .icon .fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #0f766e, #0f172a 72%);
          color: #f8fafc;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.08em;
        }
        .icon .dot {
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid rgba(15, 23, 42, 0.95);
          background: #ef4444;
        }
        .dot.running {
          background: #22c55e;
        }
        .panel {
          position: absolute;
          top: 56px;
          left: 4px;
          width: 344px;
          background:
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 30%),
            linear-gradient(180deg, rgba(8, 15, 28, 0.98), rgba(15, 23, 42, 0.98));
          color: #e7edf7;
          border: 1px solid rgba(71, 85, 105, 0.95);
          border-radius: 18px;
          box-shadow: 0 24px 48px rgba(2, 6, 23, 0.55);
          padding: 16px;
          display: none;
        }
        .panel.show {
          display: block;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(71, 85, 105, 0.5);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          overflow: hidden;
          flex: 0 0 auto;
          background: linear-gradient(135deg, #0ea5e9, #0f766e);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-mark img,
        .brand-mark .fallback {
          width: 100%;
          height: 100%;
        }
        .brand-copy {
          min-width: 0;
        }
        .brand-copy strong {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
        }
        .brand-copy span {
          display: block;
          font-size: 11px;
          color: #94a3b8;
        }
        .status-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(239, 68, 68, 0.14);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.35);
          white-space: nowrap;
        }
        .status-pill.running {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
          border-color: rgba(34, 197, 94, 0.35);
        }
        .hero {
          margin-bottom: 14px;
          padding: 14px;
          border-radius: 16px;
          background: linear-gradient(140deg, rgba(14, 165, 233, 0.16), rgba(15, 23, 42, 0.55));
          border: 1px solid rgba(56, 189, 248, 0.18);
        }
        .hero-title {
          font-size: 15px;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        .hero-copy {
          font-size: 12px;
          line-height: 1.45;
          color: #cbd5e1;
        }
        .row {
          margin-bottom: 12px;
        }
        .label {
          font-size: 11px;
          color: #90a5ba;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .value {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(71, 85, 105, 0.9);
          background: rgba(15, 23, 42, 0.92);
          color: #f1f5f9;
          border-radius: 12px;
          padding: 11px 12px;
          margin-bottom: 10px;
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }
        input:focus {
          border-color: rgba(56, 189, 248, 0.95);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.16);
        }
        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        button {
          border: 0;
          border-radius: 12px;
          padding: 9px 12px;
          color: #eaf3fb;
          cursor: pointer;
          background: #334155;
          font-weight: 600;
        }
        .primary {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
        }
        .danger {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
        }
        .muted {
          color: #90a5ba;
          font-size: 11px;
        }
        .panel-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border: 0;
          border-radius: 6px;
          color: #d7e0ea;
          background: #334155;
          cursor: pointer;
          line-height: 24px;
          text-align: center;
          padding: 0;
        }
        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .stat-card {
          padding: 12px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.82);
          border: 1px solid rgba(71, 85, 105, 0.55);
        }
        .stat-card .label {
          margin-bottom: 4px;
        }
        .stat-card .value {
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
        }
        .wide {
          grid-column: 1 / -1;
        }
      </style>
    </head>
    <body>
      <button id="ws-icon" class="icon" title="Open timer">
        ${iconUrl ? `<img alt="" src="${iconUrl}" />` : '<div class="fallback">TH</div>'}
        <div id="ws-dot" class="dot"></div>
      </button>

      <div id="ws-panel" class="panel">
        <button id="ws-close-panel" class="panel-close" title="Close">X</button>
        <div class="header">
          <div class="brand">
            <div class="brand-mark">
              ${iconUrl ? `<img alt="" src="${iconUrl}" />` : '<div class="fallback">TH</div>'}
            </div>
            <div class="brand-copy">
              <strong>TaskHive Tracker</strong>
              <span>Desktop time tracking</span>
            </div>
          </div>
          <div id="ws-status-pill" class="status-pill">Offline</div>
        </div>

        <div class="hero">
          <div class="hero-title">Track from the desktop</div>
          <div class="hero-copy">Log in once, start tracking from the floating launcher, and keep the TaskHive dashboard in sync.</div>
        </div>

        <div id="ws-login-section">
          <div class="row">
            <div class="label">Work Email</div>
            <input id="ws-email" placeholder="employee@demo.com" />
            <div class="label">Password</div>
            <input id="ws-password" type="password" placeholder="Enter password" />
            <div class="actions">
              <button id="ws-login-btn" class="primary">Login</button>
            </div>
            <div id="ws-login-error" class="muted" style="color:#fca5a5; min-height: 16px;"></div>
            <div class="muted">Timer starts only after login and pressing Start.</div>
          </div>
        </div>

        <div id="ws-control-section" style="display:none;">
          <div class="stats">
            <div class="stat-card">
              <div class="label">Signed In</div>
              <div id="ws-user" class="value">-</div>
            </div>
            <div class="stat-card">
              <div class="label">Timer</div>
              <div id="ws-elapsed" class="value">0s</div>
            </div>
            <div class="stat-card wide">
              <div class="label">Active App</div>
              <div id="ws-app" class="value">Waiting for activity...</div>
            </div>
            <div class="stat-card wide">
              <div class="label">Website</div>
              <div id="ws-site" class="value">No active website</div>
            </div>
          </div>
          <div class="actions">
            <button id="ws-start-stop" class="primary">Start</button>
            <button id="ws-open-main">Open App</button>
            <button id="ws-logout" class="danger">Logout</button>
          </div>
        </div>
      </div>

      <script>
        const { ipcRenderer } = require('electron')
        const iconBtn = document.getElementById('ws-icon')
        const panel = document.getElementById('ws-panel')
        const dot = document.getElementById('ws-dot')
        const loginSection = document.getElementById('ws-login-section')
        const controlSection = document.getElementById('ws-control-section')
        const startStopBtn = document.getElementById('ws-start-stop')
        const statusPill = document.getElementById('ws-status-pill')
        const loginError = document.getElementById('ws-login-error')
        const emailInput = document.getElementById('ws-email')
        const passwordInput = document.getElementById('ws-password')
        let dragData = null

        iconBtn.addEventListener('click', () => ipcRenderer.send('taskhive:icon-click'))
        iconBtn.addEventListener('mousedown', (event) => {
          if (event.button !== 0) return
          dragData = { startX: event.screenX, startY: event.screenY, active: true }
        })
        window.addEventListener('mousemove', (event) => {
          if (!dragData || !dragData.active) return
          const dx = event.screenX - dragData.startX
          const dy = event.screenY - dragData.startY
          if (dx !== 0 || dy !== 0) {
            ipcRenderer.send('taskhive:drag-widget', { dx, dy })
            dragData.startX = event.screenX
            dragData.startY = event.screenY
          }
        })
        window.addEventListener('mouseup', () => {
          if (dragData) dragData.active = false
        })
        document.getElementById('ws-login-btn').addEventListener('click', () => {
          loginError.textContent = ''
          ipcRenderer.send('taskhive:login', {
            email: emailInput.value,
            password: passwordInput.value
          })
        })
        passwordInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            document.getElementById('ws-login-btn').click()
          }
        })
        startStopBtn.addEventListener('click', () => ipcRenderer.send('taskhive:toggle-timer'))
        document.getElementById('ws-logout').addEventListener('click', () => ipcRenderer.send('taskhive:logout'))
        document.getElementById('ws-open-main').addEventListener('click', () => ipcRenderer.send('taskhive:open-main'))
        document.getElementById('ws-close-panel').addEventListener('click', () => ipcRenderer.send('taskhive:close-widget'))

        ipcRenderer.on('taskhive:login-result', (_, result) => {
          if (result.success) {
            loginError.textContent = ''
            passwordInput.value = ''
            return
          }

          loginError.textContent = result.error || 'Login failed.'
        })

        ipcRenderer.on('taskhive:widget-layout', (_, payload) => {
          panel.classList.toggle('show', payload.expanded)
        })

        ipcRenderer.on('taskhive:widget-state', (_, state) => {
          loginSection.style.display = state.loggedIn ? 'none' : 'block'
          controlSection.style.display = state.loggedIn ? 'block' : 'none'
          dot.classList.toggle('running', state.running)
          statusPill.classList.toggle('running', state.running)
          statusPill.textContent = state.running ? 'Tracking' : state.loggedIn ? 'Ready' : 'Offline'
          startStopBtn.textContent = state.running ? 'Stop' : 'Start'
          document.getElementById('ws-user').textContent = state.userName ? state.userName + ' (' + state.userRole + ')' : '-'
          document.getElementById('ws-elapsed').textContent = state.elapsed
          document.getElementById('ws-app').textContent = state.app
          document.getElementById('ws-site').textContent = state.site
        })
      </script>
    </body>
  </html>
  `

  widgetWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(widgetHtml)}`)
  widgetWindow.once('ready-to-show', updateWidgetStatus)

  widgetWindow.on('closed', () => {
    widgetWindow = null
  })

  if (widgetTimer) clearInterval(widgetTimer)
  widgetTimer = setInterval(updateWidgetStatus, 1000)
}

function setWidgetExpanded(expanded) {
  if (!widgetWindow || widgetWindow.isDestroyed()) return

  widgetExpanded = expanded
  const bounds = widgetWindow.getBounds()
  const nextWidth = expanded ? 372 : 52
  const nextHeight = expanded ? 590 : 52
  widgetWindow.setBounds({ x: bounds.x, y: bounds.y, width: nextWidth, height: nextHeight })
  widgetWindow.webContents.send('taskhive:widget-layout', { expanded: widgetExpanded })
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  const trayImage = runtimeIconPath ? nativeImage.createFromPath(runtimeIconPath) : nativeImage.createFromPath(process.execPath)
  tray = new Tray(trayImage.isEmpty() ? nativeImage.createFromPath(process.execPath) : trayImage)
  tray.setToolTip('TaskHive')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open TaskHive', click: showMainWindow },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ]))

  tray.on('click', showMainWindow)
}

async function handleDesktopLogin(payload) {
  const email = String(payload?.email || '').trim()
  const password = String(payload?.password || '')

  if (!email || !password) {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('taskhive:login-result', {
        success: false,
        error: 'Email and password are required.'
      })
    }
    return
  }

  try {
    const result = await loginRendererUser(email, password)

    if (!result?.success || !result.user) {
      if (widgetWindow && !widgetWindow.isDestroyed()) {
        widgetWindow.webContents.send('taskhive:login-result', {
          success: false,
          error: result?.error || 'Login failed.'
        })
      }
      return
    }

    currentUser = result.user
    isLoggedIn = true
    updateWidgetStatus()

    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('taskhive:login-result', { success: true })
    }

    await navigateRendererToUserHome(result.user)
    setWidgetExpanded(true)
  } catch (_error) {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send('taskhive:login-result', {
        success: false,
        error: 'Desktop login is not ready yet. Wait for the app to finish loading.'
      })
    }
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.blackroth.taskhive')
  }

  db
  createWindow()
  createWidget()
  createTray()
})

ipcMain.on('taskhive:close-widget', () => {
  setWidgetExpanded(false)
})

ipcMain.on('taskhive:icon-click', () => {
  setWidgetExpanded(!widgetExpanded)
})

ipcMain.on('taskhive:drag-widget', (_event, payload) => {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  const dx = Number(payload?.dx || 0)
  const dy = Number(payload?.dy || 0)
  const bounds = widgetWindow.getBounds()
  widgetWindow.setPosition(bounds.x + dx, bounds.y + dy)
})

ipcMain.on('taskhive:open-main', () => {
  showMainWindow()
})

ipcMain.on('taskhive:login', async (_event, payload) => {
  await handleDesktopLogin(payload)
})

ipcMain.on('taskhive:logout', async () => {
  const userId = currentUser?.id

  if (timerRunning) {
    const stopTime = Date.now()
    await flushCurrentActivity(stopTime)
    await persistDesktopTimeEntry(timerStartedAt, stopTime)
    elapsedSeconds = getElapsedSeconds()
  }

  resetDesktopSession()
  await clearRendererSession()
  await clearRendererTimerState(userId)

  if (mainWindow && !mainWindow.isDestroyed()) {
    await mainWindow.loadURL(buildAppUrl('/login'))
  }

  updateWidgetStatus()
})

ipcMain.on('taskhive:toggle-timer', async () => {
  if (!isLoggedIn || !currentUser) return

  if (!timerRunning) {
    timerRunning = true
    timerStartedAt = Date.now()
    lastApp = null
    lastWebsite = null
    lastStart = Date.now()
    await syncRendererTimerState()
    await navigateRendererToUserHome(currentUser)
    setWidgetExpanded(true)
  } else {
    const stopTime = Date.now()
    await flushCurrentActivity(stopTime)
    await persistDesktopTimeEntry(timerStartedAt, stopTime)
    elapsedSeconds = getElapsedSeconds()
    timerRunning = false
    timerStartedAt = null
    lastApp = null
    lastWebsite = null
    lastStart = Date.now()
    await clearRendererTimerState(currentUser.id)
  }

  updateWidgetStatus()
})

app.on('window-all-closed', () => {
  if (trackingInterval) clearInterval(trackingInterval)
  if (widgetTimer) clearInterval(widgetTimer)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    createWidget()
    createTray()
  } else {
    showMainWindow()
  }
})
