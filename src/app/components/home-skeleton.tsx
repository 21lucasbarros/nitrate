import { SlowHint } from "./ui/slow-hint";

/** o formato da home enquanto a sessão carrega: saudação, pôsteres e seções, pulsando */
export function HomeSkeleton() {
  return (
    <main aria-busy="true" aria-label="Carregando" className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto w-full">
      <div className="h-8 w-56 rounded bg-surface animate-pulse" />
      <div className="mt-3 h-4 w-72 max-w-full rounded bg-surface animate-pulse" />

      <SlowHint className="mt-8 justify-start" />

      {[0, 1, 2].map((section) => (
        <section key={section} className="mt-10">
          <div className="flex justify-between pb-2.5 mb-5 border-b border-foreground/10">
            <div className="h-4 w-40 rounded bg-surface animate-pulse" />
            <div className="h-4 w-12 rounded bg-surface animate-pulse" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={i >= 3 ? "hidden sm:block" : ""}>
                <div className="aspect-2/3 rounded-md bg-surface animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="mt-2.5 h-3 w-3/4 rounded bg-surface animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
