import type { ReactNode } from "react";
import FlatIcon from "../../../components/FlatIcon";

interface ListHeaderProps {
  title: string;
  description?: string;
  count: number;
  filters?: ReactNode;
}

export default function ListHeader({
  title,
  description,
  count,
  filters,
}: ListHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-brand-teal shadow-sm">
          <FlatIcon name="list-check" className="text-[16px]" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {filters && <div className="shrink-0">{filters}</div>}
    </div>
  );
}
