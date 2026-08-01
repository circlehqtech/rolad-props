import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  useMockStore,
  type Client,
  type CommissionItem,
  type RoiItem,
} from "../../store/mockStore";
import Button from "../../components/Button";
import Select from "../../components/Select";
import KpiCard from "../../components/KpiCard";
import type { TimeRangeFilterState } from "../../components/TimeRangePicker";
import PageHeader from "../../components/PageHeader";
import {
  LiveChartGrid,
  LiveDonutChart,
  LiveMetricBars,
} from "../../components/LiveCharts";
import { toast } from "../../utils/toast";
import {
  useAccountsKpis,
  useAccountsCommissions,
  useAccountsRoiPayouts,
  useAccountsLedger,
  useAccountsAudits,
  useLogAccountsAuditMutation,
  useLogAccountPaymentMutation,
  useLogAccountCommissionMutation,
  useLogAccountRoiMutation,
  useLogAccountRevenueMutation,
  useUpdateAccountAuditStatusMutation,
  useMarketingCampaigns,
  useAccountsRevenue,
} from "../../shared/hooks/useLiveQueries";
import { useClientsList } from "../../features/clients/hooks/useClients";
import { toNaira, toKoboInt } from "../../shared/money";
import Skeleton from "../../components/Skeleton";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  Plus,
  Lock,
  ArrowLeftRight,
  Search,
  Upload,
  X,
  CheckCircle,
  PieChart,
  DollarSign as MoneyIcon,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  Filter,
} from "lucide-react";

function getRevenueOrigin(details?: string) {
  if (!details) return "External";
  const internalSignals = [
    "summer",
    "instagram",
    "google",
    "facebook",
    "search",
    "promo",
    "newsletter",
  ];
  return internalSignals.some((signal) =>
    details.toLowerCase().includes(signal),
  )
    ? "Internal"
    : "External";
}

