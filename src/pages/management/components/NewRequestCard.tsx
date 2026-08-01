import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button";
import FlatIcon from "../../../components/FlatIcon";
import Select, { type SelectOption } from "../../../components/Select";
import type { NewRequestFormData, RequestType } from "../types";

const requestTypes: Array<{ value: RequestType; label: string; icon: string }> = [
  { value: "clearance", label: "Clearance", icon: "document" },
  { value: "milestone", label: "Milestone", icon: "map-marker" },
  { value: "logistics", label: "Logistics", icon: "truck-side" },
];

const initialData = (requestedBy: string): NewRequestFormData => ({
  requestTitle: "",
  clientOrProject: "",
  requestedBy,
  status: "Pending",
  estimatedCost: "",
  clientCode: "",
  details: "",
  milestone: "architectural",
  milestoneStatus: "pending",
  fuelAllowance: "",
  materialAllocations: [],
});

interface NewRequestCardProps {
  requestedBy: string;
  clientOptions: SelectOption[];
  projectOptions: SelectOption[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  isSubmitting: (type: RequestType) => boolean;
  onSubmit: (
    type: RequestType,
    data: NewRequestFormData,
    reset: () => void,
  ) => void;
}

export default function NewRequestCard({
  requestedBy,
  clientOptions,
  projectOptions,
  expanded,
  onExpandedChange,
  isSubmitting,
  onSubmit,
}: NewRequestCardProps) {
  const [type, setType] = useState<RequestType>("clearance");
  const [data, setData] = useState<NewRequestFormData>(() => initialData(requestedBy));
  const [materialInput, setMaterialInput] = useState("");

  const activeOptions = type === "milestone" ? projectOptions : clientOptions;
  const activeType = requestTypes.find((item) => item.value === type)!;

  useEffect(() => {
    if (!data.clientOrProject && activeOptions[0]?.value) {
      setData((current) => ({
        ...current,
        clientOrProject: activeOptions[0].value,
      }));
    }
  }, [activeOptions, data.clientOrProject]);

  const setField = <K extends keyof NewRequestFormData>(
    field: K,
    value: NewRequestFormData[K],
  ) => setData((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setData(initialData(requestedBy));
    setMaterialInput("");
  };

  const changeType = (nextType: RequestType) => {
    setType(nextType);
    setData((current) => ({
      ...current,
      clientOrProject: "",
      requestTitle: "",
    }));
  };

  const addMaterial = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!tags.length) return;
    setData((current) => ({
      ...current,
      materialAllocations: Array.from(
        new Set([...current.materialAllocations, ...tags]),
      ),
    }));
    setMaterialInput("");
  };

