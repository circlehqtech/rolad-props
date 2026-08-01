import client from "../client";

export interface GetClientsParams {
  q?: string;
  productType?: "land_property" | "investment";
  stage?: string;
  paymentStatus?: string;
  page?: number;
  pageSize?: number;
}

export interface ClientListItem {
  id: string;
  clientCode: string;
  fullName: string;
  phone: string;
  productTypeCode: "land_property" | "investment";
  productTypeLabel: string;
  currentStageCode: string;
  currentStageLabel: string;
  paymentStatus: string | null;
  paidKobo: string | null;
  overdueKobo: string | null;
  outstandingKobo: string | null;
  currency: string | null;
}

export interface ClientProfileDto {
  id: string;
  clientCode: string;
  fullName: string;
  phone: string;
  email?: string;
  residentialAddress?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  occupation?: string;
  referralSource?: string;
  subscriptionDate: string;
  productTypeCode: "land_property" | "investment";
  productTypeLabel: string;
  currentStageCode: string;
  currentStageLabel: string;
  paymentStatus: string | null;
  overdueKobo: string | null;
  outstandingKobo: string | null;
  currency: string | null;
  quickActions: string[];
  closureAgent?: string;      // Defensive check per Phase 0 item 4
  campaignDetails?: string;   // Defensive check per Phase 0 item 4
}

export interface ClientJourneyStage {
  stageId: string;
  stageCode: string;
  stageLabel: string;
  sortOrder: number;
  state: "completed" | "current" | "upcoming";
  enteredAt?: string;
  enteredByStaffId?: string;
  enteredByStaffName?: string;
  notes?: string;
  requiresApproval: boolean;
}

export interface ClientJourneyDto {
  clientId: string;
  stages: ClientJourneyStage[];
}

export interface ClientPaymentsDto {
  clientId: string;
  summary: {
    paid: string; // kobo
    outstanding: string; // kobo
    overdue: string; // kobo
    computedStatus: string;
    nextDueDate?: string;
  };
  ledger?: Array<{
    id: string;
    installmentNumber: number;
    amount: string;
    paidAmount: string;
    dueDate: string;
    paidDate?: string;
    status: "scheduled" | "paid" | "skipped";
    note?: string;
  }>;
  canSeeLedger: boolean;
}

export interface ClientDocument {
  id: string;
  docName: string;
  status: "filed" | "pending";
  cloudinaryUrl?: string;
  filedByStaffId?: string;
  filedByStaffName?: string;
  filedAt?: string;
}

export interface ClientDocumentsDto {
  clientId: string;
  documents: ClientDocument[];
  counts: { filed: number; pending: number };
}

export interface ActivityEntry {
  id: string;
  createdAt: string;
  kind: "activity" | "note";
  actorStaffId?: string;
  actorStaffName?: string;
  action?: string;
  metadata?: Record<string, any>;
  body?: string;
}

export interface ClientActivityDto {
  clientId: string;
  entries: ActivityEntry[];
}

