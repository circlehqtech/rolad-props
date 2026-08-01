import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  useHrStaffList,
  useUpdateHrStaffAppraisalMutation,
  usePatchHrLeaveStatusMutation,
} from "../../shared/hooks/useLiveQueries";
import Skeleton from "../../components/Skeleton";
import Button from "../../components/Button";
import Select from "../../components/Select";
import { toast } from "../../utils/toast";
import {
  Users,
  Briefcase,
  Calendar,
  CheckCircle,
  FileText,
  Star,
  Plus,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function HR() {
  const { user } = useAuthStore();
  const role = user?.role || "MD / CEO";

  // Live queries & mutations
  const { data: staffList = [], isLoading: isStaffLoading } = useHrStaffList();
  const appraisalMutation = useUpdateHrStaffAppraisalMutation();
  const leaveMutation = usePatchHrLeaveStatusMutation();

  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [appraisalRating, setAppraisalRating] = useState(4);
  const [appraisalNotes, setAppraisalNotes] = useState("");

  // Map API personnel response to compatibility shapes
  const employees = staffList.map((s: any) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    role: s.roleLabel,
    email: s.email,
    status:
      s.status === "active"
        ? "Active"
        : s.status === "on_leave"
          ? "On Leave"
          : "Suspended",
    appraisal: s.appraisalStatus || "Awaiting Evaluation",
    leaveBalance: s.leaveBalanceDays || 20,
    onboardingDocs: s.onboardingDocs || {},
  }));

  // Reconcile pending leave requests from personnel status fields
  const leaveRequests = staffList
    .filter((s: any) => s.status === "on_leave")
    .map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      role: s.roleLabel,
      type: "Annual Paid Leave",
      days: 10,
    }));

  const handleAppraisalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    appraisalMutation.mutate(
      {
        id: selectedEmployee,
        appraisalStatus: appraisalNotes || "Evaluated",
        appraisalRating,
      },
      {
        onSuccess: () => {
          const empName =
            employees.find((emp) => emp.id === selectedEmployee)?.name ||
            "Employee";
          toast.success(`Appraisal log recorded for ${empName}`);
          setSelectedEmployee(null);
          setAppraisalNotes("");
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to update appraisal.");
        },
      },
    );
  };

  const handleLeaveAction = (
    id: string,
    name: string,
    status: "Approved" | "Rejected",
  ) => {
    leaveMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success(`Leave request for ${name} has been ${status}.`);
        },
        onError: (err: any) => {
          toast.error(err.messages?.[0] || "Failed to log leave status.");
        },
      },
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-brand-teal tracking-wide">
            HR Command & Staff Registry
          </h1>
          <p className="text-muted-gray text-sm mt-1">
            Centralized register of active personnel, leave schedules, and
            performance evaluations.
          </p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Staff Directory Registry */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-border-warm rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-warm bg-neutral-50/50 flex justify-between items-center">
              <h2 className="font-serif text-lg font-bold text-brand-teal">
                Internal Employee Registry
              </h2>
              <span className="text-[9px] font-bold text-brand-teal bg-brand-teal/5 px-2.5 py-1 rounded">
                {employees.length} TOTAL STAFF
              </span>
            </div>

            <div className="overflow-x-auto text-left">
              {isStaffLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-20 text-xs italic text-muted-gray">
                  No employee profiles registered.
                </div>
              ) : (
                <table className="rolad-table">
                  <thead>
                    <tr className="border-b border-border-warm text-[10px] font-bold text-muted-gray uppercase tracking-wider bg-neutral-50/30">
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Latest Appraisal</th>
                      <th className="px-6 py-3 text-right">Leaves</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm text-xs text-charcoal font-medium">
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-charcoal block">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-muted-gray mt-0.5 block">
                            {emp.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-gray">
                          {emp.role}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                              emp.status === "Active"
                                ? "text-brand-olive bg-brand-olive/10"
                                : emp.status === "On Leave"
                                  ? "text-brand-teal bg-brand-teal/10"
                                  : "text-status-late bg-status-late/10"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-gray italic">
                          {emp.appraisal}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {emp.leaveBalance} days remaining
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Action widgets */}
        <div className="space-y-8 text-left">
          {/* Appraisal form widget */}
          <div className="bg-white border border-border-warm p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-warm/60">
              <Star className="w-5 h-5 text-brand-teal" />
              <h2 className="font-serif text-base font-bold text-brand-teal">
                Personnel Appraisal Center
              </h2>
            </div>
            <p className="text-xs text-muted-gray leading-normal">
              Conduct performance logs and file evaluations for active staff.
            </p>

            <form
              onSubmit={handleAppraisalSubmit}
              className="space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                  Select Staff
                </label>
                <Select
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                  }))}
                  value={selectedEmployee || ""}
                  onChange={setSelectedEmployee}
                  className="w-full font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                  Appraisal Score (1-5 Stars)
                </label>
                <Select
                  options={[
                    { value: "5", label: "5 Stars (Exceptional)" },
                    { value: "4", label: "4 Stars (Strong)" },
                    { value: "3", label: "3 Stars (Meets Expectation)" },
                    { value: "2", label: "2 Stars (Needs Improvement)" },
                    { value: "1", label: "1 Star (Unsatisfactory)" },
                  ]}
                  value={appraisalRating.toString()}
                  onChange={(val) => setAppraisalRating(parseInt(val))}
                  className="w-full font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-muted-gray block mb-1">
                  Appraisal Evaluation Notes
                </label>
                <textarea
                  required
                  placeholder="Record summary feedback logs..."
                  value={appraisalNotes}
                  onChange={(e) => setAppraisalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white h-24 font-medium"
                />
              </div>

              <Button
                type="submit"
                disabled={!selectedEmployee}
                className="w-full bg-brand-teal text-white hover:bg-brand-teal/95 font-bold text-xs py-2 rounded"
              >
                File Appraisal Rating
              </Button>
            </form>
          </div>

          {/* Leave approvals queue widget */}
          <div className="bg-white border border-border-warm p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border-warm/60">
              <Calendar className="w-5 h-5 text-brand-teal" />
              <h2 className="font-serif text-base font-bold text-brand-teal">
                Leave Approvals Matrix
              </h2>
            </div>

            <div className="space-y-3 max-h-62.5 overflow-y-auto pr-1">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-6 text-xs italic text-muted-gray flex flex-col justify-center items-center">
                  <CheckCircle className="w-10 h-10 text-brand-olive/20 mb-2" />
                  Leave registry clear.
                </div>
              ) : (
                leaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-border-warm rounded-lg p-3 bg-neutral-50/50 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start font-bold">
                      <div>
                        <h4 className="text-charcoal font-serif">{req.name}</h4>
                        <p className="text-[9px] text-muted-gray mt-0.5 uppercase tracking-wide">
                          {req.role}
                        </p>
                      </div>
                      <span className="text-[9px] bg-brand-teal/5 text-brand-teal px-2 py-0.5 rounded">
                        {req.days} Days Requested
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-border-warm/60">
                      <button
                        onClick={() =>
                          handleLeaveAction(req.id, req.name, "Rejected")
                        }
                        className="flex-1 py-1 text-[10px] font-bold text-status-missed bg-status-missed/5 hover:bg-status-missed/10 rounded cursor-pointer border-none"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          handleLeaveAction(req.id, req.name, "Approved")
                        }
                        className="flex-1 py-1 text-[10px] font-bold text-white bg-brand-teal hover:bg-brand-teal/95 rounded cursor-pointer border-none"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
