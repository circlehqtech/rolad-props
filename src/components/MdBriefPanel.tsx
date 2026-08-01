import { useState } from "react";
import { Eye, Download, Send, X, FileText } from "lucide-react";
import Button from "./Button";
import Select from "./Select";
import Skeleton from "./Skeleton";
import { type Client, type ApprovalItem } from "../store/mockStore";
import { useDashboardBriefing } from "../shared/hooks/useLiveQueries";
import { toast } from "../utils/toast";
import { useAuthStore } from "../store/authStore";
import { toApiTimeRange, type TimeRangeValue } from "./TimeRangePicker";

export function renderMarkdown(text: string | null | undefined) {
  if (text === null) {
    return (
      <div className="p-4 bg-neutral-50 rounded-xl border border-border-warm text-center text-muted-gray text-xs font-semibold">
        No briefing yet
      </div>
    );
  }
  if (!text) return null;

  const paragraphs = text.split("\n\n");
  return (
    <div className="space-y-3">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split("\n");
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              const isBullet =
                trimmed.startsWith("- ") || trimmed.startsWith("* ");
              const content = isBullet ? trimmed.slice(2) : trimmed;

              const parts = content.split(/(\*\*.*?\*\*)/g);
              const renderedContent = parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={i} className="font-bold text-brand-teal">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              });

              if (isBullet) {
                return (
                  <div
                    key={lIdx}
                    className="flex items-start gap-2 ml-2 text-xs"
                  >
                    <span className="text-brand-teal font-bold">•</span>
                    <span>{renderedContent}</span>
                  </div>
                );
              }
              return (
                <p key={lIdx} className="leading-relaxed text-xs">
                  {renderedContent}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

interface MdBriefPanelProps {
  clients: Client[];
  approvals: ApprovalItem[];
  variant?: "embedded" | "floating-button";
}

export default function MdBriefPanel({
  clients,
  approvals,
  variant = "embedded",
}: MdBriefPanelProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  // Timeframe states for the brief
  const [briefRange, setBriefRange] = useState<TimeRangeValue>("this-week");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [specificDate, setSpecificDate] = useState<string>("");

  const rangeOptions = [
    { value: "all", label: "All time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this-week", label: "This week" },
    { value: "last-week", label: "Last week" },
    { value: "this-month", label: "This month" },
    { value: "last-month", label: "Last month" },
    { value: "this-year", label: "This year" },
    { value: "last-year", label: "Last year" },
    { value: "custom", label: "Custom range" },
    { value: "specific-date", label: "Specific date" },
  ];

  const briefingParams =
    briefRange === "specific-date"
      ? { ...(specificDate ? { date: specificDate } : {}) }
      : {
          timeRange: toApiTimeRange(briefRange),
          ...(briefRange === "custom" && customStart
            ? { fromDate: customStart }
            : {}),
          ...(briefRange === "custom" && customEnd
            ? { toDate: customEnd }
            : {}),
        };

  const { data: serverBriefing, isLoading: isBriefingLoading } =
    useDashboardBriefing(briefingParams, true);

  const filterByBriefTime = (dateStr?: string) => {
    if (briefRange === "all") return true;
    if (!dateStr) return false;
    const datePart = dateStr.split(" ")[0];
    const itemDate = new Date(datePart);
    if (isNaN(itemDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    itemDate.setHours(0, 0, 0, 0);

    if (briefRange === "specific-date") {
      return Boolean(
        specificDate &&
        itemDate.getTime() === new Date(`${specificDate}T00:00:00`).getTime(),
      );
    }

    if (briefRange === "custom") {
      if (!customStart || !customEnd) return true;
      return (
        itemDate >= new Date(customStart) && itemDate <= new Date(customEnd)
      );
    }

    let start = new Date(today);
    let end = new Date(today);
    if (briefRange === "yesterday") {
      start.setDate(start.getDate() - 1);
      end = new Date(start);
    } else if (briefRange === "this-week" || briefRange === "last-week") {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (briefRange === "last-week") {
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() - 7);
      }
    } else if (briefRange === "this-month" || briefRange === "last-month") {
      const monthOffset = briefRange === "last-month" ? -1 : 0;
      start = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      end = new Date(
        today.getFullYear(),
        today.getMonth() + monthOffset + 1,
        0,
      );
    } else if (briefRange === "this-year" || briefRange === "last-year") {
      const year = today.getFullYear() - (briefRange === "last-year" ? 1 : 0);
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31);
    }

    return itemDate >= start && itemDate <= end;
  };

  const briefClients = clients.filter((c) => {
    if (briefRange === "all") return true;
    const hasMatchingLedger = c.ledger.some((l) =>
      filterByBriefTime(l.dueDate),
    );
    const hasMatchingDocs = c.documents.some((d) =>
      filterByBriefTime(d.timestamp),
    );
    return hasMatchingLedger || hasMatchingDocs;
  });

  const totalPortfolioValue = briefClients.reduce(
    (sum, c) => sum + c.paid + c.outstanding,
    0,
  );

  const valueAtRisk = briefClients.reduce((sum, c) => sum + c.overdue, 0);

  const briefApprovals = approvals.filter((a) => {
    if (briefRange === "all") return true;
    return !a.clientCode || briefClients.some((c) => c.code === a.clientCode);
  });

  const lateClients = briefClients.filter(
    (c) => c.paymentStatus === "Late" || c.paymentStatus === "Missed",
  );

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getDisplayRangeText = () => {
    if (briefRange === "custom") {
      if (!customStart || !customEnd) return "Custom Range Selection";
      const fmt = (dStr: string) =>
        new Date(dStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      return `${fmt(customStart)} to ${fmt(customEnd)}`;
    }
    if (briefRange === "specific-date") {
      return specificDate
        ? new Date(`${specificDate}T00:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Select a Date";
    }
    return (
      rangeOptions.find((option) => option.value === briefRange)?.label ||
      "All time"
    );
  };

  const lateClient = lateClients[0];
  const overduePercent =
    totalPortfolioValue > 0
      ? ((valueAtRisk / totalPortfolioValue) * 100).toFixed(1)
      : "0.0";

  const collectionsWarning = lateClient
    ? `Collections warning: Overdue amount stands at ${overduePercent}% of assets. Sarah Jenkins has been assigned to contact ${lateClient.name} regarding outstanding ledger balance and overdue credit.`
    : `Collections warning: Overdue credit stands at 0.0% of assets. All active clients are currently within nominal credit tolerances.`;

  const varianceApproval = briefApprovals.find(
    (a) => a.status === "Pending" && a.title.includes("Variance"),
  );
  const budgetApproval = briefApprovals.find(
    (a) => a.status === "Pending" && a.title.includes("Budget"),
  );

  let constructionWarning = "";
  if (varianceApproval) {
    constructionWarning = `Construction block: ${varianceApproval.requestedBy} is awaiting MD authorization for Operational Variance Waiver on client ${varianceApproval.clientCode || "RC-3810"}. Approving this transition immediately triggers structural integrity code clearance.`;
  } else if (budgetApproval) {
    constructionWarning = `Construction block: ${budgetApproval.requestedBy} is awaiting MD authorization for budget increase of ${budgetApproval.cost || "+$120,000"}. Approving this transition immediately triggers site clearing and pegging layouts.`;
  } else {
    constructionWarning = `Construction block: No pending milestones require immediate executive waivers. All active plots are proceeding through structural curation phases.`;
  }

  const handleSendBrief = () => {
    toast.success("Morning portfolio brief shared with the internal team.");
  };

  const formatBriefToHtml = (text: string) => {
    const paragraphs = text.split("\n\n");
    return paragraphs
      .map((p) => {
        const lines = p.split("\n");
        const renderedLines = lines
          .map((line) => {
            const trimmed = line.trim();
            const isBullet =
              trimmed.startsWith("- ") || trimmed.startsWith("* ");
            const rawContent = isBullet ? trimmed.slice(2) : trimmed;
            const htmlContent = rawContent.replace(
              /\*\*(.*?)\*\*/g,
              "<strong>$1</strong>",
            );
            return isBullet
              ? `<li>${htmlContent}</li>`
              : `<p>${htmlContent}</p>`;
          })
          .join("");
        if (renderedLines.includes("<li>")) {
          return `<ul>${renderedLines}</ul>`;
        }
        return renderedLines;
      })
      .join("");
  };

  const handleDownload = (format: "pdf" | "docx" | "csv") => {
    const rangeText = getDisplayRangeText();
    const rawBriefContent = serverBriefing?.body
      ? serverBriefing.body
      : `OPERATIONAL HIGHLIGHTS:\n- ${collectionsWarning}\n- ${constructionWarning}`;

    const filenameBase = `rolad_ai_brief_${role.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${rangeText.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    if (format === "csv") {
      const cleanSummary = rawBriefContent.replace(/"/g, '""');
      const csvContent =
        "\uFEFF" +
        `"Metric","Details"\n` +
        `"Report Title","Rolad Properties AI Morning Brief"\n` +
        `"Role","${role}"\n` +
        `"Date","${formattedDate}"\n` +
        `"Period","${rangeText}"\n` +
        `"AI Brief Content","${cleanSummary}"\n`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filenameBase}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully for Excel!");
      setShowDownloadMenu(false);
      return;
    }

    const htmlBody = formatBriefToHtml(rawBriefContent);
    const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Rolad Ops AI Brief - ${role}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 30px; color: #1a202c; line-height: 1.6; background-color: #ffffff; }
  .header { border-bottom: 2.5px solid #0d5c63; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { color: #0d5c63; font-size: 20pt; margin: 0 0 6px 0; font-family: Georgia, serif; }
  .meta-box { background: #f0f7f7; border: 1px solid #cce3e5; border-left: 4px solid #0d5c63; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 10pt; color: #2d3748; }
  .meta-box td { padding: 3px 12px 3px 0; }
  .content { font-size: 11pt; color: #2d3748; }
  .content p { margin: 0 0 12px 0; }
  .content strong { color: #0d5c63; font-weight: bold; }
  .content ul { margin: 8px 0 16px 20px; padding: 0; }
  .content li { margin-bottom: 6px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #718096; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <h1>ROLAD PROPERTIES — AI MORNING BRIEF</h1>
  </div>
  <table class="meta-box" width="100%">
    <tr>
      <td><strong>Role Scoped:</strong> ${role}</td>
      <td><strong>Generated Date:</strong> ${formattedDate}</td>
      <td><strong>Reporting Period:</strong> ${rangeText}</td>
    </tr>
  </table>
  <div class="content">
    ${htmlBody}
  </div>
  <div class="footer">
    Rolad Properties Executive Operations Engine • Confidential Report
  </div>
</body>
</html>`;

    if (format === "docx") {
      const blob = new Blob([docHtml], {
        type: "application/msword;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filenameBase}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Word Document (.doc) downloaded successfully!");
      setShowDownloadMenu(false);
      return;
    }

    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          docHtml +
            `<script>window.onload = function() { window.print(); };</script>`,
        );
        printWindow.document.close();
        toast.success("PDF print dialog opened! Choose 'Save as PDF'.");
      } else {
        const blob = new Blob([docHtml], { type: "text/html;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filenameBase}.html`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("HTML Brief downloaded (Print to PDF ready)!");
      }
      setShowDownloadMenu(false);
      return;
    }
  };

  const renderDrawer = () => (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/60 backdrop-blur-sm animate-fade-in min-h-screen">
      <div className="bg-white border-l border-border-warm h-full max-w-xl w-full shadow-2xl p-8 flex flex-col justify-between animate-slide-in relative">
        <button
          onClick={() => setShowDrawer(false)}
          className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1.5 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-border-warm/60">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-brand-teal">
                Morning Portfolio Summary
              </h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal">
              {role}
            </span>
          </div>

          <div className="rounded-xl border border-brand-teal/15 bg-brand-teal/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block flex-1">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-brand-teal">
                  Briefing period
                </span>
                <Select
                  options={rangeOptions}
                  value={briefRange}
                  onChange={(value) => setBriefRange(value as TimeRangeValue)}
                  className="w-full"
                  ariaLabel="Filter portfolio brief by time range"
                />
              </label>
              <p className="text-[10px] font-semibold text-slate-500 sm:pb-2">
                Showing:{" "}
                <span className="text-slate-800">{getDisplayRangeText()}</span>
              </p>
            </div>

            {briefRange === "custom" && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-brand-teal/10 pt-4 sm:grid-cols-2">
                <label className="text-[10px] font-bold text-slate-600">
                  <span className="mb-1.5 block">From date</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
                  />
                </label>
                <label className="text-[10px] font-bold text-slate-600">
                  <span className="mb-1.5 block">To date</span>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
                  />
                </label>
              </div>
            )}

            {briefRange === "specific-date" && (
              <label className="mt-4 block border-t border-brand-teal/10 pt-4 text-[10px] font-bold text-slate-600">
                <span className="mb-1.5 block">Briefing date</span>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(event) => setSpecificDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
                />
              </label>
            )}
          </div>

          {/* Brief Contents */}
          <div className="space-y-6 text-xs text-charcoal leading-relaxed font-medium">
            {isBriefingLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : serverBriefing?.body !== undefined ? (
              <div className="bg-brand-teal/5 p-4 rounded-xl border border-brand-teal/15 space-y-3">
                <h4 className="font-serif text-sm font-bold text-brand-teal uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-teal" />
                  Role Summary Synthesis (
                  {serverBriefing?.date || formattedDate})
                </h4>
                {renderMarkdown(serverBriefing.body)}
              </div>
            ) : (
              <div className="bg-brand-teal/5 p-4 rounded-xl border border-brand-teal/15 space-y-3">
                <h4 className="font-serif text-sm font-bold text-brand-teal uppercase tracking-wide">
                  Role Summary Synthesis
                </h4>
                <p>{collectionsWarning}</p>
                <p>{constructionWarning}</p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Action Suite with Download options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border-warm mt-8">
          <div className="relative">
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4 text-charcoal shrink-0" />}
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2"
            >
              Convert & Download
            </Button>
            {showDownloadMenu && (
              <div className="absolute bottom-12 left-0 w-44 bg-white border border-border-warm rounded-lg shadow-lg z-50 py-1 overflow-hidden animate-scale-up">
                <button
                  onClick={() => handleDownload("docx")}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs text-charcoal font-bold uppercase transition-colors cursor-pointer"
                >
                  .DOC Word File
                </button>
                <button
                  onClick={() => handleDownload("pdf")}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs text-charcoal font-bold uppercase transition-colors cursor-pointer"
                >
                  .PDF Document
                </button>
                <button
                  onClick={() => handleDownload("csv")}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs text-charcoal font-bold uppercase transition-colors cursor-pointer"
                >
                  .CSV Excel File
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDrawer(false)}
              className="py-2 px-4 rounded-lg text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === "floating-button") {
    return (
      <>
        <div className="fixed bottom-7 right-7 z-40 animate-fade-in select-none">
          <button
            onClick={() => setShowDrawer(true)}
            className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-[#095646] p-2.5 pr-4 text-left text-white shadow-[0_18px_45px_rgba(9,86,70,0.28)] hover:-translate-y-1 hover:bg-brand-teal cursor-pointer"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12 ring-1 ring-white/15">
              <Eye className="h-4.5 w-4.5" />
            </span>
            <span className="flex flex-col">
              <span className="text-xs font-bold leading-none">
                View Portfolio Brief
              </span>
              <span className="mt-1.5 text-[9px] font-medium text-white/60">
                Collections, clients and site delivery
              </span>
            </span>
          </button>
        </div>
        {showDrawer && renderDrawer()}
      </>
    );
  }

  return (
    <div className="bg-brand-teal/5 border border-brand-teal/15 p-7 rounded-2xl shadow-sm relative overflow-hidden space-y-6 select-none animate-scale-up">
      <div className="absolute right-0 top-0 w-96 h-96 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-3.5 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[9px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span>Morning Brief Engine</span>
          </div>

          <Select
            options={rangeOptions}
            value={briefRange}
            onChange={(val) => setBriefRange(val as TimeRangeValue)}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-brand-teal tracking-wide">
              Morning Brief
            </h2>
            <p className="text-muted-gray text-xs font-semibold mt-1">
              Generated on-schedule • Period: {getDisplayRangeText()}
            </p>
          </div>
        </div>
      </div>

      {briefRange === "custom" && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-border-warm shadow-sm select-none max-w-md animate-scale-up relative z-10">
          <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">
            Custom Range:
          </span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2.5 py-1 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
          />
          <span className="text-xs text-muted-gray font-medium">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2.5 py-1 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
          />
        </div>
      )}

      {briefRange === "specific-date" && (
        <div className="relative z-10 flex max-w-sm items-center gap-3 rounded-xl border border-border-warm bg-white p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
            Briefing date:
          </span>
          <input
            type="date"
            value={specificDate}
            onChange={(event) => setSpecificDate(event.target.value)}
            className="rounded border border-border-warm bg-white px-2.5 py-1 text-xs font-medium text-charcoal outline-none focus:border-brand-teal"
          />
        </div>
      )}

      {/* Greeting message */}
      <p className="text-xs text-charcoal font-medium relative z-10">
        Good morning, <span className="font-bold">{role}</span>. Here is your
        synthesized Morning Brief for{" "}
        <span className="text-brand-teal font-bold">
          {getDisplayRangeText()}
        </span>
        .
      </p>

      {/* Brief Preview Body */}
      <div className="bg-white/80 p-4 rounded-xl border border-brand-teal/15 space-y-2 relative z-10">
        <span className="text-[10px] uppercase font-bold text-brand-teal tracking-wider block">
          Portfolio Briefing:
        </span>
        {isBriefingLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          renderMarkdown(
            serverBriefing?.body !== undefined
              ? serverBriefing.body
              : `${collectionsWarning}\n\n${constructionWarning}`,
          )
        )}
      </div>

      <div className="border-t border-brand-teal/15" />

      {/* Action Suite */}
      <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10">
        <Button
          variant="primary"
          icon={<Eye className="w-4 h-4 text-white shrink-0" />}
          onClick={() => setShowDrawer(true)}
          className="bg-brand-teal text-white hover:bg-brand-teal/95 font-bold text-xs py-2 px-4 shadow-sm rounded-lg flex items-center gap-2"
        >
          View Full Brief
        </Button>

        <div className="relative">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4 text-charcoal shrink-0" />}
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 shadow-sm rounded-lg flex items-center gap-2"
          >
            Download Brief
          </Button>
          {showDownloadMenu && (
            <div className="absolute mt-2 w-44 bg-white border border-border-warm rounded-lg shadow-lg z-50 py-1 overflow-hidden animate-scale-up">
              <button
                onClick={() => handleDownload("docx")}
                className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs text-charcoal font-bold uppercase transition-colors cursor-pointer"
              >
                .DOC Word File
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs text-charcoal font-bold uppercase transition-colors cursor-pointer"
              >
                .PDF Document
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs text-charcoal font-bold uppercase transition-colors cursor-pointer"
              >
                .CSV Excel File
              </button>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          icon={<Send className="w-4 h-4 text-charcoal shrink-0" />}
          onClick={handleSendBrief}
          className="bg-neutral-100 hover:bg-neutral-200 border-none font-bold text-xs py-2 px-4 shadow-sm rounded-lg flex items-center gap-2"
        >
          Send Brief
        </Button>
      </div>

      {showDrawer && renderDrawer()}
    </div>
  );
}
