import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  useIntakePending,
  useConfirmIntakeMutation,
  useRejectIntakeMutation,
  useCreateIntakeInternalMutation,
} from "../../features/clients/hooks/useClients";
import { uploadFile } from "../../api/endpoints/uploads";
import {
  bulkUploadClients,
  getBulkUploadTemplateBlob,
} from "../../api/endpoints/bulk-upload";
import { toast } from "../../utils/toast";
import Skeleton from "../../components/Skeleton";
import Button from "../../components/Button";
import Select from "../../components/Select";
import {
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
  X,
  Megaphone,
} from "lucide-react";

export default function Intake() {
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  // Real API TanStack hooks
  const { data: prospects = [], isLoading } = useIntakePending();
  const createIntakeMutation = useCreateIntakeInternalMutation();
  const confirmIntakeMutation = useConfirmIntakeMutation();
  const rejectIntakeMutation = useRejectIntakeMutation();

  const isAdmin = role === "Administrator";
  const isClientRelations = role === "Client Relations Officer";
  const isReadOnly = !isAdmin && !isClientRelations;
  const canUploadCSV = isAdmin || isClientRelations;

  const [idFile, setIdFile] = useState<File | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState("National ID");
  const [idNumber, setIdNumber] = useState("");
  const [productType, setProductType] = useState<
    "Land & Property" | "Investment"
  >("Land & Property");
  const [installmentProfile, setInstallmentProfile] = useState(
    "12 Months Milestone Plan",
  );
  const [estateLabel, setEstateLabel] = useState("Lekki Oceanfront Gate B");
  const [coordinates, setCoordinates] = useState("6.4290° N, 3.4250° E");
  const [campaignDetails, setCampaignDetails] = useState("");

  // Rejection modal state
  const [rejectingProspect, setRejectingProspect] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rejectProspectReason, setRejectProspectReason] = useState("");

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Access Restricted: Your role has Read-Only intake access.");
      return;
    }

    // Phone prefix validation check
    if (!phone.startsWith("+234")) {
      toast.error("Phone number must utilize the +234 country code layout.");
      return;
    }

    let idFileUrl = "";
    if (idFile) {
      try {
        toast.info("Uploading ID scan document...");
        const uploadRes = await uploadFile(idFile);
        idFileUrl = uploadRes.url;
      } catch (err: any) {
        toast.error("Failed to upload ID document scan.");
        return;
      }
    }

    toast.info("Submitting prospect lead details...");
    createIntakeMutation.mutate(
      {
        fullName: name,
        phone,
        email,
        residentialAddress: address,
        dateOfBirth: dob,
        idType,
        idNumber,
        idFileUrl: idFileUrl || undefined,
        productTypeCode:
          productType === "Land & Property" ? "land_property" : "investment",
        installmentProfile,
        estateLabel:
          productType === "Land & Property" ? estateLabel : undefined,
        coordinates:
          productType === "Land & Property" ? coordinates : undefined,
        campaignDetails: campaignDetails || "Direct Onboarding",
      },
      {
        onSuccess: () => {
          toast.success("Prospective lead submitted to verification buffer.");
          // Reset Form
          setName("");
          setPhone("");
          setEmail("");
          setAddress("");
          setDob("");
          setIdNumber("");
          setIdFile(null);
          setCampaignDetails("");
        },
        onError: (err: any) => {
          const errMsg =
            err.messages?.[0] || err.message || "Failed to submit lead.";
          toast.error(errMsg);
        },
      },
    );
  };

  const handleApproveProspect = (prospectId: string, prospectName: string) => {
    if (isReadOnly) {
      toast.error("Authorization Denied: Your role cannot approve leads.");
      return;
    }
    toast.info(`Onboarding ${prospectName}...`);
    confirmIntakeMutation.mutate(
      { id: prospectId },
      {
        onSuccess: () => {
          toast.success(
            `Client "${prospectName}" verified and onboarding initiated.`,
          );
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Verification request failed.");
        },
      },
    );
  };

  const handleRejectProspect = (id: string, name: string) => {
    if (isReadOnly) {
      toast.error(
        "Authorization Denied: Read-only access cannot reject leads.",
      );
      return;
    }
    setRejectingProspect({ id, name });
    setRejectProspectReason("");
  };

  const handleConfirmRejectProspect = () => {
    if (!rejectingProspect) return;
    const { id, name } = rejectingProspect;
    const reason =
      rejectProspectReason.trim() ||
      "Incomplete documentation / rejected during intake vetting";

    toast.info(`Rejecting ${name}...`);
    rejectIntakeMutation.mutate(
      { id, reason },
      {
        onSuccess: () => {
          toast.info(`Prospect "${name}" rejected and removed.`);
          setRejectingProspect(null);
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Rejection action failed.");
        },
      },
    );
  };

  const handleDownloadTemplate = async () => {
    try {
      toast.info("Retrieving CSV template...");
      const blob = await getBulkUploadTemplateBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "rolad_bulk_client_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV template downloaded!");
    } catch (err) {
      toast.error("Failed to fetch CSV template from server.");
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading and parsing spreadsheet...");
      const res = await bulkUploadClients(file);
      toast.success(
        `Spreadsheet processed: ${res.created} created, ${res.updated} updated.`,
      );
      if (res.errors.length > 0) {
        toast.info(
          `Note: ${res.errors.length} rows failed validation and were skipped.`,
        );
        console.error("CSV Import row errors:", res.errors);
      }
    } catch (err: any) {
      toast.error(err.messages?.[0] || err.message || "Failed to import CSV.");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-brand-teal tracking-wide">
          Add New Client Data Form
        </h1>
        <p className="text-muted-gray text-sm mt-1">
          Structured onboarding collection sheet for biometrics, marketing
          campaign details, and compliance checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white border border-border-warm rounded-lg shadow-sm p-6">
          {canUploadCSV && (
            <div className="bg-brand-teal/5 border border-brand-teal/15 p-5 rounded-lg mb-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-brand-teal/15">
                <div className="flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-brand-teal" />
                  <h3 className="font-serif text-sm font-bold text-brand-teal">
                    Bulk Client Onboarding (CSV Import)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-[10px] text-brand-teal hover:underline font-bold cursor-pointer bg-transparent border-none"
                >
                  Download CSV Template
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="flex-1 w-full border border-dashed border-brand-teal/30 hover:border-brand-teal/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-white shadow-sm">
                  <span className="font-semibold text-brand-teal text-xs text-center">
                    Click to select CSV File
                  </span>
                  <span className="text-[10px] text-muted-gray mt-0.5">
                    Accepts standard template layout
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border-warm/60">
            <FileText className="w-5 h-5 text-brand-teal" />
            <h2 className="font-serif text-lg font-bold text-brand-teal">
              Client Creation Sheet
            </h2>
          </div>

          <form onSubmit={handleIntakeSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-muted-gray" />
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alhaji Ibrahim Musa"
                    className="w-full pl-10 pr-4 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all font-medium bg-white disabled:bg-neutral-50"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Phone (e.g. +234...)
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-muted-gray" />
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full pl-10 pr-4 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all font-medium bg-white disabled:bg-neutral-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-muted-gray" />
                  <input
                    type="email"
                    required
                    disabled={isReadOnly}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@address.com"
                    className="w-full pl-10 pr-4 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all font-medium bg-white disabled:bg-neutral-50"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Date of Birth
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-muted-gray" />
                  <input
                    type="date"
                    required
                    disabled={isReadOnly}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all font-medium bg-white disabled:bg-neutral-50"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                Residential Address
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-4 h-4 text-muted-gray" />
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, Estate, LGA, State"
                  className="w-full pl-10 pr-4 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all font-medium bg-white disabled:bg-neutral-50"
                />
              </div>
            </div>

            {/* ID document upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Compliance ID Type
                </label>
                <Select
                  disabled={isReadOnly}
                  options={[
                    { value: "National ID", label: "National ID" },
                    {
                      value: "International Passport",
                      label: "International Passport",
                    },
                    { value: "Driver License", label: "Driver License" },
                    { value: "Voters Card", label: "Voters Card" },
                  ]}
                  value={idType}
                  onChange={setIdType}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="ID Number"
                  className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all bg-white disabled:bg-neutral-50"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Upload ID File (Image/PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  disabled={isReadOnly}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setIdFile(e.target.files[0]);
                  }}
                  className="w-full text-xs text-charcoal cursor-pointer mt-1"
                />
                {idFile && (
                  <p className="text-[9px] text-brand-olive font-semibold mt-1 font-mono">
                    Selected: {idFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Campaign details */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                Campaign details
              </label>
              <div className="relative flex items-center">
                <Megaphone className="absolute left-3 w-4 h-4 text-muted-gray" />
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={campaignDetails}
                  onChange={(e) => setCampaignDetails(e.target.value)}
                  placeholder="e.g. Summer Instagram Promo, Broker referral..."
                  className="w-full pl-10 pr-4 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all font-medium bg-white disabled:bg-neutral-50"
                />
              </div>
            </div>

            {/* Product configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Subscribed Product Type
                </label>
                <Select
                  disabled={isReadOnly}
                  options={[
                    { value: "Land & Property", label: "Land & Property" },
                    { value: "Investment", label: "Investment" },
                  ]}
                  value={productType}
                  onChange={(val) => setProductType(val as any)}
                  className="w-full font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                  Installment Model / Maturity Model
                </label>
                <Select
                  disabled={isReadOnly}
                  options={
                    productType === "Land & Property"
                      ? [
                          {
                            value: "12 Months Milestone Plan",
                            label: "12 Months Milestone Plan",
                          },
                          {
                            value: "24 Months Development Plan",
                            label: "24 Months Development Plan",
                          },
                          {
                            value: "Single Cash Settlement",
                            label: "Single Cash Settlement",
                          },
                        ]
                      : [
                          {
                            value: "Single Premium Growth Plan",
                            label: "Single Premium Growth Plan",
                          },
                          {
                            value: "Fixed Annuity Account (36 Months)",
                            label: "Fixed Annuity Account (36 Months)",
                          },
                          {
                            value: "Flexi Equity Trust",
                            label: "Flexi Equity Trust",
                          },
                        ]
                  }
                  value={installmentProfile}
                  onChange={setInstallmentProfile}
                  className="w-full"
                />
              </div>
            </div>

            {/* Land Allocations details (Land & Property Only) */}
            {productType === "Land & Property" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 border border-brand-teal/10 bg-brand-teal/5 rounded animate-fade-in">
                <div>
                  <label className="text-[10px] uppercase font-bold text-brand-teal tracking-wider block mb-1">
                    Estate Label Allocation
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={estateLabel}
                    onChange={(e) => setEstateLabel(e.target.value)}
                    placeholder="Lekki Gate A"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all bg-white disabled:bg-neutral-50 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-brand-teal tracking-wider block mb-1">
                    Plot Coordinates
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    placeholder="Lat, Long"
                    className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal transition-all bg-white disabled:bg-neutral-50 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            {!isReadOnly && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={createIntakeMutation.isPending}
                  className="bg-brand-teal hover:bg-brand-teal/95 font-semibold text-xs px-6 py-2 shadow-sm rounded"
                >
                  File Client Profile
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Verification Onboarding Buffer Column */}
        <div className="bg-white border border-border-warm p-6 rounded-lg shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border-warm/60 mb-4">
            <h2 className="font-serif text-base font-bold text-brand-teal">
              Onboarding Buffer
            </h2>
            <span className="text-[9px] font-bold text-brand-olive bg-brand-olive/10 px-2 py-0.5 rounded">
              {prospects.length} PENDING
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-125 pr-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-border-warm rounded-lg p-4 bg-neutral-50 space-y-3"
                >
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <div className="flex gap-2 pt-2 border-t border-border-warm/60">
                    <Skeleton className="h-7 flex-1" />
                    <Skeleton className="h-7 flex-1" />
                  </div>
                </div>
              ))
            ) : prospects.length === 0 ? (
              <div className="text-center py-10">
                <ShieldCheck className="w-10 h-10 text-brand-olive/40 mx-auto mb-2" />
                <p className="text-xs text-muted-gray font-medium">
                  Intake buffer is clear. No prospects awaiting verification.
                </p>
              </div>
            ) : (
              prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="border border-border-warm rounded-lg p-4 bg-neutral-50 space-y-3"
                >
                  <div>
                    <h3 className="font-serif text-sm font-bold text-charcoal">
                      {prospect.fullName}
                    </h3>
                    <p className="text-[10px] text-brand-teal font-semibold mt-0.5">
                      {prospect.productTypeLabel} • {prospect.idType} (
                      {prospect.idNumber})
                    </p>
                  </div>

                  <div className="text-[11px] text-muted-gray space-y-1">
                    <p>Phone: {prospect.phone}</p>
                    <p>Email: {prospect.email}</p>
                    <p>Address: {prospect.residentialAddress || "—"}</p>
                    <p>DOB: {prospect.dateOfBirth || "—"}</p>
                    <p className="text-brand-teal font-bold">
                      Campaign: {prospect.campaignDetails || "—"}
                    </p>
                    {prospect.idFileUrl && (
                      <p>
                        <a
                          href={prospect.idFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-teal font-semibold underline hover:text-brand-teal/85"
                        >
                          View ID Scanned Attachment
                        </a>
                      </p>
                    )}
                    {prospect.estateLabel && (
                      <p className="text-brand-olive font-medium">
                        Allocation: {prospect.estateLabel} (
                        {prospect.coordinates})
                      </p>
                    )}
                  </div>

                  {!isReadOnly ? (
                    <div className="flex gap-2 pt-1 border-t border-border-warm/60">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleRejectProspect(prospect.id, prospect.fullName)
                        }
                        className="flex-1 py-1 text-[10px] font-bold text-status-missed bg-status-missed/5 hover:bg-status-missed/10 border-none"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span>Block</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={confirmIntakeMutation.isPending}
                        onClick={() =>
                          handleApproveProspect(prospect.id, prospect.fullName)
                        }
                        className="flex-1 py-1 text-[10px] font-bold text-white bg-brand-teal hover:bg-brand-teal/95"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>Approve</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center pt-1.5 border-t border-border-warm/60">
                      <span className="text-[9px] font-bold text-muted-gray italic">
                        Read Only Profile Vetting
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Prospect Rejection Modal */}
      {rejectingProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-border-warm rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-xs font-semibold animate-scale-up">
            <button
              onClick={() => setRejectingProspect(null)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pb-3 border-b border-border-warm mb-4">
              <X className="w-5 h-5 text-status-missed" />
              <h3 className="font-serif text-base font-bold text-status-missed">
                Reject Prospective Lead
              </h3>
            </div>
            <p className="text-charcoal font-bold mb-1 text-sm">
              "{rejectingProspect.name}"
            </p>
            <p className="text-muted-gray mb-4">
              Please specify the rejection justification reason for declining
              this prospect:
            </p>
            <textarea
              required
              rows={3}
              value={rejectProspectReason}
              onChange={(e) => setRejectProspectReason(e.target.value)}
              placeholder="Enter rejection reason / compliance issue..."
              className="w-full p-3 border border-border-warm rounded text-charcoal outline-none focus:border-status-missed font-medium bg-white"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-border-warm mt-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setRejectingProspect(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmRejectProspect}
                isLoading={rejectIntakeMutation.isPending}
                className="bg-status-missed border-status-missed hover:bg-status-missed/95 text-white font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