export interface ClientProjectDto {
  id: string;
  clientId: string;
  plot?: string;
  location?: string;
  landName?: string;
  estateLabel?: string;
  coordinates?: string;
  architectural: "pending" | "in_progress" | "completed";
  structural: "pending" | "in_progress" | "completed";
  civil: "pending" | "in_progress" | "completed";
  latestUpdateNote?: string;
  latestUpdateAt?: string;
  latestUpdateByStaffId?: string;
  latestUpdateByStaffName?: string;
  isComplete: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface CreateClientPayload {
  fullName: string;
  phone: string;
  email?: string;
  productTypeCode: "land_property" | "investment";
  subscriptionDate: string;
  residentialAddress?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  occupation?: string;
  referralSource?: string;
  assignedStaffId?: string;
  closureAgentId?: string;
}

export interface LogPaymentPayload {
  amount: number; // integer kobo per §9
  paidDate: string;
  installmentNumber?: number;
  note?: string;
}

export interface FileDocumentPayload {
  cloudinaryUrl: string;
  note?: string;
}

// Client Profile API fetchers
export const getClients = (params: GetClientsParams = {}) =>
  client.get<any, PaginatedResponse<ClientListItem>>("/clients", { params });

export const getClientProfile = (idOrCode: string) =>
  client.get<any, ClientProfileDto>(`/clients/${idOrCode}`);

export const getClientJourney = (id: string) =>
  client.get<any, ClientJourneyDto>(`/clients/${id}/journey`);

export const getClientPayments = (id: string) =>
  client.get<any, ClientPaymentsDto>(`/clients/${id}/payments`);

export const getClientDocuments = (id: string) =>
  client.get<any, ClientDocumentsDto>(`/clients/${id}/documents`);

export const getClientActivity = (id: string) =>
  client.get<any, ClientActivityDto>(`/clients/${id}/activity`);

export const getClientProject = (id: string) =>
  client.get<any, ClientProjectDto>(`/clients/${id}/project`);

// Mutations
export const createClient = (payload: CreateClientPayload) =>
  client.post<any, ClientProfileDto>("/clients", payload);

export const patchClient = (id: string, payload: Partial<CreateClientPayload>) =>
  client.patch<any, ClientProfileDto>(`/clients/${id}`, payload);

export const logPayment = (id: string, payload: LogPaymentPayload) =>
  client.post<any, any>(`/clients/${id}/payments`, payload);

export const addDocument = (id: string, docName: string, cloudinaryUrl?: string) =>
  client.post<any, any>(`/clients/${id}/documents`, { docName, cloudinaryUrl });

export const fileDocument = (clientId: string, docId: string, payload: FileDocumentPayload) =>
  client.post<any, any>(`/clients/${clientId}/documents/${docId}/file`, payload);

export const voidDocument = (clientId: string, docId: string, reason: string) =>
  client.post<any, any>(`/clients/${clientId}/documents/${docId}/void`, { reason });

export const addNote = (clientId: string, body: string) =>
  client.post<any, any>(`/clients/${clientId}/notes`, { body });

export const adjustBalance = (clientId: string, installmentNumber: number, adjustmentAmountKobo: string, note?: string) =>
  client.post<any, any>(`/clients/${clientId}/adjust-balance`, {
    installmentNumber,
    adjustmentAmountKobo,
    note,
  });

export const advanceStage = (clientId: string, notes?: string) =>
  client.post<any, { pendingApproval: boolean }>(`/clients/${clientId}/stage/advance`, { notes });

export const revertStage = (clientId: string, toStageId: string, reason: string) =>
  client.post<any, any>(`/clients/${clientId}/stage/revert`, { toStageId, reason });

export const patchPaymentDueDate = (paymentId: string, dueDate: string) =>
  client.patch<any, any>(`/payments/${paymentId}`, { dueDate });

export interface AttributeCampaignPayload {
  campaignName?: string;
  closingAgentId?: string;
}

export const attributeCampaign = async (id: string, payload: AttributeCampaignPayload) => {
  try {
    return await client.post<any, ClientProfileDto>(`/clients/${id}/campaign`, payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] POST /clients/${id}/campaign for Campaign Attribution`);
    }
    throw err;
  }
};


// Intake API endpoints
export interface ProspectLead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  residentialAddress?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  idFileUrl?: string;
  productTypeCode: "land_property" | "investment";
  productTypeLabel?: string;
  installmentProfile?: string;
  estateLabel?: string;
  coordinates?: string;
  campaignDetails?: string;
  createdAt: string;
}

export const getIntakePending = () =>
  client.get<any, ProspectLead[]>("/intake/pending");

export const confirmIntake = (id: string, payload?: any) =>
  client.post<any, any>(`/intake/${id}/confirm`, payload);

export const rejectIntake = (id: string, reason: string) =>
  client.post<any, any>(`/intake/${id}/reject`, { reason });

export const createIntakeInternal = (payload: any) =>
  client.post<any, any>("/intake/internal", payload);
