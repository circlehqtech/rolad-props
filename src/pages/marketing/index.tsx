import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore, type Client } from "../../store/mockStore";
import TimeRangePicker, {
  type TimeRangeFilterState,
  buildTimeRangeParams,
} from "../../components/TimeRangePicker";
import { toast } from "../../utils/toast";
import {
  useMarketingLeads,
  useMarketingCampaigns,
  useCreateMarketingCampaignMutation,
  useMarketingKpis,
} from "../../shared/hooks/useLiveQueries";
import { formatNaira, toKoboInt, formatCompactNaira } from "../../shared/money";
import Skeleton from "../../components/Skeleton";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import {
  LiveChartGrid,
  LiveDonutChart,
  LiveMetricBars,
} from "../../components/LiveCharts";
import {
  Megaphone,
  TrendingUp,
  Users,
  Megaphone as Target,
  Sparkles,
  Layers,
  History,
  FileSpreadsheet,
  ChevronRight,
  Edit2,
  X,
} from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  channel: string;
  spend: number;
  leads: number;
  startDate: string;
  status: "Active" | "Completed" | "Planned";
}

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";
  const isMarketing = role === "Marketing Officer";

  const {
    clients,
    updateClientCampaignDetails,
    updateClientClosureAgent,
    logActivity,
  } = useMockStore();

  const [timeRange, setTimeRange] = useState<TimeRangeFilterState>({
    range: "all",
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [campaignInput, setCampaignInput] = useState("");
  const [agentInput, setAgentInput] = useState("");

  const apiParams = buildTimeRangeParams(timeRange);

  const { data: marketingLeadsData, isLoading: isLeadsLoading } =
    useMarketingLeads(apiParams);
  const { data: marketingCampaignsData, isLoading: isCampaignsLoading } =
    useMarketingCampaigns(apiParams);
  const { data: marketingKpisData, isLoading: isKpisLoading } =
    useMarketingKpis(apiParams);
  const createCampaignMutation = useCreateMarketingCampaignMutation();
  const [showLeadGenDrawer, setShowLeadGenDrawer] = useState(false);

  // Manual campaign form states
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [newCampName, setNewCampName] = useState("");
  const [newCampObjective, setNewCampObjective] = useState("");
  const [newCampChannel, setNewCampChannel] = useState("Social Media");
  const [newCampStart, setNewCampStart] = useState("");
  const [newCampEnd, setNewCampEnd] = useState("");
  const [newCampSpend, setNewCampSpend] = useState("");
  const [newCampLeads, setNewCampLeads] = useState("");
  const [newCampConversions, setNewCampConversions] = useState("");
  const [newCampNotes, setNewCampNotes] = useState("");
  const [newCampStatus, setNewCampStatus] = useState<
    "Active" | "Completed" | "Planned"
  >("Active");

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMarketing) {
      toast.error(
        "Only Marketing Officers are authorized to create marketing campaigns.",
      );
      return;
    }

    const spendVal = parseFloat(newCampSpend) || 0;
    const leadsVal = parseInt(newCampLeads) || 0;
    const convVal = parseInt(newCampConversions) || 0;
    const spendKoboStr = toKoboInt(spendVal).toString();

    createCampaignMutation.mutate(
      {
        name: newCampName,
        objective: newCampObjective || undefined,
        channel: newCampChannel.toLowerCase(),
        startDate: newCampStart || undefined,
        endDate: newCampEnd || undefined,
        spendKobo: spendKoboStr,
        leadsGenerated: leadsVal,
        conversions: convVal,
        notes: newCampNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Campaign "${newCampName}" added to history timeline!`);
          logActivity(
            `Added campaign details for "${newCampName}"`,
            user?.name || role,
          );
          // Reset Form
          setNewCampName("");
          setNewCampObjective("");
          setNewCampChannel("Social Media");
          setNewCampStart("");
          setNewCampEnd("");
          setNewCampSpend("");
          setNewCampLeads("");
          setNewCampConversions("");
          setNewCampNotes("");
          setNewCampStatus("Active");
          setShowAddCampaignModal(false);
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to create campaign.");
        },
      },
    );
  };

  // Mock static campaigns details
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([
    {
      id: "camp-1",
      name: "Summer Instagram Promo 2026",
      channel: "Social Media (Paid)",
      spend: 4500,
      leads: 185,
      startDate: "2026-06-01",
      status: "Active",
    },
    {
      id: "camp-2",
      name: "Google Search Ads Campaign G2",
      channel: "PPC Search",
      spend: 3200,
      leads: 110,
      startDate: "2026-05-15",
      status: "Active",
    },
    {
      id: "camp-3",
      name: "VGC Billboard Ad Campaign",
      channel: "Outdoor/OOH",
      spend: 12000,
      leads: 45,
      startDate: "2026-04-10",
      status: "Completed",
    },
  ]);

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

  // Filter campaigns and clients based on active dates
  const filteredCampaigns = campaigns.filter((c: any) =>
    filterByTime(c.startDate),
  );
  const filteredClients = clients.filter((c: any) => {
    if (timeRange.range === "all") return true;
    return (
      c.ledger.some((l: any) => filterByTime(l.dueDate)) ||
      c.documents.some((d: any) => filterByTime(d.timestamp))
    );
  });

  // Calculate totals
  const totalCampaignSpend = filteredCampaigns.reduce(
    (sum: number, c: any) => sum + c.spend,
    0,
  );
  const totalCampaignLeads = filteredCampaigns.reduce(
    (sum: number, c: any) => sum + c.leads,
    0,
  );

  const apiLeads = Array.isArray(marketingLeadsData)
    ? marketingLeadsData
    : marketingLeadsData?.data || [];
  const displayLeads = apiLeads.map((lead: any, idx: number) => ({
    id: lead.clientCode || `lead-${idx}`,
    name: lead.clientName,
    code: lead.clientCode,
    productType: lead.category,
    campaignDetails: lead.campaignName || lead.referralSource || "",
    closureAgent: lead.salesAgent || "",
    journeyStage: lead.stage,
    isApiLead: true,
  }));

  const totalLeadsCount =
    marketingKpisData?.totalLeads ??
    marketingLeadsData?.totalLeads ??
    apiLeads.length;

  const apiCampaigns = Array.isArray(marketingCampaignsData)
    ? marketingCampaignsData
    : marketingCampaignsData?.data || [];
  const displayCampaigns = apiCampaigns.map((camp: any) => ({
    id: camp.id,
    name: camp.name,
    channel: camp.channel,
    spendFormatted: formatNaira(camp.spendKobo),
    leads: camp.leadsGenerated,
    conversions: camp.conversions,
    costPerLeadFormatted: formatNaira(camp.costPerLeadKobo),
    createdBy: camp.createdByStaffName || "Chuka Rolad",
    createdAt: camp.createdAt ? camp.createdAt.split("T")[0] : "2026-07-22",
    status: "Active",
  }));

  const acquiredClients = filteredClients.length;
  const averageCAC =
    acquiredClients > 0
      ? (totalCampaignSpend / acquiredClients).toFixed(2)
      : "0.00";

  const formattedTotalSpend = marketingCampaignsData?.totalSpendKobo
    ? formatNaira(marketingCampaignsData.totalSpendKobo)
    : `${formatCompactNaira(totalCampaignSpend)}`;

  const formattedAvgCac = marketingCampaignsData?.avgCostPerLeadKobo
    ? formatNaira(marketingCampaignsData.avgCostPerLeadKobo)
    : `₦${averageCAC}`;

  const displayTotalSpend = marketingKpisData?.totalSpendKobo
    ? formatNaira(marketingKpisData.totalSpendKobo)
    : formattedTotalSpend;

  const displayTotalLeads = marketingKpisData?.totalLeads ?? totalLeadsCount;

  const displayLeadSubtext = marketingKpisData?.leadBreakdown
    ? `${marketingKpisData.leadBreakdown.landProperty} L&P • ${marketingKpisData.leadBreakdown.investment} Inv`
    : marketingLeadsData?.landPropertyCount !== undefined
      ? `${marketingLeadsData.landPropertyCount} L&P • ${marketingLeadsData.investmentCount} Inv`
      : "Digital pipeline captures";

  const displayAcquiredAccounts =
    marketingKpisData?.acquiredAccounts ?? acquiredClients;

  const displayAvgCac = marketingKpisData?.averageCacKobo
    ? formatNaira(marketingKpisData.averageCacKobo)
    : formattedAvgCac;

  const landPropertyLeads =
    marketingKpisData?.leadBreakdown?.landProperty ??
    displayLeads.filter((lead: any) =>
      String(lead.productType || "")
        .toLowerCase()
        .includes("land"),
    ).length;
  const investmentLeads =
    marketingKpisData?.leadBreakdown?.investment ??
    displayLeads.filter((lead: any) =>
      String(lead.productType || "")
        .toLowerCase()
        .includes("investment"),
    ).length;

  const handleEditCampaignClick = (client: any) => {
    setEditingClientId(client.id);
    setCampaignInput(client.campaignDetails || "");
    setAgentInput(client.closureAgent || "");
  };

  const handleSaveCampaign = (clientId: string) => {
    updateClientCampaignDetails(clientId, campaignInput);
    updateClientClosureAgent(clientId, agentInput);
    toast.success("Attribution & closing agent updated successfully!");
    logActivity(
      `Marketing updated campaign attribution to "${campaignInput}" and closing agent to "${agentInput}" for client ID ${clientId}`,
      user?.name || role,
    );
    setEditingClientId(null);
  };

  return (
    <div className="property-page space-y-6 pb-10 select-none">
      <PageHeader
        section="Marketing"
        title="Marketing & Lead Acquisition"
        description="Review campaign spend, lead sources and the clients converted by each channel."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <TimeRangePicker
              initialRange="all"
              onChange={(rangeState) => setTimeRange(rangeState)}
            />
            <Button
              variant="primary"
              icon={<FileSpreadsheet className="w-4 h-4 text-white" />}
              onClick={() => setShowLeadGenDrawer(true)}
            >
              Lead Summary
            </Button>
          </div>
        }
      />

      {/* Campaign Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border-warm border-l-[3px] border-l-brand-teal p-5 rounded-lg shadow-sm">
          <p className="text-[9px] tracking-wider font-bold text-muted-gray uppercase">
            Total Marketing Spend
          </p>
          <p className="text-[19px] xl:text-[21px] font-bold leading-none mt-2 tracking-tight text-charcoal">
            {displayTotalSpend}
          </p>
          <div className="text-brand-teal text-[9px] font-medium flex items-center gap-1 mt-4">
            <Target className="w-3 h-3" />
            <span>Aggregated campaign investments</span>
          </div>
        </div>

        <div className="bg-white border border-border-warm border-l-[3px] border-l-brand-olive p-5 rounded-lg shadow-sm">
          <p className="text-[9px] tracking-wider font-bold text-muted-gray uppercase">
            Enquiries Captured
          </p>
          <p className="text-[19px] xl:text-[21px] font-bold leading-none mt-2 tracking-tight text-brand-olive">
            {displayTotalLeads} Leads
          </p>
          <div className="text-brand-olive text-[9px] font-medium flex items-center gap-1 mt-4">
            <Users className="w-3 h-3" />
            <span>{displayLeadSubtext}</span>
          </div>
        </div>

        <div className="bg-white border border-border-warm border-l-[3px] border-l-charcoal p-5 rounded-lg shadow-sm">
          <p className="text-[9px] tracking-wider font-bold text-muted-gray uppercase">
            Converted Clients
          </p>
          <p className="text-[19px] xl:text-[21px] font-bold leading-none mt-2 tracking-tight text-charcoal">
            {displayAcquiredAccounts} Closed
          </p>
          <div className="text-muted-gray text-[9px] font-medium flex items-center gap-1 mt-4">
            <Layers className="w-3 h-3 text-brand-teal" />
            <span>Reconciled on-ledger clients</span>
          </div>
        </div>

        <div className="bg-white border border-border-warm border-l-[3px] border-l-status-late p-5 rounded-lg shadow-sm">
          <p className="text-[9px] tracking-wider font-bold text-muted-gray uppercase">
            Cost per Lead
          </p>
          <p className="text-[19px] xl:text-[21px] font-bold leading-none mt-2 tracking-tight text-charcoal">
            {displayAvgCac}
          </p>
          <div className="text-muted-gray text-[9px] font-medium flex items-center gap-1 mt-4">
            <TrendingUp className="w-3 h-3 text-brand-olive" />
            <span>Average spend for each enquiry</span>
          </div>
        </div>
      </div>

      <LiveChartGrid>
        <LiveMetricBars
          eyebrow="Campaign response"
          title="Leads generated by campaign"
          description="Compare campaign contribution using the latest lead totals returned by the marketing service."
          loading={isCampaignsLoading}
          icon="megaphone"
          data={displayCampaigns.slice(0, 6).map((campaign: any) => ({
            label: campaign.name || campaign.channel || "Campaign",
            value: Number(campaign.leads || 0),
            displayValue: `${Number(campaign.leads || 0).toLocaleString()} leads`,
          }))}
        />
        <LiveDonutChart
          eyebrow="Lead portfolio"
          title="Enquiries by property interest"
          description="See how the current enquiry pool is distributed between land/property and investment products."
          centerLabel="Enquiries"
          loading={isKpisLoading || isLeadsLoading}
          data={[
            {
              label: "Land & property",
              value: landPropertyLeads,
              color: "#0e6b57",
            },
            { label: "Investment", value: investmentLeads, color: "#ff7758" },
          ]}
        />
      </LiveChartGrid>

      {/* Ingestion Ledger and Campaign History split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Ingestion Ledger */}
        <div className="lg:col-span-2 bg-white border border-border-warm rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
              <h2 className="font-serif text-base font-bold text-brand-teal">
                Lead Attribution Register
              </h2>
              <span className="text-[9px] font-bold text-brand-teal bg-brand-teal/5 px-2 py-0.5 rounded">
                SOURCE RECORDS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="rolad-table">
                <thead>
                  <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                    <th className="px-6 py-3">Prospect / Client</th>
                    <th className="px-6 py-3">Property Interest</th>
                    <th className="px-6 py-3">Client Reference & Stage</th>
                    <th className="px-6 py-3 font-bold text-brand-teal">
                      Lead Source
                    </th>
                    <th className="px-6 py-3 font-bold text-brand-olive">
                      Assigned Sales Adviser
                    </th>
                    {role !== "MD / CEO" && (
                      <th className="px-6 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                  {isLeadsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-3.5">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : displayLeads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-6 text-center italic text-muted-gray"
                      >
                        No marketing leads registered.
                      </td>
                    </tr>
                  ) : (
                    displayLeads.map((client: any) => {
                      const isEditing = editingClientId === client.id;
                      return (
                        <tr
                          key={client.id}
                          className="hover:bg-neutral-50/30 transition-colors"
                        >
                          <td
                            className="px-6 py-3.5 font-bold cursor-pointer text-charcoal hover:text-brand-teal hover:underline transition-colors"
                            onClick={() =>
                              navigate(`/clients/${client.code || client.id}`)
                            }
                          >
                            {client.name}
                          </td>
                          <td className="px-6 py-3.5 text-muted-gray">
                            {client.productType}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-[11px] text-muted-gray">
                            {client.code} • {client.journeyStage}
                          </td>
                          <td className="px-6 py-3.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={campaignInput}
                                onChange={(e) =>
                                  setCampaignInput(e.target.value)
                                }
                                className="px-2 py-1 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium w-36"
                              />
                            ) : (
                              <span className="font-semibold text-brand-teal">
                                {client.campaignDetails || "Direct Channel"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={agentInput}
                                onChange={(e) => setAgentInput(e.target.value)}
                                className="px-2 py-1 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium w-36"
                                placeholder="Sales Agent Name"
                              />
                            ) : (
                              <span className="font-semibold text-brand-olive">
                                {client.closureAgent || "No Closure Agent"}
                              </span>
                            )}
                          </td>
                          {role !== "MD / CEO" && (
                            <td className="px-6 py-3.5 text-right">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveCampaign(client.id)}
                                  className="px-3 py-1 bg-brand-teal hover:bg-brand-teal/95 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Save Source
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleEditCampaignClick(client)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-charcoal font-bold text-[10px] cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3 text-charcoal" />
                                  <span>Attribute</span>
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Campaign History Timeline & AI Summary */}
        <div className="space-y-8">
          {/* AI-Powered Summary */}
          <div className="bg-brand-teal/5 border border-brand-teal/15 p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-brand-teal/15">
              <h2 className="font-serif text-sm font-bold text-brand-teal uppercase tracking-wider">
                Campaign Performance Note
              </h2>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-charcoal font-medium">
              <p>
                <span className="font-bold text-brand-teal">
                  Channel finding:
                </span>{" "}
                Social media channel acquisitions show a{" "}
                <span className="text-brand-olive font-bold">
                  +18.4% efficiency lift
                </span>{" "}
                compared to physical outdoor billboard ads.
              </p>
              <p className="text-muted-gray italic">
                Search advertising is producing enquiries at $29.09 each.
                Consider moving 15% of the billboard budget to the stronger
                digital channels.
              </p>
            </div>
          </div>

          {/* Campaign History Timeline */}
          <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-warm/60">
              <div className="flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-brand-teal" />
                <h2 className="font-serif text-base font-bold text-brand-teal">
                  Campaign Activity
                </h2>
              </div>
              {isMarketing && (
                <Button
                  variant="primary"
                  onClick={() => setShowAddCampaignModal(true)}
                  className="bg-brand-teal text-white hover:bg-brand-teal/95 font-bold text-[10px] py-1 px-2.5 rounded shadow-sm"
                >
                  Record Campaign
                </Button>
              )}
            </div>
            <div className="space-y-4 max-h-75 overflow-y-auto pr-1">
              {isCampaignsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 border border-border-warm rounded bg-neutral-50/20 space-y-2"
                  >
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : displayCampaigns.length === 0 ? (
                <p className="text-xs italic text-muted-gray py-4 text-center">
                  No marketing campaigns logged yet.
                </p>
              ) : (
                displayCampaigns.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="p-3 border border-border-warm rounded bg-neutral-50/20 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-charcoal">{camp.name}</p>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                          camp.status === "Active"
                            ? "text-brand-teal bg-brand-teal/10"
                            : "text-muted-gray bg-neutral-100"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-gray capitalize">
                      Channel: {camp.channel} • Staff: {camp.createdBy}
                    </p>
                    <div className="flex justify-between items-center pt-1 border-t border-border-warm/50 mt-1 text-[9px] font-bold text-muted-gray">
                      <span>
                        Spend: {camp.spendFormatted} • Leads: {camp.leads}{" "}
                        (Conv: {camp.conversions})
                      </span>
                      <span>Cost/Lead: {camp.costPerLeadFormatted}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* View Lead Generation Summary Drawer */}
      {showLeadGenDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-lg w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative">
            <button
              onClick={() => setShowLeadGenDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 text-xs font-semibold text-left">
              <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
                <FileSpreadsheet className="w-5 h-5 text-brand-teal" />
                <h3 className="font-serif text-lg font-bold text-brand-teal">
                  Lead Generation Summary
                </h3>
              </div>

              <p className="text-muted-gray leading-normal">
                Verifies detailed marketing attribution metrics, closed
                conversions, sales representatives, and target acquisition
                origins.
              </p>

              <div className="space-y-3.5">
                {displayLeads.length === 0 ? (
                  <p className="text-xs text-muted-gray italic text-center py-8">
                    No leads registered in this time range.
                  </p>
                ) : (
                  displayLeads.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setShowLeadGenDrawer(false);
                        navigate(`/clients/${c.code || c.id}`);
                      }}
                      className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2.5 cursor-pointer hover:border-brand-teal/40 transition-colors group"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-charcoal text-sm">
                          {c.name}
                        </p>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded text-brand-teal bg-brand-teal/10">
                          {c.productType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-gray pt-1 border-t border-border-warm/50">
                        <div>
                          <p className="uppercase text-[8px] tracking-wider mb-0.5 text-muted-gray/80">
                            Campaign Name
                          </p>
                          <p className="text-charcoal font-semibold">
                            {c.campaignDetails || "Direct Marketing Campaign"}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase text-[8px] tracking-wider mb-0.5 text-muted-gray/80">
                            Sales agents stage
                          </p>
                          <p className="text-brand-olive font-extrabold">
                            {c.closureAgent || "No Closure Agent"}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-muted-gray font-mono pt-1">
                        <span>Code: {c.code}</span>
                        <span>Stage: {c.journeyStage}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowLeadGenDrawer(false)}
              className="w-full mt-6 py-2"
            >
              Close View
            </Button>
          </div>
        </div>
      )}

      {/* Manual Ingest Campaign Modal Overlay */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-xs font-semibold">
            <button
              onClick={() => setShowAddCampaignModal(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              ✕
            </button>
            <div className="flex items-center gap-1.5 pb-2 border-b border-border-warm mb-4">
              <Megaphone className="w-4.5 h-4.5 text-brand-teal" />
              <h3 className="font-serif text-sm font-bold text-brand-teal uppercase tracking-wide">
                Add Campaign Details
              </h3>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g. Easter Sales Drive"
                  className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    Channel / Type
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampChannel}
                    onChange={(e) => setNewCampChannel(e.target.value)}
                    placeholder="e.g. PPC, Social Media"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    Objective
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampObjective}
                    onChange={(e) => setNewCampObjective(e.target.value)}
                    placeholder="e.g. Lead Gen, Brand Awareness"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newCampStart}
                    onChange={(e) => setNewCampStart(e.target.value)}
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newCampEnd}
                    onChange={(e) => setNewCampEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    Amount Spent (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newCampSpend}
                    onChange={(e) => setNewCampSpend(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    Leads Captured
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newCampLeads}
                    onChange={(e) => setNewCampLeads(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                    Conversions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCampConversions}
                    onChange={(e) => setNewCampConversions(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                  Campaign Notes / Strategy
                </label>
                <textarea
                  rows={2}
                  value={newCampNotes}
                  onChange={(e) => setNewCampNotes(e.target.value)}
                  placeholder="Additional campaign details or target demographic notes..."
                  className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium resize-none"
                />
              </div>

              {parseInt(newCampLeads) > 0 && parseFloat(newCampSpend) >= 0 && (
                <div className="p-3 bg-neutral-50 rounded border border-border-warm text-center font-bold text-brand-teal text-[10px]">
                  Estimated Cost Per Lead: ₦
                  {(parseFloat(newCampSpend) / parseInt(newCampLeads)).toFixed(
                    2,
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border-warm">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowAddCampaignModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={createCampaignMutation.isPending}
                  className="bg-brand-teal text-white hover:bg-brand-teal/95 font-bold"
                >
                  Save Campaign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
