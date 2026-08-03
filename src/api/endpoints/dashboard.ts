import client from "../client";

export interface DashboardKpis {
  activeClients: number;
  portfolioValueKobo: string | null;
  valueAtRiskKobo: string | null;
  pendingDocuments: number | null;
}

export interface ActionItemData {
  clientId: string;
  clientCode: string;
  fullName: string;
  detail: string;
  stageCode: string;
  stageLabel: string;
  lastActivityAt: string;
}

export interface ActionItemResponse {
  count: number;
  data: ActionItemData[];
}

export interface StageDistributionStageItem {
  stageCode: string;
  stageLabel: string;
  sortOrder: number;
  count: number;
}

export interface StageDistributionResponse {
  landProperty: StageDistributionStageItem[];
  investment: StageDistributionStageItem[];
}

export interface BriefingResponse {
  date: string;
  body: string | null;
}

export interface DashboardBriefingParams {
  timeRange?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DashboardBriefingEnvelope {
  data: BriefingResponse[];
  meta?: {
    timeRange?: string;
    date?: string;
    fromDate?: string;
    toDate?: string;
    total?: number;
  };
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  type: string;
  relatedClientId?: string;
  clientCode?: string;
  clientName?: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedByName?: string;
  createdAt: string;
  payload?: Record<string, any>;
  aiSummary?: string | null;
  cachedSummary?: string | null;
}

export interface GlobalActivityItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorStaffId: string;
  actorStaffName: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface GlobalActivityResponse {
  data: GlobalActivityItem[];
}

// Fetchers
export const getDashboardKpis = (params?: DashboardBriefingParams) =>
  client.get<any, DashboardKpis>("/dashboard/kpis", { params });

export const getGlobalActivity = async (params?: DashboardBriefingParams) => {
  try {
    return await client.get<any, GlobalActivityResponse>("/dashboard/activity", { params });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /dashboard/activity for Global Activity Feed");
      return { data: [] };
    }
    throw err;
  }
};

export const getActionItems = (
  type:
    | "missing-documents"
    | "stage-changed"
    | "incomplete-records"
    | "allocation-status",
) => client.get<any, ActionItemResponse>(`/dashboard/action-items/${type}`);

export const getStageDistribution = async () => {
  try {
    return await client.get<any, StageDistributionResponse>("/dashboard/stage-distribution");
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /dashboard/stage-distribution for Pipeline Stage Distribution");
      return { landProperty: [], investment: [] };
    }
    throw err;
  }
};

export const getDashboardBriefing = async (
  params?: DashboardBriefingParams,
): Promise<BriefingResponse | null> => {
  const response = await client.get<
    any,
    BriefingResponse | DashboardBriefingEnvelope | null
  >("/dashboard/briefing", { params });

  if (!response) return null;
  if (Array.isArray((response as DashboardBriefingEnvelope).data)) {
    return (response as DashboardBriefingEnvelope).data[0] || null;
  }
  return response as BriefingResponse;
};

export const getBriefing = getDashboardBriefing;

export const getNotifications = () =>
  client.get<any, NotificationItem[]>("/notifications");

export const markNotificationRead = (id: string) =>
  client.post<any, any>(`/notifications/${id}/read`);

export interface SubmitApprovalPayload {
  requestType: string;
  title: string;
  description?: string;
  relatedClientId?: string;
  payload?: Record<string, any>;
}

export const submitApproval = (payload: SubmitApprovalPayload) =>
  client.post<any, ApprovalItem>("/approvals/submit", payload);

export const getApprovals = (
  status: "pending" | "approved" | "rejected" | "all" | string = "pending",
) => client.get<any, ApprovalItem[]>("/approvals", { params: { status } });

export const approveItem = (id: string, reason?: string) =>
  client.post<any, any>(`/approvals/${id}/approve`, { reason });

export const rejectItem = (id: string, reason: string) =>
  client.post<any, any>(`/approvals/${id}/reject`, { reason });

// Projects API (§7)
export interface ProjectItemDto {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  plot: string;
  location: string;
  architectural: string;
  structural: string;
  civil: string;
  latestUpdateNote?: string;
  latestUpdateAt?: string;
  isComplete: boolean;
}

export interface ProjectsResponse {
  data: ProjectItemDto[];
}

export const getProjects = async () => {
  try {
    return await client.get<any, ProjectsResponse>("/projects");
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /projects for Active Land Developments");
      return { data: [] };
    }
    throw err;
  }
};
