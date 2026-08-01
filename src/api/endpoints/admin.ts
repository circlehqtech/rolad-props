import client from "../client";

// ========================================================
// 1. Logistics & Allocation Types & Endpoints
// ========================================================

export interface CreateAdminLogisticsPayload {
  clientId: string;
  fuelAllowanceKobo: string;
  materialAllocations: string;
  note?: string;
}

export interface AdminLogisticsItem {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  fuelAllowanceKobo: string;
  materialAllocations: string;
  status: string; // "pending" | "approved" | "rejected"
  rejectionReason?: string;
  submittedBy?: string;
  submittedByName?: string;
  actionedBy?: string;
  actionedByName?: string;
  actionedAt?: string;
  createdAt: string;
}

export interface AdminLogisticsResponse {
  data: AdminLogisticsItem[];
}

export interface PatchAdminStatusPayload {
  status: "approved" | "rejected";
  rejectionReason?: string;
}

export const getAdminLogistics = async (status: string = "--") => {
  try {
    const params = status && status !== "--" && status !== "all" ? { status } : {};
    return await client.get<any, AdminLogisticsResponse>("/admin/logistics", { params });
  } catch (err) {
    console.warn("[MISSING ENDPOINT] GET /admin/logistics, falling back locally", err);
    throw err;
  }
};

export const createAdminLogistics = async (payload: CreateAdminLogisticsPayload) => {
  try {
    return await client.post<any, AdminLogisticsItem>("/admin/logistics", payload);
  } catch (err) {
    console.warn("[MISSING ENDPOINT] POST /admin/logistics, falling back locally", err);
    throw err;
  }
};

export const patchAdminLogisticsStatus = async (id: string, payload: PatchAdminStatusPayload) => {
  try {
    return await client.patch<any, AdminLogisticsItem>(`/admin/logistics/${id}/status`, payload);
  } catch (err) {
    console.warn(`[MISSING ENDPOINT] PATCH /admin/logistics/${id}/status, falling back locally`, err);
    throw err;
  }
};

// ========================================================
// 2. Clearance Request Types & Endpoints
// ========================================================

export interface CreateAdminClearancePayload {
  requestTitle: string;
  costOverrideKobo: string;
  clientId: string;
  details: string;
}

export interface AdminClearanceItem {
  id: string;
  requestTitle: string;
  costOverrideKobo: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  details: string;
  status: string; // "pending" | "approved" | "rejected"
  rejectionReason?: string;
  submittedBy?: string;
  submittedByName?: string;
  actionedBy?: string;
  actionedByName?: string;
  actionedAt?: string;
  createdAt: string;
}

export interface AdminClearanceResponse {
  data: AdminClearanceItem[];
}

export const getAdminClearance = async (status: string = "--") => {
  try {
    const params = status && status !== "--" && status !== "all" ? { status } : {};
    return await client.get<any, AdminClearanceResponse>("/admin/clearance", { params });
  } catch (err) {
    console.warn("[MISSING ENDPOINT] GET /admin/clearance, falling back locally", err);
    throw err;
  }
};

export const createAdminClearance = async (payload: CreateAdminClearancePayload) => {
  try {
    return await client.post<any, AdminClearanceItem>("/admin/clearance", payload);
  } catch (err) {
    console.warn("[MISSING ENDPOINT] POST /admin/clearance, falling back locally", err);
    throw err;
  }
};

export const patchAdminClearanceStatus = async (id: string, payload: PatchAdminStatusPayload) => {
  try {
    return await client.patch<any, AdminClearanceItem>(`/admin/clearance/${id}/status`, payload);
  } catch (err) {
    console.warn(`[MISSING ENDPOINT] PATCH /admin/clearance/${id}/status, falling back locally`, err);
    throw err;
  }
};

// ========================================================
// 3. Milestone Update Types & Endpoints
// ========================================================

export interface CreateAdminMilestoneUpdatePayload {
  projectId: string;
  milestone: "architectural" | "structural" | "civil";
  newStatus: "completed" | "in_progress" | "pending";
}

export interface AdminMilestoneUpdateItem {
  id: string;
  projectId: string;
  clientCode: string;
  clientName: string;
  milestone: string;
  newStatus: string;
  status: string; // "pending" | "approved" | "rejected"
  rejectionReason?: string;
  submittedBy?: string;
  submittedByName?: string;
  actionedBy?: string;
  actionedByName?: string;
  actionedAt?: string;
  createdAt: string;
}

export interface AdminMilestoneUpdatesResponse {
  data: AdminMilestoneUpdateItem[];
}

export const getAdminMilestoneUpdates = async (status: string = "--") => {
  try {
    const params = status && status !== "--" && status !== "all" ? { status } : {};
    return await client.get<any, AdminMilestoneUpdatesResponse>("/admin/milestone-updates", { params });
  } catch (err) {
    console.warn("[MISSING ENDPOINT] GET /admin/milestone-updates, falling back locally", err);
    throw err;
  }
};

export const createAdminMilestoneUpdate = async (payload: CreateAdminMilestoneUpdatePayload) => {
  try {
    return await client.post<any, AdminMilestoneUpdateItem>("/admin/milestone-update", payload);
  } catch (err) {
    console.warn("[MISSING ENDPOINT] POST /admin/milestone-update, falling back locally", err);
    throw err;
  }
};

export const patchAdminMilestoneStatus = async (id: string, payload: PatchAdminStatusPayload) => {
  try {
    return await client.patch<any, AdminMilestoneUpdateItem>(`/admin/milestone-updates/${id}/status`, payload);
  } catch (err) {
    console.warn(`[MISSING ENDPOINT] PATCH /admin/milestone-updates/${id}/status, falling back locally`, err);
    throw err;
  }
};
