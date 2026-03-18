
import { ArrowRight, BarChart3, Briefcase, CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const featureCards = [
  {
    title: "Track employee productivity",
    description: "Measure productive time, identify focus patterns, and keep distributed teams aligned.",
    icon: BarChart3,
  },
  {
    title: "Monitor activity",
    description: "Review work activity trends and understand how teams spend their time across the day.",
    icon: ShieldCheck,
  },
  {
    title: "Manage projects",
    description: "Connect tracked time to tasks and projects so managers can make decisions faster.",
    icon: Briefcase,
  },
  {
    title: "Analyze work performance",
    description: "Use clear dashboards to spot bottlenecks, balance workloads, and improve delivery.",
    icon: Users,
  },
];

const benefitPoints = [
  "Improve team accountability with real-time visibility into work activity.",
  "Reduce manual reporting by turning tracked time into actionable productivity insights.",
  "Give managers and employees one place to manage projects, tasks, and performance trends.",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="TaskHive - Employee Monitoring & Productivity Platform"
        description="TaskHive helps companies track employee productivity, monitor activity, manage projects, and analyze work performance."
        path="/"
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_32%),radial-gradient(circle_at_85%_20%,hsl(var(--accent)/0.22),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link to="/home">Home</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-10">
          <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-4 py-2 text-sm text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Productivity intelligence for modern teams
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  TaskHive - Employee Monitoring & Productivity Platform
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                  Track employee productivity, monitor activity, manage projects, and analyze work performance from a single platform.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/login">
                    Start with TaskHive
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">Explore features</a>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="text-sm text-muted-foreground">Visibility into tracked work activity</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
                  <p className="text-3xl font-bold">4x</p>
                  <p className="text-sm text-muted-foreground">Faster reporting for managers and teams</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
                  <p className="text-3xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">Unified workspace for monitoring and delivery</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-primary/15 bg-card/85 p-6 shadow-2xl shadow-primary/10 backdrop-blur">
              <div className="rounded-[1.5rem] border border-border/70 bg-background p-6">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Private workspace preview</p>
                  <h2 className="text-2xl font-bold">TaskHive Desktop + Web</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Employees only see their own timer, tasks, and activity. Admin insights stay inside the protected dashboard.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-primary/8 p-4">
                    <p className="text-sm font-medium text-primary">Built for role-based access</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      TaskHive separates employee views from administrator reports so sensitive organization data stays private.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card p-4">
                      <p className="text-sm text-muted-foreground">Desktop tracker</p>
                      <p className="mt-2 text-lg font-semibold">Floating widget with start and stop controls</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card p-4">
                      <p className="text-sm text-muted-foreground">Secure routing</p>
                      <p className="mt-2 text-lg font-semibold">Admin and employee screens stay separated</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card p-4">
                    <p className="text-sm text-muted-foreground">What TaskHive includes</p>
                    <div className="mt-4 space-y-3">
                      {["Private employee timer", "Task-linked time tracking", "Protected admin reports"].map((item) => (
                        <div key={item} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="mt-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Features</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built for teams that need visibility without losing momentum</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-24 grid gap-10 rounded-[2rem] border border-border/70 bg-card/85 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Productivity Benefits</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A clearer picture of how work gets done</h2>
            </div>
            <div className="space-y-4">
              {benefitPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-border/70 bg-background/70 p-5">
                  <p className="text-base leading-7 text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-24 rounded-[2rem] bg-[linear-gradient(135deg,hsl(var(--primary)/0.16),hsl(var(--accent)/0.24))] p-8 shadow-xl shadow-primary/10 lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Call to Action</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Make TaskHive the control center for employee monitoring and productivity tracking</h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Give your company a searchable, indexable home page and a platform teams can use every day to monitor work, manage tasks, and improve performance.
                </p>
              </div>
              <Button asChild size="lg" className="gap-2 self-start lg:self-auto">
                <Link to="/login">
                  Go to Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
