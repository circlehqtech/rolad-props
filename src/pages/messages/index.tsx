import { useState } from "react";
import { useGlobalMessages } from "../../features/clients/hooks/useMessages";
import type { ClientMessageDto } from "../../api/endpoints/messages";
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";
import Skeleton from "../../components/Skeleton";
import { formatLabel } from "../../utils/formatters";

export default function MessagesPage() {
  const { data, isLoading } = useGlobalMessages();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const rawMessages = data?.data || [];

  const filteredMessages = rawMessages.filter((msg: ClientMessageDto) => {
    const matchesSearch =
      msg.clientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.finalContent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.messageType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || msg.status === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "sent":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-status-good bg-status-good/10 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            {formatLabel(status)}
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-olive bg-brand-olive/10 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-status-missed bg-status-missed/10 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-muted-gray bg-neutral-100 px-2 py-0.5 rounded-full">
            {formatLabel(status) || "Unknown"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-teal" />
            <h1 className="font-serif text-2xl font-bold text-charcoal tracking-wide">
              Client Communication Register
            </h1>
          </div>
          <p className="text-muted-gray text-xs mt-1">
            Review client emails, WhatsApp updates, allocation notices and payment reminders.
          </p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-border-warm p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-gray absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter messages or client code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border-warm rounded-lg text-xs outline-none focus:border-brand-teal bg-neutral-50/50 text-charcoal font-medium"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {["all", "draft", "sent", "delivered", "failed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterType(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filterType === st
                  ? "bg-brand-teal text-white shadow-sm"
                  : "bg-neutral-100 text-muted-gray hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-border-warm rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
          <h2 className="font-serif text-base font-bold text-brand-teal flex items-center gap-2">
            Outgoing Client Messages
          </h2>
          <span className="text-[10px] font-bold text-muted-gray">
            TOTAL: {filteredMessages.length} RECORDS
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-muted-gray">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-brand-teal" />
            <p className="text-sm font-semibold">
              No message dispatches found matching your filters.
            </p>
            <p className="text-xs mt-1">
              Generated client messages and notices will appear here
              automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="rolad-table">
              <thead>
                <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                  <th className="px-6 py-3">Client Ref</th>
                  <th className="px-6 py-3">Type & Channel</th>
                  <th className="px-6 py-3">Message Content</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                {filteredMessages.map((msg: ClientMessageDto) => (
                  <tr
                    key={msg.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-brand-teal">
                      {msg.clientId || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <div>{formatLabel(msg.messageType)}</div>
                      <div className="text-[10px] text-muted-gray uppercase tracking-wider mt-0.5">
                        {formatLabel(msg.channel)}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="line-clamp-2 text-charcoal font-medium text-xs">
                        {msg.body || msg.finalContent || msg.aiDraft}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>
                    <td className="px-6 py-4 font-mono text-muted-gray text-[11px]">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
