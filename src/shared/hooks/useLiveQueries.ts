import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as dbApi from "../../api/endpoints/dashboard";
import * as acApi from "../../api/endpoints/accounts";
import * as hrApi from "../../api/endpoints/hr";
import * as adminApi from "../../api/endpoints/admin";

// ==========================================
// 1. Dashboard Query Hooks
// ==========================================
export function useDashboardKpis(enabled: boolean = true) {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: () => dbApi.getDashboardKpis(),
    enabled,
  });
}

export function useGlobalActivity(enabled: boolean = true) {
  return useQuery({
    queryKey: ["global-activity"],
    queryFn: () => dbApi.getGlobalActivity(),
    enabled,
  });
}

export function useActionItems(type: "missing-documents" | "stage-changed" | "incomplete-records" | "allocation-status", enabled: boolean = true) {
  return useQuery({
    queryKey: ["action-items", type],
    queryFn: () => dbApi.getActionItems(type),
    enabled,
  });
}

export function useStageDistribution(enabled: boolean = true) {
  return useQuery({
    queryKey: ["stage-distribution"],
    queryFn: () => dbApi.getStageDistribution(),
    enabled,
  });
}

export function useDashboardBriefing(
  params?: dbApi.DashboardBriefingParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["dashboard-briefing", params],
    queryFn: () => dbApi.getBriefing(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 24 * 60 * 60 * 1000, // 24h garbage collection
    retry: 1, // fallback response is valid 200
  });
}

export function useAccountsRevenue(
  params?: acApi.AccountsRevenueParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["accounts-revenue", params],
    queryFn: () => acApi.getAccountsRevenue(params),
    enabled,
  });
}

export function useAccountRevenue(id?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["accounts-revenue-detail", id],
    queryFn: () => acApi.getAccountRevenueById(id as string),
    enabled: enabled && Boolean(id),
  });
}

// ==========================================
// 2. Notifications Hooks (Polling 30s)
// ==========================================
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => dbApi.getNotifications(),
    refetchInterval: 30 * 1000, // Poll every 30s per §10 instructions
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dbApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });
}

// ==========================================
// 3. Approvals Hooks (Management page overrides)
// ==========================================
export function useApprovals(
  status: "pending" | "approved" | "rejected" | "all" | string = "pending",
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["approvals-list", status],
    queryFn: () => dbApi.getApprovals(status),
    enabled,
  });
}

export function useSubmitApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: dbApi.SubmitApprovalPayload) =>
      dbApi.submitApproval(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useApproveItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      dbApi.approveItem(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
    },
  });
}

export function useRejectItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      dbApi.rejectItem(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals-list"] });
    },
  });
}

// ==========================================
// 4. Accounts Query Hooks
// ==========================================
export function useAccountsKpis(enabled: boolean = true) {
  return useQuery({
    queryKey: ["accounts-kpis"],
    queryFn: () => acApi.getAccountsKpis(),
    enabled,
  });
}

export function useAccountsLedger(
  params?: { paymentStatus?: string; sortBy?: string },
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["accounts-ledger", params],
    queryFn: () => acApi.getAccountsLedger(params),
    enabled,
  });
}

export function useRiskRegister(enabled: boolean = true) {
  return useQuery({
    queryKey: ["risk-register"],
    queryFn: () => acApi.getRiskRegister(),
    enabled,
  });
}

export function useAccountsCommissions(enabled: boolean = true) {
  return useQuery({
    queryKey: ["accounts-commissions"],
    queryFn: () => acApi.getAccountsCommissions(),
    enabled,
  });
}

export function useAccountsRoiPayouts(enabled: boolean = true) {
  return useQuery({
    queryKey: ["accounts-roi-payouts"],
    queryFn: () => acApi.getAccountsRoiPayouts(),
    enabled,
  });
}

// ==========================================
// 5. Sales Query Hooks
// ==========================================
export function useSalesKpis(enabled: boolean = true) {
  return useQuery({
    queryKey: ["sales-kpis"],
    queryFn: () => acApi.getSalesKpis(),
    enabled,
  });
}

export function useSalesLeaderboard(enabled: boolean = true) {
  return useQuery({
    queryKey: ["sales-leaderboard"],
    queryFn: () => acApi.getSalesLeaderboard(),
    enabled,
  });
}

export function useSalesCommissions(enabled: boolean = true) {
  return useQuery({
    queryKey: ["sales-commissions"],
    queryFn: () => acApi.getSalesCommissions(),
    enabled,
  });
}

