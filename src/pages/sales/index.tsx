import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore, type CommissionItem } from "../../store/mockStore";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import TimeRangePicker from "../../components/TimeRangePicker";
import type { TimeRangeFilterState } from "../../components/TimeRangePicker";
import PageHeader from "../../components/PageHeader";
import { LiveChartGrid, LiveDonutChart, LiveMetricBars } from "../../components/LiveCharts";
import { toast } from "../../utils/toast";
import {
  useSalesKpis,
  useSalesLeaderboard,
  useSalesCommissions,
  useReleaseSalesPayoutMutation,
} from "../../shared/hooks/useLiveQueries";
import { toKoboInt, toNaira } from "../../shared/money";
import { formatLabel } from "../../utils/formatters";
import {
  TrendingUp,
  DollarSign,
  Users,
  Award,
  ArrowRight,
  ClipboardList,
  Sparkles,
  PieChart,
  ChevronRight,
  Lock,
  Trophy,
} from "lucide-react";

export default function SalesDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  const { clients, commissions, actionCommission, logActivity } =
    useMockStore();

  const [timeRange, setTimeRange] = useState<TimeRangeFilterState>({
    range: "all",
  });
  const [selectedSource, setSelectedSource] = useState<
    "Internal" | "External" | null
  >(null);

  // Live Query Hooks for Sales Endpoints
  const { data: salesKpisData, isLoading: isKpisLoading } = useSalesKpis();
  const { data: salesLeaderboardData, isLoading: isLeaderboardLoading } =
    useSalesLeaderboard();
  const { data: salesCommissionsData, isLoading: isCommissionsLoading } =
    useSalesCommissions();
  const releasePayoutMutation = useReleaseSalesPayoutMutation();

  // Date Filter helper
  const filterByTime = (itemDateStr?: string) => {
    if (timeRange.range === "all" || !itemDateStr) return true;
    const datePart = itemDateStr.split(" ")[0];
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

  // Filter commissions & clients
  const filteredCommissions = commissions.filter((c: any) =>
    filterByTime(c.date),
  );
  const filteredClients = clients.filter((c: any) => {
    if (timeRange.range === "all") return true;
    return (
      c.ledger.some((l: any) => filterByTime(l.dueDate)) ||
      c.documents.some((d: any) => filterByTime(d.timestamp))
    );
  });

  // Calculate local fallbacks
  const totalEarningsFallback = filteredCommissions
    .filter((c: any) => c.status === "Paid")
    .reduce((sum: number, c: any) => sum + c.amount, 0);

  const pendingCommissionsFallback = filteredCommissions
    .filter((c: any) => c.status === "Pending" || c.status === "Approved")
    .reduce((sum: number, c: any) => sum + c.amount, 0);

  const referredClientsCountFallback = filteredClients.length;

  // Live KPI values
  const collectedRevenue = salesKpisData?.collectedRevenueKobo
    ? toNaira(salesKpisData.collectedRevenueKobo)
    : 0;

  const awaitingClearance = salesKpisData?.awaitingClearanceKobo
    ? toNaira(salesKpisData.awaitingClearanceKobo)
    : 0;

  const pipelineDealsCount = salesKpisData?.pipelineDeals ?? 0;

  // Live Commissions list
  const liveCommissionsList = salesCommissionsData?.data || [];
  const displayCommissions = liveCommissionsList.map((c: any) => ({
    id: c.id,
    clientId: c.clientId,
    clientName: c.clientName || c.clientCode || "Client",
    details: `Contract: ₦${toNaira(c.contractAmountKobo || "0").toLocaleString()} • Code: ${c.clientCode}`,
    amount: toNaira(c.commissionAmountKobo || "0"),
    date: c.createdAt
      ? new Date(c.createdAt).toLocaleDateString()
      : "2026-07-24",
    status: formatLabel(c.status),
    rawStatus: (c.status || "").toLowerCase(),
    closureAgentName: c.closureAgentName || "Closure Agent",
  }));

  // Live Leaderboard list
  const leaderboardList = salesLeaderboardData?.data || [];

  const handleRequestPayout = (comm: any) => {
    releasePayoutMutation.mutate(
      {
        clientId: comm.clientId,
        commissionAmountKobo: toKoboInt(comm.amount).toString(),
        note: comm.details,
      },
      {
        onSuccess: () => {
          actionCommission(comm.id, "Approved");
          toast.success(
            `Payout release request logged for ₦${comm.amount.toLocaleString()}!`,
          );
          logActivity(
            `Sales requested payout release for commission of ₦${comm.amount.toLocaleString()} (Client: ${comm.clientName})`,
            user?.name || role,
          );
        },
        onError: (err: any) => {
          toast.error(
            err.messages?.[0] || "Failed to submit release payout request.",
          );
        },
      },
    );
  };

  // Split Revenue Source: Campaign mapping details (Internal vs External origin)
  const getRevenueOrigin = (details?: string) => {
    if (!details) return "External";
    const intKeywords = [
      "summer",
      "instagram",
      "google",
      "facebook",
      "search",
      "promo",
      "direct",
    ];
    const isInternal = intKeywords.some((kw) =>
      details.toLowerCase().includes(kw),
    );
    return isInternal ? "Internal" : "External";
  };

  const internalClients = filteredClients.filter(
    (c: any) => getRevenueOrigin(c.campaignDetails) === "Internal",
  );
  const externalClients = filteredClients.filter(
    (c: any) => getRevenueOrigin(c.campaignDetails) === "External",
  );

  const internalComm = filteredCommissions
    .filter((c: any) => {
      const cl = clients.find((client: any) => client.id === c.clientId);
      return getRevenueOrigin(cl?.campaignDetails) === "Internal";
    })
    .reduce((sum: number, c: any) => sum + c.amount, 0);

  const externalComm = filteredCommissions
    .filter((c: any) => {
      const cl = clients.find((client: any) => client.id === c.clientId);
      return getRevenueOrigin(cl?.campaignDetails) === "External";
    })
    .reduce((sum: number, c: any) => sum + c.amount, 0);

  return (
    <div className="property-page space-y-6 pb-10 select-none">
      <PageHeader
        section="Sales"
        title="Sales & Commission Hub"
        description="Trace sales conversions, earnings matrix distributions, and referral payouts."
        actions={<div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            icon={<PieChart className="w-4 h-4 text-white" />}
            onClick={() => navigate("/sales/revenue-sources")}
          >
            View Revenue Sources
          </Button>
          <TimeRangePicker onChange={(rangeState) => setTimeRange(rangeState)} />
        </div>}
      />

      {/* Earnings Breakdown Matrix (Live API KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-border-warm border-l-[3px] border-l-brand-olive p-6 rounded-lg shadow-sm">
          <p className="text-[10px] tracking-wider font-bold text-muted-gray uppercase">
            Collected revenue
          </p>
          {isKpisLoading ? (
            <Skeleton className="h-9 w-40 mt-2" />
          ) : (
            <p className="text-3xl font-bold text-charcoal mt-2 tracking-tight">
              ₦{collectedRevenue.toLocaleString()}
            </p>
          )}
          <div className="text-brand-olive text-xs font-semibold flex items-center gap-1 mt-4">
            <Award className="w-3.5 h-3.5" />
            <span>Successfully cleared settlements</span>
          </div>
        </div>

        <div className="bg-white border border-border-warm border-l-[3px] border-l-brand-teal p-6 rounded-lg shadow-sm">
          <p className="text-[10px] tracking-wider font-bold text-muted-gray uppercase">
            Awaiting Clearance
          </p>
          {isKpisLoading ? (
            <Skeleton className="h-9 w-40 mt-2" />
          ) : (
            <p className="text-3xl font-bold text-brand-teal mt-2 tracking-tight">
              ₦{awaitingClearance.toLocaleString()}
            </p>
          )}
          <div className="text-brand-teal text-xs font-semibold flex items-center gap-1 mt-4">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pending administrative reviews</span>
          </div>
        </div>

        <div className="bg-white border border-border-warm border-l-[3px] border-l-charcoal p-6 rounded-lg shadow-sm">
          <p className="text-[10px] tracking-wider font-bold text-muted-gray uppercase whitespace-nowrap">
            Pipeline deals
          </p>
          {isKpisLoading ? (
            <Skeleton className="h-9 w-28 mt-2" />
          ) : (
            <p className="text-3xl font-bold text-charcoal mt-2 tracking-tight">
              {pipelineDealsCount} Deals
            </p>
          )}
          <div className="text-muted-gray text-xs font-semibold flex items-center gap-1 mt-4">
            <Users className="w-3.5 h-3.5" />
            <span>Active pipeline conversions</span>
          </div>
        </div>
      </div>

      <LiveChartGrid>
        <LiveDonutChart
          eyebrow="Revenue readiness"
          title="Collected versus awaiting clearance"
          description="A live view of secured sales revenue compared with value still awaiting administrative clearance."
          centerLabel="Revenue value"
          loading={isKpisLoading}
          data={[
            { label: "Collected revenue", value: collectedRevenue, displayValue: `₦${collectedRevenue.toLocaleString()}`, color: "#0b909c" },
            { label: "Awaiting clearance", value: awaitingClearance, displayValue: `₦${awaitingClearance.toLocaleString()}`, color: "#ff7758" },
          ]}
        />
        <LiveMetricBars
          eyebrow="Team performance"
          title="Closed value by sales adviser"
          description="Compare the live closed value attributed to the leading sales advisers."
          loading={isLeaderboardLoading}
          icon="chart-line-up"
          data={leaderboardList.slice(0, 5).map((agent: any) => {
            const value = toNaira(agent.closedAmountKobo || agent.paidAmountKobo || "0");
            return {
              label: `${agent.firstName || ""} ${agent.lastName || ""}`.trim() || "Sales adviser",
              value,
              displayValue: `₦${value.toLocaleString()}`,
            };
          })}
        />
      </LiveChartGrid>

      {/* Split: Commission Audit Dashboard and Revenue Source Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Commission Audit Table */}
        <div className="lg:col-span-2 bg-white border border-border-warm rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
              <h2 className="font-serif text-base font-bold text-brand-teal">
                Commission Payout Audits
              </h2>
              <span className="text-[9px] font-bold text-brand-teal bg-brand-teal/5 px-2 py-0.5 rounded">
                REPRESENTATIVE TRACE
              </span>
            </div>

            {isCommissionsLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="rolad-table">
                  <thead>
                    <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                      <th className="px-6 py-3">Client Reference</th>
                      <th className="px-6 py-3 text-brand-olive">
                        Sales Agent
                      </th>
                      <th className="px-6 py-3">Payout Amt</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                    {displayCommissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-6 italic text-muted-gray"
                        >
                          No commissions registered.
                        </td>
                      </tr>
                    ) : (
                      displayCommissions.map((comm: any) => {
                        const isPending =
                          comm.rawStatus === "pending" ||
                          comm.rawStatus === "draft";
                        return (
                          <tr
                            key={comm.id}
                            className="hover:bg-neutral-50/30 transition-colors"
                          >
                            <td className="px-6 py-3.5">
                              <span className="font-bold block">
                                {comm.clientName}
                              </span>
                              <span className="text-[10px] text-muted-gray mt-0.5 block">
                                {comm.details}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="font-semibold text-brand-olive">
                                {comm.closureAgentName}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 font-bold">
                              ₦{comm.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5 text-muted-gray font-mono text-[11px]">
                              {comm.date}
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                  comm.rawStatus === "paid"
                                    ? "text-brand-olive bg-brand-olive/10"
                                    : comm.rawStatus === "approved"
                                      ? "text-brand-teal bg-brand-teal/10"
                                      : "text-status-late bg-status-late/10"
                                }`}
                              >
                                {comm.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {isPending && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  isLoading={releasePayoutMutation.isPending}
                                  onClick={() => handleRequestPayout(comm)}
                                  className="text-[10px] py-1 px-2.5 font-bold"
                                >
                                  Release Payout
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sales Leaderboard Section */}
          {isLeaderboardLoading ? (
            <div className="border-t border-border-warm bg-neutral-50/20 p-6 space-y-4">
              <Skeleton className="h-4 w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : leaderboardList.length > 0 ? (
            <div className="border-t border-border-warm bg-neutral-50/20 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif text-sm font-bold text-brand-teal">
                  Sales Officer Leaderboard
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {leaderboardList.map((staff: any) => (
                  <div
                    key={staff.staffId}
                    className="p-3 bg-white border border-border-warm rounded-lg shadow-2xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-charcoal">
                        {staff.firstName} {staff.lastName}
                      </span>
                      <span className="text-[10px] font-bold text-brand-olive bg-brand-olive/10 px-1.5 py-0.5 rounded">
                        {staff.conversionRate}% Conv.
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-gray space-y-0.5 font-medium">
                      <p>
                        Clients:{" "}
                        <strong className="text-charcoal">
                          {staff.activeClients} Active / {staff.totalClients}{" "}
                          Total
                        </strong>
                      </p>
                      <p>
                        Closed Vol:{" "}
                        <strong className="text-brand-teal">
                          ₦
                          {toNaira(
                            staff.closedAmountKobo || "0",
                          ).toLocaleString()}
                        </strong>
                      </p>
                      <p>
                        Paid Vol:{" "}
                        <strong className="text-brand-olive">
                          ₦
                          {toNaira(
                            staff.paidAmountKobo || "0",
                          ).toLocaleString()}
                        </strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* View Revenue Source Dashboard partition */}
        <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border-warm/60">
            <PieChart className="w-5 h-5 text-brand-teal" />
            <h2 className="font-serif text-base font-bold text-brand-teal">
              Revenue Sources Partition
            </h2>
          </div>
          <p className="text-[11px] text-muted-gray leading-normal">
            Segregate referred income pipelines by campaigns (Internal) vs
            Broker referrals (External) channels.
          </p>

          <Button
            variant="secondary"
            onClick={() => navigate("/sales/revenue-sources")}
            className="w-full bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 border-none font-bold text-xs py-2 rounded-lg cursor-pointer"
          >
            Open Full Revenue Sources Console →
          </Button>

          <div className="space-y-3">
            {/* Internal Origin Row */}
            <div
              onClick={() =>
                setSelectedSource(
                  selectedSource === "Internal" ? null : "Internal",
                )
              }
              className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                selectedSource === "Internal"
                  ? "bg-brand-teal/5 border-brand-teal shadow-sm"
                  : "border-border-warm hover:bg-neutral-50/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-charcoal">
                  Internal Campaign Sources
                </span>
                <span className="text-xs font-bold text-brand-teal">
                  ₦{internalComm.toLocaleString()}
                </span>
              </div>
              <p className="text-[9px] text-muted-gray mt-1">
                {internalClients.length} referred directories
              </p>
            </div>

            {/* External Origin Row */}
            <div
              onClick={() =>
                setSelectedSource(
                  selectedSource === "External" ? null : "External",
                )
              }
              className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                selectedSource === "External"
                  ? "bg-brand-teal/5 border-brand-teal shadow-sm"
                  : "border-border-warm hover:bg-neutral-50/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-charcoal">
                  External Referral channels
                </span>
                <span className="text-xs font-bold text-charcoal">
                  ₦{externalComm.toLocaleString()}
                </span>
              </div>
              <p className="text-[9px] text-muted-gray mt-1">
                {externalClients.length} referred directories
              </p>
            </div>
          </div>

          {/* Deep-link referral list */}
          {selectedSource && (
            <div className="pt-2 border-t border-border-warm/60 space-y-2.5 animate-fade-in max-h-45 overflow-y-auto pr-1">
              <span className="text-[9px] font-bold text-muted-gray uppercase block tracking-wider">
                Select Client to view Profile:
              </span>
              <div className="space-y-1.5">
                {(selectedSource === "Internal"
                  ? internalClients
                  : externalClients
                ).map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="p-2 border border-border-warm hover:border-brand-teal/40 rounded flex justify-between items-center cursor-pointer transition-colors group bg-neutral-50/30 font-semibold"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-charcoal group-hover:text-brand-teal transition-colors">
                        Client: {c.name}
                      </span>
                      <span className="text-[9px] text-brand-teal font-bold mt-0.5">
                        Agent: {c.closureAgent || "No Agent"} • Source:{" "}
                        {c.campaignDetails || "Direct"}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-gray group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
