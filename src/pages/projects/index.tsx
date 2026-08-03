import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore } from "../../store/mockStore";
import Skeleton from "../../components/Skeleton";
import Button from "../../components/Button";
import Select from "../../components/Select";
import { toast } from "../../utils/toast";
import {
  useApprovals,
  useApproveItemMutation,
  useProjects,
  useRejectItemMutation,
  useSubmitApprovalMutation,
} from "../../shared/hooks/useLiveQueries";
import {
  Compass,
  MapPin,
  ClipboardList,
  Send,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatLabel } from "../../utils/formatters";
import PageHeader from "../../components/PageHeader";
import FlatIcon from "../../components/FlatIcon";

const milestoneBadgeClass = (status: string, isSelected = false) => {
  if (isSelected) {
    if (status === "completed") return "bg-white text-[#08715d]";
    if (status === "in_progress") return "bg-[#fff2bf] text-[#695400]";
    return "bg-white/90 text-[#40535d]";
  }

  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const unwrapApprovalList = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
};

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";
  const isCEO = role === "MD / CEO";
  const {
    projects,
    approvals,
    clients,
    submitApprovalRequest,
    actionApprovalRequest,
    updateProjectMilestone,
    logActivity,
  } = useMockStore();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const submitApprovalMutation = useSubmitApprovalMutation();
  const { data: projectsApiData, isLoading: isProjectsLoading } = useProjects();
  const {
    data: approvalsEnvelope,
    isLoading: isApprovalsLoading,
    isError: isApprovalsError,
  } = useApprovals("pending", isCEO);
  const approveItemMutation = useApproveItemMutation();
  const rejectItemMutation = useRejectItemMutation();

  const rawProjectsList = Array.isArray(projectsApiData)
    ? projectsApiData
    : projectsApiData?.data || [];
  const activeProjects = rawProjectsList.map((p: any) => ({
    id: p.id,
    clientId: p.clientId,
    clientCode: p.clientCode,
    clientName: p.clientName,
    landName: p.location
      ? `${p.location}${p.plot ? ` — ${p.plot}` : ""}`
      : p.landName || p.plot || "Land Development Plot",
    estateLabel: p.clientName
      ? `Client: ${p.clientName} (${p.clientCode || "CLIENT"})`
      : p.location || p.estateLabel,
    coordinates: p.plot || p.coordinates,
    architectural: p.architectural || "pending",
    structural: p.structural || "pending",
    civil: p.civil || "pending",
    latestUpdateNote: p.latestUpdateNote,
    latestUpdateAt: p.latestUpdateAt,
    isComplete: p.isComplete,
  }));

  useEffect(() => {
    if (activeProjects.length > 0) {
      const exists = activeProjects.some((p: any) => p.id === selectedProject);
      if (!selectedProject || !exists) {
        setSelectedProject(activeProjects[0].id);
      }
    }
  }, [activeProjects, selectedProject]);

  const [editingMilestone, setEditingMilestone] = useState<
    "architectural" | "structural" | "civil" | null
  >(null);
  const [milestoneStatus, setMilestoneStatus] = useState<
    "completed" | "in_progress" | "pending"
  >("pending");

  const [showLandUpdateModal, setShowLandUpdateModal] = useState(false);
  const [showActionRequestModal, setShowActionRequestModal] = useState(false);
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [showApprovalReviewModal, setShowApprovalReviewModal] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");

  const [reqTitle, setReqTitle] = useState("");
  const [reqType, setReqType] = useState("Payment Confirmation Request");
  const [reqDetails, setReqDetails] = useState("");
  const [reqCost, setReqCost] = useState("");
  const [targetClientCode, setTargetClientCode] = useState("GENERAL");

  const liveApprovals = unwrapApprovalList(approvalsEnvelope);
  const selectedProjectRecord = activeProjects.find(
    (project: any) => project.id === selectedProject,
  );
  const selectedProjectApprovals = liveApprovals.filter((approval: any) => {
    const payload = approval.payload || {};
    return (
      approval.relatedClientId === selectedProjectRecord?.clientId ||
      approval.relatedClientId === selectedProjectRecord?.id ||
      approval.clientCode === selectedProjectRecord?.clientCode ||
      payload.clientCode === selectedProjectRecord?.clientCode ||
      payload.projectId === selectedProjectRecord?.id
    );
  });

  // The API returns the MD's full pending queue. Fall back to mock store pending items if live API is empty.
  const mockPendingApprovals = approvals.filter(
    (a: any) => a.status === "Pending",
  );
  const approvalQueue =
    liveApprovals.length > 0 ? liveApprovals : mockPendingApprovals;

  useEffect(() => {
    if (!showApprovalReviewModal) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowApprovalReviewModal(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showApprovalReviewModal]);

  // MD / CEO validation actions
  const handleApprove = (id: string, title: string) => {
    actionApprovalRequest(id, "Approved", user?.name || role);
    toast.success(`Approved request: "${title}"`);
    logActivity(`Approved request: "${title}"`, user?.name || role);
  };

  const handleReject = (id: string, title: string) => {
    actionApprovalRequest(id, "Rejected", user?.name || role);
    toast.info(`Rejected request: "${title}"`);
    logActivity(`Rejected request: "${title}"`, user?.name || role);
  };

  // Determine permissions
  const isProjectManager = role === "Project Manager";
  const isFullAccess =
    role === "MD / CEO" || role === "Administrator" || isProjectManager;
  const isReadOnly = !isFullAccess;

  const handleMilestoneUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editingMilestone) return;

    updateProjectMilestone(selectedProject, editingMilestone, milestoneStatus);

    const projName =
      activeProjects.find((p: any) => p.id === selectedProject)?.landName ||
      "Project";
    toast.success(
      `Milestone "${editingMilestone}" updated to "${milestoneStatus}"`,
    );
    logActivity(
      `Updated milestone "${editingMilestone}" for land "${projName}" to "${milestoneStatus}"`,
      user?.name || role,
    );

    setEditingMilestone(null);
  };

  return (
    <div className="property-page projects-page space-y-6 pb-10 select-none">
      <PageHeader
        section="Estates & Sites"
        title="Estates & Sites"
        description="Follow estate infrastructure, plot allocations and construction milestones."
        actions={
          isCEO ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setDecisionNote("");
                setShowApprovalReviewModal(true);
              }}
              icon={<FlatIcon name="shield-check" className="text-[14px]" />}
              className="relative btn-glow-accent bg-[#0e6b57] hover:bg-[#13886f] active:bg-[#0c5948] text-white border-[#0e6b57] py-2.5 px-4.5 text-xs sm:text-sm font-bold rounded-lg shadow-md cursor-pointer transition-colors"
            >
              Review Approvals
              {approvalQueue.length > 0 && (
                <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#d64550] text-white font-extrabold text-[10px] px-1 shadow-md border-2 border-white">
                  {approvalQueue.length}
                </span>
              )}
            </Button>
          ) : role === "Project Manager" ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingMilestone("architectural");
                setMilestoneStatus("pending");
                setShowLandUpdateModal(true);
              }}
              className="bg-[#0e6b57] hover:bg-[#13886f] active:bg-[#0c5948] text-white border-[#0e6b57] py-2.5 px-4.5 text-xs sm:text-sm font-bold rounded-lg shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
            >
              Log Milestone Update
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setReqType(
                  role === "Administrator"
                    ? "Vehicle Fuel Request"
                    : "Payment Confirmation Request",
                );
                const currentProj = activeProjects.find(
                  (p: any) => p.id === selectedProject,
                );
                const activeSubscribers = clients.filter(
                  (c: any) =>
                    c.lands?.some(
                      (l: any) =>
                        l.name === currentProj?.landName,
                    ),
                );
                setTargetClientCode(
                  activeSubscribers[0]?.code || "GENERAL",
                );
                setShowActionRequestModal(true);
              }}
              className="bg-[#0e6b57] hover:bg-[#13886f] active:bg-[#0c5948] text-white border-[#0e6b57] py-2.5 px-4.5 text-xs sm:text-sm font-bold rounded-lg shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
            >
              Request Approval
            </Button>
          )
        }
      />
      {/* Projects list */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        <section className="overflow-hidden rounded-3xl border border-brand-teal/10 bg-white shadow-[0_18px_50px_rgba(7,52,59,0.07)] xl:col-span-5">
          <div className="flex items-center justify-between border-b border-brand-teal/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-teal text-white shadow-md">
                <ClipboardList className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-teal/60">
                  Property directory
                </p>
                <h2 className="font-serif text-xl font-bold text-charcoal">
                  Active Estates
                </h2>
              </div>
            </div>
            <span className="rounded-full border border-brand-teal/10 bg-[#f2f8f8] px-3 py-1.5 text-[10px] font-bold text-brand-teal">
              {activeProjects.length} sites
            </span>
          </div>

          <div className="space-y-3 p-4">
            {isProjectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 border border-border-warm rounded-lg space-y-3"
                >
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))
            ) : activeProjects.length === 0 ? (
              <p className="text-xs text-muted-gray italic text-center py-8">
                No land development projects found.
              </p>
            ) : (
              activeProjects.map((project: any) => {
                const isSelected = selectedProject === project.id;

                return (
                  <article
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedProject(project.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-4 text-left outline-none transition-[border-color,background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-[#073c31] bg-gradient-to-br from-[#128a70] via-[#0e6b57] to-[#084538] text-white shadow-[0_16px_34px_rgba(7,95,105,0.24)]"
                        : "border-brand-teal/10 bg-white hover:border-brand-teal/25 hover:bg-[#f8fcfc] hover:shadow-[0_10px_28px_rgba(7,52,59,0.08)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/45" />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                          )}
                          <h3
                            className={`truncate font-serif text-[15px] font-bold ${isSelected ? "text-white" : "text-charcoal"}`}
                          >
                            {project.landName}
                          </h3>
                        </div>
                        <p
                          className={`mt-1.5 truncate text-[11px] font-medium ${isSelected ? "text-white/90" : "text-muted-gray"}`}
                        >
                          {project.estateLabel}
                        </p>
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${isSelected ? "border border-white/20 bg-white/15 text-white" : "bg-brand-teal/6 text-brand-teal"}`}
                      >
                        <MapPin className="h-3 w-3" />
                        {project.coordinates}
                      </span>
                    </div>

                    {/* Milestones brief */}
                    {role !== "Administrator" ? (
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center font-bold uppercase">
                        <div
                          className={`rounded-xl border px-2 py-2.5 ${isSelected ? "border-white/20 bg-white/10" : "border-border-warm/70 bg-slate-50/80"}`}
                        >
                          <p
                            className={`mb-1.5 text-[8px] tracking-[0.08em] ${isSelected ? "text-[#e1fafb]" : "text-muted-gray"}`}
                          >
                            Architectural
                          </p>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-extrabold ${milestoneBadgeClass(project.architectural, isSelected)}`}
                          >
                            {formatLabel(project.architectural)}
                          </span>
                        </div>

                        <div
                          className={`rounded-xl border px-2 py-2.5 ${isSelected ? "border-white/20 bg-white/10" : "border-border-warm/70 bg-slate-50/80"}`}
                        >
                          <p
                            className={`mb-1.5 text-[8px] tracking-[0.08em] ${isSelected ? "text-[#e1fafb]" : "text-muted-gray"}`}
                          >
                            Structural
                          </p>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-extrabold ${milestoneBadgeClass(project.structural, isSelected)}`}
                          >
                            {formatLabel(project.structural)}
                          </span>
                        </div>

                        <div
                          className={`rounded-xl border px-2 py-2.5 ${isSelected ? "border-white/20 bg-white/10" : "border-border-warm/70 bg-slate-50/80"}`}
                        >
                          <p
                            className={`mb-1.5 text-[8px] tracking-[0.08em] ${isSelected ? "text-[#e1fafb]" : "text-muted-gray"}`}
                          >
                            Civil
                          </p>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-extrabold ${milestoneBadgeClass(project.civil, isSelected)}`}
                          >
                            {formatLabel(project.civil)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`mt-4 flex items-center justify-between rounded-xl border p-2.5 text-[10px] font-bold uppercase ${isSelected ? "border-white/20 bg-white/10" : "border-border-warm/60 bg-white"}`}
                      >
                        <span
                          className={`text-[8px] tracking-wide ${isSelected ? "text-[#e1fafb]" : "text-muted-gray"}`}
                        >
                          Civil Works Status:
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 font-extrabold ${milestoneBadgeClass(project.civil, isSelected)}`}
                        >
                          {formatLabel(project.civil)}
                        </span>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Development update form */}
        <div className="overflow-hidden rounded-3xl border border-brand-teal/10 bg-white shadow-[0_24px_60px_rgba(23,35,30,0.08)] xl:sticky xl:top-0 xl:col-span-7">
          <div>
            <div className="flex items-center gap-3 bg-linear-to-r from-[#0e6b57] to-[#0b5444] px-6 py-5 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/15 text-white">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Selected property
                </p>
                <h2 className="font-serif text-xl font-bold text-white">
                  {role === "Administrator"
                    ? "Allocation Desk"
                    : "Site Progress"}
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              {selectedProject ? (
                (() => {
                  const project = (activeProjects.find(
                    (p: any) => p.id === selectedProject,
                  ) || activeProjects[0]) as any;
                  if (!project) {
                    return (
                      <div className="text-center py-20 text-muted-gray text-xs font-semibold">
                        Select an active land development project to view
                        milestone controls.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-7">
                      <div className="rounded-2xl bg-gradient-to-br from-brand-teal/8 to-brand-lime/10 p-5 ring-1 ring-brand-teal/10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-brand-teal shadow-sm">
                          <MapPin className="h-3 w-3" /> Active site
                        </span>
                        <h3 className="mt-3 font-serif font-bold text-charcoal text-2xl">
                          {project.landName}
                        </h3>
                        <p className="text-xs text-muted-gray mt-1.5 font-medium">
                          Site Location: {project.estateLabel} (
                          {project.coordinates})
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold text-muted-gray tracking-wider">
                          Development Milestones
                        </h4>

                        {[
                          {
                            key: "architectural",
                            label: "Architectural Layout Clearances",
                            current: project.architectural,
                          },
                          {
                            key: "structural",
                            label: "Structural Integrity Clearances",
                            current: project.structural,
                          },
                          {
                            key: "civil",
                            label: "Civil and Foundation Works",
                            current: project.civil,
                          },
                        ]
                          .filter(
                            (m) =>
                              role !== "Administrator" || m.key === "civil",
                          )
                          .map((m, index) => (
                            <div
                              key={m.key}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-border-warm/70 bg-white p-4 text-xs font-semibold shadow-sm transition-colors hover:border-brand-teal/25"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`grid h-9 w-9 place-items-center rounded-xl text-[10px] font-extrabold ${
                                    m.current === "completed"
                                      ? "bg-brand-olive/12 text-brand-olive"
                                      : m.current === "in_progress"
                                        ? "bg-status-due-soon/12 text-status-due-soon"
                                        : "bg-neutral-100 text-muted-gray"
                                  }`}
                                >
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <p className="font-bold text-charcoal">
                                    {m.label}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-muted-gray">
                                    Current Status:{" "}
                                    <span className="font-semibold text-brand-teal">
                                      {formatLabel(m.current)}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider ${
                                  m.current === "completed"
                                    ? "bg-brand-olive/10 text-brand-olive"
                                    : m.current === "in_progress"
                                      ? "bg-status-due-soon/10 text-status-due-soon"
                                      : "bg-neutral-100 text-muted-gray"
                                }`}
                              >
                                {formatLabel(m.current)}
                              </span>
                            </div>
                          ))}
                      </div>

                      {/* Action update & request suite buttons */}
                      <div className="flex flex-wrap gap-2.5 pt-4 border-t border-border-warm/60 mt-6">
                        <Button
                          variant="secondary"
                          onClick={() => setShowSubscribersModal(true)}
                          className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1 text-charcoal"
                        >
                          View Subscribed Clients
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-20 text-muted-gray text-xs font-semibold">
                  Select an active land development project to view milestone
                  controls.
                </div>
              )}
            </div>
          </div>

          {selectedProject && role === "Project Manager" && (
            <div className="pt-6 border-t border-border-warm/60 text-right mt-6">
              <span className="text-[10px] font-bold text-brand-olive bg-brand-olive/10 px-2 py-1 rounded">
                SITE UPDATE ACCESS
              </span>
            </div>
          )}
        </div>
      </div>
      {/* MD-only live approvals review */}
      {isCEO && showApprovalReviewModal && selectedProjectRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-approvals-title"
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-brand-teal/10 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-5 border-b border-brand-teal/10 bg-[#f3f9f9] px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-teal text-white">
                  <FlatIcon name="shield-check" className="text-[18px]" />
                </span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-teal">
                    MD decision desk
                  </p>
                  <h3
                    id="project-approvals-title"
                    className="mt-1 text-lg font-bold text-charcoal"
                  >
                    Project Approvals
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-gray">
                    {selectedProjectRecord.landName} · {approvalQueue.length}{" "}
                    pending in queue
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close approvals review"
                onClick={() => setShowApprovalReviewModal(false)}
                className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-brand-teal/25 hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30"
              >
                <FlatIcon name="cross-small" className="text-[16px]" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {isApprovalsLoading ? (
                <div className="space-y-3" aria-label="Loading approvals">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border-warm p-4"
                    >
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="mt-3 h-3 w-4/5" />
                      <Skeleton className="mt-4 h-9 w-48" />
                    </div>
                  ))}
                </div>
              ) : isApprovalsError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center">
                  <FlatIcon
                    name="triangle-warning"
                    className="text-xl text-red-500"
                  />
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Approvals could not be loaded. Please try again.
                  </p>
                </div>
              ) : approvalQueue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-teal/20 bg-[#f8fbfb] px-5 py-12 text-center">
                  <FlatIcon
                    name="badge-check"
                    className="text-2xl text-brand-teal/55"
                  />
                  <p className="mt-3 text-sm font-bold text-charcoal">
                    No pending approvals
                  </p>
                  <p className="mt-1 text-[11px] text-muted-gray">
                    There are no requests waiting for an MD decision.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalQueue.map((approval: any) => {
                    const payload = approval.payload || {};
                    const isLinkedToSelectedProject =
                      selectedProjectApprovals.some(
                        (item: any) => item.id === approval.id,
                      );
                    return (
                      <article
                        key={approval.id}
                        className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                                Pending decision
                              </span>
                              <span className="text-[9px] font-semibold text-muted-gray">
                                {formatLabel(
                                  approval.type ||
                                    approval.requestType ||
                                    "project request",
                                )}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                                {isLinkedToSelectedProject
                                  ? "Selected project"
                                  : "Operations queue"}
                              </span>
                            </div>
                            <h4 className="mt-3 text-sm font-bold text-charcoal">
                              {approval.title ||
                                payload.title ||
                                "Project approval request"}
                            </h4>
                            <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-muted-gray">
                              {approval.description ||
                                payload.description ||
                                payload.details ||
                                payload.note ||
                                "No additional request details were supplied."}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[9px] font-semibold text-slate-500">
                              <span>
                                Requested by:{" "}
                                {approval.requestedByName ||
                                  approval.requestedBy ||
                                  "Project team"}
                              </span>
                              <span>
                                Client:{" "}
                                {approval.clientName ||
                                  approval.clientCode ||
                                  payload.clientCode ||
                                  "General operations"}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="outlined"
                              disabled={
                                approveItemMutation.isPending ||
                                rejectItemMutation.isPending
                              }
                              onClick={() => {
                                if (!decisionNote.trim()) {
                                  toast.error(
                                    "Add a decision note before rejecting this request.",
                                  );
                                  return;
                                }
                                rejectItemMutation.mutate(
                                  {
                                    id: approval.id,
                                    reason: decisionNote.trim(),
                                  },
                                  {
                                    onSuccess: () => {
                                      toast.success(
                                        "Approval request rejected.",
                                      );
                                      setDecisionNote("");
                                    },
                                    onError: (error: any) =>
                                      toast.error(
                                        error?.message ||
                                          "Unable to reject this approval.",
                                      ),
                                  },
                                );
                              }}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              isLoading={approveItemMutation.isPending}
                              disabled={rejectItemMutation.isPending}
                              onClick={() =>
                                approveItemMutation.mutate(
                                  {
                                    id: approval.id,
                                    reason: decisionNote.trim() || undefined,
                                  },
                                  {
                                    onSuccess: () => {
                                      toast.success(
                                        "Approval request approved.",
                                      );
                                      setDecisionNote("");
                                    },
                                    onError: (error: any) =>
                                      toast.error(
                                        error?.message ||
                                          "Unable to approve this request.",
                                      ),
                                  },
                                )
                              }
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {approvalQueue.length > 0 && !isApprovalsLoading && (
              <div className="border-t border-brand-teal/10 bg-[#fbfdfd] px-6 py-4">
                <label
                  htmlFor="project-decision-note"
                  className="block text-[10px] font-bold text-charcoal"
                >
                  Decision note{" "}
                  <span className="font-medium text-muted-gray">
                    (required when rejecting)
                  </span>
                </label>
                <textarea
                  id="project-decision-note"
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  rows={2}
                  placeholder="Add a short reason or instruction for the project team."
                  className="mt-2 w-full resize-none rounded-xl border border-border-warm bg-white px-3 py-2.5 text-xs text-charcoal outline-none placeholder:text-slate-400 focus:border-brand-teal"
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* Pop-up Overlay: Log land update */}
      {showLandUpdateModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-xs font-semibold">
            <button
              onClick={() => setShowLandUpdateModal(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-brand-teal mb-4 uppercase tracking-wider">
              Log Land Update
            </h3>
            <form onSubmit={handleMilestoneUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Select Milestone Key
                </label>
                <Select
                  options={[
                    ...(role !== "Administrator"
                      ? [
                          {
                            value: "architectural",
                            label: "Architectural Layout Clearances",
                          },
                          {
                            value: "structural",
                            label: "Structural Integrity Clearances",
                          },
                        ]
                      : []),
                    { value: "civil", label: "Civil and Foundation Works" },
                  ]}
                  value={editingMilestone || "civil"}
                  onChange={(val) => setEditingMilestone(val as any)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Status Level
                </label>
                <Select
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "completed", label: "Completed" },
                  ]}
                  value={milestoneStatus}
                  onChange={(val) => setMilestoneStatus(val as any)}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowLandUpdateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  onClick={() => setShowLandUpdateModal(false)}
                  className="bg-brand-teal text-white"
                >
                  Confirm Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}{" "}
      {/* Pop-up Overlay: Operations Status Center / Allocation Request Center */}
      {showActionRequestModal &&
        selectedProject &&
        (() => {
          const currentProj = (activeProjects.find(
            (p: any) => p.id === selectedProject,
          ) || activeProjects[0]) as any;
          if (!currentProj) return null;
          const activeSubscribers = clients.filter((c: any) =>
            c.lands?.some((l: any) => l.name === currentProj.landName),
          );
          const projectApprovals = approvals.filter(
            (app: any) =>
              app.clientCode &&
              activeSubscribers.some((sub: any) => sub.code === app.clientCode),
          );

          // targetClientCode state is lifted to the parent component level

          const handleActionRequestSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!reqTitle.trim() || !reqDetails.trim()) {
              toast.error("Please fill out Title and Details.");
              return;
            }
            const approvalTitle = `${reqType}: ${reqTitle}`;

            const isUuid = (id?: string) =>
              Boolean(
                id &&
                /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                  id,
                ),
              );
            const matchedClient = clients.find(
              (c: any) =>
                c.code === targetClientCode || c.id === targetClientCode,
            );
            const targetUuid =
              matchedClient?.id ||
              (isUuid(targetClientCode) ? targetClientCode : undefined);

            submitApprovalMutation.mutate(
              {
                requestType: reqType.toLowerCase().replace(/\s+/g, "_"),
                title: approvalTitle,
                description: reqDetails,
                ...(targetUuid ? { relatedClientId: targetUuid } : {}),
                payload: {
                  clientCode: targetClientCode,
                  cost: reqCost || "OPERATIONAL",
                  details: reqDetails,
                },
              },
              {
                onSuccess: () => {
                  submitApprovalRequest({
                    title: approvalTitle,
                    requestedBy: `${user?.name || "Project Officer"} (${role})`,
                    cost: reqCost || "OPERATIONAL",
                    details: reqDetails,
                    clientCode: targetClientCode,
                  });
                  toast.success(
                    "Validation action request submitted successfully!",
                  );
                  logActivity(
                    `Submitted approval request "${reqType}: ${reqTitle}" for client code ${targetClientCode}`,
                    user?.name || role,
                  );

                  // Reset and close modal
                  setReqTitle("");
                  setReqDetails("");
                  setReqCost("");
                  setShowActionRequestModal(false);
                },
                onError: (err: any) => {
                  toast.error(
                    err?.messages?.[0] ||
                      err?.message ||
                      "Failed to submit approval request.",
                  );
                },
              },
            );
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative text-xs font-semibold flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowActionRequestModal(false)}
                  className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
                >
                  ✕
                </button>

                {/* Left Side: Track requests */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-border-warm">
                    <ClipboardList className="w-4 h-4 text-brand-teal" />
                    <h3 className="font-serif text-sm font-bold text-brand-teal uppercase tracking-wide">
                      {role === "Administrator"
                        ? "Allocation Request Log"
                        : "Operational Status Center"}
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-gray leading-normal">
                    {role === "Administrator"
                      ? "Track upcoming site allocations, materials dispatch logs, and logistics fuel requests."
                      : "Track active operations status requests for Accounts payment confirmations, Admin logistics dispatch, or MD approvals."}
                  </p>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {projectApprovals.length === 0 ? (
                      <p className="text-center italic py-10 text-muted-gray font-bold text-[10px]">
                        No active requests logged for this project.
                      </p>
                    ) : (
                      projectApprovals.map((app: any) => (
                        <div
                          key={app.id}
                          className="p-3 border border-border-warm rounded bg-neutral-50/40 space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-charcoal">
                              {app.title}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                app.status === "Approved"
                                  ? "text-brand-olive bg-brand-olive/10"
                                  : app.status === "Pending"
                                    ? "text-brand-teal bg-brand-teal/10"
                                    : "text-status-late bg-status-late/10"
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-gray leading-normal font-medium">
                            {app.details}
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-muted-gray font-mono pt-1 border-t border-border-warm/30 mt-1.5">
                            <span>Cost: {app.cost}</span>
                            <span>By: {app.requestedBy}</span>
                          </div>

                          {/* MD / CEO Approval Action Loop */}
                          {app.status === "Pending" && role === "MD / CEO" && (
                            <div className="flex gap-2 pt-1.5 mt-1 border-t border-border-warm/30 justify-end">
                              <button
                                onClick={() => handleApprove(app.id, app.title)}
                                className="px-2.5 py-1 bg-brand-olive text-white rounded font-bold text-[9px] hover:bg-brand-olive/90 cursor-pointer transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(app.id, app.title)}
                                className="px-2.5 py-1 bg-status-late text-white rounded font-bold text-[9px] hover:bg-status-late/90 cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Side: Log Request Form */}
                <div className="w-full md:w-72 space-y-4 border-t md:border-t-0 md:border-l border-border-warm pt-4 md:pt-0 md:pl-6">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-border-warm">
                    <Send className="w-4 h-4 text-brand-teal" />
                    <h3 className="font-serif text-sm font-bold text-brand-teal uppercase tracking-wide">
                      Submit New Request
                    </h3>
                  </div>

                  <form
                    onSubmit={handleActionRequestSubmit}
                    className="space-y-3 text-left"
                  >
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Target Subscriber Client
                      </label>
                      <Select
                        options={
                          activeSubscribers.length > 0
                            ? activeSubscribers.map((sub: any) => ({
                                value: sub.code,
                                label: `${sub.name} (${sub.code})`,
                              }))
                            : [
                                {
                                  value: "GENERAL",
                                  label: "General Land Request",
                                },
                              ]
                        }
                        value={targetClientCode}
                        onChange={setTargetClientCode}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Destination Department / Type
                      </label>
                      <Select
                        options={
                          role === "Administrator"
                            ? [
                                {
                                  value: "Vehicle Fuel Request",
                                  label: "Vehicle Fuel & Logistics (Admin)",
                                },
                                {
                                  value: "Materials Dispatch",
                                  label: "Materials Dispatch logistics (Admin)",
                                },
                                {
                                  value: "Validation Request",
                                  label: "MD Validation Check (MD)",
                                },
                              ]
                            : role === "Accounts Lead"
                              ? [
                                  {
                                    value: "Payment Confirmation Request",
                                    label: "Payment Confirmation (Accounts)",
                                  },
                                ]
                              : [
                                  {
                                    value: "Payment Confirmation Request",
                                    label: "Payment Confirmation (Accounts)",
                                  },
                                  {
                                    value: "Logistics Request",
                                    label: "Logistics & Fuel Request (Admin)",
                                  },
                                  {
                                    value: "Operations Approval Request",
                                    label: "Operations Approval (MD)",
                                  },
                                ]
                        }
                        value={reqType}
                        onChange={setReqType}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Request Title
                      </label>
                      <input
                        type="text"
                        required
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        placeholder="e.g. Confirm Downpayment"
                        className="w-full px-2.5 py-1.5 border border-border-warm rounded focus:border-brand-teal outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Details
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={reqDetails}
                        onChange={(e) => setReqDetails(e.target.value)}
                        placeholder="Provide description of requested logistics or clearance approvals..."
                        className="w-full p-2 border border-border-warm rounded focus:border-brand-teal outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Cost/Allowance Estimate (₦/$)
                      </label>
                      <input
                        type="text"
                        value={reqCost}
                        onChange={(e) => setReqCost(e.target.value)}
                        placeholder="e.g. 150000"
                        className="w-full px-2.5 py-1.5 border border-border-warm rounded focus:border-brand-teal outline-none"
                      />
                    </div>

                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={submitApprovalMutation.isPending}
                      className="w-full bg-brand-teal text-white py-1.5"
                    >
                      Submit Request
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          );
        })()}
      {/* Pop-up Overlay: View Subscribed Clients */}
      {showSubscribersModal &&
        selectedProject &&
        (() => {
          const currentProj = (activeProjects.find(
            (p: any) => p.id === selectedProject,
          ) || activeProjects[0]) as any;
          if (!currentProj) return null;
          const matchedClients = clients.filter(
            (c: any) =>
              c.id === currentProj.clientId ||
              c.code === currentProj.clientCode ||
              c.fullName === currentProj.clientName ||
              c.lands?.some(
                (l: any) =>
                  l.name === currentProj.landName ||
                  (currentProj.estateLabel &&
                    currentProj.estateLabel.includes(l.name)),
              ),
          );

          const activeSubscribers =
            matchedClients.length > 0
              ? matchedClients
              : currentProj.clientName
                ? [
                    {
                      id: currentProj.clientId || currentProj.id,
                      name: currentProj.clientName,
                      code: currentProj.clientCode || "GENERAL",
                      journeyStage:
                        currentProj.civil === "completed"
                          ? "Upcoming Handover"
                          : "Awaiting Allocation",
                      phone: "+234 800 000 0000",
                      email: `${currentProj.clientName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
                      plot: currentProj.coordinates,
                    },
                  ]
                : [];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-lg w-full shadow-2xl relative text-xs font-semibold">
                <button
                  onClick={() => setShowSubscribersModal(false)}
                  className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 pb-3 border-b border-border-warm mb-4">
                  <ClipboardList className="w-5 h-5 text-brand-teal" />
                  <h3 className="font-serif text-base font-bold text-brand-teal">
                    Clients Subscribed to Land
                  </h3>
                </div>
                <p className="text-[10px] text-muted-gray leading-normal mb-4">
                  Showing active accounts holding title or allocations for:{" "}
                  <strong className="text-charcoal">
                    {currentProj.landName}
                  </strong>
                </p>

                <div className="space-y-3 max-h-75 overflow-y-auto pr-1">
                  {activeSubscribers.length === 0 ? (
                    <p className="text-center italic py-8 text-muted-gray">
                      No active client subscriptions mapped to this land.
                    </p>
                  ) : (
                    activeSubscribers.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3.5 border border-border-warm rounded-lg bg-neutral-50/20 flex justify-between items-center group text-left"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-charcoal text-sm">
                            {c.name || c.fullName}
                          </p>
                          <p className="text-[10px] text-muted-gray">
                            Code: <span className="font-mono">{c.code}</span> •
                            Stage: {c.journeyStage}
                          </p>
                          <p className="text-[10px] text-muted-gray">
                            Location: {currentProj.estateLabel} •{" "}
                            {currentProj.coordinates}
                          </p>
                          {currentProj.latestUpdateNote && (
                            <p className="text-[10px] text-brand-teal font-medium">
                              Note: {currentProj.latestUpdateNote}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setShowSubscribersModal(false);
                            navigate(`/clients/${c.id}`);
                          }}
                          className="px-3 py-1.5 bg-brand-teal text-white rounded text-[10px] font-bold hover:bg-brand-teal/95 cursor-pointer flex items-center gap-1 transition-colors self-center shrink-0"
                        >
                          <span>Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-border-warm mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setShowSubscribersModal(false)}
                  >
                    Close View
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
