import { ISSUE_STATUSES, type TimelineEntry, type IssueStatus } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Timeline({
  entries,
  current,
}: {
  entries: TimelineEntry[];
  current: IssueStatus;
}) {
  const reached = new Map(entries.map((e) => [e.status, e]));
  const currentIdx = ISSUE_STATUSES.indexOf(current);

  return (
    <ol className="relative">
      {ISSUE_STATUSES.map((status, i) => {
        const entry = reached.get(status);
        const done = i <= currentIdx;
        const isLast = i === ISSUE_STATUSES.length - 1;
        return (
          <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1rem)] w-0.5",
                  done ? "bg-secondary" : "bg-line"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                done
                  ? "bg-secondary text-white"
                  : "border-2 border-line bg-white text-ink-faint"
              )}
            >
              {done ? <CheckCircle2 size={16} /> : <Circle size={12} />}
            </span>
            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  done ? "text-ink" : "text-ink-faint"
                )}
              >
                {status}
              </p>
              {entry?.note && (
                <p className="text-xs text-ink-soft">{entry.note}</p>
              )}
              {entry?.at && (
                <p className="mt-0.5 text-xs text-ink-faint">
                  {new Date(entry.at).toLocaleString()}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
