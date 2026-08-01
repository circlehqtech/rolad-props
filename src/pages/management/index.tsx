import { useRef, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  useAdminClearance,
  useAdminLogistics,
  useAdminMilestoneUpdates,
  useApprovals,
  useApproveItemMutation,
  useCreateAdminClearanceMutation,
  useCreateAdminLogisticsMutation,
  useCreateAdminMilestoneUpdateMutation,
  useProjects,
  useRejectItemMutation,
  useSubmitApprovalMutation,
  useUpdateAdminClearanceStatusMutation,
  useUpdateAdminLogisticsStatusMutation,
  useUpdateAdminMilestoneStatusMutation,
} from "../../shared/hooks/useLiveQueries";
import { useClientsList } from "../../features/clients/hooks/useClients";
import { formatNaira, toKoboInt } from "../../shared/money";
import Button from "../../components/Button";
import FlatIcon from "../../components/FlatIcon";
import PageHeader from "../../components/PageHeader";
import Select from "../../components/Select";
import Skeleton from "../../components/Skeleton";
import { renderMarkdown } from "../../components/MdBriefPanel";
import { toast } from "../../utils/toast";
import { AlertTriangle, Check, CheckCircle, ShieldAlert, Sparkles, X } from "lucide-react";
import ListHeader from "./components/ListHeader";
import NewRequestCard from "./components/NewRequestCard";
import RequestRegisterRow from "./components/RequestRegisterRow";
import type {
  NewRequestFormData,
  RequestRegisterItem,
  RequestType,
} from "./types";