export default function Accounts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  const {
    clients,
    commissions,
    rois,
    logPayment,
    logActivity,
    logCommission,
    logRoi,
    actionCommission,
    updateClientStage,
  } = useMockStore();

  const { data: accountsKpis, isLoading: isKpisLoading } = useAccountsKpis();
  const { data: commissionsData, isLoading: isCommissionsLoading } =
    useAccountsCommissions();
  const { data: roiPayoutsData, isLoading: isRoiLoading } =
    useAccountsRoiPayouts();
  const { data: revenueSourceData, isLoading: isRevenueSourcesLoading } =
    useAccountsRevenue({ timeRange: "all_time" });

  // Payment Ledger Filter and Sorting States (matching GET /accounts/ledger API)
  const [ledgerPaymentStatus, setLedgerPaymentStatus] = useState<string>("--");
  const [ledgerSortBy, setLedgerSortBy] = useState<string>("--");
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>("");

  const { data: accountsLedgerData, isLoading: isLedgerLoading } =
    useAccountsLedger({
      paymentStatus: ledgerPaymentStatus,
      sortBy: ledgerSortBy,
    });

  const { data: clientsListData } = useClientsList();
  const { data: marketingCampaignsData } = useMarketingCampaigns();

  const liveCampaignsList = Array.isArray(marketingCampaignsData)
    ? marketingCampaignsData
    : (marketingCampaignsData as any)?.data || [];

  const liveApiClients = Array.isArray(clientsListData)
    ? clientsListData
    : (clientsListData as any)?.data || [];

  const combinedClients = liveApiClients.map((c: any) => ({
    id: c.id || c.clientId || c.clientCode,
    name: c.fullName || c.name || c.clientName || "Client",
    code: c.clientCode || c.code || c.id || "RC-000",
    phone: c.phone || "",
    email: c.email || "",
    productType: c.productTypeLabel || c.productType || "Land & Property",
    paymentStatus: c.paymentStatus || "Paid",
    outstanding: c.outstandingKobo
      ? toNaira(c.outstandingKobo)
      : c.outstanding || 0,
    overdue: c.overdueKobo ? toNaira(c.overdueKobo) : c.overdue || 0,
    paid: c.paidKobo ? toNaira(c.paidKobo) : c.paid || 0,
    campaignDetails:
      c.campaignName || c.sourceName || c.campaignDetails || "Direct",
    closureAgent: c.closureAgentName || c.closureAgent || "Closure Agent",
    ledger: c.ledger || [
      {
        invoiceId: `INV-${c.clientCode || "DEFAULT"}`,
        amount: c.outstandingKobo ? toNaira(c.outstandingKobo) : 50000,
        dueDate: new Date().toISOString().substring(0, 10),
        status: "Outstanding",
      },
    ],
  }));

  const [timeRange] = useState<TimeRangeFilterState>({
    range: "all",
  });

  // Accounts Audit Trail State & Mutations
  const [showAuditTrailDrawer, setShowAuditTrailDrawer] = useState(false);
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>("all");

  const { data: accountsAuditsData, isLoading: isAuditsLoading } =
    useAccountsAudits(auditTypeFilter);

  const logAccountPaymentMutation = useLogAccountPaymentMutation();
  const logAccountCommissionMutation = useLogAccountCommissionMutation();
  const logAccountRoiMutation = useLogAccountRoiMutation();
  const logAccountRevenueMutation = useLogAccountRevenueMutation();
  const updateAuditStatusMutation = useUpdateAccountAuditStatusMutation();

  // Drawers and Modals States
  const [showLogPaymentDrawer, setShowLogPaymentDrawer] = useState(false);
  const [showLogRevenueDrawer, setShowLogRevenueDrawer] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showRoiDrawer, setShowRoiDrawer] = useState(false);
  const [showCommissionDrawer, setShowCommissionDrawer] = useState(false);
  const [showRevenueSourceDashboard, setShowRevenueSourceDashboard] =
    useState(false);
  const [selectedReceiptRow, setSelectedReceiptRow] = useState<any>(null);

  // Log Revenue Form State (matching POST /api/v1/accounts/log-revenue)
  const [revClientId, setRevClientId] = useState("");
  const [revAmount, setRevAmount] = useState("");
  const [revSourceType, setRevSourceType] = useState("internal_campaign");
  const [revSourceName, setRevSourceName] = useState("Instagram Promo 2026");
  const [revAgentId, setRevAgentId] = useState("Zainab Yusuf");
  const [revPaymentMethod, setRevPaymentMethod] = useState("bank_transfer");
  const [revTransactionRef, setRevTransactionRef] = useState("");
  const [revInstallmentNumber, setRevInstallmentNumber] = useState(1);
  const [revNote, setRevNote] = useState("");

  // Log Payments Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientProductType, setNewClientProductType] = useState<
    "Land & Property" | "Investment"
  >("Land & Property");
  const [newClientEstateLabel, setNewClientEstateLabel] = useState("");
  const [newClientCoordinates, setNewClientCoordinates] = useState("");
  const [newClientCampaignDetails, setNewClientCampaignDetails] = useState("");
  const [uploadedReceipt, setUploadedReceipt] = useState<File | null>(null);

  // Log Commission Form State
  const [commClientId, setCommClientId] = useState("");
  const [commAmount, setCommAmount] = useState("");
  const [commDetails, setCommDetails] = useState("");

  // Allocation Update Center Form State
  const [selectedAllocationClientId, setSelectedAllocationClientId] =
    useState("");
  const [allocEstateLabel, setAllocEstateLabel] = useState("");
  const [allocCoordinates, setAllocCoordinates] = useState("");
  const [downPaymentVerified, setDownPaymentVerified] = useState(false);

  // Revenue Source Selected Origin State (for deep-dive referral list)
  const [selectedRevenueSource, setSelectedRevenueSource] = useState<
    "Internal" | "External" | null
  >(null);

  // Determine permissions
  const isFullAccess =
    role === "MD / CEO" || role === "Administrator" || role === "Accounts Lead";
  const isSummaryAccess =
    role === "Client Relations Officer" || role === "Sales Officer";
  const hasAccess = isFullAccess || isSummaryAccess;

  // Filter Date helper
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

  // Filter dataset
  const filteredClients = clients.filter((c: any) => {
    if (timeRange.range === "all") return true;
    return (
      c.ledger.some((l: any) => filterByTime(l.dueDate)) ||
      c.documents.some((d: any) => filterByTime(d.timestamp))
    );
  });

  const subscriptionClients = clients.filter(
    (c: any) => c.productType === "Investment",
  );

  const rawCommissions = commissionsData?.data || [];
  const liveCommissions = rawCommissions.map((comm: any) => ({
    id: comm.id,
    clientId: comm.clientId,
    clientCode: comm.clientCode,
    clientName: comm.clientName,
    amount: toNaira(comm.commissionAmountKobo || "0"),
    status:
      comm.status === "paid"
        ? "Paid"
        : comm.status === "approved"
          ? "Approved"
          : "Pending",
    details: `Closure Agent: ${comm.closureAgentName || "Unknown"}. Contract value: ₦${toNaira(comm.contractAmountKobo || "0").toLocaleString()}`,
    date: comm.createdAt ? comm.createdAt.split("T")[0] : "2026-07-20",
  }));

  const rawRois = roiPayoutsData?.data || [];
  const liveRois = rawRois.map((roi: any, idx: number) => ({
    id: (roi.clientId || "roi") + "-" + idx,
    clientId: roi.clientId,
    clientName: roi.clientName,
    amount: toNaira(roi.roiAmountKobo || "0"),
    details: `ROI installment payout for ${roi.clientCode || "Investment"}. Contract value: ₦${toNaira(roi.contractAmountKobo || "0").toLocaleString()}`,
    status: roi.status,
    date: roi.dueDate || "2026-07-21",
  }));

  const filteredCommissions = liveCommissions.filter((c: any) =>
    filterByTime(c.date),
  );
  const filteredRois = liveRois.filter((r: any) => filterByTime(r.date));

  // Calculations
  const totalPaid = filteredClients.reduce(
    (sum: number, c: any) => sum + c.paid,
    0,
  );
  const totalOutstanding = filteredClients.reduce(
    (sum: number, c: any) => sum + c.outstanding,
    0,
  );
  const totalOverdue = filteredClients.reduce(
    (sum: number, c: any) => sum + c.overdue,
    0,
  );

  // 5 Custom KPI Calculations
  let pipelineDues = filteredClients.reduce(
    (sum: number, c: any) => sum + c.overdue,
    0,
  );
  let totalRevenueCollected = filteredClients.reduce(
    (sum: number, c: any) => sum + c.paid,
    0,
  );
  let outstandingPayment = filteredClients.reduce(
    (sum: number, c: any) => sum + c.outstanding,
    0,
  );
  let outstandingCommission = commissions
    .filter((comm: any) => comm.status !== "Paid")
    .reduce((sum: number, comm: any) => sum + comm.amount, 0);
  let dueInvestment = filteredClients
    .filter((c: any) => c.productType === "Investment")
    .reduce((sum: number, c: any) => sum + c.outstanding, 0);

  if (accountsKpis) {
    const getVal = (
      koboKey: string,
      alternateKey: string,
      fallbackVal: number,
    ) => {
      const kVal = (accountsKpis as any)[koboKey];
      if (kVal !== undefined && kVal !== null) {
        return typeof kVal === "number" ? kVal / 100 : toNaira(String(kVal));
      }
      const altVal = (accountsKpis as any)[alternateKey];
      if (altVal !== undefined && altVal !== null) {
        return typeof altVal === "number" ? altVal : parseFloat(String(altVal));
      }
      return fallbackVal;
    };

    pipelineDues = getVal("pipelineDuesKobo", "pipelineDues", pipelineDues);
    totalRevenueCollected = getVal(
      "totalRevenueCollectedKobo",
      "totalRevenueCollected",
      totalRevenueCollected,
    );
    outstandingPayment = getVal(
      "outstandingPaymentKobo",
      "outstandingPayment",
      outstandingPayment,
    );
    outstandingCommission = getVal(
      "outstandingCommissionKobo",
      "outstandingCommission",
      outstandingCommission,
    );
    dueInvestment = getVal("dueInvestmentKobo", "dueInvestment", dueInvestment);
  }

  // Search matching client logic
  const matchedClients = searchQuery.trim()
    ? combinedClients.filter(
        (c: any) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSelectClient = (c: any) => {
    setSelectedClientId(c.id);
    setSearchQuery(`${c.name} (${c.code})`);
    setPayInvoiceId("");
    // Autofill first outstanding invoice amount
    const firstOutstanding = c.ledger?.find((l: any) => l.status !== "Paid");
    if (firstOutstanding) {
      setPayInvoiceId(firstOutstanding.invoiceId);
      setPaymentAmount(firstOutstanding.amount.toString());
    }
  };

  // Handle Payment Log Submission
  const handlePaymentLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewClient) {
      if (!newClientName.trim() || !paymentAmount.trim()) {
        toast.error("Please fill out Client Name and Payment Amount.");
        return;
      }
      const amtVal = parseFloat(paymentAmount.replace(/[^0-9.]/g, ""));
      const amountKobo = toKoboInt(amtVal).toString();

      const createdClientId = logPayment(
        "",
        `INV-INIT-${Math.floor(100 + Math.random() * 900)}`,
        amtVal,
        true,
        {
          name: newClientName,
          phone: newClientPhone,
          email: newClientEmail,
          productType: newClientProductType,
          estateLabel: newClientEstateLabel,
          coordinates: newClientCoordinates,
          campaignDetails: newClientCampaignDetails,
        },
      );

      const rawOrigin = getRevenueOrigin(newClientCampaignDetails);
      const derivedSourceType = newClientCampaignDetails
        ? rawOrigin === "Internal"
          ? "internal_campaign"
          : "external_referral"
        : "direct";

      logAccountPaymentMutation.mutate(
        {
          clientId:
            createdClientId ||
            newClientName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          type: "payment_logged",
          amountKobo,
          status: "approved",
          note: `Onboarded ${newClientName} via direct ledger entry`,
          sourceType: derivedSourceType,
          sourceName: newClientCampaignDetails || "Direct Onboarding",
          proofUrl: uploadedReceipt ? uploadedReceipt.name : undefined,
          transactionRef: `TXN-${Date.now()}`,
          paymentMethod: "bank_transfer",
        },
        {
          onSuccess: () => {
            toast.success(
              `Onboarded client "${newClientName}" & recorded payment of ₦${amtVal.toLocaleString()} successfully.`,
            );
            logActivity(
              `Direct onboarded client "${newClientName}" via ledger entry (₦${amtVal.toLocaleString()})`,
              user?.name || role,
            );
            setShowLogPaymentDrawer(false);
            setSelectedClientId("");
            setSearchQuery("");
            setPayInvoiceId("");
            setPaymentAmount("");
            setIsNewClient(false);
            setNewClientName("");
            setNewClientPhone("");
            setNewClientEmail("");
            setNewClientEstateLabel("");
            setNewClientCoordinates("");
            setNewClientCampaignDetails("");
            setUploadedReceipt(null);
          },
          onError: (err: any) => {
            toast.error(
              err.messages?.[0] ||
                err.message ||
                "Failed to record payment with backend server.",
            );
          },
        },
      );
    } else {
      if (!selectedClientId || !payInvoiceId || !paymentAmount.trim()) {
        toast.error("Please select a client, invoice, and enter amount.");
        return;
      }
      const amtVal = parseFloat(paymentAmount.replace(/[^0-9.]/g, ""));
      const amountKobo = toKoboInt(amtVal).toString();

      const targetClient = combinedClients.find(
        (c: any) => c.id === selectedClientId,
      );
      const rawOrigin = getRevenueOrigin(targetClient?.campaignDetails);
      const derivedSourceType = targetClient?.campaignDetails
        ? rawOrigin === "Internal"
          ? "internal_campaign"
          : "external_referral"
        : "direct";

      const cName =
        combinedClients.find((c: any) => c.id === selectedClientId)?.name ||
        "Client";

      logAccountPaymentMutation.mutate(
        {
          clientId: selectedClientId,
          type: "payment_logged",
          amountKobo,
          status: "approved",
          note: `Payment receipt logged for Invoice ${payInvoiceId}`,
          sourceType: derivedSourceType,
          sourceName:
            targetClient?.campaignDetails ||
            targetClient?.closureAgent ||
            "Direct",
          responsibleAgentId: targetClient?.closureAgent,
          proofUrl: uploadedReceipt ? uploadedReceipt.name : undefined,
          transactionRef: `TXN-${Date.now()}`,
          paymentMethod: "bank_transfer",
        },
        {
          onSuccess: () => {
            logPayment(selectedClientId, payInvoiceId, amtVal);
            toast.success(
              `Logged payment receipt of ₦${amtVal.toLocaleString()} for ${cName}`,
            );
            logActivity(
              `Recorded payment receipt of ₦${amtVal.toLocaleString()} for client "${cName}" (Invoice: ${payInvoiceId})`,
              user?.name || role,
            );
            setShowLogPaymentDrawer(false);
            setSelectedClientId("");
            setSearchQuery("");
            setPayInvoiceId("");
            setPaymentAmount("");
            setIsNewClient(false);
            setNewClientName("");
            setNewClientPhone("");
            setNewClientEmail("");
            setNewClientEstateLabel("");
            setNewClientCoordinates("");
            setNewClientCampaignDetails("");
            setUploadedReceipt(null);
          },
          onError: (err: any) => {
            toast.error(
              err.messages?.[0] ||
                err.message ||
                "Failed to log payment receipt with backend server.",
            );
          },
        },
      );
    }
  };

  // Handle Log Revenue Submission (POST /api/v1/accounts/log-revenue)
  const handleRevenueLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revAmount.trim()) {
      toast.error("Please enter a valid revenue amount.");
      return;
    }
    const amtVal = parseFloat(revAmount.replace(/[^0-9.]/g, ""));
    const amountKobo = toKoboInt(amtVal).toString();

    const targetClientId =
      revClientId || combinedClients[0]?.id || "RC-DEFAULT";

    logAccountRevenueMutation.mutate(
      {
        clientId: targetClientId,
        type: "revenue_entry",
        amountKobo,
        status: "approved",
        note: revNote || `Logged revenue entry for ${revSourceName}`,
        sourceType: revSourceType,
        sourceName: revSourceName,
        responsibleAgentId: revAgentId,
        proofUrl: uploadedReceipt ? uploadedReceipt.name : "receipt.pdf",
        transactionRef: revTransactionRef || `TXN-${Date.now()}`,
        paymentMethod: revPaymentMethod,
        installmentNumber: revInstallmentNumber,
      },
      {
        onSuccess: () => {
          toast.success(
            `Successfully logged revenue of ₦${amtVal.toLocaleString()} under ${revSourceName}!`,
          );
          logActivity(
            `Logged revenue of ₦${amtVal.toLocaleString()} (${revSourceName} • ${revSourceType})`,
            user?.name || role,
          );
          setShowLogRevenueDrawer(false);
          setRevAmount("");
          setRevTransactionRef("");
          setRevNote("");
        },
        onError: (err: any) => {
          toast.error(
            err.messages?.[0] ||
              err.message ||
              "Failed to log revenue entry with backend server.",
          );
        },
      },
    );
  };

  // Handle Commission Log
  const handleCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commClientId || !commAmount.trim() || !commDetails.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    const amtVal = parseFloat(commAmount.replace(/[^0-9.]/g, ""));
    const amountKobo = toKoboInt(amtVal).toString();
    const cName =
      combinedClients.find((c: any) => c.id === commClientId)?.name || "Client";

    logAccountCommissionMutation.mutate(
      {
        clientId: commClientId,
        type: "commission_logged",
        amountKobo,
        status: "pending",
        note: commDetails,
      },
      {
        onSuccess: () => {
          logCommission({
            clientId: commClientId,
            clientName: cName,
            amount: amtVal,
            date: new Date().toISOString().replace("T", " ").substring(0, 19),
            status: "Pending",
            details: commDetails,
          });
          toast.success(
            `Logged sales commission of ₦${amtVal.toLocaleString()} for client ${cName}`,
          );
          logActivity(
            `Generated commission line item (₦${amtVal.toLocaleString()}) for client "${cName}"`,
            user?.name || role,
          );
          setShowCommissionModal(false);
          setCommClientId("");
          setCommAmount("");
          setCommDetails("");
        },
        onError: (err: any) => {
          toast.error(
            err.messages?.[0] ||
              err.message ||
              "Failed to log commission entry with backend server.",
          );
        },
      },
    );
  };

  // Handle Allocation Down Payment Verification
  const handleAllocationUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocationClientId) {
      toast.error("Please select an allocation client.");
      return;
    }

    const targetClient = clients.find(
      (c) => c.id === selectedAllocationClientId,
    );
    if (!targetClient) return;

    // Log updates
    if (downPaymentVerified) {
      updateClientStage(selectedAllocationClientId, "Allocation");
      toast.success(
        `Down payment verified. Onboarding stage updated to Allocation.`,
      );
    }

    // Sync allocation details
    if (allocEstateLabel || allocCoordinates) {
      // update state lands
      const updatedLands = [
        {
          id: `${selectedAllocationClientId}-l1`,
          name: `${targetClient.name} Plot`,
          estateLabel:
            allocEstateLabel || targetClient.estateLabel || "Lekki Oceanfront",
          coordinates:
            allocCoordinates ||
            targetClient.coordinates ||
            "6.4000° N, 3.4000° E",
          status: "Active Land Development",
        },
      ];
      // In a real database/store, we update coordinates & estateLabel
      targetClient.estateLabel = allocEstateLabel || targetClient.estateLabel;
      targetClient.coordinates = allocCoordinates || targetClient.coordinates;
      targetClient.lands = updatedLands;
    }

    toast.success("Allocation details updated successfully system-wide.");
    logActivity(
      `Verified down payment & structured coordinates for client "${targetClient.name}"`,
      user?.name || role,
    );
    setSelectedAllocationClientId("");
    setAllocEstateLabel("");
    setAllocCoordinates("");
    setDownPaymentVerified(false);
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-status-missed/10 flex items-center justify-center text-status-missed mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-charcoal">
          Access Restricted
        </h1>
        <p className="text-muted-gray text-sm mt-2 max-w-sm">
          Your profile does not possess billing view permissions.
        </p>
      </div>
    );
  }

  // Process Live API or Mock Store Ledger rows with filtering & sorting
  const liveLedgerList = Array.isArray(accountsLedgerData)
    ? accountsLedgerData
    : (accountsLedgerData as any)?.data || [];

  const rawLedgerRows =
    liveLedgerList.length > 0
      ? liveLedgerList.map((row: any) => ({
          id: row.clientId,
          clientId: row.clientId,
          clientName: row.fullName,
          clientCode: row.clientCode,
          invoiceId: `INV-${row.clientCode}`,
          dueDate: "2026-07-31",
          amount:
            toNaira(row.outstandingKobo || "0") || toNaira(row.paidKobo || "0"),
          paidAmount: toNaira(row.paidKobo || "0"),
          outstandingAmount: toNaira(row.outstandingKobo || "0"),
          overdueAmount: toNaira(row.overdueKobo || "0"),
          productType:
            row.productTypeLabel || row.productTypeCode || "Land & Property",
          status: row.paymentStatus || "ON_TRACK",
        }))
      : filteredClients.flatMap((c) =>
          c.ledger.map((l) => ({
            ...l,
            id: c.id,
            clientId: c.id,
            clientName: c.name,
            clientCode: c.code,
            productType: c.productType || "Land & Property",
            paidAmount: l.status === "Paid" ? l.amount : 0,
            outstandingAmount: l.status === "Outstanding" ? l.amount : 0,
            overdueAmount:
              l.status === "Missed" || l.status === "Late" ? l.amount : 0,
            status:
              l.status === "Paid"
                ? "ON_TRACK"
                : l.status === "Outstanding"
                  ? "DUE_SOON"
                  : l.status === "Late"
                    ? "LATE"
                    : "MISSED",
          })),
        );

  const displayLedgerRows = rawLedgerRows
    .filter((row: any) => {
      const matchesSearch =
        !ledgerSearchQuery.trim() ||
        row.clientName
          .toLowerCase()
          .includes(ledgerSearchQuery.toLowerCase()) ||
        row.clientCode
          .toLowerCase()
          .includes(ledgerSearchQuery.toLowerCase()) ||
        (row.invoiceId &&
          row.invoiceId
            .toLowerCase()
            .includes(ledgerSearchQuery.toLowerCase()));

      let matchesStatus = true;
      if (
        ledgerPaymentStatus &&
        ledgerPaymentStatus !== "--" &&
        ledgerPaymentStatus !== "ALL"
      ) {
        const st = row.status.toUpperCase();
        const target = ledgerPaymentStatus.toUpperCase();
        if (target === "ON_TRACK")
          matchesStatus =
            st === "ON_TRACK" || st === "PAID" || st === "ON TRACK";
        else if (target === "DUE_SOON")
          matchesStatus =
            st === "DUE_SOON" || st === "OUTSTANDING" || st === "DUE SOON";
        else if (target === "LATE") matchesStatus = st === "LATE";
        else if (target === "MISSED")
          matchesStatus = st === "MISSED" || st === "OVERDUE";
        else matchesStatus = st === target;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      if (ledgerSortBy === "overdue") {
        return (b.overdueAmount || 0) - (a.overdueAmount || 0);
      }
      if (ledgerSortBy === "outstanding") {
        return (b.outstandingAmount || 0) - (a.outstandingAmount || 0);
      }
      const statusPriority: Record<string, number> = {
        MISSED: 0,
        LATE: 1,
        DUE_SOON: 2,
        ON_TRACK: 3,
      };
      return (
        (statusPriority[a.status.toUpperCase()] ?? 4) -
        (statusPriority[b.status.toUpperCase()] ?? 4)
      );
    });

  const revenueEntries = (revenueSourceData?.data || []).map((entry: any) => ({
    id: entry.id,
    clientId: entry.clientId || entry.relatedClientId,
    clientName: entry.clientName || entry.clientCode || "General revenue",
    clientCode: entry.clientCode || "GENERAL",
    amount: toNaira(String(entry.amountKobo || "0")),
    sourceType: entry.sourceType || "external",
    sourceName: entry.sourceName || entry.note || "Direct attribution",
    responsibleAgent:
      entry.responsibleAgentName ||
      entry.loggedByName ||
      entry.responsibleAgentId ||
      "Accounts team",
    paymentMethod: entry.paymentMethod || "Not specified",
    transactionRef: entry.transactionRef || "Not supplied",
    status: entry.status || "recorded",
    createdAt: entry.createdAt,
  }));

  // The accounts summary intentionally exposes two commercial origin groups.
  // Referral, broker and organic records are grouped under External.
  const internalClients = revenueEntries.filter(
    (entry) => entry.sourceType === "internal_campaign",
  );
  const externalClients = revenueEntries.filter(
    (entry) => entry.sourceType !== "internal_campaign",
  );
  const internalRevenue = internalClients.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const externalRevenue = externalClients.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  return (
    <div className="property-page accounts-page space-y-6 pb-10 select-none relative">
      {/* Time range stays hidden until the accounts summary endpoints accept it. */}
      <PageHeader
        section="Payments & Accounts"
        title="Payments & Accounts"
        description="Track client receipts, outstanding balances, commissions and investment payouts."
      />

      {/* Prominent Billing Action Buttons Row */}
      {(role === "Accounts Lead" ||
        role === "Sales Officer" ||
        role === "MD / CEO") && (
        <div className="property-action-bar flex flex-wrap gap-2.5 bg-white p-3 rounded-2xl border border-border-warm shadow-sm animate-fade-in">
          {/* Account Officer (Accounts Lead) logs payments and commissions */}
          {role === "Accounts Lead" && (
            <>
              <Button
                variant="primary"
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                onClick={() => setShowLogRevenueDrawer(true)}
                className="bg-brand-teal text-white hover:bg-brand-teal/95 font-extrabold text-xs py-2.5 px-6 shadow-sm rounded-lg cursor-pointer"
              >
                Record Revenue
              </Button>

              <Button
                variant="secondary"
                icon={<Plus className="w-4 h-4 text-charcoal" />}
                onClick={() => setShowLogPaymentDrawer(true)}
                className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
              >
                Record Client Payment
              </Button>
            </>
          )}

          {/* Sales can submit earned commissions without access to payment tools. */}
          {(role === "Accounts Lead" || role === "Sales Officer") && (
            <Button
              variant="secondary"
              icon={<MoneyIcon className="w-4 h-4 text-charcoal" />}
              onClick={() => setShowCommissionModal(true)}
              className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
            >
              Record Commission
            </Button>
          )}

          {/* CEO (MD / CEO) only views ROI and Commissions Audits */}
          {role === "MD / CEO" && (
            <>
              <Button
                variant="secondary"
                icon={<TrendingUp className="w-4 h-4 text-charcoal" />}
                onClick={() => setShowRoiDrawer(true)}
                className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 rounded-lg"
              >
                View ROI Summary
              </Button>

              <Button
                variant="secondary"
                icon={<ClipboardList className="w-4 h-4 text-charcoal" />}
                onClick={() => setShowCommissionDrawer(true)}
                className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 rounded-lg"
              >
                View Commissions Audit
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            icon={<ClipboardList className="w-4 h-4 text-brand-teal" />}
            onClick={() => setShowAuditTrailDrawer(true)}
            className="bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 border-none font-bold text-xs py-2 px-4 rounded-lg"
          >
            Account Activity
          </Button>

          <Button
            variant="secondary"
            icon={<PieChart className="w-4 h-4 text-charcoal" />}
            onClick={() =>
              setShowRevenueSourceDashboard(!showRevenueSourceDashboard)
            }
            className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 rounded-lg ml-auto"
          >
            {showRevenueSourceDashboard ? "Hide Sources" : "Revenue Sources"}
          </Button>
        </div>
      )}

      {/* Revenue Sources Dashboard sub-view */}
      {showRevenueSourceDashboard && (
        <div className="bg-brand-teal/5 border border-brand-teal/15 p-6 rounded-xl space-y-6 animate-scale-up">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-teal/15">
            <PieChart className="w-5 h-5 text-brand-teal" />
            <h2 className="font-serif text-lg font-bold text-brand-teal">
              Revenue by Source
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin 1: Internal Revenue */}
            <div
              onClick={() => setSelectedRevenueSource("Internal")}
              className={`p-5 rounded-lg border cursor-pointer transition-all ${
                selectedRevenueSource === "Internal"
                  ? "bg-white border-brand-teal shadow-md"
                  : "bg-white border-border-warm hover:border-brand-teal/40"
              }`}
            >
              <h3 className="font-serif font-bold text-charcoal text-base">
                Internal Campaign Origins
              </h3>
              <p className="text-muted-gray text-xs mt-1">
                Generated from internal newsletters, Instagram, Google Ads.
              </p>
              <p className="text-2xl font-extrabold text-brand-teal mt-4">
                ₦{internalRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-brand-teal/60 font-bold mt-1 uppercase">
                {internalClients.length} Clients referred
              </p>
            </div>

            {/* Origin 2: External Revenue */}
            <div
              onClick={() => setSelectedRevenueSource("External")}
              className={`p-5 rounded-lg border cursor-pointer transition-all ${
                selectedRevenueSource === "External"
                  ? "bg-white border-brand-teal shadow-md"
                  : "bg-white border-border-warm hover:border-brand-teal/40"
              }`}
            >
              <h3 className="font-serif font-bold text-charcoal text-base">
                External Origin referrals
              </h3>
              <p className="text-muted-gray text-xs mt-1">
                Generated via external corporate channels, broker agencies.
              </p>
              <p className="text-2xl font-extrabold text-charcoal mt-4">
                ₦{externalRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-gray/60 font-bold mt-1 uppercase">
                {externalClients.length} Clients referred
              </p>
            </div>
          </div>

          {isRevenueSourcesLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {/* Deep-dive Referral Client list details */}
          {selectedRevenueSource && (
            <div className="bg-white p-4 border border-border-warm rounded-lg space-y-3 animate-fade-in">
              <span className="text-[10px] font-bold text-muted-gray block uppercase">
                Live revenue entries under {selectedRevenueSource} origins
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(selectedRevenueSource === "Internal"
                  ? internalClients
                  : externalClients
                ).map((c) => (
                  <div
                    key={c.id}
                    onClick={() =>
                      c.clientId && navigate(`/clients/${c.clientId}`)
                    }
                    className={`p-4 border border-border-warm rounded-lg bg-white transition-colors ${c.clientId ? "cursor-pointer hover:border-brand-teal/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-charcoal">
                          {c.clientName}{" "}
                          <span className="font-medium text-muted-gray">
                            ({c.clientCode})
                          </span>
                        </p>
                        <p className="mt-1 truncate text-[10px] font-semibold text-brand-teal">
                          {c.sourceName}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold text-charcoal">
                        ₦{c.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[9px] font-semibold text-slate-500">
                      <span>Agent: {c.responsibleAgent}</span>
                      <span>
                        Method: {String(c.paymentMethod).replace(/_/g, " ")}
                      </span>
                      <span>Ref: {c.transactionRef}</span>
                      <span className="capitalize">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial KPI stats rows */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          compact
          title="Pipeline Deals"
          value={
            isKpisLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              "₦" + pipelineDues.toLocaleString()
            )
          }
          subtext="High-risk overdue balance"
          icon={
            <AlertCircle className="w-4 h-4 text-status-late animate-pulse" />
          }
          variant="risk"
        />

        <KpiCard
          compact
          title="Total Revenue Collected"
          value={
            isKpisLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              "₦" + totalRevenueCollected.toLocaleString()
            )
          }
          subtext="Cumulative settlement logs"
          icon={<TrendingUp className="w-4 h-4 text-brand-olive" />}
          variant="success"
        />

        <KpiCard
          compact
          title="Outstanding Payment"
          value={
            isKpisLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              "₦" + outstandingPayment.toLocaleString()
            )
          }
          subtext="Awaiting milestones"
          icon={<Clock className="w-4 h-4 text-brand-teal" />}
        />

        <KpiCard
          compact
          title="Outstanding Commission"
          value={
            isKpisLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              "₦" + outstandingCommission.toLocaleString()
            )
          }
          subtext="Unpaid agent referrals"
          icon={<MoneyIcon className="w-4 h-4 text-brand-teal" />}
        />

        <KpiCard
          compact
          title="Due Investment"
          value={
            isKpisLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              "₦" + dueInvestment.toLocaleString()
            )
          }
          subtext="Active portfolio maturities"
          icon={<ClipboardList className="w-4 h-4 text-[#c5a880]" />}
        />
      </div>

      <LiveChartGrid>
        <LiveMetricBars
          eyebrow="Cash position"
          title="Portfolio financial position"
          description="Compare funds collected with the balances and obligations currently requiring attention."
          loading={isKpisLoading}
          data={[
            {
              label: "Revenue collected",
              value: totalRevenueCollected,
              displayValue: `₦${totalRevenueCollected.toLocaleString()}`,
              color: "#0b909c",
            },
            {
              label: "Outstanding payments",
              value: outstandingPayment,
              displayValue: `₦${outstandingPayment.toLocaleString()}`,
              color: "#ff7758",
            },
            {
              label: "Pipeline dues",
              value: pipelineDues,
              displayValue: `₦${pipelineDues.toLocaleString()}`,
              color: "#c5a880",
            },
            {
              label: "Due investments",
              value: dueInvestment,
              displayValue: `₦${dueInvestment.toLocaleString()}`,
              color: "#34515b",
            },
          ]}
        />
        <LiveDonutChart
          eyebrow="Open exposure"
          title="Outstanding obligation mix"
          description="See where the current finance workload is concentrated before processing settlements."
          centerLabel="Open value"
          loading={isKpisLoading}
          data={[
            {
              label: "Client payments",
              value: outstandingPayment,
              displayValue: `₦${outstandingPayment.toLocaleString()}`,
              color: "#ff7758",
            },
            {
              label: "Agent commissions",
              value: outstandingCommission,
              displayValue: `₦${outstandingCommission.toLocaleString()}`,
              color: "#0b909c",
            },
            {
              label: "Investment payouts",
              value: dueInvestment,
              displayValue: `₦${dueInvestment.toLocaleString()}`,
              color: "#c5a880",
            },
          ]}
        />
      </LiveChartGrid>

      {/* Primary finance register */}
      <div className="space-y-6">
        <div className="w-full bg-white border border-border-warm rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-teal">
                Client Payment Register
              </h2>
              <p className="text-[11px] text-muted-gray mt-0.5">
                Search receipts, balances and overdue payments by client.
              </p>
            </div>

            {/* Swagger API Query Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-44">
                <Search className="w-3.5 h-3.5 text-muted-gray absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter name or code..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-border-warm rounded text-xs outline-none focus:border-brand-teal bg-white font-medium"
                />
              </div>

              {/* paymentStatus Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold text-muted-gray hidden sm:inline">
                  Payment Status:
                </span>
                <Select
                  value={ledgerPaymentStatus}
                  onChange={setLedgerPaymentStatus}
                  options={[
                    { value: "--", label: "All Payment Statuses" },
                    { value: "ON_TRACK", label: "On Track" },
                    { value: "DUE_SOON", label: "Due Soon" },
                    { value: "LATE", label: "Late" },
                    { value: "MISSED", label: "Missed" },
                  ]}
                  className="min-w-44"
                />
              </div>

              {/* sortBy Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-[10px] uppercase font-bold text-muted-gray hidden sm:inline">
                  Sort By:
                </span>
                <Select
                  value={ledgerSortBy}
                  onChange={setLedgerSortBy}
                  options={[
                    { value: "--", label: "Default Sorting" },
                    { value: "overdue", label: "Overdue Amount" },
                    { value: "outstanding", label: "Outstanding Amount" },
                  ]}
                  className="min-w-40"
                />
              </div>
            </div>
          </div>

          {role === "MD / CEO" || role === "Accounts Lead" ? (
            <div className="overflow-x-auto">
              {isLedgerLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : displayLedgerRows.length === 0 ? (
                <div className="p-12 text-center text-muted-gray">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30 text-brand-teal" />
                  <p className="text-sm font-semibold">
                    No payment ledger records match your filter parameters.
                  </p>
                  <p className="text-xs mt-1">
                    Try selecting a different status or clear search query.
                  </p>
                </div>
              ) : (
                <table className="rolad-table">
                  <thead>
                    <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                      <th className="px-6 py-3">Client Profile</th>
                      <th className="px-6 py-3">Product Type</th>
                      <th className="px-6 py-3">Paid Amount</th>
                      <th className="px-6 py-3">Outstanding</th>
                      <th className="px-6 py-3">Overdue</th>
                      <th className="px-6 py-3">Payment Status</th>
                      <th className="px-6 py-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                    {displayLedgerRows.map((row: any, i: number) => {
                      const isPaid =
                        row.status.toUpperCase() === "ON_TRACK" ||
                        row.status.toUpperCase() === "PAID";
                      return (
                        <tr
                          key={row.id + "-" + i}
                          className="hover:bg-neutral-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-bold text-charcoal block">
                              {row.clientName}
                            </span>
                            <span className="text-[10px] text-brand-teal font-mono mt-0.5 block">
                              Code: {row.clientCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-gray font-semibold">
                            {row.productType}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-brand-olive">
                            ₦{row.paidAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-charcoal">
                            ₦{row.outstandingAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-status-missed">
                            ₦{row.overdueAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const st = row.status.toUpperCase();
                              if (st === "ON_TRACK" || st === "PAID") {
                                return (
                                  <span className="px-2.5 py-0.5 rounded font-bold text-[9px] text-brand-olive bg-brand-olive/10 inline-flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    On Track
                                  </span>
                                );
                              }
                              if (st === "DUE_SOON" || st === "OUTSTANDING") {
                                return (
                                  <span className="px-2.5 py-0.5 rounded font-bold text-[9px] text-brand-teal bg-brand-teal/10 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Due Soon
                                  </span>
                                );
                              }
                              if (st === "LATE") {
                                return (
                                  <span className="px-2.5 py-0.5 rounded font-bold text-[9px] text-status-late bg-status-late/10 inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Late
                                  </span>
                                );
                              }
                              return (
                                <span className="px-2.5 py-0.5 rounded font-bold text-[9px] text-status-missed bg-status-missed/10 inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Missed
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPaid ? (
                              <Button
                                size="sm"
                                variant="outlined"
                                onClick={() => setSelectedReceiptRow(row)}
                                className="text-[10px] py-1 px-2.5 hover:bg-brand-teal! hover:border-brand-teal! hover:text-white! [&:hover_span]:text-white!"
                              >
                                View Receipt
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-gray/50 italic">
                                N/A
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-xs text-muted-gray bg-neutral-50/30">
              <p className="font-medium italic">
                Detailed transaction ledger hidden. Billing totals displayed
                above for client relations.
              </p>
            </div>
          )}
        </div>

        {/* Allocation follow-ups sit below the finance register */}
        {role !== "Accounts Lead" && (
          <section className="rounded-2xl border border-brand-teal/10 bg-[#edf3ef] p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 border-b border-brand-teal/10 pb-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-teal/60">
                  Property fulfilment
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-teal" />
                  <h2 className="font-serif text-lg font-bold text-charcoal">
                    Allocation Follow-ups
                  </h2>
                </div>
                <p className="mt-1 text-[11px] text-muted-gray">
                  Clients whose payments are moving into plot allocation and
                  verification.
                </p>
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-teal shadow-sm">
                {
                  clients.filter(
                    (c) =>
                      c.journeyStage === "Allocation" ||
                      c.journeyStage === "Awaiting Allocation",
                  ).length
                }{" "}
                active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {clients.filter(
                (c) =>
                  c.journeyStage === "Allocation" ||
                  c.journeyStage === "Awaiting Allocation",
              ).length === 0 ? (
                <p className="col-span-full text-center italic text-muted-gray text-xs py-8">
                  No active allocation records found.
                </p>
              ) : (
                clients
                  .filter(
                    (c) =>
                      c.journeyStage === "Allocation" ||
                      c.journeyStage === "Awaiting Allocation",
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-white bg-white p-4 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-teal/20 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-charcoal">{c.name}</p>
                          <p className="mt-0.5 font-mono text-[9px] text-brand-teal">
                            {c.code}
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-teal/8 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-brand-teal">
                          {c.journeyStage}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-warm/60 pt-3">
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-gray/60">
                            Estate
                          </span>
                          <span className="mt-1 block text-[10px] font-semibold text-charcoal">
                            {c.estateLabel || "Not allocated"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-gray/60">
                            Plot details
                          </span>
                          <span className="mt-1 block text-[10px] font-semibold text-charcoal">
                            {c.coordinates || "Not plotted"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* ======================================================== */}
      {/* DRAWER PANE: Log Payments Drawer */}
      {/* ======================================================== */}
      {showLogPaymentDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-lg w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative overflow-y-auto">
            <button
              onClick={() => setShowLogPaymentDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 pr-1">
              <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
                <MoneyIcon className="w-5 h-5 text-brand-teal" />
                <h3 className="font-serif text-lg font-bold text-brand-teal">
                  Log Payments
                </h3>
              </div>

              {/* <div className="flex items-center gap-4 py-2 border-b border-border-warm">
                <label className="flex items-center gap-2 text-xs font-bold text-charcoal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewClient}
                    onChange={(e) => setIsNewClient(e.target.checked)}
                    className="w-4 h-4 border-border-warm text-brand-teal"
                  />
                  <span>
                    Record payment for client not already in the system
                  </span>
                </label>
              </div> */}

              <form
                onSubmit={handlePaymentLogSubmit}
                className="space-y-4 text-xs font-semibold"
              >
                {/* 1. Existing Client lookup search match */}
                {!isNewClient ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-gray block">
                      Search Matching Client Profile
                    </label>
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 w-4 h-4 text-muted-gray" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedClientId("");
                        }}
                        placeholder="Type client name or code..."
                        className="w-full pl-10 pr-4 py-2 border border-border-warm rounded outline-none focus:border-brand-teal"
                      />
                    </div>
                    {/* Search Suggestions */}
                    {matchedClients.length > 0 && !selectedClientId && (
                      <div className="border border-border-warm rounded bg-white shadow-lg max-h-40 overflow-y-auto mt-1 divide-y divide-border-warm">
                        {matchedClients.map((c: any) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectClient(c)}
                            className="p-2.5 hover:bg-neutral-50 cursor-pointer text-charcoal font-semibold"
                          >
                            {c.name} ({c.code})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. New Client Raw Details Entry */
                  <div className="space-y-3 p-4 bg-neutral-50/50 border border-border-warm rounded-lg">
                    <span className="text-[9px] font-bold text-brand-teal block uppercase">
                      New Client Profiles Setup
                    </span>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Client Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Alhaji Ibrahim Musa"
                        className="w-full px-2 py-1.5 border border-border-warm rounded outline-none bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="+234..."
                          className="w-full px-2 py-1.5 border border-border-warm rounded outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder="client@domain.com"
                          className="w-full px-2 py-1.5 border border-border-warm rounded outline-none bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Subscribed Product
                      </label>
                      <Select
                        options={[
                          {
                            value: "Land & Property",
                            label: "Land & Property",
                          },
                          { value: "Investment", label: "Investment" },
                        ]}
                        value={newClientProductType}
                        onChange={(val) => setNewClientProductType(val as any)}
                        className="w-full"
                      />
                    </div>

                    {newClientProductType === "Land & Property" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                            Estate Label
                          </label>
                          <input
                            type="text"
                            value={newClientEstateLabel}
                            onChange={(e) =>
                              setNewClientEstateLabel(e.target.value)
                            }
                            placeholder="Lekki Gate B"
                            className="w-full px-2 py-1.5 border border-border-warm rounded outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                            Coordinates
                          </label>
                          <input
                            type="text"
                            value={newClientCoordinates}
                            onChange={(e) =>
                              setNewClientCoordinates(e.target.value)
                            }
                            placeholder="6.4° N, 3.4° E"
                            className="w-full px-2 py-1.5 border border-border-warm rounded outline-none bg-white"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted-gray block mb-0.5">
                        Attributed Campaign / Source
                      </label>
                      <Select
                        options={[
                          {
                            value: "Direct",
                            label: "Direct Attribution / Organic",
                          },
                          ...liveCampaignsList.map((c: any) => ({
                            value: c.name || c.id,
                            label: `${c.name || "Campaign"} (${c.channel || "Marketing"})`,
                          })),
                          {
                            value: "Instagram Promo 2026",
                            label: "Instagram Promo 2026",
                          },
                          {
                            value: "Google Search Land Ads",
                            label: "Google Search Land Ads",
                          },
                          {
                            value: "Corporate Broker Referral",
                            label: "Corporate Broker Referral",
                          },
                        ]}
                        value={newClientCampaignDetails || "Direct"}
                        onChange={(val) => setNewClientCampaignDetails(val)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Invoice target selection for existing clients */}
                {!isNewClient && selectedClientId && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                      Select Outstanding Invoice
                    </label>
                    <Select
                      options={[
                        { value: "", label: "Choose invoice..." },
                        ...(combinedClients
                          .find((c: any) => c.id === selectedClientId)
                          ?.ledger.filter((l: any) => l.status !== "Paid")
                          .map((l: any) => ({
                            value: l.invoiceId,
                            label: `${l.invoiceId} (₦${l.amount.toLocaleString()} - ${l.status})`,
                          })) || []),
                      ]}
                      value={payInvoiceId}
                      onChange={(val) => {
                        setPayInvoiceId(val);
                        const invAmt =
                          combinedClients
                            .find((c: any) => c.id === selectedClientId)
                            ?.ledger.find((l: any) => l.invoiceId === val)
                            ?.amount || 0;
                        setPaymentAmount(invAmt.toString());
                      }}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Amount to record */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Payment Amount ($)
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none"
                  />
                </div>

                {/* Receipt Upload Box */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Upload Receipt
                  </label>
                  <label className="border border-dashed border-border-warm hover:border-brand-teal/40 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-neutral-50/20 text-center transition-all">
                    <Upload className="w-5 h-5 text-brand-teal mb-1" />
                    <span className="font-bold text-xs text-brand-teal">
                      Click to dispatch file upload
                    </span>
                    <span className="text-[9px] text-muted-gray mt-0.5">
                      JPEG, PNG, PDF formats accepted
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0])
                          setUploadedReceipt(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                  {uploadedReceipt && (
                    <p className="text-[10px] text-brand-olive font-bold mt-2">
                      Selected receipt: {uploadedReceipt.name} (Ready to submit)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-warm">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowLogPaymentDrawer(false)}
                    className="py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={logAccountPaymentMutation.isPending}
                    className="bg-brand-teal hover:bg-brand-teal/95 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                  >
                    Save Payment Logs
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER PANE: Log Revenue Drawer (POST /api/v1/accounts/log-revenue) */}
      {/* ======================================================== */}
      {showLogRevenueDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-lg w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative overflow-y-auto">
            <button
              onClick={() => setShowLogRevenueDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 pr-1">
              <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
                <TrendingUp className="w-5 h-5 text-brand-teal" />
                <h3 className="font-serif text-lg font-bold text-brand-teal">
                  Log Revenue Entry
                </h3>
              </div>

              <form
                onSubmit={handleRevenueLogSubmit}
                className="space-y-4 text-xs font-semibold"
              >
                {/* 1. Client Lookup */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Select Client Profile
                  </label>
                  <Select
                    options={combinedClients.map((c: any) => ({
                      value: c.id,
                      label: `${c.name} (${c.code}) - ${c.productType}`,
                    }))}
                    value={revClientId || combinedClients[0]?.id || ""}
                    onChange={(val) => setRevClientId(val)}
                    className="w-full font-semibold"
                  />
                </div>

                {/* 2. Revenue Amount */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Revenue Amount ($)
                  </label>
                  <input
                    type="text"
                    required
                    value={revAmount}
                    onChange={(e) => setRevAmount(e.target.value)}
                    placeholder="e.g. 5,000,000"
                    className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none font-medium"
                  />
                </div>

                {/* 3. Source Type */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Source Type Attribution
                  </label>
                  <Select
                    options={[
                      {
                        value: "internal_campaign",
                        label:
                          "Internal Campaign (Social, Ads, Newsletter, Waik-in)",
                      },
                      {
                        value: "external",
                        label:
                          "External Channel (Corporate Partner, Agents, Referral)",
                      },
                      // {
                      //   value: "referral",
                      //   label: "Broker / Agent Referral",
                      // },
                      // {
                      //   value: "organic",
                      //   label: "Organic Direct (Walk-in / Website)",
                      // },
                    ]}
                    value={revSourceType}
                    onChange={(val) => setRevSourceType(val)}
                    className="w-full"
                  />
                </div>

                {/* 4. Source / Campaign Name */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Source Name / Campaign Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={revSourceName}
                    onChange={(e) => setRevSourceName(e.target.value)}
                    placeholder="e.g. Instagram Promo 2026, Apex Broker"
                    className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none font-medium"
                  />
                </div>

                {/* 5. Responsible Agent & Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                      Responsible Agent
                    </label>
                    <input
                      type="text"
                      value={revAgentId}
                      onChange={(e) => setRevAgentId(e.target.value)}
                      placeholder="e.g. Zainab Yusuf"
                      className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                      Payment Method
                    </label>
                    <Select
                      options={[
                        { value: "bank_transfer", label: "Bank Transfer" },
                        { value: "cheque", label: "Cheque" },
                        { value: "card", label: "Debit/Credit Card" },
                        { value: "pos", label: "POS Terminal" },
                        { value: "cash", label: "Direct Cash Deposit" },
                      ]}
                      value={revPaymentMethod}
                      onChange={(val) => setRevPaymentMethod(val)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 6. Transaction Reference & Installment Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                      Transaction Reference
                    </label>
                    <input
                      type="text"
                      value={revTransactionRef}
                      onChange={(e) => setRevTransactionRef(e.target.value)}
                      placeholder="e.g. TXN-883921"
                      className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                      Installment #
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={revInstallmentNumber}
                      onChange={(e) =>
                        setRevInstallmentNumber(parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none font-medium"
                    />
                  </div>
                </div>

                {/* 7. Proof Upload */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Upload Proof of Payment / Receipt
                  </label>
                  <label className="border border-dashed border-border-warm hover:border-brand-teal/40 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-neutral-50/20 text-center transition-all">
                    <Upload className="w-5 h-5 text-brand-teal mb-1" />
                    <span className="font-bold text-xs text-brand-teal">
                      Click to upload proof file
                    </span>
                    <span className="text-[9px] text-muted-gray mt-0.5">
                      JPEG, PNG, PDF formats accepted
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0])
                          setUploadedReceipt(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                  {uploadedReceipt && (
                    <p className="text-[10px] text-brand-olive font-bold mt-1.5">
                      Attached proof: {uploadedReceipt.name}
                    </p>
                  )}
                </div>

                {/* 8. Note */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                    Revenue Notes / Attribution Details
                  </label>
                  <textarea
                    rows={2}
                    value={revNote}
                    onChange={(e) => setRevNote(e.target.value)}
                    placeholder="Enter additional attribution details..."
                    className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-warm">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowLogRevenueDrawer(false)}
                    className="py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={logAccountRevenueMutation.isPending}
                    className="bg-brand-teal hover:bg-brand-teal/95 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Log Revenue Entry
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PANELS: Log Commission & Log ROI */}
      {/* ======================================================== */}

      {/* Log Commission Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-scale-up text-xs font-semibold">
            <button
              onClick={() => setShowCommissionModal(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-brand-teal mb-4 uppercase tracking-wider">
              Log Sales Commission
            </h3>
            <form onSubmit={handleCommissionSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Target Client Profile
                </label>
                <Select
                  options={[
                    { value: "", label: "Select client..." },
                    ...combinedClients.map((c: any) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`,
                    })),
                  ]}
                  value={commClientId}
                  onChange={setCommClientId}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Commission Amount ($)
                </label>
                <input
                  type="text"
                  required
                  value={commAmount}
                  onChange={(e) => setCommAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-border-warm rounded focus:border-brand-teal outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Referral Commission details
                </label>
                <textarea
                  required
                  rows={2}
                  value={commDetails}
                  onChange={(e) => setCommDetails(e.target.value)}
                  placeholder="Sales agent commission for land acquisition..."
                  className="w-full p-2.5 border border-border-warm rounded focus:border-brand-teal outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowCommissionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={logAccountCommissionMutation.isPending}
                  className="bg-brand-teal text-white disabled:opacity-50"
                >
                  Generate line item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View ROI Summary Drawer */}
      {showRoiDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-lg w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative">
            <button
              onClick={() => setShowRoiDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 text-xs font-semibold">
              <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
                <TrendingUp className="w-5 h-5 text-brand-teal" />
                <h3 className="font-serif text-lg font-bold text-brand-teal">
                  ROI Payout Summaries
                </h3>
              </div>

              <p className="text-muted-gray leading-normal">
                Verifies historical return-on-investment (ROI) dividend
                allocation logs for active portfolio clients.
              </p>

              <div className="space-y-3.5">
                {isRoiLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2.5"
                    >
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : filteredRois.length === 0 ? (
                  <p className="text-xs text-muted-gray italic text-center py-8">
                    No ROI payouts recorded in this time range.
                  </p>
                ) : (
                  filteredRois.map((roi: any) => {
                    const client = clients.find(
                      (c: any) => c.id === roi.clientId,
                    );
                    const agentName = client?.closureAgent || "No Agent";
                    return (
                      <div
                        key={roi.id}
                        className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-charcoal">
                              {roi.clientName}
                            </p>
                            <p className="text-[9px] text-brand-olive font-extrabold mt-0.5">
                              Sales Agent: {agentName}
                            </p>
                          </div>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded text-brand-olive bg-brand-olive/10">
                            Disbursed
                          </span>
                        </div>
                        <p className="text-muted-gray leading-normal font-medium">
                          {roi.details}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-border-warm/50 text-[10px] font-bold">
                          <span className="text-charcoal">
                            Disbursement Amount: ₦{roi.amount.toLocaleString()}
                          </span>
                          <span className="text-muted-gray font-mono">
                            {roi.date}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowRoiDrawer(false)}
              className="w-full mt-6 py-2"
            >
              Close View
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER PANE: Commission Summary Drawer */}
      {/* ======================================================== */}
      {showCommissionDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-lg w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative">
            <button
              onClick={() => setShowCommissionDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
                <ClipboardList className="w-5 h-5 text-brand-teal" />
                <h3 className="font-serif text-lg font-bold text-brand-teal">
                  Commission Payout Summaries
                </h3>
              </div>

              <p className="text-muted-gray leading-normal">
                Verifies historical payout audit logs for sales representatives
                and closing agents.
              </p>

              <div className="space-y-3.5">
                {isCommissionsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2.5"
                    >
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : filteredCommissions.length === 0 ? (
                  <p className="text-xs text-muted-gray italic text-center py-8">
                    No payout records found.
                  </p>
                ) : (
                  filteredCommissions.map((comm: any) => (
                    <div
                      key={comm.id}
                      className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-charcoal">
                          {comm.clientName}
                        </p>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                            comm.status === "Paid"
                              ? "text-brand-olive bg-brand-olive/10"
                              : "text-brand-teal bg-brand-teal/10"
                          }`}
                        >
                          {comm.status}
                        </span>
                      </div>
                      <p className="text-muted-gray leading-normal">
                        {comm.details}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-border-warm/50 text-[10px] font-bold">
                        <span className="text-charcoal">
                          Payout Amount: ₦{comm.amount.toLocaleString()}
                        </span>
                        <span className="text-muted-gray font-mono">
                          {comm.date}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowCommissionDrawer(false)}
              className="w-full mt-6 py-2"
            >
              Close View
            </Button>
          </div>
        </div>
      )}

      {/* DRAWER PANE: Accounts Audit Trail Log (GET /api/v1/accounts/audits) */}
      {showAuditTrailDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-xl w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative">
            <button
              onClick={() => setShowAuditTrailDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
                <ClipboardList className="w-5 h-5 text-brand-teal" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-teal">
                    Accounts Audit Log
                  </h3>
                </div>
              </div>

              {/* Type Filter Select */}
              <div className="flex items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-border-warm">
                <label className="text-[10px] font-bold text-muted-gray uppercase tracking-wider whitespace-nowrap">
                  Filter by Type:
                </label>
                <Select
                  options={[
                    { value: "all", label: "All Audit Types" },
                    { value: "roi_payout", label: "ROI Payout (roi_payout)" },
                    {
                      value: "commission_release",
                      label: "Commission Release (commission_release)",
                    },
                    {
                      value: "commission_adjustment",
                      label: "Commission Adjustment (commission_adjustment)",
                    },
                    {
                      value: "payment_logged",
                      label: "Payment Logged (payment_logged)",
                    },
                    {
                      value: "commission_logged",
                      label: "Commission Logged (commission_logged)",
                    },
                    { value: "roi_logged", label: "ROI Logged (roi_logged)" },
                    {
                      value: "revenue_entry",
                      label: "Revenue Entry (revenue_entry)",
                    },
                  ]}
                  value={auditTypeFilter}
                  onChange={(val) => setAuditTypeFilter(val)}
                  className="w-full text-xs"
                />
              </div>

              {/* Aggregate Totals returned by API */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2.5 bg-brand-olive/5 border border-brand-olive/20 rounded">
                  <p className="text-muted-gray uppercase font-bold">
                    Total ROI Payout
                  </p>
                  <p className="text-xs font-bold text-brand-olive mt-0.5">
                    ₦
                    {toNaira(
                      accountsAuditsData?.totalRoiPayoutKobo || "0",
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 bg-brand-teal/5 border border-brand-teal/20 rounded">
                  <p className="text-muted-gray uppercase font-bold">
                    Commission Release
                  </p>
                  <p className="text-xs font-bold text-brand-teal mt-0.5">
                    ₦
                    {toNaira(
                      accountsAuditsData?.totalCommissionReleaseKobo || "0",
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 bg-neutral-100 border border-border-warm rounded">
                  <p className="text-muted-gray uppercase font-bold">
                    Adjustment
                  </p>
                  <p className="text-xs font-bold text-charcoal mt-0.5">
                    ₦
                    {toNaira(
                      accountsAuditsData?.totalAdjustmentKobo || "0",
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Audit Entries List */}
              <div className="space-y-3">
                {isAuditsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2"
                    >
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))
                ) : !accountsAuditsData?.data ||
                  accountsAuditsData.data.length === 0 ? (
                  <p className="text-xs text-muted-gray italic text-center py-8">
                    No audit records found matching type filter "
                    {auditTypeFilter}".
                  </p>
                ) : (
                  accountsAuditsData.data.map((audit: any) => (
                    <div
                      key={audit.id}
                      className="p-4 border border-border-warm rounded-lg bg-neutral-50/40 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-charcoal block">
                            {audit.clientName ||
                              audit.clientCode ||
                              audit.clientId}
                          </span>
                          <span className="text-[10px] text-muted-gray font-mono">
                            ID:{" "}
                            <strong className="text-charcoal">
                              {audit.id}
                            </strong>{" "}
                            • Type:{" "}
                            <strong className="text-brand-teal">
                              {audit.type}
                            </strong>
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                            audit.status === "approved" ||
                            audit.status === "paid"
                              ? "text-brand-olive bg-brand-olive/10"
                              : audit.status === "rejected"
                                ? "text-status-late bg-status-late/10"
                                : "text-amber-600 bg-amber-50"
                          }`}
                        >
                          {audit.status}
                        </span>
                      </div>
                      {audit.note && (
                        <p className="text-muted-gray font-medium text-[11px] leading-snug">
                          {audit.note}
                        </p>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-border-warm/50 text-[10px] font-semibold text-muted-gray">
                        <span>
                          Amount:{" "}
                          <strong className="text-charcoal font-bold">
                            ₦{toNaira(audit.amountKobo || "0").toLocaleString()}
                          </strong>
                        </span>
                        <span className="font-mono">
                          {audit.createdAt ? audit.createdAt.split("T")[0] : ""}
                        </span>
                      </div>
                      {/* Action buttons for PATCH /api/v1/accounts/audits/{id}/status */}
                      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-border-warm/30">
                        {audit.status !== "approved" && (
                          <button
                            onClick={() => {
                              updateAuditStatusMutation.mutate(
                                { id: audit.id, status: "approved" },
                                {
                                  onSuccess: () =>
                                    toast.success(
                                      `Audit status updated to Approved.`,
                                    ),
                                  onError: () =>
                                    toast.error(`Failed to update status.`),
                                },
                              );
                            }}
                            className="px-2 py-0.5 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded text-[9px] font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {audit.status !== "paid" && (
                          <button
                            onClick={() => {
                              updateAuditStatusMutation.mutate(
                                { id: audit.id, status: "paid" },
                                {
                                  onSuccess: () =>
                                    toast.success(
                                      `Audit status updated to Paid.`,
                                    ),
                                  onError: () =>
                                    toast.error(`Failed to update status.`),
                                },
                              );
                            }}
                            className="px-2 py-0.5 bg-brand-olive/10 hover:bg-brand-olive/20 text-brand-olive rounded text-[9px] font-bold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        {audit.status !== "rejected" && (
                          <button
                            onClick={() => {
                              updateAuditStatusMutation.mutate(
                                { id: audit.id, status: "rejected" },
                                {
                                  onSuccess: () =>
                                    toast.success(
                                      `Audit status updated to Rejected.`,
                                    ),
                                  onError: () =>
                                    toast.error(`Failed to update status.`),
                                },
                              );
                            }}
                            className="px-2 py-0.5 bg-status-late/10 hover:bg-status-late/20 text-status-late rounded text-[9px] font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowAuditTrailDrawer(false)}
              className="w-full mt-6 py-2"
            >
              Close Audit Trail
            </Button>
          </div>
        </div>
      )}

      {/* VIEW PAYMENT RECEIPT MODAL FOR CEO */}
      {selectedReceiptRow && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white border border-border-warm w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up p-6 relative">
            <button
              onClick={() => setSelectedReceiptRow(null)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1.5 hover:bg-neutral-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-border-warm/60">
              <div className="w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-teal uppercase tracking-wide">
                Payment Receipt
              </h3>
              <p className="text-[9px] text-muted-gray uppercase tracking-widest mt-0.5">
                Rolad Properties Limited
              </p>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-charcoal font-semibold">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">Receipt No:</span>
                <span className="font-mono text-charcoal">
                  REC-2026-{selectedReceiptRow.invoiceId.split("-")[2] || "099"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">
                  Invoice Reference:
                </span>
                <span className="font-mono text-charcoal">
                  {selectedReceiptRow.invoiceId}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">
                  Client Code:
                </span>
                <span className="text-brand-teal">
                  {selectedReceiptRow.clientCode}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">
                  Client Name:
                </span>
                <span>{selectedReceiptRow.clientName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">
                  Settled Amount:
                </span>
                <span className="text-brand-olive font-extrabold text-sm">
                  ₦{selectedReceiptRow.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">Status:</span>
                <span className="bg-brand-olive/10 text-brand-olive px-2.5 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wide">
                  Reconciled & Cleared
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-muted-gray font-normal">
                  Operator / Auditor:
                </span>
                <span>Ngozi Eze (Accounts Team)</span>
              </div>
            </div>

            {/* Stylized Seal/Stamp Watermark */}
            <div className="relative h-16 flex items-center justify-center overflow-hidden border-t border-border-warm/50 pt-2">
              <div className="border-2 border-brand-teal/30 text-brand-teal/40 font-serif text-[10px] font-extrabold rounded px-3 py-1 uppercase tracking-widest rotate-6 transform select-none">
                Rolad Auditor Signed
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setSelectedReceiptRow(null)}
                className="w-full bg-brand-teal hover:bg-brand-teal/95 font-bold"
              >
                Dismiss Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
