import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore } from "../../store/mockStore";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import Select from "../../components/Select";
import TimeRangePicker from "../../components/TimeRangePicker";
import type { TimeRangeFilterState } from "../../components/TimeRangePicker";
import { toApiTimeRange } from "../../components/TimeRangePicker";
import {
  useAccountRevenue,
  useAccountsRevenue,
} from "../../shared/hooks/useLiveQueries";
import { toNaira } from "../../shared/money";
import {
  ArrowLeft,
  PieChart,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  Users,
  ShieldCheck,
  Building,
  Globe,
  Share2,
  Calendar,
  CreditCard,
  FileText,
  Eye,
  X,
} from "lucide-react";

export default function RevenueSources() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  const { clients } = useMockStore();

  const [timeRange, setTimeRange] = useState<TimeRangeFilterState>({
    range: "all",
  });
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRevenueId, setSelectedRevenueId] = useState<string>("");

  const revenueParams = {
    timeRange: toApiTimeRange(timeRange.range),
    ...(timeRange.date ? { date: timeRange.date } : {}),
    ...(timeRange.range === "custom" && timeRange.start
      ? { fromDate: timeRange.start }
      : {}),
    ...(timeRange.range === "custom" && timeRange.end
      ? { toDate: timeRange.end }
      : {}),
    ...(sourceTypeFilter !== "all"
      ? {
          sourceType:
            sourceTypeFilter === "internal"
              ? "internal_campaign"
              : sourceTypeFilter,
        }
      : {}),
  };

  const { data: revenueData, isLoading: isAuditsLoading } =
    useAccountsRevenue(revenueParams);
  const { data: selectedRevenue, isLoading: isRevenueDetailLoading } =
    useAccountRevenue(selectedRevenueId, Boolean(selectedRevenueId));

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

  // Default Mock Revenue Items (Fallback & Live API Merge)
  const mockRevenueEntries = [
    {
      id: "REV-1001",
      clientName: "Alhaji Ibrahim Musa",
      clientCode: "RC-1002",
      amountKobo: "5000000000", // 50,000,000 NGN
      sourceType: "internal_campaign",
      sourceName: "Instagram Promo 2026",
      responsibleAgent: "Zainab Yusuf",
      paymentMethod: "bank_transfer",
      transactionRef: "TXN-992014",
      installmentNumber: 1,
      date: "2026-07-25",
      status: "Approved",
      note: "First installment via Instagram marketing campaign conversion",
    },
    {
      id: "REV-1002",
      clientName: "Chief Emeka Okonkwo",
      clientCode: "RC-1005",
      amountKobo: "7500000000", // 75,000,000 NGN
      sourceType: "external",
      sourceName: "Corporate Broker Partnership",
      responsibleAgent: "Tayo Bankole",
      paymentMethod: "bank_transfer",
      transactionRef: "TXN-883019",
      installmentNumber: 1,
      date: "2026-07-24",
      status: "Approved",
      note: "Full allocation payment referred via Apex Realty Broker Agency",
    },
    {
      id: "REV-1003",
      clientName: "Dr. Kemi Adebayo",
      clientCode: "RC-1008",
      amountKobo: "3000000000", // 30,000,000 NGN
      sourceType: "internal_campaign",
      sourceName: "Google Search Land Ads",
      responsibleAgent: "Adaobi Rolad",
      paymentMethod: "cheque",
      transactionRef: "TXN-774022",
      installmentNumber: 2,
      date: "2026-07-22",
      status: "Approved",
      note: "Second installment for VGC Plot allocation",
    },
    {
      id: "REV-1004",
      clientName: "Engr. Femi Balogun",
      clientCode: "RC-1011",
      amountKobo: "2000000000", // 20,000,000 NGN
      sourceType: "referral",
      sourceName: "Client Referral (Chuka Rolad)",
      responsibleAgent: "Ngozi Eze",
      paymentMethod: "bank_transfer",
      transactionRef: "TXN-661084",
      installmentNumber: 1,
      date: "2026-07-20",
      status: "Approved",
      note: "Direct referral deposit for Epe Land development",
    },
    {
      id: "REV-1005",
      clientName: "Mrs. Folake Solanke",
      clientCode: "RC-1014",
      amountKobo: "1500000000", // 15,000,000 NGN
      sourceType: "organic",
      sourceName: "Direct Website Organic Walk-in",
      responsibleAgent: "Zainab Yusuf",
      paymentMethod: "card",
      transactionRef: "TXN-552093",
      installmentNumber: 1,
      date: "2026-07-18",
      status: "Approved",
      note: "Organic web lead initial land deposit",
    },
  ];

  // Process Live Audits API + Mock fallback entries
  const liveAuditList = revenueData?.data || [];

  const mappedLiveAudits = liveAuditList.map((a: any) => ({
    id: a.id,
    clientName: a.clientName || a.clientCode || "Client",
    clientCode: a.clientCode || "RC-000",
    amountKobo: a.amountKobo || "0",
    sourceType: a.sourceType || "internal_campaign",
    sourceName: a.sourceName || a.note || "Direct Attribution",
    responsibleAgent:
      a.responsibleAgentName || a.responsibleAgentId || "Closure Agent",
    paymentMethod: a.paymentMethod || "bank_transfer",
    transactionRef: a.transactionRef || `TXN-${a.id.substring(0, 6)}`,
    installmentNumber: a.installmentNumber || 1,
    date: a.createdAt
      ? new Date(a.createdAt).toISOString().substring(0, 10)
      : "2026-07-25",
    status: a.status
      ? a.status.charAt(0).toUpperCase() + a.status.slice(1)
      : "Approved",
    note: a.note || "Logged revenue entry",
  }));

  const allEntries =
    mappedLiveAudits.length > 0 ? mappedLiveAudits : mockRevenueEntries;

  // Filter entries by time range, source type, and search query
  const filteredEntries = allEntries.filter((item: any) => {
    // 1. Time range filter
    if (!filterByTime(item.date)) return false;

    // 2. Source Type filter
    if (sourceTypeFilter !== "all") {
      if (
        sourceTypeFilter === "internal" &&
        item.sourceType !== "internal_campaign"
      )
        return false;
      if (sourceTypeFilter === "external" && item.sourceType !== "external")
        return false;
      if (sourceTypeFilter === "referral" && item.sourceType !== "referral")
        return false;
      if (sourceTypeFilter === "organic" && item.sourceType !== "organic")
        return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.clientName.toLowerCase().includes(q);
      const matchCode = item.clientCode.toLowerCase().includes(q);
      const matchSource = item.sourceName.toLowerCase().includes(q);
      const matchAgent = item.responsibleAgent.toLowerCase().includes(q);
      const matchTxn = item.transactionRef.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSource && !matchAgent && !matchTxn)
        return false;
    }

    return true;
  });

  // Calculate Aggregates
  const totalRevenue = filteredEntries.reduce(
    (sum: number, item: any) => sum + toNaira(item.amountKobo),
    0,
  );

  const internalRevenue = filteredEntries
    .filter((i: any) => i.sourceType === "internal_campaign")
    .reduce((sum: number, item: any) => sum + toNaira(item.amountKobo), 0);

  const externalRevenue = filteredEntries
    .filter((i: any) => i.sourceType === "external")
    .reduce((sum: number, item: any) => sum + toNaira(item.amountKobo), 0);

  const referralRevenue = filteredEntries
    .filter((i: any) => i.sourceType === "referral")
    .reduce((sum: number, item: any) => sum + toNaira(item.amountKobo), 0);

  const organicRevenue = filteredEntries
    .filter((i: any) => i.sourceType === "organic")
    .reduce((sum: number, item: any) => sum + toNaira(item.amountKobo), 0);

  const formatSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case "internal_campaign":
        return (
          <span className="bg-brand-teal/10 text-brand-teal border border-brand-teal/20 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
            <Globe className="w-3 h-3 text-brand-teal" />
            Internal Campaign
          </span>
        );
      case "external":
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
            <Building className="w-3 h-3 text-indigo-600" />
            External Partner
          </span>
        );
      case "referral":
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
            <Share2 className="w-3 h-3 text-amber-600" />
            Broker / Referral
          </span>
        );
      default:
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Organic Direct
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 select-none">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate("/sales")}
            className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1 mb-2 cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sales & Commission Hub
          </button>
          <h1 className="font-serif text-3xl font-extrabold text-brand-teal tracking-wide flex items-center gap-2">
            <PieChart className="w-8 h-8 text-brand-teal" />
            Revenue Sources & Attributions
          </h1>
          <p className="text-muted-gray text-sm mt-1">
            Executive view of attributed revenue streams, campaign sources, and
            channel origin details.
          </p>
        </div>

        {/* Date Range Picker with Custom Date Ranges */}
        <TimeRangePicker onChange={(rangeState) => setTimeRange(rangeState)} />
      </div>

      {/* Top Level KPI Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-border-warm border-l-4 border-l-brand-teal p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">
            Total Filtered Revenue
          </p>
          <p className="text-2xl font-extrabold text-brand-teal">
            ₦{totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-gray font-medium pt-1">
            {filteredEntries.length} total transaction logs
          </p>
        </div>

        <div className="bg-white border border-border-warm border-l-4 border-l-cyan-600 p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">
            Internal Campaign Revenue
          </p>
          <p className="text-2xl font-extrabold text-charcoal">
            ₦{internalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-cyan-700 font-semibold pt-1">
            Instagram, Google Ads, Email promos
          </p>
        </div>

        <div className="bg-white border border-border-warm border-l-4 border-l-indigo-600 p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">
            External / Partner Revenue
          </p>
          <p className="text-2xl font-extrabold text-indigo-900">
            ₦{externalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-indigo-600 font-semibold pt-1">
            Broker agencies & corporate partners
          </p>
        </div>

        <div className="bg-white border border-border-warm border-l-4 border-l-amber-500 p-5 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-muted-gray uppercase tracking-wider">
            Referrals & Organic Revenue
          </p>
          <p className="text-2xl font-extrabold text-amber-900">
            ₦{(referralRevenue + organicRevenue).toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-700 font-semibold pt-1">
            Agent referrals & direct web leads
          </p>
        </div>
      </div>

      {/* Main Content Area: Filters + Revenue Table */}
      <div className="bg-white border border-border-warm rounded-xl shadow-sm overflow-hidden space-y-4">
        {/* Table Filter Toolbar */}
        <div className="p-5 border-b border-border-warm bg-neutral-50/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-serif text-base font-bold text-brand-teal">
              Attributed Revenue Entries
            </h2>
            <span className="text-[9px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/20">
              {filteredEntries.length} RECORDS
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-muted-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search client, source, agent, ref..."
                className="pl-9 pr-3 py-1.5 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white w-56 font-medium"
              />
            </div>

            {/* Source Type Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-gray" />
              <Select
                options={[
                  { value: "all", label: "All Source Types" },
                  { value: "internal", label: "Internal Campaign" },
                  { value: "external", label: "External Partner" },
                  { value: "referral", label: "Broker Referral" },
                  { value: "organic", label: "Organic Direct" },
                ]}
                value={sourceTypeFilter}
                onChange={(val) => setSourceTypeFilter(val)}
                className="w-40 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Revenue Entries Detailed Table */}
        {isAuditsLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 text-xs italic text-muted-gray flex flex-col items-center justify-center space-y-2">
            <FileText className="w-10 h-10 text-muted-gray/30 mb-1" />
            <p>No revenue sources matched your current filters or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="rolad-table">
              <thead>
                <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/40">
                  <th className="px-6 py-3.5">Client & Reference</th>
                  <th className="px-6 py-3.5">Attributed Source</th>
                  <th className="px-6 py-3.5">Responsible Agent</th>
                  <th className="px-6 py-3.5">Payment Method</th>
                  <th className="px-6 py-3.5">Revenue Amount</th>
                  <th className="px-6 py-3.5 text-right">Date & Status</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs text-charcoal font-medium">
                {filteredEntries.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    {/* Client & Reference */}
                    <td className="px-6 py-4">
                      <span className="font-bold block text-charcoal">
                        {item.clientName}
                      </span>
                      <span className="text-[10px] font-semibold text-brand-teal mt-0.5 block">
                        Code: {item.clientCode} • Ref: {item.transactionRef}
                      </span>
                    </td>

                    {/* Attributed Source */}
                    <td className="px-6 py-4 space-y-1">
                      <div>{formatSourceBadge(item.sourceType)}</div>
                      <span className="text-xs font-bold text-charcoal block">
                        {item.sourceName}
                      </span>
                    </td>

                    {/* Responsible Agent */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-charcoal block">
                        {item.responsibleAgent}
                      </span>
                      <span className="text-[10px] text-muted-gray">
                        Attributed Officer
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-charcoal uppercase text-[11px] block">
                        {item.paymentMethod.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-muted-gray">
                        Installment #{item.installmentNumber}
                      </span>
                    </td>

                    {/* Revenue Amount */}
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-brand-teal text-sm block">
                        ₦{toNaira(item.amountKobo).toLocaleString()}
                      </span>
                    </td>

                    {/* Date & Status */}
                    <td className="px-6 py-4 text-right">
                      <span className="bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider">
                        {item.status}
                      </span>
                      <span className="text-[10px] text-muted-gray font-mono block mt-1">
                        {item.date}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        aria-label={`View revenue entry for ${item.clientName}`}
                        onClick={() => setSelectedRevenueId(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-teal/15 text-brand-teal hover:bg-brand-teal hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRevenueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-brand-teal/10 bg-white p-6 shadow-2xl">
            <button
              type="button"
              aria-label="Close revenue details"
              onClick={() => setSelectedRevenueId("")}
              className="absolute right-4 top-4 rounded-lg p-2 text-muted-gray hover:bg-neutral-100 hover:text-charcoal"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-teal">
              Revenue entry
            </span>
            <h2 className="mt-1 font-serif text-xl font-bold text-charcoal">
              Transaction Details
            </h2>

            {isRevenueDetailLoading ? (
              <div className="mt-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : selectedRevenue ? (
              <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Client", selectedRevenue.clientName || selectedRevenue.clientCode],
                  ["Client code", selectedRevenue.clientCode || "—"],
                  ["Amount", `₦${toNaira(selectedRevenue.amountKobo).toLocaleString()}`],
                  ["Status", selectedRevenue.status],
                  ["Source type", selectedRevenue.sourceType || "—"],
                  ["Source", selectedRevenue.sourceName || "—"],
                  [
                    "Responsible agent",
                    selectedRevenue.responsibleAgentName ||
                      selectedRevenue.responsibleAgentId ||
                      "—",
                  ],
                  ["Transaction reference", selectedRevenue.transactionRef || "—"],
                ].map(([label, detail]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border-warm/70 bg-[#f8faf7] p-3"
                  >
                    <dt className="text-[8px] font-bold uppercase tracking-wider text-muted-gray">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold text-charcoal">
                      {detail}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-6 rounded-xl bg-neutral-50 p-5 text-center text-xs text-muted-gray">
                Revenue details could not be loaded.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
