import Link from "next/link";
import { cn } from "@/lib/utils";

/** JanSeva wordmark — a small green "जन" mark + name. Simple and calm. */
export function Logo({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
        <span className="text-[15px] font-bold leading-none">जन</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="display text-2xl text-ink">JanSeva</span>
        {subtitle && (
          <span className="mt-0.5 text-[11px] font-medium tracking-wide text-ink-faint">
            Report. Track. Resolve.
          </span>
        )}
      </span>
    </Link>
  );
}
