import './App.css'

function App() {
  return (
    <main className="shell">
      <section className="shell-card">
        <p className="shell-kicker">TaskHive Desktop</p>
        <h1>Desktop shell ready</h1>
        <p>
          This renderer is only a fallback. The installed Electron app loads the main TaskHive web
          application and uses the floating widget from <code>electron/main.js</code>.
        </p>
      </section>
    </main>
  )
}

export default App
