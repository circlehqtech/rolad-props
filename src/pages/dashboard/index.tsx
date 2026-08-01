import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore } from "../../store/mockStore";
import {
  useDashboardKpis,
  useGlobalActivity,
  useActionItems,
  useStageDistribution,
} from "../../shared/hooks/useLiveQueries";
import { toNaira } from "../../shared/money";
import Button from "../../components/Button";
import KpiCard from "../../components/KpiCard";
import MdBriefPanel from "../../components/MdBriefPanel";
import type { TimeRangeFilterState } from "../../components/TimeRangePicker";
import Skeleton from "../../components/Skeleton";
import PageHeader from "../../components/PageHeader";
import DashboardCharts, {
  DashboardHero,
} from "../../components/DashboardVisuals";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  Sparkles,
  ClipboardList,
  Activity,
  ChevronRight,
  ShieldCheck,
  Compass,
  AlertTriangle,
  PhoneCall,
  UserCheck,
  MapPin,
  CheckSquare,
  X,
  FileWarning,
  Eye,
  Info,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  const mockStore = useMockStore();
  const clients = mockStore.clients;
  const approvals = mockStore.approvals;
  const activities = mockStore.activities;

  const [timeRange] = useState<TimeRangeFilterState>({
    range: "all",
  });

  const [activeModal, setActiveModal] = useState<
    | "admin-needing-action"
    | "cs-clients-update"
    | "sales-update-required"
    | "project-allocation"
    | "marketing-allocation"
    | null
  >(null);

  // Role permissions & names
  const isCEO = role === "MD / CEO";
  const isAdmin = role === "Administrator";
  const isAccountsLead = role === "Accounts Lead";
  const isCS = role === "Client Relations Officer";
  const isSales = role === "Sales Officer";
  const isProjectManager = role === "Project Manager";
  const isMarketing = role === "Marketing Officer";

  const isExecutive = isCEO || isAdmin;

  // TanStack Query API calls (enabled based on role)
  const { data: kpiData, isLoading: isKpisLoading } =
    useDashboardKpis(!isMarketing);
  const { data: activityData, isLoading: isActivityLoading } =
    useGlobalActivity();
  const { data: stageDistData } = useStageDistribution();

  // Fetch Action items queries
  const { data: missingDocsItems, isLoading: isMissingDocsLoading } =
    useActionItems("missing-documents", isAdmin || isCEO);
  const { data: csClientsUpdateItems, isLoading: isCsLoading } = useActionItems(
    "stage-changed",
    isCS,
  );
  const { data: salesUpdateRequiredItems, isLoading: isSalesLoading } =
    useActionItems("incomplete-records", isSales);
  const { data: pmAllocationItems, isLoading: isPmLoading } = useActionItems(
    "allocation-status",
    isProjectManager,
  );
  const { data: marketingAllocationItems, isLoading: isMktLoading } =
    useActionItems("allocation-status", isMarketing);

  // Helper function to filter items by selected time range
  const filterByTime = (dateStr?: string) => {
    if (timeRange.range === "all" || !dateStr) return true;
    const datePart = dateStr.split(" ")[0];
    const itemDate = new Date(datePart);
    if (isNaN(itemDate.getTime())) return true;

    if (timeRange.range === "this-week") {
      const start = new Date("2026-07-20");
      const end = new Date("2026-07-26");
      return itemDate >= start && itemDate <= end;
    }
    if (timeRange.range === "last-year") {
      return itemDate.getFullYear() === 2025;
    }
    if (timeRange.range === "custom" && timeRange.start && timeRange.end) {
      const start = new Date(timeRange.start);
      const end = new Date(timeRange.end);
      return itemDate >= start && itemDate <= end;
    }
    return true;
  };

  // Filter clients based on their document upload or ledger transaction timestamps
  const filteredClients = clients.filter((c: any) => {
    if (timeRange.range === "all") return true;
    const hasMatchingLedger = c.ledger.some((l: any) =>
      filterByTime(l.dueDate),
    );
    const hasMatchingDocs = c.documents.some((d: any) =>
      filterByTime(d.timestamp),
    );
    return hasMatchingLedger || hasMatchingDocs;
  });

  // Calculate live KPI metrics
  const activeClientsCount = kpiData?.activeClients ?? 0;

  const totalPortfolioValue = kpiData?.portfolioValueKobo
    ? toNaira(kpiData.portfolioValueKobo)
    : 0;

  const valueAtRisk = kpiData?.valueAtRiskKobo
    ? toNaira(kpiData.valueAtRiskKobo)
    : 0;

  const pendingDocumentsCount =
    kpiData?.pendingDocuments !== null &&
    kpiData?.pendingDocuments !== undefined
      ? kpiData.pendingDocuments
      : 0;

  const apiLandStages = stageDistData?.landProperty;
  const apiInvestmentStages = stageDistData?.investment;

  const landStagesList =
    apiLandStages && apiLandStages.length > 0
      ? [...apiLandStages]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s) => ({
            code: s.stageCode,
            label: s.stageLabel,
            count: s.count,
          }))
      : [];

  const investStagesList =
    apiInvestmentStages && apiInvestmentStages.length > 0
      ? [...apiInvestmentStages]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s) => ({
            code: s.stageCode,
            label: s.stageLabel,
            count: s.count,
          }))
      : [];

  // Define headers dynamically for premium personalization
  const dashboardTitle = () => {
    if (isCEO) return "Property Portfolio Overview";
    if (isAdmin) return "Client Documentation Desk";
    if (isAccountsLead) return "Collections & Receivables";
    if (isCS) return "Client Service Desk";
    if (isSales) return "Sales & Subscriptions";
    if (isProjectManager) return "Estate Delivery & Allocations";
    if (isMarketing) return "Leads & Campaign Performance";
    return "Property Operations";
  };

  // Custom Card 1: Needing Action (Admin)
  // Count clients with missing documents (at least one pending)
  const adminNeedingActionClientsFallback = filteredClients.filter((c: any) =>
    c.documents.some((d: any) => d.status === "pending"),
  );
  const adminNeedingActionCount =
    missingDocsItems?.count ?? adminNeedingActionClientsFallback.length;

  const adminNeedingActionClients = (
    missingDocsItems?.data || adminNeedingActionClientsFallback
  ).map((c: any) => {
    if (c.clientId) {
      return {
        id: c.clientId,
        code: c.clientCode,
        name: c.fullName,
        documents: [{ name: c.detail || "Required Files", status: "pending" }],
      };
    }
    return c;
  });

  // Custom Card 2: Clients Update (Customer Service)
  // Count clients in action/transitional stages who need to be contacted
  const actionStages = [
    "Subscription Form",
    "Awaiting Allocation",
    "Payment Rollover",
    "Verification",
    "Maturity",
  ];
  const csClientsUpdateClientsFallback = filteredClients.filter((c: any) =>
    actionStages.includes(c.journeyStage),
  );
  const csClientsUpdateCount =
    csClientsUpdateItems?.count ?? csClientsUpdateClientsFallback.length;

  const csClientsUpdateClients = (
    csClientsUpdateItems?.data || csClientsUpdateClientsFallback
  ).map((c: any) => {
    if (c.clientId) {
      return {
        id: c.clientId,
        name: c.fullName,
        journeyStage: c.stageLabel,
        phone: c.detail || "Touchpoint Needed",
        email: c.clientCode,
      };
    }
    return c;
  });

  // Custom Card 3: Update Required (Sales)
  // Filtered to clients they onboarded, count missing biodata, initial stage setup, or overdue payment
  const salesClients = filteredClients.filter(
    (c: any) => c.closureAgent === user?.name,
  );
  const salesUpdateRequiredClientsFallback = salesClients.filter((c: any) => {
    const missingBiodata = !c.phone || !c.email || !c.address;
    const initialSetup = c.journeyStage === "Subscription Form";
    const overduePayment =
      c.paymentStatus === "Late" || c.paymentStatus === "Missed";
    return missingBiodata || initialSetup || overduePayment;
  });
  const salesUpdateRequiredCount =
    salesUpdateRequiredItems?.count ??
    salesUpdateRequiredClientsFallback.length;

  const salesUpdateRequiredClients = (
    salesUpdateRequiredItems?.data || salesUpdateRequiredClientsFallback
  ).map((c: any) => {
    if (c.clientId) {
      return {
        id: c.clientId,
        name: c.fullName,
        phone: "123",
        email: "a@b.com",
        address: "123",
        journeyStage: c.stageLabel,
        paymentStatus: c.detail?.toLowerCase().includes("overdue")
          ? "Late"
          : "Outstanding",
        customReason: c.detail,
      };
    }
    return c;
  });

  // Custom Card 4: Allocation Status (Project & Marketing)
  // Count clients ready or pending allocation
  // (journeyStage is "Awaiting Allocation"/"Allocation" or has a document name containing "Allocation" and is pending)
  const isLeadFromMarketing = (c: any) => {
    return (
      c.campaignDetails &&
      c.campaignDetails.toLowerCase() !== "corporate referral channel"
    );
  };

  const baseAllocationClients = filteredClients.filter((c: any) => {
    const isAllocationStage =
      c.journeyStage === "Awaiting Allocation" ||
      c.journeyStage === "Allocation";
    const hasPendingAllocationDoc = c.documents.some(
      (d: any) =>
        d.name.toLowerCase().includes("allocation") && d.status === "pending",
    );
    return isAllocationStage || hasPendingAllocationDoc;
  });

  const projectAllocationClientsFallback = baseAllocationClients;
  const projectAllocationCount =
    pmAllocationItems?.count ?? projectAllocationClientsFallback.length;

  const projectAllocationClients = (
    pmAllocationItems?.data || projectAllocationClientsFallback
  ).map((c: any) => {
    if (c.clientId) {
      return {
        id: c.clientId,
        code: c.clientCode,
        name: c.fullName,
        journeyStage: c.stageLabel,
      };
    }
    return c;
  });

  const marketingAllocationClientsFallback =
    baseAllocationClients.filter(isLeadFromMarketing);
  const marketingAllocationCount =
    marketingAllocationItems?.count ??
    marketingAllocationClientsFallback.length;

  const marketingAllocationClients = (
    marketingAllocationItems?.data || marketingAllocationClientsFallback
  ).map((c: any) => {
    if (c.clientId) {
      return {
        id: c.clientId,
        code: c.clientCode,
        name: c.fullName,
        campaignDetails: c.detail || "Marketing Campaign",
        journeyStage: c.stageLabel,
      };
    }
    return c;
  });

  const rawActivityList =
    activityData?.data || (Array.isArray(activityData) ? activityData : null);

  const displayActivities = rawActivityList
    ? rawActivityList.map((item: any) => {
        let message = "";
        const meta = item.metadata || {};
        switch (item.action) {
          case "client.created":
            message = `Created client record ${meta.code || ""}`.trim();
            break;
          case "client.updated":
            message =
              `Updated client profile ${meta.fields ? `(${meta.fields.join(", ")})` : ""}`.trim();
            break;
          case "payment.logged":
            message =
              `Logged payment ${meta.reason ? `"${meta.reason}" ` : ""}${meta.installment ? `(Installment #${meta.installment})` : ""}`.trim();
            break;
          case "project.updated":
            message =
              `Updated project tracking ${meta.note ? `"${meta.note}"` : ""}`.trim();
            break;
          case "document.filed":
            message =
              meta.action === "voided"
                ? `Voided document ${meta.docName || ""} (${meta.reason || "Invalid upload"})`.trim()
                : `Filed document: ${meta.docName || meta.doc || "Verification document"}`;
            break;
          case "auth.login":
            message = "Staff logged into operations portal";
            break;
          case "approval.submitted":
            message = `Submitted ${meta.type ? meta.type.replace(/_/g, " ") : "approval"} request`;
            break;
          default:
            message = `${item.action.replace(".", " ")}`;
        }

        const dateObj = new Date(item.createdAt);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : item.createdAt;

        return {
          id: item.id,
          message,
          operator: item.actorStaffName || "Staff Member",
          timestamp: dateStr,
          rawItem: item,
        };
      })
    : activities;

  // Filter activities dynamically based on role rules
  const filteredActivities = displayActivities.filter((act: any) => {
    if (!filterByTime(act.timestamp)) return false;

    // CEO & Accounts: Show all activities
    if (isCEO || isAccountsLead) return true;

    const msgLower = act.message.toLowerCase();
    const operatorLower = act.operator.toLowerCase();

    // Admin: Document uploads, signatures, filings, allocation logistics requests
    if (isAdmin) {
      return (
        msgLower.includes("upload") ||
        msgLower.includes("certificate") ||
        msgLower.includes("layout") ||
        msgLower.includes("deed") ||
        msgLower.includes("signoff") ||
        msgLower.includes("document") ||
        msgLower.includes("file") ||
        msgLower.includes("clearance") ||
        msgLower.includes("signature") ||
        msgLower.includes("signed") ||
        msgLower.includes("filing") ||
        msgLower.includes("allocation") ||
        msgLower.includes("logistics") ||
        msgLower.includes("request")
      );
    }

    // CS: Stage changes and communication triggers only
    if (isCS) {
      return (
        msgLower.includes("stage") ||
        msgLower.includes("moved to") ||
        msgLower.includes("changed stage") ||
        msgLower.includes("transitioned") ||
        msgLower.includes("journey") ||
        msgLower.includes("status") ||
        msgLower.includes("contact") ||
        msgLower.includes("call") ||
        msgLower.includes("email") ||
        msgLower.includes("notified") ||
        msgLower.includes("sent") ||
        msgLower.includes("message") ||
        msgLower.includes("letter") ||
        msgLower.includes("sms")
      );
    }

    // Sales: Filtered to clients they onboarded only
    if (isSales) {
      const myClientNames = clients
        .filter((c: any) => c.closureAgent === user?.name)
        .map((c: any) => c.name.toLowerCase());
      const myClientCodes = clients
        .filter((c: any) => c.closureAgent === user?.name)
        .map((c: any) => c.code.toLowerCase());

      const isMyClient =
        myClientNames.some((name: string) => msgLower.includes(name)) ||
        myClientCodes.some((code: string) => msgLower.includes(code));
      return isMyClient || operatorLower === user?.name?.toLowerCase();
    }

    // Project Manager: Filtered to specific clients they closed (or with projects), payment, allocation, construction
    if (isProjectManager) {
      const managesClient = clients.some(
        (c: any) =>
          (c.closureAgent === user?.name || (c.lands && c.lands.length > 0)) &&
          (msgLower.includes(c.name.toLowerCase()) ||
            msgLower.includes(c.code.toLowerCase())),
      );

      const matchesTopics =
        msgLower.includes("payment") ||
        msgLower.includes("ledger") ||
        msgLower.includes("outstanding") ||
        msgLower.includes("paid") ||
        msgLower.includes("invoice") ||
        msgLower.includes("late") ||
        msgLower.includes("missed") ||
        msgLower.includes("due") ||
        msgLower.includes("allocation") ||
        msgLower.includes("allocated") ||
        msgLower.includes("awaiting allocation") ||
        msgLower.includes("structural") ||
        msgLower.includes("architectural") ||
        msgLower.includes("civil") ||
        msgLower.includes("construction") ||
        msgLower.includes("site") ||
        msgLower.includes("soil test") ||
        msgLower.includes("survey") ||
        msgLower.includes("pegging") ||
        msgLower.includes("foundation") ||
        msgLower.includes("excavation");

      return managesClient && matchesTopics;
    }

    // Marketing Officer: Filtered to leads they brought in, payment, allocation, construction
    if (isMarketing) {
      const isMyLead = clients.some(
        (c: any) =>
          isLeadFromMarketing(c) &&
          (msgLower.includes(c.name.toLowerCase()) ||
            msgLower.includes(c.code.toLowerCase())),
      );

      const matchesTopics =
        msgLower.includes("payment") ||
        msgLower.includes("ledger") ||
        msgLower.includes("outstanding") ||
        msgLower.includes("paid") ||
        msgLower.includes("invoice") ||
        msgLower.includes("late") ||
        msgLower.includes("missed") ||
        msgLower.includes("due") ||
        msgLower.includes("allocation") ||
        msgLower.includes("allocated") ||
        msgLower.includes("awaiting allocation") ||
        msgLower.includes("structural") ||
        msgLower.includes("architectural") ||
        msgLower.includes("civil") ||
        msgLower.includes("construction") ||
        msgLower.includes("site") ||
        msgLower.includes("soil test") ||
        msgLower.includes("survey") ||
        msgLower.includes("pegging") ||
        msgLower.includes("foundation") ||
        msgLower.includes("excavation");

      return isMyLead && matchesTopics;
    }

    return true;
  });

  // Recent Activity section title dynamically matches role
  const activitySectionTitle = () => {
    if (isCS) return "Recent Client Journey Activity";
    if (isSales) return "My Onboarded Client Activities";
    if (isProjectManager) return "Recent Project & Construction Activity";
    if (isMarketing) return "Recent Lead & Project Activity";
    if (isAdmin) return "Recent Operational Activities";
    return "Recent Ledger Activities";
  };

  return (
    <div className="dashboard-page property-page space-y-6 pb-10 select-none">
      {/* Dashboard time filter hidden until its KPI and activity endpoints support it. */}
      <PageHeader
        section="Dashboard"
        title={dashboardTitle()}
        description="A current view of clients, collections, documentation and property delivery."
      />

      <div className="dashboard-summary-grid">
        <DashboardHero
          name={user?.name || "Rolad team"}
          role={role}
          title={dashboardTitle()}
        />

        {/* KPI Cards Row (Filtered Dynamically by Role) */}
        <div className="dashboard-kpi-grid">
        {/* All Roles show Active Portfolio Clients */}
        <KpiCard
          title="Active Portfolio Clients"
          value={
            isKpisLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              activeClientsCount
            )
          }
          subtext="Current property and investment clients"
          icon={<Users className="w-5 h-5" />}
        />

        {/* CEO & Accounts: Gross Portfolio Value & Value at Risk */}
        {(isCEO || isAccountsLead) && (
          <>
            <KpiCard
              title="Gross Portfolio Value"
              value={
                isKpisLoading ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  "₦" + totalPortfolioValue.toLocaleString()
                )
              }
              subtext="Value of active subscriptions"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <KpiCard
              title="Value at Risk"
              value={
                isKpisLoading ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  "₦" + valueAtRisk.toLocaleString()
                )
              }
              subtext="Outstanding overdue balances"
              icon={<AlertCircle className="w-5 h-5 text-status-missed" />}
              variant="risk"
            />
          </>
        )}

        {/* Pending Documents Checklist (CEO, Accounts & Admin) */}
        {(isCEO || isAccountsLead || isAdmin) && (
          <KpiCard
            title="Outstanding Documentation"
            value={
              isKpisLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                pendingDocumentsCount
              )
            }
            subtext="Files required to complete client records"
            icon={<Clock className="w-5 h-5" />}
            isProminent={isAdmin} // Prominent card style for Admin!
          />
        )}

        {/* ADMIN ADD: Needing Action Card */}
        {isAdmin && (
          <KpiCard
            title="Records to Complete"
            value={
              isMissingDocsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                adminNeedingActionCount
              )
            }
            subtext="Records with missing files"
            icon={<AlertTriangle className="w-5 h-5 text-status-late" />}
            variant="warning"
            onClick={() => setActiveModal("admin-needing-action")}
          />
        )}

        {/* CUSTOMER SERVICE ADD: Clients Update Card */}
        {isCS && (
          <KpiCard
            title="Client Follow-ups"
            value={
              isCsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                csClientsUpdateCount
              )
            }
            subtext="Milestones requiring client contact"
            icon={<PhoneCall className="w-5 h-5 text-brand-teal" />}
            onClick={() => setActiveModal("cs-clients-update")}
          />
        )}

        {/* SALES ADD: Update Required Card */}
        {isSales && (
          <KpiCard
            title="Incomplete Sales Records"
            value={
              isSalesLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                salesUpdateRequiredCount
              )
            }
            subtext="Client details or payments to update"
            icon={<FileWarning className="w-5 h-5 text-status-missed" />}
            variant="risk"
            onClick={() => setActiveModal("sales-update-required")}
          />
        )}

        {/* PROJECT MANAGER ADD: Allocation Status Card */}
        {isProjectManager && (
          <KpiCard
            title="Allocation Status"
            value={
              isPmLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                projectAllocationCount
              )
            }
            subtext="Ready or pending allocation"
            icon={<MapPin className="w-5 h-5 text-brand-teal" />}
            onClick={() => setActiveModal("project-allocation")}
          />
        )}

        {/* MARKETING ADD: Allocation Status Card */}
        {isMarketing && (
          <KpiCard
            title="Allocation Status"
            value={
              isMktLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                marketingAllocationCount
              )
            }
            subtext="My leads pending allocation"
            icon={<MapPin className="w-5 h-5 text-brand-teal" />}
            onClick={() => setActiveModal("marketing-allocation")}
          />
        )}
        </div>
      </div>

      <DashboardCharts
        primaryTitle={
          isAccountsLead
            ? "Collections portfolio progression"
            : isSales
              ? "Sales pipeline progression"
              : isProjectManager
                ? "Allocation and delivery progression"
                : isMarketing
                  ? "Lead-to-allocation progression"
                  : "Portfolio progression"
        }
        land={landStagesList.map((stage) => ({
          label: stage.label,
          value: stage.count,
        }))}
        investment={investStagesList.map((stage) => ({
          label: stage.label,
          value: stage.count,
        }))}
      />

      {isExecutive ? (
        <MdBriefPanel
          variant="embedded"
          clients={clients}
          approvals={approvals}
        />
      ) : (
        <MdBriefPanel
          variant="floating-button"
          clients={clients}
          approvals={approvals}
        />
      )}

      {/* Recent Activity stream */}
      <div className="grid grid-cols-1 gap-5">
        <div
          className="bg-white border border-border-warm p-5 rounded-2xl shadow-sm flex flex-col justify-between w-full"
        >
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-border-warm/60 mb-4">
              <Activity className="w-5 h-5 text-brand-teal" />
              <h2 className="font-serif text-base font-bold text-brand-teal">
                {activitySectionTitle()}
              </h2>
            </div>

            <div className="space-y-4 max-h-95 overflow-y-auto pr-1">
              {isActivityLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="space-y-1.5 border-l-2 border-brand-teal/20 pl-3"
                  >
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))
              ) : filteredActivities.length === 0 ? (
                <p className="text-xs text-muted-gray italic text-center py-8">
                  No activities recorded in this time range.
                </p>
              ) : (
                filteredActivities.map((act: any) => (
                  <div
                    key={act.id}
                    className="text-xs space-y-1 border-l-2 border-brand-teal/20 pl-3"
                  >
                    <p className="font-medium text-charcoal leading-normal">
                      {act.message}
                    </p>
                    <p className="text-[9px] text-muted-gray flex items-center justify-between">
                      <span>by {act.operator}</span>
                      <span>{act.timestamp}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODALS (DRILL DOWN INTERACTIVITY) */}
      {activeModal && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white border border-border-warm w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-scale-up max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border-warm">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-teal flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  {activeModal === "admin-needing-action" &&
                    "Clients Needing Action (Compliance)"}
                  {activeModal === "cs-clients-update" &&
                    "CS Contact Outreach Required"}
                  {activeModal === "sales-update-required" &&
                    "Sales Records Update Required"}
                  {activeModal === "project-allocation" &&
                    "Clients Pending Allocation"}
                  {activeModal === "marketing-allocation" &&
                    "My Leads Pending Allocation"}
                </h3>
                <p className="text-[11px] text-muted-gray mt-1">
                  {activeModal === "admin-needing-action" &&
                    "All active clients who possess one or more outstanding compliance documents."}
                  {activeModal === "cs-clients-update" &&
                    "Clients in critical journey stages who require progress tracking and touchpoints."}
                  {activeModal === "sales-update-required" &&
                    "Your portfolios with missing biodata, initial configurations, or overdue items."}
                  {activeModal === "project-allocation" &&
                    "Subscribed clients ready for plot coordinates or allocation layouts."}
                  {activeModal === "marketing-allocation" &&
                    "Marketing generated leads currently in queue for final land allocation."}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-gray hover:text-charcoal p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 flex-1">
              {/* Admin Needing Action */}
              {activeModal === "admin-needing-action" && (
                <div className="space-y-4">
                  {adminNeedingActionClients.length === 0 ? (
                    <p className="text-xs text-muted-gray italic text-center py-8">
                      All client compliance documents are fully filed.
                    </p>
                  ) : (
                    <table className="rolad-table">
                      <thead>
                        <tr className="border-b border-border-warm text-muted-gray font-bold">
                          <th className="py-2.5">Code</th>
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Missing Documents</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminNeedingActionClients.map((c: any) => (
                          <tr
                            key={c.id}
                            className="border-b border-border-warm/50 hover:bg-neutral-50/50"
                          >
                            <td
                              className="py-3 font-semibold text-brand-teal cursor-pointer hover:text-brand-teal/80 hover:underline transition-colors"
                              onClick={() => {
                                setActiveModal(null);
                                navigate(`/clients/${c.id}`);
                              }}
                            >
                              {c.code}
                            </td>
                            <td
                              className="py-3 font-medium text-charcoal cursor-pointer hover:text-brand-teal/80 hover:underline transition-colors"
                              onClick={() => {
                                setActiveModal(null);
                                navigate(`/clients/${c.id}`);
                              }}
                            >
                              {c.name}
                            </td>
                            <td className="py-3 text-status-missed font-medium">
                              {c.documents
                                .filter((d: any) => d.status === "pending")
                                .map((d: any) => d.name)
                                .join(", ")}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                size="sm"
                                variant="outlined"
                                icon={<Eye className="w-3 h-3" />}
                                onClick={() => {
                                  setActiveModal(null);
                                  navigate(`/clients/${c.id}`);
                                }}
                                className="text-[10px] py-1 px-2 hover:bg-brand-teal hover:text-white hover:border-brand-teal"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Customer Service Outreach */}
              {activeModal === "cs-clients-update" && (
                <div className="space-y-4">
                  {csClientsUpdateClients.length === 0 ? (
                    <p className="text-xs text-muted-gray italic text-center py-8">
                      No client is currently in an outreach stage.
                    </p>
                  ) : (
                    <table className="rolad-table">
                      <thead>
                        <tr className="border-b border-border-warm text-muted-gray font-bold">
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Current Stage</th>
                          <th className="py-2.5">Contact Details</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csClientsUpdateClients.map((c: any) => (
                          <tr
                            key={c.id}
                            className="border-b border-border-warm/50 hover:bg-neutral-50/50"
                          >
                            <td
                              className="py-3 font-medium text-charcoal cursor-pointer hover:text-brand-teal/80 hover:underline transition-colors"
                              onClick={() => {
                                setActiveModal(null);
                                navigate(`/clients/${c.id}`);
                              }}
                            >
                              {c.name}
                            </td>
                            <td className="py-3">
                              <span className="bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full font-semibold text-[9px] uppercase">
                                {c.journeyStage}
                              </span>
                            </td>
                            <td className="py-3 space-y-0.5">
                              <div className="font-semibold text-charcoal">
                                {c.phone}
                              </div>
                              <div className="text-muted-gray text-[10px]">
                                {c.email}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                size="sm"
                                variant="outlined"
                                icon={<Eye className="w-3 h-3" />}
                                onClick={() => {
                                  setActiveModal(null);
                                  navigate(`/clients/${c.id}`);
                                }}
                                className="text-[10px] py-1 px-2 hover:bg-brand-teal hover:text-white hover:border-brand-teal"
                              >
                                Detail
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Sales Update Required */}
              {activeModal === "sales-update-required" && (
                <div className="space-y-4">
                  {salesUpdateRequiredClients.length === 0 ? (
                    <p className="text-xs text-muted-gray italic text-center py-8">
                      All your closed client records are fully configured.
                    </p>
                  ) : (
                    <table className="rolad-table">
                      <thead>
                        <tr className="border-b border-border-warm text-muted-gray font-bold">
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Compliance Status</th>
                          <th className="py-2.5">Reason Needed</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesUpdateRequiredClients.map((c: any) => {
                          const missingBiodata =
                            !c.phone || !c.email || !c.address;
                          const initialSetup =
                            c.journeyStage === "Subscription Form";
                          const overduePayment =
                            c.paymentStatus === "Late" ||
                            c.paymentStatus === "Missed";

                          let reason = c.customReason || "";
                          if (!reason) {
                            if (missingBiodata)
                              reason = "Missing contact/address";
                            else if (initialSetup)
                              reason = "Initial intake stage setup";
                            else if (overduePayment)
                              reason = `Overdue payments (${c.paymentStatus})`;
                          }

                          return (
                            <tr
                              key={c.id}
                              className="border-b border-border-warm/50 hover:bg-neutral-50/50"
                            >
                              <td
                                className="py-3 font-medium text-charcoal cursor-pointer hover:text-brand-teal/80 hover:underline transition-colors"
                                onClick={() => {
                                  setActiveModal(null);
                                  navigate(`/clients/${c.id}`);
                                }}
                              >
                                {c.name}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-semibold text-[9px] uppercase ${c.paymentStatus === "Paid" ? "bg-status-on-track/10 text-status-on-track" : "bg-status-missed/10 text-status-missed"}`}
                                >
                                  {c.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3 font-medium text-status-missed">
                                {reason}
                              </td>
                              <td className="py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="outlined"
                                  icon={<Eye className="w-3 h-3" />}
                                  onClick={() => {
                                    setActiveModal(null);
                                    navigate(`/clients/${c.id}`);
                                  }}
                                  className="text-[10px] py-1 px-2 hover:bg-brand-teal hover:text-white hover:border-brand-teal"
                                >
                                  Update
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Project PM Allocation Status */}
              {activeModal === "project-allocation" && (
                <div className="space-y-4">
                  {projectAllocationClients.length === 0 ? (
                    <p className="text-xs text-muted-gray italic text-center py-8">
                      No clients are currently awaiting land plot allocation.
                    </p>
                  ) : (
                    <table className="rolad-table">
                      <thead>
                        <tr className="border-b border-border-warm text-muted-gray font-bold">
                          <th className="py-2.5">Code</th>
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Stage</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectAllocationClients.map((c: any) => (
                          <tr
                            key={c.id}
                            className="border-b border-border-warm/50 hover:bg-neutral-50/50"
                          >
                            <td className="py-3 font-semibold text-brand-teal">
                              {c.code}
                            </td>
                            <td className="py-3 font-medium text-charcoal">
                              {c.name}
                            </td>
                            <td className="py-3 text-muted-gray font-semibold">
                              {c.journeyStage}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                size="sm"
                                variant="outlined"
                                icon={<Eye className="w-3 h-3" />}
                                onClick={() => {
                                  setActiveModal(null);
                                  navigate(`/clients/${c.id}`);
                                }}
                                className="text-[10px] py-1 px-2 hover:bg-brand-teal hover:text-white hover:border-brand-teal"
                              >
                                Allocate
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Marketing Allocation Status */}
              {activeModal === "marketing-allocation" && (
                <div className="space-y-4">
                  {marketingAllocationClients.length === 0 ? (
                    <p className="text-xs text-muted-gray italic text-center py-8">
                      No marketing leads are pending allocation.
                    </p>
                  ) : (
                    <table className="rolad-table">
                      <thead>
                        <tr className="border-b border-border-warm text-muted-gray font-bold">
                          <th className="py-2.5">Name</th>
                          <th className="py-2.5">Campaign Lead Channel</th>
                          <th className="py-2.5">Stage</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketingAllocationClients.map((c: any) => (
                          <tr
                            key={c.id}
                            className="border-b border-border-warm/50 hover:bg-neutral-50/50"
                          >
                            <td
                              className="py-3 font-medium text-charcoal cursor-pointer hover:text-brand-teal/80 hover:underline transition-colors"
                              onClick={() => {
                                setActiveModal(null);
                                navigate(`/clients/${c.id}`);
                              }}
                            >
                              {c.name}
                            </td>
                            <td className="py-3 font-medium text-brand-olive">
                              {c.campaignDetails}
                            </td>
                            <td className="py-3 text-muted-gray font-semibold">
                              {c.journeyStage}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                size="sm"
                                variant="outlined"
                                icon={<Eye className="w-3 h-3" />}
                                onClick={() => {
                                  setActiveModal(null);
                                  navigate(`/clients/${c.id}`);
                                }}
                                className="text-[10px] py-1 px-2 hover:bg-brand-teal hover:text-white hover:border-brand-teal"
                              >
                                View Lead
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-50/50 px-6 py-4 border-t border-border-warm flex justify-between items-center text-[10px] text-muted-gray">
              <span>
                Open a client record to review documents, payments and milestones.
              </span>
              <Button
                size="sm"
                variant="outlined"
                onClick={() => setActiveModal(null)}
                className="text-[10px] py-1 px-2.5 font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
