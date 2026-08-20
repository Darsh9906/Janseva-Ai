"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useTranslation } from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo subtitle={false} />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {t("footer.desc")}
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {t("footer.platform")}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
                <li><Link href="/report" className="hover:text-primary">{t("nav.reportIssue")}</Link></li>
                <li><Link href="/issues" className="hover:text-primary">{t("nav.issues")}</Link></li>
                <li><Link href="/map" className="hover:text-primary">{t("nav.map")}</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary">{t("nav.dashboard")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {t("footer.community")}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
                <li><Link href="/leaderboard" className="hover:text-primary">{t("nav.leaderboard")}</Link></li>
                <li>{t("footer.pointsBadges")}</li>
                <li>{t("footer.wardOfficers")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-ink-faint">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
