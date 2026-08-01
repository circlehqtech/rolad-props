import client from "../client";

export interface StaffListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleCode: string;
  roleLabel: string;
  status: "active" | "on_leave" | "suspended";
  joinedDate?: string;
  appraisalStatus: string;
  appraisalRating?: number;
  leaveBalanceDays: number;
  onboardingDocs: Record<string, boolean>;
}

export interface CreateStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleCode: string;
  joinedDate?: string;
}

export interface AppraisalPayload {
  appraisalStatus: string;
  appraisalRating: number;
}

export interface LeavePayload {
  startDate: string;
  endDate: string;
  reason: string;
}

// Fetchers
export const getHrStaffList = () =>
  client.get<any, StaffListItem[]>("/hr/staff");

export const createHrStaff = (payload: CreateStaffPayload) =>
  client.post<any, StaffListItem>("/hr/staff", payload);

export const updateHrStaffAppraisal = (id: string, payload: AppraisalPayload) =>
  client.patch<any, any>(`/hr/staff/${id}/appraisal`, payload);

export const requestHrLeave = (payload: LeavePayload) =>
  client.post<any, any>("/hr/leave", payload);

export const patchHrLeaveStatus = (id: string, status: "Approved" | "Rejected") =>
  client.patch<any, any>(`/hr/leave/${id}`, { status });

export const patchHrStaffOnboardingDoc = (id: string, docKey: string, status: boolean) =>
  client.patch<any, any>(`/hr/staff/${id}/onboarding/${docKey}`, { status });