  const validationMessage = useMemo(() => {
    if (!data.requestTitle.trim()) return "Add a request title.";
    if (!data.clientOrProject) return "Select a client or project.";
    if (type === "clearance" && !data.estimatedCost.trim())
      return "Add the estimated cost.";
    if (type === "clearance" && !data.clientCode.trim()) return "Add the client code.";
    if (type === "clearance" && !data.details.trim()) return "Add the clearance details.";
    if (type === "logistics" && !data.fuelAllowance.trim())
      return "Add the fuel allowance.";
    if (type === "logistics" && data.materialAllocations.length === 0)
      return "Add at least one material allocation.";
    return "";
  }, [data, type]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validationMessage) return;
    onSubmit(type, data, reset);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-teal text-white shadow-sm">
            <FlatIcon name="add-document" className="text-[16px]" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">New Request</h2>
            <p className="mt-1 text-xs text-slate-500">
              Submit one structured site-operation request for MD review.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse new request form" : "Expand new request form"}
          className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
        >
          <FlatIcon
            name="angle-small-down"
            className={`text-[16px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <form onSubmit={submit} className="space-y-6 p-4 sm:p-6">
          <fieldset>
            <legend className="mb-2 text-xs font-bold text-slate-700">Request type</legend>
            <div className="sm:hidden">
              <Select
                options={requestTypes.map(({ value, label }) => ({ value, label }))}
                value={type}
                onChange={(value) => changeType(value as RequestType)}
                className="w-full"
                ariaLabel="Request type"
              />
            </div>
            <div className="hidden rounded-xl bg-slate-100 p-1 sm:grid sm:grid-cols-3">
              {requestTypes.map((item) => {
                const selected = item.value === type;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => changeType(item.value)}
                    className={`flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal/20 ${
                      selected
                        ? "bg-white text-brand-teal shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FlatIcon name={item.icon} className="text-[13px]" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-xs font-bold text-slate-700 lg:col-span-2">
              <span>Request title</span>
              <input
                value={data.requestTitle}
                onChange={(event) => setField("requestTitle", event.target.value)}
                placeholder={`e.g. ${activeType.label} request for Lekki site`}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
              />
            </label>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {type === "milestone" ? "Project / land client" : type === "logistics" ? "Allocation client" : "Client / project"}
              </label>
              <Select
                options={activeOptions.length ? activeOptions : [{ value: "", label: "No records available" }]}
                value={data.clientOrProject}
                onChange={(value) => setField("clientOrProject", value)}
                className="w-full"
                disabled={!activeOptions.length}
                ariaLabel={type === "milestone" ? "Project or land client" : "Client or project"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-xs font-bold text-slate-700">
                <span>Requested by</span>
                <input
                  value={requestedBy}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
                />
              </label>
              <label className="space-y-2 text-xs font-bold text-slate-700">
                <span>Request status</span>
                <input
                  value="Pending"
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            {type === "clearance" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-xs font-bold text-slate-700">
                  <span>Estimated cost (NGN)</span>
                  <input
                    inputMode="decimal"
                    value={data.estimatedCost}
                    onChange={(event) => setField("estimatedCost", event.target.value)}
                    placeholder="e.g. 5,000"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
                  />
                </label>
                <label className="space-y-2 text-xs font-bold text-slate-700">
                  <span>Client code</span>
                  <input
                    value={data.clientCode}
                    onChange={(event) => setField("clientCode", event.target.value)}
                    placeholder="e.g. RC-1002"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
                  />
                </label>
                <label className="space-y-2 text-xs font-bold text-slate-700 sm:col-span-2">
                  <span>Clearance details</span>
                  <textarea
                    value={data.details}
                    onChange={(event) => setField("details", event.target.value)}
                    placeholder="State the exception and the decision required from MD."
                    className="min-h-28 w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
                  />
                </label>
              </div>
            )}

            {type === "milestone" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Milestone</label>
                  <Select
                    options={[
                      { value: "architectural", label: "Architectural" },
                      { value: "structural", label: "Structural" },
                      { value: "civil", label: "Civil Foundation" },
                    ]}
                    value={data.milestone}
                    onChange={(value) => setField("milestone", value as NewRequestFormData["milestone"])}
                    className="w-full"
                    ariaLabel="Milestone"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Milestone status</label>
                  <Select
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "completed", label: "Completed" },
                    ]}
                    value={data.milestoneStatus}
                    onChange={(value) => setField("milestoneStatus", value as NewRequestFormData["milestoneStatus"])}
                    className="w-full"
                    ariaLabel="Milestone status"
                  />
                </div>
              </div>
            )}

            {type === "logistics" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-xs font-bold text-slate-700">
                  <span>Fuel allowance (NGN)</span>
                  <input
                    inputMode="decimal"
                    value={data.fuelAllowance}
                    onChange={(event) => setField("fuelAllowance", event.target.value)}
                    placeholder="e.g. 50,000"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
                  />
                </label>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700" htmlFor="material-allocation-input">
                    Material allocations
                  </label>
                  <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/15">
                    <div className="flex flex-wrap gap-2">
                      {data.materialAllocations.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setField("materialAllocations", data.materialAllocations.filter((item) => item !== tag))}
                            aria-label={`Remove ${tag}`}
                            className="cursor-pointer text-slate-400 hover:text-red-600"
                          >
                            <FlatIcon name="cross-small" className="text-[11px]" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      id="material-allocation-input"
                      value={materialInput}
                      onChange={(event) => setMaterialInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          addMaterial(materialInput);
                        }
                      }}
                      onBlur={() => addMaterial(materialInput)}
                      placeholder={data.materialAllocations.length ? "Add another item" : "Type an item and press Enter"}
                      className="mt-1 w-full border-0 px-1 py-1 text-sm font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-xs ${validationMessage ? "text-amber-700" : "text-slate-500"}`} aria-live="polite">
              {validationMessage || "Ready to submit for MD review."}
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={Boolean(validationMessage)}
              isLoading={isSubmitting(type)}
              icon={<FlatIcon name="paper-plane" className="text-[14px]" />}
              className="w-full sm:w-auto"
            >
              Submit {activeType.label} Request
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