// ==========================================
// 6. Marketing Query Hooks
// ==========================================
export function useMarketingSummary(enabled: boolean = true) {
  return useQuery({
    queryKey: ["marketing-summary"],
    queryFn: () => acApi.getMarketingSummary(),
    enabled,
  });
}

export function useAccountsAudits(type?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["accounts-audits", type],
    queryFn: () => acApi.getAccountsAudits(type),
    enabled,
  });
}

export function useLogAccountsAuditMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.logAccountsAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-roi-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-ledger"] });
    },
  });
}

export function useLogAccountPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.logAccountPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useLogAccountCommissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.logAccountCommission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["sales-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-kpis"] });
    },
  });
}

export function useLogAccountRoiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.logAccountRoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-roi-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-kpis"] });
    },
  });
}

export function useLogAccountRevenueMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.logAccountRevenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-kpis"] });
    },
  });
}

export function useAccountAuditById(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["account-audit-by-id", id],
    queryFn: () => acApi.getAccountAuditById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateAccountAuditStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      acApi.updateAccountAuditStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
      queryClient.invalidateQueries({ queryKey: ["account-audit-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["sales-commissions"] });
    },
  });
}

export function useReleaseSalesPayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.releaseSalesPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["sales-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-audits"] });
    },
  });
}

export function useMarketingLeads(enabled: boolean = true) {
  return useQuery({
    queryKey: ["marketing-leads"],
    queryFn: () => acApi.getMarketingLeads(),
    enabled,
  });
}

export function useMarketingCampaigns(enabled: boolean = true) {
  return useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: () => acApi.getMarketingCampaigns(),
    enabled,
  });
}

export function useCreateMarketingCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acApi.createMarketingCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-summary"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-leads"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-kpis"] });
    },
  });
}

export function useMarketingKpis(enabled: boolean = true) {
  return useQuery({
    queryKey: ["marketing-kpis"],
    queryFn: () => acApi.getMarketingKpis(),
    enabled,
  });
}



// ==========================================
// 7. HR Query Hooks
// ==========================================
export function useHrStaffList() {
  return useQuery({
    queryKey: ["hr-staff-list"],
    queryFn: () => hrApi.getHrStaffList(),
  });
}

export function useCreateHrStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrApi.createHrStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff-list"] });
    },
  });
}

export function useUpdateHrStaffAppraisalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appraisalStatus, appraisalRating }: { id: string; appraisalStatus: string; appraisalRating: number }) =>
      hrApi.updateHrStaffAppraisal(id, { appraisalStatus, appraisalRating }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff-list"] });
    },
  });
}

export function useRequestHrLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrApi.requestHrLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff-list"] });
    },
  });
}

export function usePatchHrLeaveStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Approved" | "Rejected" }) =>
      hrApi.patchHrLeaveStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff-list"] });
    },
  });
}

export function usePatchHrStaffOnboardingDocMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, docKey, status }: { id: string; docKey: string; status: boolean }) =>
      hrApi.patchHrStaffOnboardingDoc(id, docKey, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-staff-list"] });
    },
  });
}

export function useProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => dbApi.getProjects(),
    enabled,
  });
}

// ==========================================
// 6. Admin Governance Suite Query & Mutation Hooks
// ==========================================

export function useAdminLogistics(status: string = "--", enabled: boolean = true) {
  return useQuery({
    queryKey: ["admin-logistics", status],
    queryFn: () => adminApi.getAdminLogistics(status),
    enabled,
  });
}

export function useCreateAdminLogisticsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAdminLogistics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-logistics"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useUpdateAdminLogisticsStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: "approved" | "rejected"; rejectionReason?: string }) =>
      adminApi.patchAdminLogisticsStatus(id, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-logistics"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useAdminClearance(status: string = "--", enabled: boolean = true) {
  return useQuery({
    queryKey: ["admin-clearance", status],
    queryFn: () => adminApi.getAdminClearance(status),
    enabled,
  });
}

export function useCreateAdminClearanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAdminClearance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clearance"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useUpdateAdminClearanceStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: "approved" | "rejected"; rejectionReason?: string }) =>
      adminApi.patchAdminClearanceStatus(id, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clearance"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useAdminMilestoneUpdates(status: string = "--", enabled: boolean = true) {
  return useQuery({
    queryKey: ["admin-milestone-updates", status],
    queryFn: () => adminApi.getAdminMilestoneUpdates(status),
    enabled,
  });
}

export function useCreateAdminMilestoneUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAdminMilestoneUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-milestone-updates"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateAdminMilestoneStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: "approved" | "rejected"; rejectionReason?: string }) =>
      adminApi.patchAdminMilestoneStatus(id, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-milestone-updates"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
