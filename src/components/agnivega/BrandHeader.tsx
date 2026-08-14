import { Link } from "@tanstack/react-router";

import { Emblem } from "./Emblem";
import { DemoBanner } from "./DemoBanner";
import { useMyRoles } from "@/lib/krishi/useRole";

const PORTALS = [
  { to: "/farmer", label: "Farmer" },
  { to: "/fleet", label: "Fleet" },
  { to: "/admin", label: "Admin" },
] as const;

export function BrandHeader({ active }: { active?: string }) {
  const { isAdmin } = useMyRoles();

  return (
    <div className="sticky top-0 z-40">
      <DemoBanner />
      <header className="border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <Emblem className="h-8 w-8 shrink-0" />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide">Smart Krishi-Yatra AI</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-accent">
                Team Agnivega
              </span>
            </span>
          </Link>
          <nav className="-mx-1 ml-auto flex max-w-full items-center gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PORTALS.map((portal) => (
              <Link
                key={portal.to}
                to={portal.to}
                className={`shrink-0 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  active === portal.label
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                {portal.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/diagnostics"
                className={`shrink-0 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  active === "Diagnostics"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                Diagnostics
              </Link>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
}
