export type RequestType = "clearance" | "milestone" | "logistics";

export type RequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "In Progress"
  | string;

export interface NewRequestFormData {
  requestTitle: string;
  clientOrProject: string;
  requestedBy: string;
  status: "Pending";
  estimatedCost: string;
  clientCode: string;
  details: string;
  milestone: "architectural" | "structural" | "civil";
  milestoneStatus: "pending" | "in_progress" | "completed";
  fuelAllowance: string;
  materialAllocations: string[];
}

export interface RequestRegisterItem {
  id: string;
  type: RequestType;
  apiType: "clearance" | "logistics" | "milestone_update" | "governance";
  title: string;
  requestedBy: string;
  clientCode: string;
  clientDisplay: string;
  status: RequestStatus;
  amount?: string;
  estimatedCost?: string;
  fuelAllowance?: string;
  materialAllocations?: string[];
  milestone?: string;
  milestoneStatus?: string;
  isCustomerAudit?: boolean;
  aiSummary?: string | null;
}
