import { Box, Gauge, SlidersHorizontal, Sparkles } from "lucide-react";

const productPillars = [
  {
    title: "Fit Quiz",
    description:
      "Guide beginner and intermediate players toward a useful racquet profile based on swing, control, power, and comfort preferences.",
    icon: Sparkles,
  },
  {
    title: "Configuration Simulator",
    description:
      "Model how shape, balance, weight, string tension, and grip choices push a setup toward control, power, maneuverability, or forgiveness.",
    icon: SlidersHorizontal,
  },
  {
    title: "3D Racquet Preview",
    description:
      "Use a lightweight Three.js scene to make configuration changes visible and tactile on desktop and mobile.",
    icon: Box,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#223c2d] text-white shadow-sm">
              <Gauge size={20} strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">
                RacquetBuild
              </p>
              <p className="mt-1 text-sm text-[#61705f]">
                Squash racquet fitting and configuration
              </p>
            </div>
          </div>
          <a
            className="hidden rounded-md border border-[#c9d0bf] px-4 py-2 text-sm font-medium text-[#223c2d] transition hover:border-[#223c2d] sm:inline-flex"
            href="https://vercel.com/new"
            rel="noreferrer"
            target="_blank"
          >
            Vercel-ready
          </a>
        </header>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#151711] sm:text-6xl lg:text-7xl">
              Build a squash racquet setup around how you actually play.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4d584b]">
              RacquetBuild will help players compare racquet shape, balance,
              weight, string tension, and grip choices, then translate those
              choices into clear trade-offs for power, control, touch, and
              maneuverability.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#223c2d] px-5 text-sm font-semibold text-white transition hover:bg-[#1a2e23]"
                href="#plan"
              >
                View project plan
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#c9d0bf] px-5 text-sm font-semibold text-[#223c2d] transition hover:border-[#223c2d]"
                href="https://github.com/new"
                rel="noreferrer"
                target="_blank"
              >
                Create GitHub repo
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-[#d8ddcf] bg-white/70 p-4 shadow-sm">
            <div className="aspect-[4/5] rounded-md border border-[#d8ddcf] bg-[#eef1e7] p-4">
              <div className="flex h-full flex-col justify-between rounded-md border border-dashed border-[#9fab98] p-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-[#61705f]">
                    First interactive surface
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight">
                    Racquet profile cockpit
                  </h2>
                </div>
                <div className="grid gap-3">
                  {["Shape", "Balance", "Strings", "Grip"].map((label) => (
                    <div
                      className="flex items-center justify-between rounded-md bg-white px-4 py-3 text-sm shadow-sm"
                      key={label}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-[#61705f]">configurable</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          className="grid gap-4 pb-8 md:grid-cols-3"
          id="plan"
          aria-label="Product pillars"
        >
          {productPillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                className="rounded-lg border border-[#d8ddcf] bg-white/75 p-5"
                key={pillar.title}
              >
                <Icon className="text-[#223c2d]" size={22} strokeWidth={2.25} />
                <h2 className="mt-5 text-xl font-semibold">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#4d584b]">
                  {pillar.description}
                </p>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
