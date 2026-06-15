import Link from "next/link";
import type { ReactNode } from "react";
import { RacquetMark } from "./RacquetMark";

const NAV = [
  { href: "/build", label: "Bench", code: "01" },
  { href: "/quiz", label: "Fit", code: "02" },
  { href: "/racquets", label: "Catalog", code: "03" },
  { href: "/about", label: "Spec", code: "04" },
];

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-rule-major bg-paper/85 backdrop-blur-[2px]">
        {/* sheet metadata strip */}
        <div className="hidden border-b border-rule px-4 py-1 readout text-[10px] uppercase tracking-[0.2em] text-ink-3 sm:flex sm:gap-6">
          <span>Sheet 01 / 04</span>
          <span>Rev. A</span>
          <span>Units · lb / g / mm</span>
          <span className="ml-auto">Squash · Configuration Bench</span>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link href="/" className="group flex min-h-11 min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center border border-ink text-ink transition-colors group-hover:border-accent group-hover:text-accent">
              <RacquetMark className="size-6" />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-base font-extrabold uppercase tracking-[0.16em] text-ink">
                Racquet<span className="text-accent">Build</span>
              </span>
              <span className="readout mt-1 block text-[10px] uppercase tracking-[0.22em] text-ink-3">
                Drafting&nbsp;Bench
              </span>
            </span>
          </Link>

          <nav className="grid w-full grid-cols-4 gap-1 sm:w-auto sm:flex sm:items-center sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-11 min-w-0 items-center justify-center gap-1.5 border border-rule px-2 py-2 transition-colors hover:border-rule-major hover:bg-paper-2 sm:min-h-0 sm:justify-start sm:gap-2 sm:border-transparent sm:px-2.5 sm:py-1.5"
              >
                <span className="hidden readout text-[10px] text-ink-3 group-hover:text-accent sm:inline">
                  {item.code}
                </span>
                <span className="label truncate text-[9px] tracking-[0.04em] text-ink-2 group-hover:text-ink sm:text-xs sm:tracking-[0.18em]">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-rule-major">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="readout text-[11px] uppercase tracking-[0.18em]">
            RacquetBuild · Heuristic model · Catalog specs cite source pages
          </p>
          <p className="readout text-[11px] uppercase tracking-[0.18em]">
            Drawn to inform, not to spec a purchase
          </p>
        </div>
      </footer>
    </div>
  );
}