function asList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function titleCase(value?: string, fallback = "Pending") {
  if (!value) return fallback;
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function approvalTitle(approval: any) {
  const payload = approval.payload || {};
  if (payload.title && payload.title.toLowerCase() !== "test") return payload.title;

  switch (approval.type) {
    case "payment_adjustment":
      return "Payment Schedule Adjustment";
    case "budget_override":
      return "Budget Override Request";
    case "vetting_waiver":
      return "Vetting Waiver Request";
    case "stage_advance_allocation":
      return "Allocation Readiness Request";
    case "stage_advance_completion":
      return "Handover Completion Request";
    default:
      return titleCase(approval.type, "Management Clearance");
  }
}

function errorMessage(error: any, fallback: string) {
  return error?.messages?.[0] || error?.message || fallback;
}

export default function Management() {
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";
  const isCEO = role === "MD / CEO";
  const isAdmin = role === "Administrator";

  const [statusFilter, setStatusFilter] = useState(isAdmin ? "all" : "pending");
  const [isNewRequestExpanded, setIsNewRequestExpanded] = useState(true);
  const [rejectionItem, setRejectionItem] = useState<RequestRegisterItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const newRequestRef = useRef<HTMLDivElement>(null);

  const clearanceQuery = useAdminClearance(statusFilter);
  const logisticsQuery = useAdminLogistics(statusFilter);
  const milestoneQuery = useAdminMilestoneUpdates(statusFilter);
  const approvalsQuery = useApprovals(statusFilter);
  const projectsQuery = useProjects();
  const clientsQuery = useClientsList();

  const submitApproval = useSubmitApprovalMutation();
  const createClearance = useCreateAdminClearanceMutation();
  const createLogistics = useCreateAdminLogisticsMutation();
  const createMilestone = useCreateAdminMilestoneUpdateMutation();
  const approveApproval = useApproveItemMutation();
  const rejectApproval = useRejectItemMutation();
  const updateClearance = useUpdateAdminClearanceStatusMutation();
  const updateLogistics = useUpdateAdminLogisticsStatusMutation();
  const updateMilestone = useUpdateAdminMilestoneStatusMutation();

  const clients = asList(clientsQuery.data);
  const projects = asList(projectsQuery.data);
  const clearanceItems = asList(clearanceQuery.data);
  const logisticsItems = asList(logisticsQuery.data);
  const milestoneItems = asList(milestoneQuery.data);
  const genericApprovals = asList(approvalsQuery.data);

  const landClients = clients.filter((client: any) => {
    const product = String(
      client.productTypeCode || client.productTypeLabel || client.productType || "",
    ).toLowerCase();
    return !product || product.includes("land");
  });

  const clientOptions = (landClients.length ? landClients : clients)
    .map((client: any) => ({
      value: client.id || client.clientId || client.clientCode,
      label: `${client.fullName || client.name || "Client"} (${client.clientCode || client.code || "RC-000"})`,
    }))
    .filter((option: any) => Boolean(option.value));

  const projectOptions = [
    ...projects.map((project: any) => ({
      value: project.id || project.clientId,
      label: `${project.clientName || project.clientCode || "Project"} - ${project.location || project.plot || "Land plot"}`,
    })),
    ...clientOptions,
  ].filter(
    (option, index, options) =>
      Boolean(option.value) &&
      index === options.findIndex((candidate) => candidate.value === option.value),
  );

  const requests: RequestRegisterItem[] = [
    ...clearanceItems.map((item: any) => {
      const amount = item.costOverrideKobo
        ? formatNaira(item.costOverrideKobo)
        : undefined;
      return {
        id: item.id,
        type: "clearance" as const,
        apiType: "clearance" as const,
        title: item.requestTitle || "Clearance Request",
        requestedBy: item.submittedByName || item.submittedBy || "Administrator",
        clientCode: item.clientCode || item.clientId || "GENERAL",
        clientDisplay: item.clientName
          ? `${item.clientName} (${item.clientCode || item.clientId})`
          : item.clientCode || item.clientId || "General",
        status: titleCase(item.status),
        amount,
        estimatedCost: amount,
      };
    }),
    ...milestoneItems.map((item: any) => ({
      id: item.id,
      type: "milestone" as const,
      apiType: "milestone_update" as const,
      title: `${titleCase(item.milestone, "Site")} Milestone Update`,
      requestedBy: item.submittedByName || item.submittedBy || "Administrator",
      clientCode: item.clientCode || item.projectId || "PROJECT",
      clientDisplay: item.clientName
        ? `${item.clientName} (${item.clientCode || item.projectId})`
        : item.clientCode || item.projectId || "Project",
      status: titleCase(item.status),
      milestone: item.milestone,
      milestoneStatus: item.newStatus,
    })),
    ...logisticsItems.map((item: any) => {
      const amount = item.fuelAllowanceKobo
        ? formatNaira(item.fuelAllowanceKobo)
        : undefined;
      return {
        id: item.id,
        type: "logistics" as const,
        apiType: "logistics" as const,
        title: `Logistics Allocation - ${item.clientName || item.clientCode || "Client"}`,
        requestedBy: item.submittedByName || item.submittedBy || "Administrator",
        clientCode: item.clientCode || item.clientId || "GENERAL",
        clientDisplay: item.clientName
          ? `${item.clientName} (${item.clientCode || item.clientId})`
          : item.clientCode || item.clientId || "General",
        status: titleCase(item.status),
        amount,
        fuelAllowance: amount,
        materialAllocations: Array.isArray(item.materialAllocations)
          ? item.materialAllocations
          : String(item.materialAllocations || "")
              .split(",")
              .map((material) => material.trim())
              .filter(Boolean),
      };
    }),
    ...genericApprovals.map((item: any) => {
      const amount = item.payload?.requestedBudget
        ? formatNaira(item.payload.requestedBudget)
        : item.payload?.amountKobo
          ? formatNaira(item.payload.amountKobo)
          : undefined;
      const clientDisplay = item.clientName
        ? `${item.clientName} (${item.clientCode || "GENERAL"})`
        : item.clientCode || item.payload?.clientCode || "General";
      return {
        id: item.id,
        type: "clearance" as const,
        apiType: "governance" as const,
        title: approvalTitle(item),
        requestedBy: item.requestedByName || item.requestedBy || "Staff member",
        clientCode: item.clientCode || item.payload?.clientCode || "GENERAL",
        clientDisplay,
        status: titleCase(item.status),
        amount,
        estimatedCost: amount,
        isCustomerAudit:
          String(item.type || "").toLowerCase().includes("audit") ||
          approvalTitle(item).toLowerCase().includes("audit"),
        aiSummary: item.cachedSummary || item.aiSummary || null,
      };
    }),
  ];

  const isLoading =
    clearanceQuery.isLoading ||
    logisticsQuery.isLoading ||
    milestoneQuery.isLoading ||
    approvalsQuery.isLoading;

  const decisionPending =
    approveApproval.isPending ||
    rejectApproval.isPending ||
    updateClearance.isPending ||
    updateLogistics.isPending ||
    updateMilestone.isPending;

  const handleNewRequestSubmit = (
    type: RequestType,
    data: NewRequestFormData,
    reset: () => void,
  ) => {
    if (type === "clearance") {
      const cost = parseFloat(data.estimatedCost.replace(/[^0-9.]/g, "")) || 0;
      const costOverrideKobo = toKoboInt(cost).toString();
      submitApproval.mutate(
        {
          requestType: "budget_override",
          title: data.requestTitle,
          description: data.details,
          relatedClientId: data.clientOrProject,
          payload: {
            clientCode: data.clientCode,
            requestedBudget: cost,
            description: data.details,
          },
        },
        {
          onSuccess: () => {
            toast.success("Clearance request submitted for MD review.");
            reset();
          },
          onError: () => {
            createClearance.mutate(
              {
                requestTitle: data.requestTitle,
                costOverrideKobo,
                clientId: data.clientOrProject,
                details: data.details,
              },
              {
                onSuccess: () => {
                  toast.success("Clearance request submitted for MD review.");
                  reset();
                },
                onError: (error: any) =>
                  toast.error(errorMessage(error, "Failed to submit clearance request.")),
              },
            );
          },
        },
      );
      return;
    }

    if (type === "milestone") {
      createMilestone.mutate(
        {
          projectId: data.clientOrProject,
          milestone: data.milestone,
          newStatus: data.milestoneStatus,
        },
        {
          onSuccess: () => {
            toast.success(`${data.requestTitle} submitted for MD review.`);
            reset();
          },
          onError: (error: any) =>
            toast.error(errorMessage(error, "Failed to submit milestone update.")),
        },
      );
      return;
    }

    const fuel = parseFloat(data.fuelAllowance.replace(/[^0-9.]/g, "")) || 0;
    createLogistics.mutate(
      {
        clientId: data.clientOrProject,
        fuelAllowanceKobo: toKoboInt(fuel).toString(),
        materialAllocations: data.materialAllocations.join(", "),
        note: `Allocated fuel allowance of ₦${fuel.toLocaleString()} and materials`,
      },
      {
        onSuccess: () => {
          toast.success(`${data.requestTitle} submitted for MD review.`);
          reset();
        },
        onError: (error: any) =>
          toast.error(errorMessage(error, "Failed to submit logistics request.")),
      },
    );
  };

  const handleApprove = (item: RequestRegisterItem) => {
    const onSuccess = () => toast.success(`Approved: ${item.title}`);
    const onError = (error: any) =>
      toast.error(errorMessage(error, "Failed to approve request."));

    if (item.apiType === "clearance") {
      updateClearance.mutate({ id: item.id, status: "approved" }, { onSuccess, onError });
    } else if (item.apiType === "logistics") {
      updateLogistics.mutate({ id: item.id, status: "approved" }, { onSuccess, onError });
    } else if (item.apiType === "milestone_update") {
      updateMilestone.mutate({ id: item.id, status: "approved" }, { onSuccess, onError });
    } else {
      approveApproval.mutate({ id: item.id }, { onSuccess, onError });
    }
  };

  const confirmReject = () => {
    if (!rejectionItem) return;
    const reason = rejectionReason.trim() || "Rejected by MD";
    const onSuccess = () => {
      toast.info(`Declined: ${rejectionItem.title}`);
      setRejectionItem(null);
      setRejectionReason("");
    };
    const onError = (error: any) =>
      toast.error(errorMessage(error, "Failed to decline request."));

    if (rejectionItem.apiType === "clearance") {
      updateClearance.mutate(
        { id: rejectionItem.id, status: "rejected", rejectionReason: reason },
        { onSuccess, onError },
      );
    } else if (rejectionItem.apiType === "logistics") {
      updateLogistics.mutate(
        { id: rejectionItem.id, status: "rejected", rejectionReason: reason },
        { onSuccess, onError },
      );
    } else if (rejectionItem.apiType === "milestone_update") {
      updateMilestone.mutate(
        { id: rejectionItem.id, status: "rejected", rejectionReason: reason },
        { onSuccess, onError },
      );
    } else {
      rejectApproval.mutate(
        { id: rejectionItem.id, reason },
        { onSuccess, onError },
      );
    }
  };

  const openNewRequest = () => {
    setIsNewRequestExpanded(true);
    window.requestAnimationFrame(() => {
      newRequestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="property-page approvals-page space-y-6 pb-10">
      <PageHeader
        section="Site Operations"
        title="Site Operations"
        description={
          isAdmin
            ? "Submit structured site requests and track management decisions from one workspace."
            : "Review clearance, milestone and logistics requests awaiting an executive decision."
        }
        actions={
          isAdmin ? (
            <Button
              type="button"
              onClick={openNewRequest}
              icon={<FlatIcon name="plus" className="text-[13px]" />}
            >
              New Request
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <div ref={newRequestRef} className="scroll-mt-24">
          <NewRequestCard
            requestedBy={user?.name || "Administrator"}
            clientOptions={clientOptions}
            projectOptions={projectOptions}
            expanded={isNewRequestExpanded}
            onExpandedChange={setIsNewRequestExpanded}
            onSubmit={handleNewRequestSubmit}
            isSubmitting={(type) =>
              type === "clearance"
                ? submitApproval.isPending || createClearance.isPending
                : type === "milestone"
                  ? createMilestone.isPending
                  : createLogistics.isPending
            }
          />
        </div>
      )}

      {isCEO && requests.some((request) => request.status.toLowerCase() === "pending") && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <div>
            <h2 className="text-sm font-bold text-amber-900">Approvals awaiting review</h2>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Review the pending site-operation requests below and record an executive decision.
            </p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ListHeader
          title={isAdmin ? "Submitted Request Register" : "Approval Queue"}
          description={
            isAdmin
              ? "Track every submitted request and its management decision."
              : "Review structured site-operation requests awaiting a decision."
          }
          count={requests.length}
          filters={
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-semibold text-slate-600 sm:inline">
                Filter status
              </span>
              <Select
                options={[
                  { value: "pending", label: "Pending Review" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "all", label: "All Items" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full sm:w-40"
                ariaLabel="Filter request status"
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 bg-slate-50/50 p-4 sm:p-6 xl:grid-cols-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-3 h-3.5 w-1/2" />
                <Skeleton className="mt-3 h-3.5 w-4/5" />
              </div>
            ))
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle className="mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-800">No requests found</h3>
              <p className="mt-1 text-xs text-slate-500">
                There are no items matching the selected status.
              </p>
            </div>
          ) : (
            requests.map((item) => (
              <RequestRegisterRow
                key={`${item.apiType}-${item.id}`}
                item={item}
                assessment={
                  isCEO ? (
                    <div className="rounded-lg border border-brand-teal/15 bg-brand-teal/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-brand-teal">
                        <Sparkles className="h-3.5 w-3.5" />
                        Request Assessment
                      </div>
                      {item.aiSummary ? (
                        <div className="text-xs font-normal leading-5 text-slate-700">
                          {renderMarkdown(item.aiSummary)}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Assessment not yet available.</p>
                      )}
                    </div>
                  ) : undefined
                }
                actions={
                  isCEO && item.status.toLowerCase() === "pending" ? (
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <Button
                        variant="secondary"
                        disabled={decisionPending}
                        icon={<X className="h-4 w-4 text-red-700" />}
                        onClick={() => {
                          setRejectionItem(item);
                          setRejectionReason("");
                        }}
                        className="text-red-700"
                      >
                        Decline Request
                      </Button>
                      <Button
                        disabled={decisionPending}
                        icon={<Check className="h-4 w-4" />}
                        onClick={() => handleApprove(item)}
                      >
                        Approve Request
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            ))
          )}
        </div>
      </section>

      {isCEO && rejectionItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-request-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") setRejectionItem(null);
          }}
        >
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setRejectionItem(null)}
              aria-label="Close rejection dialog"
              className="absolute right-4 top-4 grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 pr-10">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-800">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 id="reject-request-title" className="text-base font-bold text-slate-900">
                  Decline request
                </h2>
                <p className="mt-1 text-xs text-slate-500">{rejectionItem.title}</p>
              </div>
            </div>
            <label className="mt-6 block space-y-2 text-xs font-bold text-slate-700">
              <span>Decision note</span>
              <textarea
                autoFocus
                rows={4}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="State why this request cannot be approved."
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setRejectionItem(null)}>
                Cancel
              </Button>
              <Button
                onClick={confirmReject}
                isLoading={decisionPending}
                className="border-red-700 bg-red-700 hover:bg-red-800"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
