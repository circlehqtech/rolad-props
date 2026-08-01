import client from "../client";

export interface LedgerRow {
  clientId: string;
  clientCode: string;
  fullName: string;
  paymentStatus: string;
  paidKobo: string;
  outstandingKobo: string;
  overdueKobo: string;
  productTypeCode: string;
  productTypeLabel: string;
}

export interface RiskRegisterRow {
  clientId: string;
  clientCode: string;
  fullName: string;
  overdueKobo: string;
  paymentStatus: string;
  lastAttemptAt?: string;
  riskScore: number;
}

export interface CommissionRow {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  closureAgentId: string;
  closureAgentName: string;
  contractAmountKobo: string;
  commissionAmountKobo: string;
  status: "pending" | "approved" | "paid";
  createdAt: string;
}

export interface CommissionsResponse {
  data: CommissionRow[];
  totalPendingKobo: string;
  totalApprovedKobo: string;
  totalPaidKobo: string;
}

export interface SalesLeaderboardRow {
  staffId: string;
  firstName: string;
  lastName: string;
  totalClients: number;
  activeClients: number;
  closedAmountKobo: string;
  paidAmountKobo: string;
  conversionRate: number;
}

export interface MarketingSummary {
  leadSources: {
    data: Array<{
      source: string;
      totalClients: number;
      activeClients: number;
      totalContractKobo: string;
      paidKobo: string;
    }>;
  };
  conversionFunnel: {
    data: Array<{
      stage: string;
      count: number;
    }>;
    overallConversionRate: number;
  };
  totalLeads: number;
  totalActiveClients: number;
}

export interface AccountsKpis {
  pipelineDuesKobo?: string | number | null;
  totalRevenueCollectedKobo?: string | number | null;
  outstandingPaymentKobo?: string | number | null;
  outstandingCommissionKobo?: string | number | null;
  dueInvestmentKobo?: string | number | null;
  pipelineDues?: string | number | null;
  totalRevenueCollected?: string | number | null;
  outstandingPayment?: string | number | null;
  outstandingCommission?: string | number | null;
  dueInvestment?: string | number | null;
}

// Accounts Fetchers
export const getAccountsKpis = () =>
  client.get<any, AccountsKpis>("/accounts/kpis");

export interface AccountsLedgerParams {
  paymentStatus?: string;
  sortBy?: string;
}

export const getAccountsLedger = async (params?: AccountsLedgerParams) => {
  try {
    const cleanParams: Record<string, string> = {};
    if (params?.paymentStatus && params.paymentStatus !== "ALL" && params.paymentStatus !== "--") {
      cleanParams.paymentStatus = params.paymentStatus;
    }
    if (params?.sortBy && params.sortBy !== "NONE" && params.sortBy !== "--") {
      cleanParams.sortBy = params.sortBy;
    }
    const res = await client.get<any, any>("/accounts/ledger", { params: cleanParams });
    const list = Array.isArray(res) ? res : (res as any)?.data || [];
    return list as LedgerRow[];
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /accounts/ledger");
      return [];
    }
    throw err;
  }
};

export const getRiskRegister = () =>
  client.get<any, RiskRegisterRow[]>("/accounts/risk-register");

export interface RoiPayoutRow {
  clientId: string;
  clientCode: string;
  clientName: string;
  closureAgentId: string;
  closureAgentName: string;
  contractAmountKobo: string;
  roiAmountKobo: string;
  status: string;
  dueDate: string;
}

export interface RoiPayoutsResponse {
  data: RoiPayoutRow[];
  totalRoiPayoutKobo: string;
}

export const getAccountsCommissions = () =>
  client.get<any, CommissionsResponse>("/accounts/commissions");

export const getAccountsRoiPayouts = () =>
  client.get<any, RoiPayoutsResponse>("/accounts/roi-payouts");

// Sales Fetchers
export interface SalesKpisResponse {
  collectedRevenueKobo: string;
  awaitingClearanceKobo: string;
  pipelineDeals: number;
}

export interface SalesLeaderboardRow {
  staffId: string;
  firstName: string;
  lastName: string;
  totalClients: number;
  activeClients: number;
  closedAmountKobo: string;
  paidAmountKobo: string;
  conversionRate: number;
}

export interface SalesCommissionItem {
  id: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  closureAgentId: string;
  closureAgentName: string;
  contractAmountKobo: string;
  commissionAmountKobo: string;
  status: string;
  createdAt: string;
}

