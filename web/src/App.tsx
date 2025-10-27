import { NavLink, Outlet, Route, Routes } from "react-router-dom";

import BoardPage from "./pages/BoardPage";
import AboutPage from "./pages/AboutPage";
import { cn } from "./lib/utils";

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-base font-bold">K</span>
            <span>Kanban Lite</span>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-2 transition-colors",
                  isActive ? "bg-brand-500 text-white" : "text-slate-300 hover:text-white"
                )
              }
              end
            >
              Board
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-2 transition-colors",
                  isActive ? "bg-brand-500 text-white" : "text-slate-300 hover:text-white"
                )
              }
            >
              About
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<BoardPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
