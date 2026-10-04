import { cn } from "@/lib/utils";

/** Marca do RepDay: sol (o dia) cercado por setas de repetição (o ciclo diário), em âmbar e azul-céu. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      {/* Setas de repetição */}
      <g stroke="#0ea5e9" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.72 11.9A12 12 0 0 1 27.28 11.9" />
        <path d="M29.18 7.82 27.28 11.9 24.38 10.55" />
        <path d="M27.28 20.1A12 12 0 0 1 4.72 20.1" />
        <path d="M2.82 24.18 4.72 20.1 7.62 21.45" />
      </g>
      {/* Sol */}
      <g stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round">
        <path d="M21.8 16h1.8M10.2 16H8.4M16 21.8v1.8M16 10.2V8.4M20.1 20.1l1.27 1.27M11.9 20.1l-1.27 1.27M11.9 11.9l-1.27-1.27M20.1 11.9l1.27-1.27" />
      </g>
      <circle cx="16" cy="16" r="3.9" fill="#f59e0b" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className={markClassName} />
      RepDay
    </span>
  );
}
