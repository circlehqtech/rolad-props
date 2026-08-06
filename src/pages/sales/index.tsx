import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore, type CommissionItem } from "../../store/mockStore";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import TimeRangePicker, {
  type TimeRangeFilterState,
  buildTimeRangeParams,
} from "../../components/TimeRangePicker";
import PageHeader from "../../components/PageHeader";
import {
  LiveChartGrid,
  LiveDonutChart,
  LiveMetricBars,
} from "../../components/LiveCharts";
import { toast } from "../../utils/toast";
import {
  useSalesKpis,
  useSalesLeaderboard,
  useSalesCommissions,
  useReleaseSalesPayoutMutation,
  useAccountsRevenue,
} from "../../shared/hooks/useLiveQueries";
import { toKoboInt, toNaira, formatNaira, formatCompactNaira } from "../../shared/money";
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
  // modalSource drives the modal open/closed; selectedSource keeps the row highlight
  const [modalSource, setModalSource] = useState<"Internal" | "External" | null>(null);
  const internalRowRef = useRef<HTMLDivElement>(null);
  const externalRowRef = useRef<HTMLDivElement>(null);

  const apiParams = buildTimeRangeParams(timeRange);

  // Live Query Hooks for Sales Endpoints
  const { data: salesKpisData, isLoading: isKpisLoading } = useSalesKpis(apiParams);
  const { data: salesLeaderboardData, isLoading: isLeaderboardLoading } =
    useSalesLeaderboard(apiParams);
  const { data: salesCommissionsData, isLoading: isCommissionsLoading } =
    useSalesCommissions(apiParams);
  const { data: accountsRevenueData, isLoading: isAccountsRevenueLoading } =
    useAccountsRevenue(apiParams);
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
    details: `Contract: ${formatNaira(c.contractAmountKobo || "0")} • Code: ${c.clientCode}`,
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
            `Payout release request logged for ${formatCompactNaira(comm.amount)}!`,
          );
          logActivity(
            `Sales requested payout release for commission of ${formatCompactNaira(comm.amount)} (Client: ${comm.clientName})`,
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
  const getRevenueOrigin = (details?: string, sourceType?: string) => {
    if (sourceType === "internal_campaign") return "Internal";
    if (sourceType === "external" || sourceType === "referral" || sourceType === "organic") return "External";
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

  const liveRevenueList = Array.isArray(accountsRevenueData)
    ? accountsRevenueData
    : (accountsRevenueData as any)?.data || [];

  const mappedLiveRevenue = liveRevenueList.map((item: any) => ({
    id: item.id || item.clientId,
    clientId: item.clientId || item.id,
    name: item.clientName || item.clientCode || "Client",
    code: item.clientCode || "RC-000",
    amount: toNaira(item.amountKobo || "0"),
    sourceType: item.sourceType || "",
    sourceName: item.sourceName || item.note || "Direct Attribution",
    closureAgent: item.responsibleAgentName || "Closure Agent",
    campaignDetails: item.sourceName || item.note || "Direct Attribution",
  }));

  const useLiveSourceData = mappedLiveRevenue.length > 0;

  const internalClients = useLiveSourceData
    ? mappedLiveRevenue.filter(
        (c: any) => getRevenueOrigin(c.campaignDetails, c.sourceType) === "Internal",
      )
    : filteredClients.filter(
        (c: any) => getRevenueOrigin(c.campaignDetails) === "Internal",
      );

  const externalClients = useLiveSourceData
    ? mappedLiveRevenue.filter(
        (c: any) => getRevenueOrigin(c.campaignDetails, c.sourceType) === "External",
      )
    : filteredClients.filter(
        (c: any) => getRevenueOrigin(c.campaignDetails) === "External",
      );

  const internalComm = useLiveSourceData
    ? internalClients.reduce((sum: number, c: any) => sum + c.amount, 0)
    : filteredCommissions
        .filter((c: any) => {
          const cl = clients.find((client: any) => client.id === c.clientId);
          return getRevenueOrigin(cl?.campaignDetails) === "Internal";
        })
        .reduce((sum: number, c: any) => sum + c.amount, 0);

  const externalComm = useLiveSourceData
    ? externalClients.reduce((sum: number, c: any) => sum + c.amount, 0)
    : filteredCommissions
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
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <TimeRangePicker
              initialRange="all"
              onChange={(rangeState) => setTimeRange(rangeState)}
            />
            <Button
              variant="primary"
              icon={<PieChart className="w-4 h-4 text-white" />}
              onClick={() => navigate("/sales/revenue-sources")}
            >
              View Revenue Sources
            </Button>
          </div>
        }
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
              {formatCompactNaira(collectedRevenue)}
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
              {formatCompactNaira(awaitingClearance)}
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
          centerDisplayValue={formatCompactNaira(collectedRevenue + awaitingClearance)}
          loading={isKpisLoading}
          data={[
            {
              label: "Collected revenue",
              value: collectedRevenue,
              displayValue: `${formatCompactNaira(collectedRevenue)}`,
              color: "#0e6b57",
            },
            {
              label: "Awaiting clearance",
              value: awaitingClearance,
              displayValue: `${formatCompactNaira(awaitingClearance)}`,
              color: "#ff7758",
            },
          ]}
        />

        {/* Revenue Sources Partition — moved to Row 2, with ChartShell-matching header chrome */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
          {/* Header: matches ChartShell eyebrow + Live badge + icon-in-circle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-teal">
                  Revenue sources
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                  Live
                </span>
              </div>
              <h2 className="mt-1 text-base font-bold text-slate-900">
                Revenue Sources Partition
              </h2>
              <p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-500">
                Segregate referred income pipelines by campaigns (Internal) vs
                Broker referrals (External) channels.
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-teal/8 text-brand-teal">
              <PieChart className="w-4 h-4" />
            </span>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate("/sales/revenue-sources")}
            className="w-full bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 border-none font-bold text-xs py-2 rounded-lg cursor-pointer"
          >
            Open Full Revenue Sources
          </Button>

          <div className="space-y-3">
            {/* Internal Origin Row — click selects + opens modal */}
            <div
              ref={internalRowRef}
              onClick={() => {
                setSelectedSource("Internal");
                setModalSource("Internal");
              }}
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
                {isAccountsRevenueLoading ? (
                  <Skeleton className="h-4 w-14" />
                ) : (
                  <span className="text-xs font-bold text-brand-teal">
                    {formatCompactNaira(internalComm)}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-gray mt-1">
                {isAccountsRevenueLoading ? (
                  <Skeleton className="h-3 w-20" />
                ) : (
                  `${internalClients.length} referred directories`
                )}
              </p>
            </div>

            {/* External Origin Row — click selects + opens modal */}
            <div
              ref={externalRowRef}
              onClick={() => {
                setSelectedSource("External");
                setModalSource("External");
              }}
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
                {isAccountsRevenueLoading ? (
                  <Skeleton className="h-4 w-14" />
                ) : (
                  <span className="text-xs font-bold text-charcoal">
                    {formatCompactNaira(externalComm)}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-gray mt-1">
                {isAccountsRevenueLoading ? (
                  <Skeleton className="h-3 w-20" />
                ) : (
                  `${externalClients.length} referred directories`
                )}
              </p>
            </div>
          </div>
        </section>
      </LiveChartGrid>

      {/* Split: Commission Audit Dashboard and Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Commission Audit Table — untouched */}
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
                              {formatCompactNaira(comm.amount)}
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
        </div>

        {/* Team Performance — moved to Row 3, right column */}
        <div className="flex flex-col gap-4">
          <LiveMetricBars
            eyebrow="Team performance"
            title="Closed value by sales adviser"
            description="Compare the live closed value attributed to the leading sales advisers."
            loading={isLeaderboardLoading}
            icon="chart-line-up"
            data={leaderboardList.slice(0, 5).map((agent: any) => {
              const value = toNaira(
                agent.closedAmountKobo || agent.paidAmountKobo || "0",
              );
              return {
                label:
                  `${agent.firstName || ""} ${agent.lastName || ""}`.trim() ||
                  "Sales adviser",
                value,
                displayValue: `${formatCompactNaira(value)}`,
              };
            })}
          />

          {/* Sales Leaderboard cards */}
          {isLeaderboardLoading ? (
            <div className="bg-white border border-border-warm rounded-lg p-5 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : leaderboardList.length > 0 ? (
            <div className="bg-white border border-border-warm rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif text-sm font-bold text-brand-teal">
                  Sales Officer Leaderboard
                </h3>
              </div>
              <div className="space-y-2">
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
                          {formatCompactNaira(
                            toNaira(staff.closedAmountKobo || "0"),
                          )}
                        </strong>
                      </p>
                      <p>
                        Paid Vol:{" "}
                        <strong className="text-brand-olive">
                          {formatCompactNaira(
                            toNaira(staff.paidAmountKobo || "0"),
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/* Revenue source client-list modal */}
      <Modal
        open={modalSource !== null}
        onClose={() => setModalSource(null)}
        title={
          modalSource === "Internal"
            ? "Internal Campaign Sources — clients"
            : "External Referral channels — clients"
        }
        description="Select a client below to navigate to their profile."
      >
        {modalSource && (
          <div className="space-y-2">
            {(modalSource === "Internal" ? internalClients : externalClients)
              .length === 0 ? (
              <p className="text-sm text-muted-gray italic text-center py-4">
                No clients in this category.
              </p>
            ) : (
              (modalSource === "Internal"
                ? internalClients
                : externalClients
              ).map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setModalSource(null);
                    navigate(`/clients/${c.id}`);
                  }}
                  className="p-3 border border-border-warm hover:border-brand-teal/40 rounded-lg flex justify-between items-center cursor-pointer transition-colors group bg-neutral-50/30"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-charcoal group-hover:text-brand-teal transition-colors">
                      Client: {c.name}
                    </span>
                    <span className="text-[9px] text-brand-teal font-bold">
                      Agent: {c.closureAgent || "No Agent"} • Source:{" "}
                      {c.campaignDetails || "Direct"}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-gray group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
