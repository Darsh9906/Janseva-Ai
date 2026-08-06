import Link from "next/link";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo subtitle={false} />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              A simple way for communities to report local problems and follow
              them through to resolution.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Platform
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
                <li><Link href="/report" className="hover:text-primary">Report</Link></li>
                <li><Link href="/issues" className="hover:text-primary">Issues</Link></li>
                <li><Link href="/map" className="hover:text-primary">Map</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Community
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
                <li><Link href="/leaderboard" className="hover:text-primary">Leaderboard</Link></li>
                <li>Points &amp; badges</li>
                <li>Ward officers</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-ink-faint">
          © 2026 JanSeva · Made for stronger neighbourhoods.
        </div>
      </div>
    </footer>
  );
}
