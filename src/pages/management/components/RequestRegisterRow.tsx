import type { ReactNode } from "react";
import FlatIcon from "../../../components/FlatIcon";
import type { RequestRegisterItem, RequestType } from "../types";

const typeMeta: Record<RequestType, { label: string; icon: string }> = {
  clearance: { label: "Clearance", icon: "document" },
  milestone: { label: "Milestone", icon: "map-marker" },
  logistics: { label: "Logistics", icon: "truck-side" },
};

function statusClasses(status: string) {
  switch (status.toLowerCase().replace("_", " ")) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "in progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function buildRequestSummary(item: RequestRegisterItem) {
  if (item.type === "milestone") {
    const milestone = item.milestone || "Site";
    const status = (item.milestoneStatus || "pending").replace(/_/g, " ");
    return `${milestone.charAt(0).toUpperCase() + milestone.slice(1)} milestone proposed as ${status} for ${item.clientDisplay}.`;
  }

  if (item.type === "logistics") {
    const materials = item.materialAllocations?.length
      ? item.materialAllocations.join(", ")
      : "No material allocation listed";
    return `Fuel allowance ${item.fuelAllowance || "not specified"} · Materials: ${materials}.`;
  }

  return `Clearance review for ${item.clientDisplay}${
    item.estimatedCost ? ` · Estimated cost ${item.estimatedCost}` : ""
  }.`;
}

interface RequestRegisterRowProps {
  item: RequestRegisterItem;
  assessment?: ReactNode;
  actions?: ReactNode;
}

export default function RequestRegisterRow({
  item,
  assessment,
  actions,
}: RequestRegisterRowProps) {
  const meta = typeMeta[item.type];

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              <FlatIcon name={meta.icon} className="text-[11px]" />
              {meta.label}
            </span>
            <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
          </div>
          <p className="text-xs text-slate-500">
            Requested by <span className="font-semibold text-slate-700">{item.requestedBy}</span>
            <span aria-hidden="true"> · </span>
            Client: <span className="font-semibold text-slate-700">{item.clientDisplay}</span>
          </p>
          <p className="text-xs leading-5 text-slate-600">
            {buildRequestSummary(item)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClasses(item.status)}`}>
            {item.status}
          </span>
          {item.amount && (
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-slate-800">
              {item.amount}
            </span>
          )}
        </div>
      </div>

      {(assessment || actions) && (
        <div className="mt-auto space-y-4 border-t border-slate-100 pt-4">
          {assessment}
          {actions}
        </div>
      )}
    </article>
  );
}
