import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Code2 } from "lucide-react";

const FEATURES = [
  {
    title: "Real-time sync",
    description:
      "Board state stays consistent across all connected clients via WebSocket. Drag a card and it moves everywhere.",
  },
  {
    title: "Workspace ➡️ Project ➡️ Task",
    description:
      "Strict hierarchy keeps your data organized. Workspaces contain Projects, Projects contain work items.",
  },
  {
    title: "Velocity tracking",
    description:
      "Completed story points are tracked automatically across rolling sprint windows so you can measure throughput.",
  },
  {
    title: "Role-based access",
    description:
      "Admin, Member, and Viewer roles with row-level isolation. People only see and edit what they should.",
  },
  {
    title: "Kanban + List views",
    description:
      "Switch between a drag-and-drop board and a sortable list view depending on how you want to work.",
  },
  {
    title: "Self-hostable",
    description:
      "Next.js frontend, Spring Boot API, PostgreSQL. Ship the whole stack with a single docker compose up.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/favicon.ico"
              alt="Strideboard"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Strideboard
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
              Project management for teams that ship
            </h1>
            <p className="mt-4 text-base text-gray-500 leading-relaxed">
              Track work across workspaces and projects with real-time boards,
              list views, and velocity metrics. Open-source, self-hostable, no
              nonsense.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://github.com/JonathanHii/Strideboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                <Code2 className="w-4 h-4" />
                Source
              </a>
            </div>
          </div>

          {/* Screenshot */}
          <div className="mt-14 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <Image
              src="/dashboard.png"
              alt="Strideboard dashboard showing a kanban board with tasks"
              width={2541}
              height={1422}
              quality={80}
              priority
              className="w-full h-auto block"
            />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-lg font-semibold text-gray-900 mb-8">
              What you get
            </h2>

            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="bg-white p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stack */}
        <section className="border-t border-gray-200">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Built with
            </p>
            <div className="flex flex-wrap gap-2">
              {["Next.js", "Spring Boot", "PostgreSQL", "Docker", "WebSocket / STOMP"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="text-sm text-gray-600 font-medium bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Strideboard
          </p>
          <a
            href="https://github.com/JonathanHii/Strideboard"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}