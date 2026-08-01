import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useClientsList } from "../../features/clients/hooks/useClients";
import { formatNaira } from "../../shared/money";
import { paymentStatusMeta } from "../../shared/paymentStatus";
import Button from "../../components/Button";
import Select from "../../components/Select";
import Skeleton from "../../components/Skeleton";
import PageHeader from "../../components/PageHeader";
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function Clients() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  // Role permissions checks
  const isMarketing = role === "Marketing Officer";
  const canAddClient =
    role === "Administrator" || role === "Client Relations Officer";

  // Filter States
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("q") || "",
  );
  const [productFilter, setProductFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const productFilterCode =
    productFilter === "Land & Property"
      ? "land_property"
      : productFilter === "Investment"
        ? "investment"
        : undefined;

  // Query live API list with TanStack query
  const { data: clientsResponse, isLoading } = useClientsList({
    q: searchTerm || undefined,
    productType: productFilterCode,
    stage: stageFilter === "All" ? undefined : stageFilter,
    paymentStatus: paymentFilter === "All" ? undefined : paymentFilter,
  });

  const clients = clientsResponse?.data || [];

  return (
    <div className="property-page space-y-6 pb-10 select-none">
      <PageHeader
        section="Clients"
        title="Client Portfolio"
        description="Searchable directory and compliance history for active properties and investment portfolios."
        actions={
          canAddClient ? (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate("/intake")}
            >
              Register Client
            </Button>
          ) : undefined
        }
      />

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-warm/60">
          <Filter className="w-4.5 h-4.5 text-brand-teal" />
          <h2 className="text-xs font-bold text-brand-teal uppercase tracking-wider">
            Granular Query Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="px-3 bg-white rounded border border-border-warm flex items-center gap-2 w-full">
            <Search className="w-4 h-4 text-muted-gray" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-charcoal py-1.5 text-xs placeholder:text-muted-gray/70"
              placeholder="Search by client or code..."
            />
          </div>
          {/* Product Type Filter */}
          <div className="w-full sm:w-auto">
            <Select
              options={[
                { value: "All", label: "Product Type: All" },
                { value: "Land & Property", label: "Land & Property" },
                { value: "Investment", label: "Investment" },
              ]}
              value={productFilter}
              onChange={setProductFilter}
              className="w-full"
            />
          </div>
          {/* Journey Stage Filter */}
          <div className="w-full sm:w-auto">
            <Select
              options={[
                { value: "All", label: "Journey Stage: All" },
                { value: "LP_PAYMENT_SETUP", label: "LP Payment & Setup" },
                { value: "LP_DOCUMENT_COLLECTION", label: "LP Doc Collection" },
                { value: "LP_SURVEY_VERIFICATION", label: "LP Survey Verification" },
                { value: "LP_ALLOCATION", label: "LP Allocation" },
                { value: "LP_BUILDING", label: "LP Building" },
                { value: "LP_COMPLETION", label: "LP Completion" },
                { value: "INV_PAYMENT_SETUP", label: "INV Payment & Setup" },
                { value: "INV_DOCUMENT_COLLECTION", label: "INV Doc Collection" },
                { value: "INV_ACTIVATED", label: "INV Activated" },
                { value: "INV_PAYOUT_CYCLE", label: "INV ROI Payout" },
                { value: "INV_MATURITY", label: "INV Maturity" },
              ]}
              value={stageFilter}
              onChange={setStageFilter}
              className="w-full"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="w-full sm:w-auto">
            <Select
              options={[
                { value: "All", label: "Payment Status: All" },
                { value: "ON_TRACK", label: "On Track" },
                { value: "DUE_SOON", label: "Due Soon" },
                { value: "LATE", label: "Late" },
                { value: "MISSED", label: "Missed" },
              ]}
              value={paymentFilter}
              onChange={setPaymentFilter}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Tabular Matrix */}
      <div className="bg-white border border-border-warm rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
          <h2 className="font-serif text-lg font-bold text-brand-teal">
            Client Directory List
          </h2>
          <span className="text-[9px] font-bold text-brand-teal bg-brand-teal/5 px-2.5 py-1 rounded">
            {clients.length} DIRECTORY ENTRIES
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <table className="rolad-table">
              <thead>
                <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                  <th className="px-6 py-3">Client Code</th>
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Product Type</th>
                  <th className="px-6 py-3">Estate / Land Plot</th>
                  <th className="px-6 py-3">Closure Agent</th>
                  <th className="px-6 py-3">Journey Stage</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border-warm/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-12 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-gray/40 mx-auto mb-2" />
              <p className="text-xs text-muted-gray font-medium">
                No matching clients found in directory.
              </p>
            </div>
          ) : (
            <table className="rolad-table">
              <thead>
                <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                  <th className="px-6 py-3">Client Code</th>
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Product Type</th>
                  <th className="px-6 py-3">Journey Stage</th>
                  {!isMarketing && (
                    <>
                      <th className="px-6 py-3">Paid</th>
                      <th className="px-6 py-3">Outstanding</th>
                      <th className="px-6 py-3">Payment Status</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                {clients.map((client) => {
                  const statusMeta = paymentStatusMeta(client.paymentStatus as any);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-neutral-50/50 transition-all duration-150 group"
                    >
                      <td className="px-6 py-4 font-mono text-[11px] text-muted-gray font-semibold">
                        {client.clientCode}
                      </td>
                      <td className="px-6 py-4">
                        {/* URL routing to client profile pushes human clientCode RC-xxxx per §11.10 */}
                        <Link
                          to={`/clients/${client.clientCode}`}
                          className="font-serif font-bold text-charcoal hover:text-brand-teal hover:underline transition-colors block text-sm"
                        >
                          {client.fullName}
                        </Link>
                        <span className="text-[10px] text-muted-gray mt-0.5 block">
                          {client.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-muted-gray">
                        {client.productTypeLabel}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block text-[9px] font-bold text-brand-teal bg-brand-teal/5 px-2.5 py-0.5 rounded font-mono">
                          {client.currentStageLabel}
                        </span>
                      </td>
                      {!isMarketing && (
                        <>
                          <td className="px-6 py-4 font-semibold text-brand-olive">
                            {formatNaira(client.paidKobo)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-charcoal">
                            {formatNaira(client.outstandingKobo)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[9px] ${statusMeta.bg} ${statusMeta.textClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/clients/${client.clientCode}`}
                          className="inline-flex items-center gap-1.5 font-bold text-brand-teal hover:underline text-[11px]"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
