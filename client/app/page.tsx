import Link from "next/link";
import {
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Layers,
  Code2,
  Terminal,
  Layout
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100">

      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.ico"
                alt="Strideboard Logo"
                className="w-8 h-8 rounded-sm"
              />
              <span className="text-xl font-bold tracking-tight">Strideboard</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24 pb-12">

        {/* --- Hero Section --- */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6 leading-[1.1]">
            Project management for <br />
            <span className="text-indigo-600">production-grade</span> teams.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            High-velocity tracking without the fluff. Real-time syncing, strict hierarchies,
            and velocity analytics built on Next.js 16 and Spring Boot.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/JonathanHii/Project-Management-Platform"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Code2 className="w-4 h-4" />
              GitHub
            </a>
          </div>

{/* --- Dashboard Preview --- */}
<div className="mt-12 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-2xl relative">
  {/* Use the Next.js Image component you already imported */}
  <Image
    src="/dashboard.png"
    alt="Strideboard Dashboard Interface"
    width={2541} // Set these to the approximate aspect ratio of your image
    height={1422}
    quality={90}
    priority={true} // Loads this image immediately (good for LCP)
    className="w-full h-auto block"
  />
</div>
        </div>

        {/* --- Tech Stack --- */}
        <div className="mt-20 border-y border-gray-100 bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
              Powered By
            </p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" /> Next.js 16
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full" /> Spring Boot
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> PostgreSQL
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full" /> Docker
              </div>
            </div>
          </div>
        </div>

        {/* --- Features Grid --- */}
        <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Real-time WebSocket</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                State remains consistent across all clients. Drag a card, and it moves everywhere instantly via STOMP/WS.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Strict Hierarchy</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Workspaces contain Projects, which contain Epics and Tasks. Structured data for structured teams.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Velocity Metrics</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automatic calculation of team velocity based on completed story points over rolling sprint windows.
              </p>
            </div>
          </div>
        </div>

        {/* --- Architecture Section --- */}
        <div className="bg-gray-50 py-24 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Enterprise Architecture
                </h2>
                <p className="text-gray-600 mb-8">
                  Designed to run in containerized environments with strict separation of concerns.
                </p>
                <ul className="space-y-4">
                  {[
                    "Multi-tenant isolation (Row-level security)",
                    "JWT Stateless Authentication",
                    "Database Migrations (Flyway/Liquibase)",
                    "AWS SQS for async email processing",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span className="text-gray-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Terminal visual */}
              <div className="bg-gray-900 rounded-xl p-6 shadow-xl font-mono text-xs text-gray-300 border border-gray-800">
                <div className="flex items-center gap-1.5 mb-4 border-b border-gray-700 pb-3">
                  <Terminal className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">server — bash</span>
                </div>
                <div className="space-y-3">
                  <p><span className="text-green-400">➜</span> <span className="text-blue-400">~</span> docker compose up --build</p>
                  <p className="text-gray-500">[+] Running 3/3</p>
                  <p> ✔ Container strideboard-db <span className="text-green-500 float-right">Started</span></p>
                  <p> ✔ Container strideboard-server <span className="text-green-500 float-right">Started</span></p>
                  <p> ✔ Container strideboard-client <span className="text-green-500 float-right">Started</span></p>
                  <p className="animate-pulse mt-2 text-indigo-400">_</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Footer (Outside Main) --- */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center shrink-0">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img
            src="/favicon.ico"
            alt="Strideboard Logo"
            className="w-6 h-6 rounded-sm opacity-90"
          />
          <span className="font-semibold text-gray-900">Strideboard</span>
        </div>
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Strideboard. Apache License.
        </p>
      </footer>

    </div>
  );
}