export interface SalesCommissionsResponse {
  data: SalesCommissionItem[];
  totalPendingKobo?: string;
  totalApprovedKobo?: string;
  totalPaidKobo?: string;
}

export const getSalesKpis = () =>
  client.get<any, SalesKpisResponse>("/sales/kpis");

export const getSalesLeaderboard = () =>
  client.get<any, { data: SalesLeaderboardRow[] }>("/sales/leaderboard");

export const getSalesCommissions = () =>
  client.get<any, SalesCommissionsResponse>("/sales/commissions");

export const getMarketingSummary = () =>
  client.get<any, MarketingSummary>("/marketing/summary");

// Accounts Audits (§8/§9)
export type AccountsAuditType =
  | "roi_payout"
  | "commission_release"
  | "commission_adjustment"
  | "payment_logged"
  | "commission_logged"
  | "roi_logged"
  | "revenue_entry";

export interface AccountsAuditEntry {
  id: string;
  clientId: string;
  clientCode?: string;
  clientName?: string;
  closureAgentId?: string;
  closureAgentName?: string;
  type: AccountsAuditType | string;
  amountKobo: string;
  status: "pending" | "approved" | "paid" | "rejected" | string;
  note?: string;
  productTypeCode?: string;
  loggedByName?: string;
  createdAt: string;
  sourceType?: string;
  sourceName?: string;
  responsibleAgentId?: string;
  responsibleAgentName?: string;
  proofUrl?: string;
  transactionRef?: string;
  paymentMethod?: string;
}

export interface AccountsRevenueParams {
  timeRange?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
  clientId?: string;
  status?: string;
  sourceType?: string;
  sourceName?: string;
  responsibleAgentId?: string;
}

export interface AccountsRevenueResponse {
  data: AccountsAuditEntry[];
  meta?: {
    timeRange?: string;
    date?: string;
    fromDate?: string;
    toDate?: string;
    total?: number;
  };
}

export const getAccountsRevenue = async (
  params?: AccountsRevenueParams,
): Promise<AccountsRevenueResponse> => {
  const response = await client.get<
    any,
    AccountsRevenueResponse | AccountsAuditEntry[]
  >("/accounts/revenue", { params });

  return Array.isArray(response) ? { data: response } : response;
};

export const getAccountRevenueById = async (
  id: string,
): Promise<AccountsAuditEntry> => {
  const response = await client.get<
    any,
    AccountsAuditEntry | { data: AccountsAuditEntry }
  >(`/accounts/revenue/${id}`);

  return "data" in response ? response.data : response;
};

export interface AccountsAuditsResponse {
  data: AccountsAuditEntry[];
  totalRoiPayoutKobo: string;
  totalCommissionReleaseKobo: string;
  totalAdjustmentKobo: string;
}

export interface LogAuditPayload {
  clientId: string;
  type: AccountsAuditType | string;
  amountKobo: string;
  status?: "pending" | "approved" | "paid" | "rejected" | string;
  note?: string;
  sourceType?: string;
  sourceName?: string;
  responsibleAgentId?: string;
  proofUrl?: string;
  transactionRef?: string;
  paymentMethod?: string;
  installmentNumber?: number;
}

export const getAccountsAudits = async (type?: string) => {
  try {
    const params: Record<string, string> = {};
    if (type && type !== "all" && type !== "ALL" && type !== "--") {
      params.type = type;
    }
    return await client.get<any, AccountsAuditsResponse>("/accounts/audits", { params });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /accounts/audits for Accounts Audits List");
      return { data: [], totalRoiPayoutKobo: "0", totalCommissionReleaseKobo: "0", totalAdjustmentKobo: "0" };
    }
    throw err;
  }
};

export const logAccountsAudit = async (payload: LogAuditPayload) => {
  try {
    return await client.post<any, AccountsAuditEntry>("/accounts/audits", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /accounts/audits for Log Audit Entry");
    }
    throw err;
  }
};

export const logAccountPayment = async (payload: LogAuditPayload) => {
  try {
    return await client.post<any, AccountsAuditEntry>("/accounts/log-payment", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /accounts/log-payment for Log Payment Entry");
    }
    throw err;
  }
};

export const logAccountCommission = async (payload: LogAuditPayload) => {
  try {
    return await client.post<any, AccountsAuditEntry>("/accounts/log-commission", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /accounts/log-commission for Log Commission Entry");
    }
    throw err;
  }
};

