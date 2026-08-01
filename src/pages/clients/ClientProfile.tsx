import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useMockStore } from "../../store/mockStore";
import {
  useClientProfile,
  useClientJourney,
  useClientPayments,
  useClientDocuments,
  useClientActivity,
  useClientProject,
  useLogPaymentMutation,
  useFileDocumentMutation,
  useVoidDocumentMutation,
  useAddNoteMutation,
  useAdjustBalanceMutation,
  useAdvanceStageMutation,
  useRevertStageMutation,
  usePatchClientMutation,
  useAttributeCampaign,
} from "../../features/clients/hooks/useClients";
import {
  useSaveMessageMutation,
  useDraftMessageMutation,
  useClientMessages,
} from "../../features/clients/hooks/useMessages";
import { useSubmitApprovalMutation } from "../../shared/hooks/useLiveQueries";
import { uploadFile } from "../../api/endpoints/uploads";
import { formatNaira, toNaira, toKoboInt } from "../../shared/money";
import { paymentStatusMeta } from "../../shared/paymentStatus";
import { toast } from "../../utils/toast";
import Button from "../../components/Button";
import Select from "../../components/Select";
import TimeRangePicker from "../../components/TimeRangePicker";
import type { TimeRangeFilterState } from "../../components/TimeRangePicker";
import Skeleton from "../../components/Skeleton";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Plus,
  Compass,
  ArrowRight,
  X,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>(); // Client code from URL, e.g. RC-1001
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  // 1. Fetch live client profile (handles both UUID and clientCode)
  const { data: client, isLoading, resolvedUuid } = useClientProfile(id || "");

  // 2. Fetch live sub-resources (activated only when UUID is resolved)
  const { data: journeyData, isLoading: isJourneyLoading } =
    useClientJourney(resolvedUuid);
  const { data: paymentsData, isLoading: isPaymentsLoading } =
    useClientPayments(resolvedUuid);
  const { data: documentsData, isLoading: isDocsLoading } =
    useClientDocuments(resolvedUuid);
  const { data: activityData, isLoading: isActivityLoading } =
    useClientActivity(resolvedUuid);
  const { data: projectData, isLoading: isProjectLoading } =
    useClientProject(resolvedUuid);

  // 3. Mutations
  const logPaymentMutation = useLogPaymentMutation(resolvedUuid || "");
  const fileDocMutation = useFileDocumentMutation(resolvedUuid || "");
  const voidDocMutation = useVoidDocumentMutation(resolvedUuid || "");
  const addNoteMutation = useAddNoteMutation(resolvedUuid || "");
  const adjustBalanceMutation = useAdjustBalanceMutation(resolvedUuid || "");
  const advanceStageMutation = useAdvanceStageMutation(resolvedUuid || "");
  const revertStageMutation = useRevertStageMutation(resolvedUuid || "");
  const patchClientMutation = usePatchClientMutation(resolvedUuid || "");
  const attributeCampaignMutation = useAttributeCampaign(resolvedUuid || "");
  const saveMessageMutation = useSaveMessageMutation(resolvedUuid || "");
  const draftMessageMutation = useDraftMessageMutation(resolvedUuid || "");
  const submitApprovalMutation = useSubmitApprovalMutation();
  const { data: clientMessagesRes } = useClientMessages(resolvedUuid);

  // Local UI States
  const [showMessageDrawer, setShowMessageDrawer] = useState(false);
  const [draftedMessage, setDraftedMessage] = useState("");
  const [selectedMessageType, setSelectedMessageType] =
    useState<string>("payment_reminder");
  const [selectedChannel, setSelectedChannel] = useState<string>("whatsapp");
  const [newNote, setNewNote] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [revertReason, setRevertReason] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  // Ledger Time range filter
  const [timeRange, setTimeRange] = useState<TimeRangeFilterState>({
    range: "all",
  });

  const {
    submitApprovalRequest,
    logActivity,
    approvals: allApprovals,
  } = useMockStore();

  // Balance Adjustment Form State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustInstallment, setAdjustInstallment] = useState<number>(1);
  const [adjustAmountNaira, setAdjustAmountNaira] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Customer Audit Request State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditDepartment, setAuditDepartment] = useState<
    "Accounts" | "Admin" | "Projects" | "Legal"
  >("Accounts");
  const [auditUrgency, setAuditUrgency] = useState<
    "Routine" | "High Priority" | "Urgent / Escalate"
  >("High Priority");
  const [auditParams, setAuditParams] = useState("");

  // Claim Business State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [salesValidationCode, setSalesValidationCode] = useState("");

  // Marketing Campaign State
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [campaignInput, setCampaignInput] = useState("");

  // Sync campaign input when client info loads
  useEffect(() => {
    if (client?.campaignDetails) {
      setCampaignInput(client.campaignDetails);
    }
  }, [client?.campaignDetails]);

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12 select-none animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* 3-column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: General Info & Stats */}
          <div className="space-y-6">
            <div className="bg-white border border-border-warm rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-32 pb-2" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="bg-white border border-border-warm rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-40 pb-2" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>

          {/* Middle Column: Journey Track & Docs */}
          <div className="space-y-6 lg:col-span-2">
            <div className="bg-white border border-border-warm rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-44" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5 py-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border-warm rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h1 className="font-serif text-2xl font-bold text-charcoal">
          Client Not Found
        </h1>
        <Button onClick={() => navigate("/clients")} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  // Compat parameters mapping
  const clientName = client.fullName || client.name || "—";
  const clientCode = client.clientCode || client.code || "—";
  const clientPhone = client.phone || "—";
  const clientEmail = client.email || "—";
  const clientAddress = client.residentialAddress || client.address || "—";
  const clientProductType =
    client.productTypeLabel || client.productType || "Land & Property";
  const clientJourneyStage =
    client.currentStageLabel || client.journeyStage || "—";
  const clientPaymentStatus = client.paymentStatus || "—";

  const auditForThisClient = allApprovals.find(
    (a) =>
      (a.clientCode === clientCode ||
        a.clientCode === client.id ||
        a.title.includes(clientCode) ||
        a.title.includes(clientName)) &&
      (a.title.toLowerCase().includes("audit") ||
        a.cost?.toLowerCase().includes("audit")),
  );
  const clientPaid = paymentsData?.summary?.paid
    ? toNaira(paymentsData.summary.paid)
    : 0;
  const clientOutstanding = paymentsData?.summary?.outstanding
    ? toNaira(paymentsData.summary.outstanding)
    : 0;
  const clientOverdue = paymentsData?.summary?.overdue
    ? toNaira(paymentsData.summary.overdue)
    : 0;
  const clientTotalPortfolio = clientPaid + clientOutstanding;

  const quickActions = client.quickActions || [];
  const isMarketer =
    role === "Marketing Officer" || role.toLowerCase().includes("marketing");
  const canUploadDocs =
    role !== "MD / CEO" &&
    (role === "Customer Success" ||
      role === "Administrator" ||
      role === "Marketing Officer" ||
      role === "Sales Officer" ||
      role === "Accounts Lead" ||
      role.toLowerCase().includes("client") ||
      role.toLowerCase().includes("officer"));
  const hideFinance =
    role === "Marketing Officer" || role === "Project Manager";

  // PDF file type detector helper
  const isPdfFile = (url?: string, name?: string) => {
    if (!url && !name) return false;
    const urlLower = (url || "").toLowerCase();
    const nameLower = (name || "").toLowerCase();
    return (
      urlLower.includes(".pdf") ||
      nameLower.includes(".pdf") ||
      urlLower.includes("pdf") ||
      urlLower.startsWith("data:application/pdf")
    );
  };

  // Time range filter helper for ledger rows
  const filterLedgerTime = (itemDateStr: string) => {
    if (timeRange.range === "all") return true;
    const date = new Date(itemDateStr);
    if (isNaN(date.getTime())) return true;

    if (timeRange.range === "this-week") {
      const start = new Date("2026-07-20");
      const end = new Date("2026-07-26");
      return date >= start && date <= end;
    }
    if (timeRange.range === "last-year") {
      return date.getFullYear() === 2025;
    }
    if (timeRange.range === "custom" && timeRange.start && timeRange.end) {
      const start = new Date(timeRange.start);
      const end = new Date(timeRange.end);
      return date >= start && date <= end;
    }
    return true;
  };

  const ledgerList = paymentsData?.ledger || [];
  const filteredLedger = ledgerList.filter((item) =>
    filterLedgerTime(item.dueDate),
  );
  const stages = journeyData?.stages || [];

  // Construct dynamic Subscribed Properties list matching screenshot specification
  const rawLands = (client as any)?.lands || (client as any)?.properties || [];

  const subscribedProperties =
    rawLands.length > 0
      ? rawLands.map((l: any, idx: number) => ({
          id: l.id || `land-${idx}`,
          title: l.name || l.title || `Plot Allotment #${idx + 1}`,
          badge: l.status || "Active Land Development",
          badgeClass: "text-brand-teal bg-brand-teal/10",
          estate: l.estate || l.location || "Lekki Oceanfront Gate A",
          gps: l.coordinates || l.gps || "6.4281° N, 3.4219° E",
        }))
      : projectData
        ? [
            {
              id: projectData.id || "proj-1",
              title:
                projectData.landName ||
                (projectData.plot
                  ? `Plot Allotment (${projectData.plot})`
                  : "Active Land Development"),
              badge: projectData.isComplete
                ? "Handed Over"
                : "Active Land Development",
              badgeClass: projectData.isComplete
                ? "text-brand-olive bg-brand-olive/10"
                : "text-brand-teal bg-brand-teal/10",
              estate:
                projectData.location ||
                projectData.estateLabel ||
                "Rolad Ocean View Estate",
              gps:
                projectData.coordinates ||
                (projectData.plot
                  ? `Plot: ${projectData.plot}`
                  : "6.4281° N, 3.4219° E"),
            },
          ]
        : clientProductType === "Land & Property"
          ? [
              {
                id: "land-default-1",
                title: `${client.estateLabel || "Rolad Development Plot"} — ${client.plot || "Plot 27"}`,
                badge: "Active Land Development",
                badgeClass: "text-brand-teal bg-brand-teal/10",
                estate:
                  client.residentialAddress ||
                  client.estateLabel ||
                  "Lekki Oceanfront Gate A",
                gps: client.plot
                  ? `Plot: ${client.plot}`
                  : "6.4281° N, 3.4219° E",
              },
            ]
          : [
              {
                id: "inv-default-1",
                title: client.category || "Rolad Investment Plan",
                badge: "Investment Portfolio",
                badgeClass: "text-brand-olive bg-brand-olive/10",
                estate: "Rolad Wealth Guaranteed Yield Portfolio",
                gps: "Maturity Cycle Active",
              },
            ];

  // 4. Action Handlers
  const handleStageAdvance = () => {
    advanceStageMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.pendingApproval) {
          toast.success("Stage advance request sent for MD approval.");
        } else {
          toast.success("Stage advanced successfully.");
        }
      },
      onError: (err: any) => {
        toast.error(err.messages?.[0] || "Failed to advance stage.");
      },
    });
  };

  const handleStageRevert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage || !revertReason.trim()) {
      toast.error("Select target stage and provide a reversion reason.");
      return;
    }
    revertStageMutation.mutate(
      { toStageId: selectedStage, reason: revertReason },
      {
        onSuccess: () => {
          toast.success("Stage reverted successfully.");
          setRevertReason("");
          setSelectedStage("");
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to revert stage.");
        },
      },
    );
  };

  const handleRecordPayment = (installmentNum: number, amountNaira: number) => {
    // Log payment requires integer kobo per §9
    logPaymentMutation.mutate(
      {
        amount: toKoboInt(amountNaira),
        paidDate: new Date().toISOString(),
        installmentNumber: installmentNum,
        note: `Manual payment logged for installment #${installmentNum}`,
      },
      {
        onSuccess: () => {
          toast.success(`Payment recorded for Installment #${installmentNum}.`);
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to record payment.");
        },
      },
    );
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    addNoteMutation.mutate(newNote, {
      onSuccess: () => {
        toast.success("Journal note recorded.");
        setNewNote("");
      },
      onError: (err: any) => {
        toast.error(err.messages?.[0] || "Failed to record note.");
      },
    });
  };

  const handleSaveCampaignDetails = () => {
    attributeCampaignMutation.mutate(
      { campaignName: campaignInput },
      {
        onSuccess: () => {
          toast.success("Campaign details synced successfully.");
          setIsEditingCampaign(false);
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to save campaign details.");
        },
      },
    );
  };

  const handleClaimBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (salesValidationCode !== "SALES-99") {
      toast.error("Invalid Sales Validation credentials code.");
      return;
    }
    // Assigning logged-in user's staff profile ID as the closing agent via POST /clients/:id/campaign
    attributeCampaignMutation.mutate(
      { closingAgentId: user?.id },
      {
        onSuccess: () => {
          toast.success("Business claimed successfully! You are assigned.");
          setShowClaimModal(false);
          setSalesValidationCode("");
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to claim business.");
        },
      },
    );
  };

  const handleAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(adjustAmountNaira);
    if (isNaN(parsedAmount)) {
      toast.error("Please enter a valid amount.");
      return;
    }
    // adjustBalance expects a string kobo
    const koboString = toKoboInt(parsedAmount).toString();
    adjustBalanceMutation.mutate(
      {
        installmentNumber: adjustInstallment,
        adjustmentAmountKobo: koboString,
        note: adjustNote,
      },
      {
        onSuccess: () => {
          toast.success("Balance adjusted successfully.");
          setShowAdjustModal(false);
          setAdjustAmountNaira("");
          setAdjustNote("");
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to adjust balance.");
        },
      },
    );
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docId: string,
    docName: string,
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    try {
      toast.info(`Uploading ${docName}...`);
      const uploadRes = await uploadFile(file);
      await fileDocMutation.mutateAsync({
        docId,
        cloudinaryUrl: uploadRes.url,
        note: "Uploaded scan via UI",
      });
      toast.success(`Uploaded "${docName}" scan.`);
    } catch (err: any) {
      toast.error(err.messages?.[0] || err.message || "Failed to upload file.");
    }
  };

  const handleVoidDocument = (docId: string, docName: string) => {
    const reason = prompt(`Provide void reason for "${docName}":`);
    if (!reason) return;
    voidDocMutation.mutate(
      { docId, reason },
      {
        onSuccess: () => {
          toast.success(`Document "${docName}" voided successfully.`);
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to void document.");
        },
      },
    );
  };

  const handleGenerateMessage = async (
    overrideType?: string,
    overrideChannel?: string,
  ) => {
    const typeToUse = overrideType || selectedMessageType;
    const channelToUse = overrideChannel || selectedChannel;
    if (overrideType) setSelectedMessageType(overrideType);
    if (overrideChannel) setSelectedChannel(overrideChannel);

    let msg = "";
    try {
      if (resolvedUuid) {
        const res = await draftMessageMutation.mutateAsync({
          messageType: typeToUse,
          channel: channelToUse,
        });
        if (res?.draft || res?.aiDraft) {
          msg = res.draft || res.aiDraft || "";
        }
      }
    } catch (err) {
      console.warn(
        "[AI Message Drafter] API draft endpoint call failed, using intelligent client context fallback",
        err,
      );
    }

    if (!msg) {
      const dueAmountStr = paymentsData?.summary?.overdue
        ? formatNaira(paymentsData.summary.overdue)
        : paymentsData?.summary?.outstanding
          ? formatNaira(paymentsData.summary.outstanding)
          : "N41,666,666";

      if (typeToUse === "payment_reminder") {
        msg =
          channelToUse === "whatsapp"
            ? `Hello ${clientName},\n\nHope this message finds you well. This is a friendly reminder that your installment of ${dueAmountStr} for the ${clientProductType} product is due.\n\nWe encourage you to make your payment on time to avoid any inconvenience.\n\nThank you for your attention to this matter.`
            : `Subject: Payment Settlement Reminder - ${clientProductType} (Ref: ${clientCode})\n\nDear ${clientName},\n\nI hope this message finds you well. This is a friendly reminder that your installment of ${dueAmountStr} for the ${clientProductType} product is due.\n\nWe encourage you to make your payment on time to avoid any inconvenience.\n\nThank you for your attention to this matter.\n\nWarm regards,\nRolad Properties Operations Team`;
      } else if (typeToUse === "follow_up") {
        msg =
          channelToUse === "whatsapp"
            ? `Hello ${clientName},\n\nWe are following up on your ${clientProductType} investment (Ref: ${clientCode}). Your current milestone stage is "${clientJourneyStage}".\n\nPlease let us know if you have any questions or need support with your documentation.\n\nBest regards,\nRolad Client Experience`
            : `Subject: Follow-up regarding your ${clientProductType} (Ref: ${clientCode})\n\nDear ${clientName},\n\nWe are writing to follow up on your account status. Your current milestone stage is ${clientJourneyStage}.\n\nIf you have any questions or require support regarding your portfolio, please do not hesitate to contact us.\n\nWarm regards,\nRolad Client Experience Desk`;
      } else if (typeToUse === "roi_payout") {
        msg =
          channelToUse === "whatsapp"
            ? `Hello ${clientName},\n\nGreat news! Your ROI payout for your ${clientProductType} investment (${clientCode}) has been processed successfully. Please check your registered account details.\n\nThank you for trusting Rolad Properties!`
            : `Subject: ROI Payout Confirmation - ${clientCode}\n\nDear ${clientName},\n\nWe are pleased to inform you that your ROI distribution for your ${clientProductType} investment has been successfully processed.\n\nThank you for your continued trust and partnership with Rolad Properties.\n\nSincerely,\nTreasury & Accounts Division`;
      } else if (typeToUse === "allocation_congratulations") {
        msg =
          channelToUse === "whatsapp"
            ? `Congratulations ${clientName}! 🎉\n\nYour land allocation for ${projectData?.estateLabel || clientProductType} (Ref: ${clientCode}) has been confirmed! Plot coordinates: ${projectData?.coordinates || "6.4000 N"}.\n\nBest regards,\nRolad Development Team`
            : `Subject: Landmark Allocation Confirmed - ${clientProductType} (Ref: ${clientCode})\n\nDear ${clientName},\n\nWe are thrilled to inform you that your physical land allocation for ${projectData?.estateLabel || clientProductType} is now confirmed.\n\nPlot details & coordinates: ${projectData?.coordinates || "6.4000 N"}.\n\nCongratulations on reaching this milestone!\n\nBest regards,\nRolad Executive Management`;
      } else {
        msg =
          channelToUse === "whatsapp"
            ? `Hello ${clientName},\n\nOfficial notice regarding your ${clientProductType} account (${clientCode}). Status: ${clientJourneyStage}.\n\nWarm regards,\nRolad Operations`
            : `Subject: Update on your ${clientProductType} Account (Ref: ${clientCode})\n\nDear ${clientName},\n\nThis is an official notice regarding your ${clientProductType} portfolio. Status: ${clientJourneyStage}.\n\nWarm regards,\nRolad Properties`;
      }
    }
    setDraftedMessage(msg);
  };

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditParams.trim()) {
      toast.error("Please enter the audit rationale and parameters.");
      return;
    }

    const auditTitle = `Customer Audit Request: ${clientName} (${clientCode})`;
    const auditDetails = `Urgency: ${auditUrgency} | Scope: ${auditDepartment} | Rationale: ${auditParams}`;

    const isUuid = (id?: string | null): id is string =>
      Boolean(
        id &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          id,
        ),
      );

    submitApprovalMutation.mutate(
      {
        requestType: "customer_audit",
        title: auditTitle,
        description: auditDetails,
        ...(isUuid(resolvedUuid) ? { relatedClientId: resolvedUuid } : {}),
        payload: {
          clientCode: clientCode,
          department: auditDepartment,
          urgency: auditUrgency,
          rationale: auditParams,
        },
      },
      {
        onSuccess: () => {
          submitApprovalRequest({
            title: auditTitle,
            requestedBy: `${user?.name || role} (Client Relations)`,
            cost: `${auditDepartment} Audit`,
            details: auditDetails,
            clientCode: clientCode,
          });

          logActivity(
            `Submitted Customer Audit Request for client "${clientName}" (${clientCode}) [${auditDepartment} - ${auditUrgency}]`,
            user?.name || role,
          );

          toast.success(
            `Customer audit request for ${clientName} submitted to MD / CEO for executive review.`,
          );

          setShowAuditModal(false);
          setAuditParams("");
          setAuditDepartment("Accounts");
          setAuditUrgency("High Priority");
        },
        onError: (err: any) => {
          toast.error(
            err?.messages?.[0] ||
              err?.message ||
              "Failed to submit customer audit request.",
          );
          // Do NOT close modal on error!
        },
      },
    );
  };

  // Reconciled paymentStatusMeta mapping
  const statusMeta = paymentStatusMeta(clientPaymentStatus as any);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 select-none relative">
      {/* Back navigation & Time Range selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-gray hover:text-brand-teal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
        {!hideFinance && (
          <TimeRangePicker
            onChange={(rangeState) => setTimeRange(rangeState)}
          />
        )}
      </div>

      {/* Header Dashboard Ribbon */}
      <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-brand-teal bg-brand-teal/5 px-2 py-0.5 rounded border border-brand-teal/10">
              {clientCode}
            </span>
            <span className="font-sans text-[9px] font-extrabold uppercase bg-brand-olive text-white px-2 py-0.5 rounded tracking-wide">
              {clientProductType}
            </span>
            {auditForThisClient &&
              (auditForThisClient.status === "Approved" ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  MD Audit Approved
                </span>
              ) : auditForThisClient.status === "Pending" ? (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Audit Pending MD Review
                </span>
              ) : (
                <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Audit Rejected
                </span>
              ))}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
          </div>
          <h1 className="font-serif text-2xl font-extrabold text-charcoal tracking-wide">
            {clientName}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-gray">
            <span>Phone: {clientPhone}</span>
            <span>•</span>
            <span>Email: {clientEmail}</span>
            <span>•</span>
            {/* Defensive check closureAgent fallback per Phase 0 item 4 */}
            <span>Sales Agent: {client.closureAgent || "—"}</span>
          </div>
        </div>

        {/* Campaign details & Marketing attribution */}
        <div className="p-4 bg-neutral-50 rounded border border-border-warm/60 min-w-50 space-y-1">
          <span className="text-[8px] uppercase font-bold text-muted-gray tracking-wider block">
            Campaign Attribution
          </span>
          {isEditingCampaign && isMarketer ? (
            <div className="flex gap-2 items-center mt-1">
              <input
                type="text"
                value={campaignInput}
                onChange={(e) => setCampaignInput(e.target.value)}
                className="px-2 py-1 text-xs border border-border-warm rounded focus:border-brand-teal bg-white"
              />
              <button
                onClick={handleSaveCampaignDetails}
                className="px-2.5 py-1 bg-brand-teal text-white text-[10px] font-bold rounded cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-2">
              {/* Defensive check campaignDetails fallback per Phase 0 item 4 */}
              <span className="text-xs text-charcoal font-semibold">
                {client.campaignDetails || "—"}
              </span>
              {isMarketer && (
                <button
                  onClick={() => setIsEditingCampaign(true)}
                  className="text-[9px] text-brand-teal hover:underline font-bold cursor-pointer"
                >
                  Attribute Campaign
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sales Officer: Claim business */}
        {role === "Sales Officer" && (
          <Button
            variant="primary"
            onClick={() => setShowClaimModal(true)}
            className="bg-brand-olive border-brand-olive hover:bg-brand-olive/95 text-white font-bold text-xs px-4 py-2.5 rounded-lg"
          >
            Claim Business
          </Button>
        )}

        {/* Customer Audit Request button for Client Relations & Team Members */}
        <Button
          variant="secondary"
          onClick={() => setShowAuditModal(true)}
          className="border border-brand-teal text-brand-teal hover:bg-brand-teal/5 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span>Request Customer Audit</span>
        </Button>

        {/* Stage transitions updating panel */}
        <div className="flex flex-wrap gap-2.5">
          {quickActions.includes("ADVANCE_STAGE") && (
            <Button
              variant="primary"
              onClick={handleStageAdvance}
              isLoading={advanceStageMutation.isPending}
              className="text-xs py-2.5 px-4 bg-brand-teal text-white hover:bg-brand-teal/95 font-bold rounded"
            >
              Advance Stage
            </Button>
          )}

          {quickActions.includes("REVERT_STAGE") && (
            <form
              onSubmit={handleStageRevert}
              className="flex gap-2 items-center bg-neutral-50 p-2.5 border border-border-warm rounded"
            >
              <div>
                <Select
                  options={stages
                    .filter((st) => st.state === "completed")
                    .map((st) => ({ value: st.stageId, label: st.stageLabel }))}
                  value={selectedStage}
                  onChange={setSelectedStage}
                  className="text-xs py-1"
                />
              </div>
              <input
                type="text"
                placeholder="Reason for Reverting..."
                required
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                className="px-2 py-1 text-xs border border-border-warm rounded bg-white text-charcoal outline-none"
              />
              <Button
                variant="secondary"
                type="submit"
                isLoading={revertStageMutation.isPending}
                className="text-[10px] py-1 bg-neutral-200 border-none rounded text-charcoal hover:bg-neutral-300 font-bold"
              >
                Revert
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Journey stages timeline */}
          <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-teal mb-6 pb-2 border-b border-border-warm/60">
              Journey Timeline Layout
            </h2>
            <div className="relative pl-6 border-l-2 border-border-warm/85 space-y-6 ml-3">
              {isJourneyLoading ? (
                <div className="text-xs font-semibold text-muted-gray">
                  Querying journey timeline...
                </div>
              ) : stages.length === 0 ? (
                <div className="text-xs text-muted-gray italic">
                  No timeline stages defined.
                </div>
              ) : (
                stages.map((stageItem) => {
                  const isActive =
                    stageItem.state === "completed" ||
                    stageItem.state === "current";
                  const isCurrent = stageItem.state === "current";

                  return (
                    <div key={stageItem.stageId} className="relative">
                      <div
                        className={`absolute -left-7.75 top-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCurrent
                            ? "bg-brand-lime border-brand-teal scale-110 z-10"
                            : isActive
                              ? "bg-brand-teal border-brand-teal"
                              : "bg-white border-border-warm"
                        }`}
                      >
                        {isActive && (
                          <CheckCircle
                            className={`w-3 h-3 ${isCurrent ? "text-brand-teal" : "text-white"}`}
                          />
                        )}
                      </div>

                      <div className="ml-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3
                            className={`font-serif text-sm font-bold leading-none ${
                              isCurrent
                                ? "text-brand-teal"
                                : isActive
                                  ? "text-charcoal"
                                  : "text-muted-gray/50"
                            }`}
                          >
                            {stageItem.stageLabel}
                          </h3>
                          {isActive && stageItem.enteredAt && (
                            <span className="text-[9px] font-mono text-muted-gray flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                              {new Date(stageItem.enteredAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-gray mt-1 leading-normal">
                          {isCurrent
                            ? `Current stage. Entered by ${stageItem.enteredByStaffName || "system"}.`
                            : isActive
                              ? `Completed milestone.`
                              : "Downstream milestone."}
                        </p>
                        {stageItem.notes && (
                          <p className="text-[9px] bg-neutral-50 border border-border-warm p-1.5 rounded mt-1.5 text-charcoal font-mono italic">
                            Note: {stageItem.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payments Ledger Interface */}
          {!hideFinance && (
            <div className="bg-white border border-border-warm rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
                <h2 className="font-serif text-lg font-bold text-brand-teal">
                  Payments Ledger Interface
                </h2>
                <div className="flex items-center gap-2">
                  {quickActions.includes("ADJUST_BALANCE") && (
                    <button
                      onClick={() => setShowAdjustModal(true)}
                      className="px-3 py-1 bg-brand-olive text-white text-[10px] font-bold rounded cursor-pointer shadow-sm"
                    >
                      Adjust Balance
                    </button>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded font-bold text-[9px] ${statusMeta.bg} ${statusMeta.textClass}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {/* Financial KPI Summary Header */}
              <div className="grid grid-cols-3 divide-x divide-border-warm border-b border-border-warm text-center bg-neutral-50/20 py-4">
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-gray tracking-wider">
                    Paid Balance
                  </p>
                  <p className="text-xl font-bold text-brand-olive mt-1">
                    {formatNaira(paymentsData?.summary?.paid)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-gray tracking-wider">
                    Outstanding
                  </p>
                  <p className="text-xl font-bold text-charcoal mt-1">
                    {formatNaira(paymentsData?.summary?.outstanding)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-gray tracking-wider">
                    Overdue Balance
                  </p>
                  <p
                    className={`text-xl font-bold mt-1 ${clientOverdue > 0 ? "text-status-late" : "text-charcoal"}`}
                  >
                    {formatNaira(paymentsData?.summary?.overdue)}
                  </p>
                </div>
              </div>

              {/* Ledger access control per §11.5 */}
              {isPaymentsLoading ? (
                <div className="p-8 text-center text-xs font-semibold text-muted-gray">
                  Querying payment ledger...
                </div>
              ) : paymentsData && !paymentsData.canSeeLedger ? (
                <div className="p-8 text-center text-xs text-status-late bg-neutral-50/30 font-bold">
                  🔒 Detailed installment ledger hidden for your role type.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="rolad-table">
                    <thead>
                      <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                        <th className="px-6 py-3">Installment #</th>
                        <th className="px-6 py-3">Amount Due</th>
                        <th className="px-6 py-3">Due Date</th>
                        <th className="px-6 py-3">Paid amount</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                      {filteredLedger.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-neutral-50/30 transition-colors"
                        >
                          <td className="px-6 py-3.5 font-mono text-[11px] text-muted-gray font-semibold">
                            Installment #{item.installmentNumber}
                          </td>
                          <td className="px-6 py-3.5 font-bold">
                            {formatNaira(item.amount)}
                          </td>
                          <td className="px-6 py-3.5 text-muted-gray">
                            {item.dueDate}
                          </td>
                          <td className="px-6 py-3.5 text-brand-olive font-semibold">
                            {formatNaira(item.paidAmount)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                item.status === "paid"
                                  ? "text-brand-olive bg-brand-olive/10"
                                  : item.status === "skipped"
                                    ? "text-neutral-500 bg-neutral-100"
                                    : "text-status-late bg-status-late/10"
                              }`}
                            >
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {item.status !== "paid" &&
                              quickActions.includes("LOG_PAYMENT") && (
                                <button
                                  onClick={() =>
                                    handleRecordPayment(
                                      item.installmentNumber,
                                      toNaira(item.amount),
                                    )
                                  }
                                  className="px-3 py-1 bg-brand-teal hover:bg-brand-teal/95 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Mark Paid
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Project details, Documents */}
        <div className="space-y-8">
          {/* Subscribed Properties Card */}
          <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-warm/60">
              <Compass className="w-5 h-5 text-brand-teal" />
              <h2 className="font-serif text-lg font-bold text-brand-teal">
                Subscribed Properties
              </h2>
            </div>

            <p className="text-xs text-muted-gray leading-normal font-medium">
              This client owns {subscribedProperties.length} plot allotment
              {subscribedProperties.length === 1 ? "" : "s"}.
            </p>

            {isProjectLoading ? (
              <div className="text-xs font-semibold text-muted-gray py-4">
                Querying property allotments...
              </div>
            ) : subscribedProperties.length === 0 ? (
              <div className="p-4 bg-neutral-50 border border-border-warm/60 rounded-xl text-center text-xs text-muted-gray italic">
                — No subscribed properties or plot allotments assigned —
              </div>
            ) : (
              <div className="space-y-3.5">
                {subscribedProperties.map((prop: any) => (
                  <div
                    key={prop.id}
                    className="p-4 border border-border-warm/80 rounded-xl bg-white hover:bg-neutral-50/50 transition-all flex flex-col gap-2 shadow-2xs"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-sans font-bold text-charcoal text-sm">
                        {prop.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${prop.badgeClass}`}
                      >
                        {prop.badge}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-gray space-y-0.5 font-medium">
                      <p>
                        <span className="font-semibold text-muted-gray">
                          Estate:
                        </span>{" "}
                        {prop.estate}
                      </p>
                      <p className="font-mono text-[10px]">
                        <span className="font-sans font-semibold text-muted-gray">
                          GPS:
                        </span>{" "}
                        {prop.gps}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents Checklist Card */}
          <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-teal mb-4 pb-2 border-b border-border-warm/60">
              Documents Checklist
            </h2>
            {isDocsLoading ? (
              <div className="text-xs font-semibold text-muted-gray">
                Querying folder docs...
              </div>
            ) : !documentsData || documentsData.documents.length === 0 ? (
              <div className="text-xs text-muted-gray italic">
                No document slots assigned.
              </div>
            ) : (
              <div className="space-y-3.5">
                {documentsData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-3 p-3 border border-border-warm/80 bg-neutral-50/20 hover:bg-neutral-50/70 transition-colors rounded-lg text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-charcoal">{doc.docName}</p>
                      {doc.status === "filed" ? (
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-gray mt-0.5">
                            Filed by {doc.filedByStaffName || "staff"} on{" "}
                            {doc.filedAt
                              ? new Date(doc.filedAt).toLocaleDateString()
                              : "—"}
                          </p>
                          {doc.cloudinaryUrl && (
                            <div className="mt-1.5">
                              {isPdfFile(doc.cloudinaryUrl, doc.docName) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewUrl(doc.cloudinaryUrl || null);
                                    setPreviewName(doc.docName);
                                  }}
                                  className="group/thumb relative flex flex-col items-center justify-center w-14 h-14 bg-red-50/90 border border-red-200 rounded overflow-hidden shadow-xs cursor-pointer hover:bg-red-100 transition-colors text-red-700"
                                >
                                  <FileText className="w-5 h-5 text-red-600" />
                                  <span className="text-[8px] font-extrabold uppercase mt-0.5 tracking-wider text-red-700">
                                    PDF
                                  </span>
                                  <div className="absolute inset-0 bg-red-800/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold animate-fade-in">
                                    Preview
                                  </div>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewUrl(doc.cloudinaryUrl || null);
                                    setPreviewName(doc.docName);
                                  }}
                                  className="group/thumb relative block w-14 h-14 bg-neutral-100 border border-border-warm rounded overflow-hidden shadow-sm cursor-pointer"
                                >
                                  <img
                                    src={doc.cloudinaryUrl}
                                    alt={doc.docName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-brand-teal/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold animate-fade-in">
                                    Preview
                                  </div>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[9px] text-status-late font-bold mt-0.5">
                          Awaiting file
                        </p>
                      )}
                    </div>

                    {/* Permissions uploads gating */}
                    {doc.status === "filed" ? (
                      <div className="flex items-center gap-1.5">
                        {doc.cloudinaryUrl && (
                          <a
                            href={doc.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-border-warm rounded text-charcoal font-bold text-[9px] inline-flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            Download
                          </a>
                        )}
                        {quickActions.includes("VOID_DOCUMENT") && (
                          <button
                            onClick={() =>
                              handleVoidDocument(doc.id, doc.docName)
                            }
                            className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-border-warm rounded text-status-late font-bold text-[9px] cursor-pointer shrink-0"
                          >
                            Void
                          </button>
                        )}
                      </div>
                    ) : (
                      canUploadDocs && (
                        <label className="px-2.5 py-1 bg-brand-teal hover:bg-brand-teal/95 text-white rounded font-bold text-[9px] cursor-pointer transition-all flex items-center justify-center relative shadow-sm">
                          Upload Scan
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) =>
                              handleFileUpload(e, doc.id, doc.docName)
                            }
                          />
                        </label>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit trail / Activity Feed logs */}
      <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm mt-8">
        <h2 className="font-serif text-lg font-bold text-brand-teal mb-4 pb-2 border-b border-border-warm/60">
          Client Operations Journal Notes
        </h2>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {isActivityLoading ? (
            <div className="text-xs font-semibold text-muted-gray">
              Querying notes feed...
            </div>
          ) : !activityData || activityData.entries.length === 0 ? (
            <p className="text-xs text-muted-gray italic">
              No activity or journal logs recorded.
            </p>
          ) : (
            activityData.entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-neutral-50/50 border border-border-warm rounded-lg space-y-1.5 text-xs"
              >
                <div className="flex justify-between text-[10px] text-muted-gray font-semibold">
                  <span>{entry.actorStaffName || "Operations Console"}</span>
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-charcoal font-medium font-sans">
                  {entry.kind === "note" ? entry.body : entry.action}
                </p>
              </div>
            ))
          )}
        </div>

        {quickActions.includes("ADD_NOTE") && (
          <form onSubmit={handleAddNote} className="mt-4 flex gap-2">
            <input
              type="text"
              required
              placeholder="Record notes on site checks, approvals, or calls..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 px-3 py-2 border border-border-warm focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/15 rounded text-xs outline-none bg-white text-charcoal"
            />
            <Button
              variant="primary"
              type="submit"
              isLoading={addNoteMutation.isPending}
              className="px-4 py-2 bg-brand-teal text-white hover:bg-brand-teal/95 text-xs rounded font-bold shadow-sm"
            >
              Add Journal Entry
            </Button>
          </form>
        )}
      </div>

      {/* Context Toolbar message drawer */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowMessageDrawer(true)}
          className="flex items-center gap-2 bg-brand-teal hover:bg-brand-teal/95 text-white shadow-xl px-4 py-3 rounded-full font-sans text-xs font-bold tracking-wide uppercase transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
        >
          <span>Draft Client Message</span>
        </button>
      </div>

      {/* AI Message Drawer */}
      {showMessageDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-l border-border-warm h-full max-w-lg w-full shadow-2xl p-6 flex flex-col justify-between animate-slide-in relative">
            <button
              onClick={() => setShowMessageDrawer(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              ✕
            </button>

            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-border-warm/60">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-teal">
                      Client Message Draft
                    </h3>
                    <p className="text-[11px] text-muted-gray">
                      Client Context:{" "}
                      <span className="font-semibold text-charcoal">
                        {clientName}
                      </span>{" "}
                      ({clientCode})
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Channel Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">
                  1. Dispatch Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "whatsapp", label: "WhatsApp", icon: "💬" },
                    { id: "email", label: "Email Notice", icon: "✉️" },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannel(ch.id)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedChannel === ch.id
                          ? "border-brand-teal bg-brand-teal/10 text-brand-teal shadow-xs"
                          : "border-border-warm bg-neutral-50/50 text-muted-gray hover:bg-neutral-100"
                      }`}
                    >
                      <span>{ch.icon}</span>
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Message Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">
                  2. Message Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: "payment_reminder",
                      label: "Payment Reminder",
                      desc: "Installment due notice",
                    },
                    {
                      id: "follow_up",
                      label: "Follow-up Notice",
                      desc: "Milestone status check",
                    },
                    {
                      id: "roi_payout",
                      label: "ROI Payout",
                      desc: "Yield payout confirmation",
                    },
                    {
                      id: "allocation_congratulations",
                      label: "Allocation Congrats",
                      desc: "Plot allocation notice",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMessageType(item.id)}
                      className={`text-left p-2.5 border rounded-lg transition-all cursor-pointer ${
                        selectedMessageType === item.id
                          ? "border-brand-teal bg-brand-teal/5 text-brand-teal shadow-xs"
                          : "border-border-warm bg-white hover:bg-neutral-50 text-charcoal"
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate AI Draft Button */}
              <Button
                onClick={() => handleGenerateMessage()}
                isLoading={draftMessageMutation.isPending}
                className="w-full py-2.5 bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <span>Generate Message Draft</span>
              </Button>

              {/* Draft Text Output & Editor */}
              {draftedMessage && (
                <div className="space-y-2.5 pt-4 border-t border-border-warm/60 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">
                      Generated Message Copy (Editable)
                    </label>
                    <span className="text-[10px] text-muted-gray font-mono">
                      {draftedMessage.length} chars
                    </span>
                  </div>

                  <textarea
                    value={draftedMessage}
                    onChange={(e) => setDraftedMessage(e.target.value)}
                    rows={8}
                    className="w-full p-3 border border-border-warm rounded-lg font-sans text-xs text-charcoal outline-none focus:border-brand-teal bg-neutral-50/50 resize-y"
                    placeholder="Synthesized draft content will appear here..."
                  />

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(draftedMessage);
                        toast.success("Draft copied to clipboard.");
                      }}
                      className="text-xs py-2 bg-neutral-100 hover:bg-neutral-200 font-medium"
                    >
                      <p className="text-charcoal">Copy Text</p>
                    </Button>

                    <Button
                      isLoading={saveMessageMutation.isPending}
                      onClick={() => {
                        if (!resolvedUuid) return;
                        saveMessageMutation.mutate(
                          {
                            messageType: selectedMessageType,
                            channel: selectedChannel,
                            body: draftedMessage,
                            aiDraft: draftedMessage,
                            finalContent: draftedMessage,
                          },
                          {
                            onSuccess: () => {
                              toast.success(
                                "Message draft saved successfully.",
                              );
                            },
                            onError: (err: any) => {
                              toast.error(
                                err.messages?.[0] || "Failed to save draft.",
                              );
                            },
                          },
                        );
                      }}
                      className="text-xs py-2 bg-brand-teal text-white font-bold shadow-xs"
                    >
                      Save Draft
                    </Button>
                  </div>

                  {/* Direct Launch Dispatch Button */}
                  {selectedChannel === "whatsapp" ? (
                    <a
                      href={`https://wa.me/${clientPhone !== "—" ? clientPhone.replace(/\D/g, "") : ""}?text=${encodeURIComponent(draftedMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>💬 Open & Dispatch in WhatsApp</span>
                    </a>
                  ) : (
                    <a
                      href={`mailto:${clientEmail !== "—" ? clientEmail : ""}?subject=${encodeURIComponent(`Notice regarding ${clientProductType} (${clientCode})`)}&body=${encodeURIComponent(draftedMessage)}`}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>✉️ Open Mail Client</span>
                    </a>
                  )}
                </div>
              )}

              {/* Message History preview */}
              {clientMessagesRes?.data && clientMessagesRes.data.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border-warm/60">
                  <h4 className="text-[10px] uppercase font-bold text-muted-gray tracking-wider">
                    Recent Dispatches & Saved Drafts (
                    {clientMessagesRes.data.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {clientMessagesRes.data.slice(0, 3).map((m: any) => (
                      <div
                        key={m.id}
                        className="p-2.5 border border-border-warm/70 rounded-lg bg-neutral-50/60 text-xs"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-brand-teal capitalize">
                            {m.messageType} ({m.channel})
                          </span>
                          <span className="text-[10px] font-mono text-muted-gray">
                            {m.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal line-clamp-2">
                          {m.body || m.finalContent || m.aiDraft}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowMessageDrawer(false)}
              className="w-full mt-4 py-2.5 text-xs font-bold"
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-xs font-semibold">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-brand-teal mb-4 uppercase tracking-wider">
              Adjust Client Installment Balance
            </h3>
            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Target Installment Number
                </label>
                <Select
                  options={ledgerList.map((item) => ({
                    value: item.installmentNumber.toString(),
                    label: `Installment #${item.installmentNumber} (${formatNaira(item.amount)})`,
                  }))}
                  value={adjustInstallment.toString()}
                  onChange={(val) => setAdjustInstallment(parseInt(val))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Adjustment Amount (Naira)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={adjustAmountNaira}
                  onChange={(e) => setAdjustAmountNaira(e.target.value)}
                  placeholder="e.g. -50000 to deduct, 50000 to increase"
                  className="w-full p-2.5 border border-border-warm rounded bg-white text-charcoal outline-none focus:border-brand-teal"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Adjustment Justification Note
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Provide brief notes on adjustment reason..."
                  className="w-full p-2.5 border border-border-warm rounded bg-white text-charcoal outline-none focus:border-brand-teal"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={adjustBalanceMutation.isPending}
                  className="bg-brand-teal text-white font-bold"
                >
                  Submit Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Audit Request Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-lg w-full shadow-2xl relative text-xs font-semibold animate-scale-up">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border-warm/60">
              <ShieldAlert className="w-5 h-5 text-brand-teal" />
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-teal uppercase tracking-wider">
                  Request Customer Audit
                </h3>
                <p className="text-[10px] text-muted-gray">
                  Initiate formal audit review routed to MD / CEO executive desk
                </p>
              </div>
            </div>

            <form onSubmit={handleAuditSubmit} className="space-y-4">
              {/* Target Client Summary Box */}
              <div className="p-3 bg-neutral-50 border border-border-warm rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-mono text-[10px] text-brand-teal font-bold block">
                    {clientCode}
                  </span>
                  <span className="font-serif font-bold text-charcoal text-sm">
                    {clientName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted-gray uppercase block font-bold">
                    Current Stage
                  </span>
                  <span className="text-xs font-bold text-brand-olive">
                    {clientJourneyStage}
                  </span>
                </div>
              </div>

              {/* Department / Scope Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                  Audit Department & Scope
                </label>
                <Select
                  options={[
                    { value: "Accounts", label: "Accounts & Ledger Audit" },
                    { value: "Admin", label: "Admin & Identity Vetting" },
                    {
                      value: "Projects",
                      label: "Project & Allocation Verification",
                    },
                    { value: "Legal", label: "Legal & Documentation Audit" },
                  ]}
                  value={auditDepartment}
                  onChange={(val) => setAuditDepartment(val as any)}
                  className="w-full"
                />
              </div>

              {/* Urgency Level Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                  Urgency Level
                </label>
                <Select
                  options={[
                    { value: "Routine", label: "Routine Compliance Check" },
                    {
                      value: "High Priority",
                      label: "High Priority Discrepancy",
                    },
                    {
                      value: "Urgent / Escalate",
                      label: "Urgent / Executive Escalation",
                    },
                  ]}
                  value={auditUrgency}
                  onChange={(val) => setAuditUrgency(val as any)}
                  className="w-full"
                />
              </div>

              {/* Audit Rationale / Parameters TextArea */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray block mb-1">
                  Audit Rationale & Parameters
                </label>
                <textarea
                  required
                  rows={3}
                  value={auditParams}
                  onChange={(e) => setAuditParams(e.target.value)}
                  placeholder="Explain why this customer audit is required (e.g. variance in payment receipts, stage advancement hold, boundary verification)..."
                  className="w-full p-3 border border-border-warm rounded focus:border-brand-teal outline-none bg-white text-charcoal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border-warm">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={submitApprovalMutation.isPending}
                  className="bg-brand-teal hover:bg-brand-teal/95 text-white font-bold px-6 py-2 rounded-lg"
                >
                  Submit Audit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Business Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-xs font-semibold">
            <button
              onClick={() => setShowClaimModal(false)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-brand-teal mb-4 uppercase tracking-wider">
              Verify Sales Commission Claim
            </h3>
            <form onSubmit={handleClaimBusiness} className="space-y-4">
              <div>
                <label className="text-[9px] uppercase block mb-1">
                  Verification Validation Code
                </label>
                <input
                  type="text"
                  required
                  value={salesValidationCode}
                  onChange={(e) => setSalesValidationCode(e.target.value)}
                  placeholder="Enter SALES-99 code..."
                  className="w-full p-2.5 border border-border-warm rounded bg-white text-charcoal outline-none focus:border-brand-teal font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowClaimModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={patchClientMutation.isPending}
                  className="bg-brand-olive text-white border-brand-olive font-bold"
                >
                  Verify Ownership
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Scanned Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-border-warm relative animate-fade-in">
            <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-brand-teal">
                Document Preview: {previewName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName(null);
                }}
                className="p-1.5 rounded-full hover:bg-neutral-200 text-muted-gray hover:text-charcoal transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex justify-center items-center bg-neutral-50 max-h-[60vh] overflow-auto w-full">
              {isPdfFile(previewUrl || undefined, previewName || undefined) ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white border border-red-200 rounded-xl shadow-xs text-center space-y-3 max-w-sm w-full">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal text-sm">
                      {previewName}
                    </h4>
                    <p className="text-[10px] text-muted-gray mt-0.5 font-mono">
                      PDF Compliance Document
                    </p>
                  </div>
                  <a
                    href={previewUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    Open PDF Document
                  </a>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt={previewName || "Document Scan"}
                  className="max-w-full max-h-[50vh] object-contain rounded border border-border-warm bg-white shadow-sm"
                />
              )}
            </div>

            <div className="px-6 py-4 border-t border-border-warm flex justify-end gap-3 bg-neutral-50/50">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/95 text-white font-bold rounded text-xs transition-colors"
              >
                View Fullscreen
              </a>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName(null);
                }}
                className="px-4 py-2 border border-charcoal text-charcoal hover:bg-neutral-100 font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