export const logAccountRoi = async (payload: LogAuditPayload) => {
  try {
    return await client.post<any, AccountsAuditEntry>("/accounts/log-roi", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /accounts/log-roi for Log ROI Entry");
    }
    throw err;
  }
};

export const logAccountRevenue = async (payload: LogAuditPayload) => {
  try {
    return await client.post<any, AccountsAuditEntry>("/accounts/log-revenue", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /accounts/log-revenue for Log Revenue Entry");
    }
    throw err;
  }
};

export const getAccountAuditById = async (id: string) => {
  try {
    return await client.get<any, AccountsAuditEntry>(`/accounts/audits/${id}`);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] GET /accounts/audits/${id}`);
      return null;
    }
    throw err;
  }
};

export const updateAccountAuditStatus = async (id: string, status: string) => {
  try {
    return await client.patch<any, AccountsAuditEntry>(`/accounts/audits/${id}/status`, { status });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] PATCH /accounts/audits/${id}/status`);
    }
    throw err;
  }
};

// Sales Payout Release (§8/§9)
export interface ReleasePayoutPayload {
  clientId: string;
  commissionAmountKobo: string;
  note?: string;
}

export interface ReleasePayoutResponse {
  clientId: string;
  clientCode: string;
  clientName: string;
  closureAgentId: string;
  closureAgentName: string;
  releaseAmountKobo: string;
  status: "pending";
  releasedBy: string;
}

export const releaseSalesPayout = async (payload: ReleasePayoutPayload) => {
  try {
    return await client.post<any, ReleasePayoutResponse>("/sales/release-payout", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /sales/release-payout for Sales Payout Release");
    }
    throw err;
  }
};

// Marketing Leads (§8)
export interface MarketingLeadRow {
  clientCode: string;
  category: string;
  campaignName: string;
  salesAgent: string;
  stage: string;
  clientName: string;
  referralSource: string;
}

export interface MarketingLeadsResponse {
  data: MarketingLeadRow[];
  totalLeads: number;
  landPropertyCount: number;
  investmentCount: number;
}

export const getMarketingLeads = async () => {
  try {
    return await client.get<any, MarketingLeadsResponse>("/marketing/leads");
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /marketing/leads for Marketing Lead Gen Summary");
      return { data: [], totalLeads: 0, landPropertyCount: 0, investmentCount: 0 };
    }
    throw err;
  }
};

// Marketing Campaigns (§7/§8/§9)
export interface MarketingCampaignItem {
  id: string;
  name: string;
  objective?: string;
  channel: string;
  startDate?: string;
  endDate?: string;
  spendKobo: string;
  leadsGenerated: number;
  conversions: number;
  costPerLeadKobo: string;
  createdByStaffId?: string;
  createdByStaffName?: string;
  createdAt: string;
}

export interface MarketingCampaignsResponse {
  data: MarketingCampaignItem[];
  totalSpendKobo: string;
  totalLeads: number;
  totalConversions: number;
  avgCostPerLeadKobo: string;
}

export interface CreateCampaignPayload {
  name: string;
  objective?: string;
  channel: string;
  startDate?: string;
  endDate?: string;
  spendKobo: string | number;
  leadsGenerated?: number;
  conversions?: number;
  notes?: string;
}

export const getMarketingCampaigns = async () => {
  try {
    return await client.get<any, MarketingCampaignsResponse>("/marketing/campaigns");
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /marketing/campaigns for Marketing Campaigns Timeline");
      return { data: [], totalSpendKobo: "0", totalLeads: 0, totalConversions: 0, avgCostPerLeadKobo: "0" };
    }
    throw err;
  }
};

export const createMarketingCampaign = async (payload: CreateCampaignPayload) => {
  try {
    return await client.post<any, MarketingCampaignItem>("/marketing/campaigns", payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] POST /marketing/campaigns for Create Campaign");
    }
    throw err;
  }
};

// Marketing KPIs (§8)
export interface MarketingKpisResponse {
  totalSpendKobo: string;
  totalLeads: number;
  leadBreakdown?: {
    landProperty: number;
    investment: number;
  };
  acquiredAccounts: number;
  averageCacKobo: string;
}

export const getMarketingKpis = async () => {
  try {
    return await client.get<any, MarketingKpisResponse>("/marketing/kpis");
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /marketing/kpis for Marketing KPIs");
      return null;
    }
    throw err;
  }
};
