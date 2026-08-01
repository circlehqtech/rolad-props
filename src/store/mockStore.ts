import { create } from "zustand";

export interface DocumentItem {
  name: string;
  status: "filed" | "pending";
  updatedBy: string;
  timestamp: string;
  fileUrl?: string;
}

export interface LedgerItem {
  invoiceId: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Outstanding" | "Late" | "Missed";
}

export interface LandItem {
  id: string;
  name: string;
  estateLabel: string;
  coordinates: string;
  status: string; // e.g. "Active Land Development"
}

export interface CommissionItem {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string; // Date and Time ISO/formatted stamp
  status: "Pending" | "Paid" | "Approved";
  details: string;
}

export interface RoiItem {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string; // Date and Time ISO/formatted stamp
  details: string;
}

export interface Client {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  productType: "Land & Property" | "Investment";
  journeyStage: string;
  paymentStatus: "Paid" | "Outstanding" | "Late" | "Missed";
  outstanding: number;
  overdue: number;
  paid: number;
  documents: DocumentItem[];
  ledger: LedgerItem[];
  coordinates?: string;
  estateLabel?: string;
  journalNotes?: string[];
  campaignDetails?: string;
  lands?: LandItem[];
  closureAgent?: string;
}

export interface Project {
  id: string;
  clientName: string;
  landName: string;
  estateLabel: string;
  coordinates: string;
  architectural: "completed" | "in_progress" | "pending";
  structural: "completed" | "in_progress" | "pending";
  civil: "completed" | "in_progress" | "pending";
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: "Active" | "On Leave" | "Suspended";
  appraisalRating: number;
  appraisalNotes: string;
  joinedDate: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface ApprovalItem {
  id: string;
  title: string;
  requestedBy: string;
  cost?: string;
  details: string;
  status: "Pending" | "Approved" | "Rejected";
  clientCode?: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  operator: string;
}

interface DataState {
  clients: Client[];
  projects: Project[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  approvals: ApprovalItem[];
  activities: ActivityLog[];
  commissions: CommissionItem[];
  rois: RoiItem[];

  // Actions
  addClient: (client: Omit<Client, "id" | "code">) => void;
  updateClientStage: (id: string, stage: string) => void;
  updateClientCampaignDetails: (id: string, campaignDetails: string) => void;
  updateClientLands: (id: string, lands: LandItem[]) => void;
  logPayment: (
    clientId: string,
    invoiceId: string,
    amount: number,
    isNewClient?: boolean,
    newClientData?: Partial<Client>,
  ) => string;
  addAdjustment: (clientId: string, amount: number, details: string) => void;
  addJournalNote: (clientId: string, note: string) => void;
  toggleDocumentStatus: (
    clientId: string,
    docName: string,
    operator: string,
    fileUrl?: string,
  ) => void;

  updateProjectMilestone: (
    projectId: string,
    milestone: "architectural" | "structural" | "civil",
    status: "completed" | "in_progress" | "pending",
  ) => void;

  updateEmployeeAppraisal: (
    employeeId: string,
    rating: number,
    notes: string,
  ) => void;
  actionLeaveRequest: (
    requestId: string,
    status: "Approved" | "Rejected",
  ) => void;
  submitLeaveRequest: (req: Omit<LeaveRequest, "id" | "status">) => void;

  submitApprovalRequest: (app: Omit<ApprovalItem, "id" | "status">) => void;
  actionApprovalRequest: (
    id: string,
    status: "Approved" | "Rejected",
    operator: string,
  ) => void;

  logActivity: (message: string, operator: string) => void;
  logCommission: (comm: Omit<CommissionItem, "id">) => void;
  updateClientClosureAgent: (id: string, closureAgent: string) => void;
  logRoi: (roi: Omit<RoiItem, "id">) => void;
  actionCommission: (
    id: string,
    status: "Pending" | "Paid" | "Approved",
  ) => void;
}

// Initial Mock Data
const initialClients: Client[] = [
  {
    id: "emaar",
    name: "Chief Amadi Chukwuemeka",
    code: "RC-3810",
    phone: "+234 803 123 4567",
    email: "amadi.chukwuemeka@example.com",
    address: "Plot 14, Marina District, Lekki Phase 1, Lagos",
    productType: "Land & Property",
    journeyStage: "Payment & Setup",
    paymentStatus: "Outstanding",
    outstanding: 1180000,
    overdue: 0,
    paid: 2820000,
    coordinates: "6.4281° N, 3.4219° E",
    estateLabel: "Lekki Oceanfront Gate A",
    campaignDetails: "Summer Instagram Promo 2026",
    closureAgent: "Sarah Jenkins",
    journalNotes: [
      "Site clearing completed on 2026-06-12 10:15:00.",
      "Soil test results approved by Chief Engineer on 2026-06-14 11:30:00.",
      "Boundary pegging completed on 2026-06-15 14:00:00.",
    ],
    lands: [
      {
        id: "emaar-l1",
        name: "Emaar Marina Plot A1",
        estateLabel: "Lekki Oceanfront Gate A",
        coordinates: "6.4281° N, 3.4219° E",
        status: "Active Land Development",
      },
      {
        id: "emaar-l2",
        name: "Emaar Marina Plot A2",
        estateLabel: "Lekki Oceanfront Gate B",
        coordinates: "6.4290° N, 3.4250° E",
        status: "Active Land Development",
      },
    ],
    documents: [
      {
        name: "C of O Certificate",
        status: "filed",
        updatedBy: "Adaobi Rolad",
        timestamp: "2026-06-01 09:30:00",
        fileUrl: "/land_certificate.png",
      },
      {
        name: "Approved Architectural Layout",
        status: "filed",
        updatedBy: "Adaobi Rolad",
        timestamp: "2026-06-15 15:45:00",
        fileUrl: "/land_certificate.png",
      },
      {
        name: "Deed of Assignment",
        status: "pending",
        updatedBy: "",
        timestamp: "",
      },
      {
        name: "Structural Integrity Signoff",
        status: "pending",
        updatedBy: "",
        timestamp: "",
      },
    ],
    ledger: [
      {
        invoiceId: "INV-2026-042",
        amount: 280000,
        dueDate: "2026-07-12",
        status: "Paid",
      },
      {
        invoiceId: "INV-2026-045",
        amount: 400000,
        dueDate: "2026-08-15",
        status: "Outstanding",
      },
      {
        invoiceId: "INV-2026-048",
        amount: 780000,
        dueDate: "2026-09-30",
        status: "Outstanding",
      },
    ],
  },
  {
    id: "serene",
    name: "Alhaji Ibrahim Musa",
    code: "RC-4109",
    phone: "+234 812 987 6543",
    email: "ibrahim.musa@example.com",
    address: "Sector G, Serene Hills Estate, Epe, Lagos",
    productType: "Land & Property",
    journeyStage: "Assessment",
    paymentStatus: "Late",
    outstanding: 425000,
    overdue: 425000,
    paid: 120000,
    coordinates: "6.5833° N, 3.9833° E",
    estateLabel: "Serene Hills West Ridge",
    campaignDetails: "Google Search Ads Campaign G2",
    closureAgent: "Michael Thompson",
    journalNotes: [
      "Topographical survey draft completed on 2026-05-10 11:20:00.",
      "Access road construction halted due to weather issues on 2026-05-18 16:30:00.",
    ],
    lands: [
      {
        id: "serene-l1",
        name: "Serene Ridge Plot B4",
        estateLabel: "Serene Hills West Ridge",
        coordinates: "6.5833° N, 3.9833° E",
        status: "Active Land Development",
      },
    ],
    documents: [
      {
        name: "Survey Plan",
        status: "filed",
        updatedBy: "Adaobi Rolad",
        timestamp: "2026-05-10 14:00:00",
        fileUrl: "/land_certificate.png",
      },
      {
        name: "Allocations Map Approval",
        status: "pending",
        updatedBy: "",
        timestamp: "",
      },
    ],
    ledger: [
      {
        invoiceId: "INV-2026-039",
        amount: 425000,
        dueDate: "2026-07-08",
        status: "Late",
      },
    ],
  },
  {
    id: "zenith",
    name: "Dr. Folake Adebayo",
    code: "RC-8812",
    phone: "+234 706 555 1122",
    email: "folake.adebayo@example.com",
    address: "Block 8A, Victoria Island, Lagos",
    productType: "Investment",
    journeyStage: "Active Portfolio",
    paymentStatus: "Paid",
    outstanding: 0,
    overdue: 0,
    paid: 1500000,
    campaignDetails: "Corporate Referral Channel",
    closureAgent: "Tunde Alao",
    journalNotes: [
      "Dividend portfolio report shared on 2026-04-15 09:00:00.",
      "Investor relations update logged on 2026-04-20 14:15:00.",
    ],
    lands: [
      {
        id: "zenith-l1",
        name: "Emaar Marina Plot A1",
        estateLabel: "Lekki Oceanfront Gate A",
        coordinates: "6.4281° N, 3.4219° E",
        status: "Active Land Development",
      },
    ],
    documents: [
      {
        name: "Investment Agreement",
        status: "filed",
        updatedBy: "Chuka Rolad",
        timestamp: "2026-04-12 11:20:00",
        fileUrl: "/land_certificate.png",
      },
      {
        name: "KYC Verification Profile",
        status: "filed",
        updatedBy: "David Adekunle",
        timestamp: "2026-04-14 10:00:00",
        fileUrl: "/national_id.png",
      },
    ],
    ledger: [
      {
        invoiceId: "INV-2026-041",
        amount: 1500000,
        dueDate: "2026-07-04",
        status: "Paid",
      },
    ],
  },
  {
    id: "coastal",
    name: "Engr. Babatunde Ogunlesi",
    code: "RC-7723",
    phone: "+234 905 444 3322",
    email: "babatunde.ogunlesi@example.com",
    address: "Coastal Road Corridor, Ibeju-Lekki, Lagos",
    productType: "Land & Property",
    journeyStage: "Subscription Form",
    paymentStatus: "Paid",
    outstanding: 0,
    overdue: 0,
    paid: 980000,
    coordinates: "6.3980° N, 3.6521° E",
    estateLabel: "Coastal Highway Crest A",
    campaignDetails: "VGC Billboard Ad Campaign",
    closureAgent: "Ngozi Eze",
    journalNotes: [
      "Inquiry logged from agency rep on 2026-06-28 09:12:00.",
      "Coastal clearance guidelines attached on 2026-06-29 11:00:00.",
    ],
    lands: [
      {
        id: "coastal-l1",
        name: "Coastal Plot C3",
        estateLabel: "Coastal Highway Crest A",
        coordinates: "6.3980° N, 3.6521° E",
        status: "Active Land Development",
      },
    ],
    documents: [
      {
        name: "Right of Way Clearance",
        status: "filed",
        updatedBy: "Chuka Rolad",
        timestamp: "2026-06-28 12:00:00",
        fileUrl: "/land_certificate.png",
      },
    ],
    ledger: [
      {
        invoiceId: "INV-2026-038",
        amount: 980000,
        dueDate: "2026-06-28",
        status: "Paid",
      },
    ],
  },
];

const initialProjects: Project[] = [
  {
    id: "emaar-proj-1",
    clientName: "Chief Amadi Chukwuemeka",
    landName: "Emaar Marina Plot A1",
    estateLabel: "Lekki Oceanfront Gate A",
    coordinates: "6.4281° N, 3.4219° E",
    architectural: "completed",
    structural: "in_progress",
    civil: "pending",
  },
  {
    id: "emaar-proj-2",
    clientName: "Chief Amadi Chukwuemeka",
    landName: "Emaar Marina Plot A2",
    estateLabel: "Lekki Oceanfront Gate B",
    coordinates: "6.4290° N, 3.4250° E",
    architectural: "pending",
    structural: "pending",
    civil: "pending",
  },
  {
    id: "serene-proj-1",
    clientName: "Alhaji Ibrahim Musa",
    landName: "Serene Ridge Plot B4",
    estateLabel: "Serene Hills West Ridge",
    coordinates: "6.5833° N, 3.9833° E",
    architectural: "in_progress",
    structural: "pending",
    civil: "pending",
  },
  {
    id: "coastal-proj-1",
    clientName: "Engr. Babatunde Ogunlesi",
    landName: "Coastal Plot C3",
    estateLabel: "Coastal Highway Crest A",
    coordinates: "6.3980° N, 3.6521° E",
    architectural: "completed",
    structural: "completed",
    civil: "completed",
  },
];

const initialEmployees: Employee[] = [
  {
    id: "emp1",
    name: "Sarah Jenkins",
    role: "Finance Officer",
    status: "Active",
    appraisalRating: 4,
    appraisalNotes: "Excellent ledger audits, highly meticulous.",
    joinedDate: "2024-03-15",
  },
  {
    id: "emp2",
    name: "Michael Thompson",
    role: "Business Developer",
    status: "Active",
    appraisalRating: 5,
    appraisalNotes: "Brought in three anchor clients this fiscal quarter.",
    joinedDate: "2023-11-01",
  },
  {
    id: "emp3",
    name: "Tunde Alao",
    role: "Site Inspector",
    status: "Active",
    appraisalRating: 3,
    appraisalNotes: "Good reports, needs to submit logs faster.",
    joinedDate: "2025-01-10",
  },
  {
    id: "emp4",
    name: "Jane Peters",
    role: "Client Success Specialist",
    status: "On Leave",
    appraisalRating: 4,
    appraisalNotes: "Consistently high resolution speed.",
    joinedDate: "2024-08-20",
  },
];

const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "lv1",
    employeeName: "Jane Peters",
    startDate: "2026-07-15",
    endDate: "2026-07-30",
    reason: "Maternity Leave",
    status: "Pending",
  },
  {
    id: "lv2",
    employeeName: "Tunde Alao",
    startDate: "2026-08-05",
    endDate: "2026-08-12",
    reason: "Annual Leave",
    status: "Pending",
  },
];

const initialApprovals: ApprovalItem[] = [
  {
    id: "app-audit-0",
    title: "Customer Audit Request: Alhaji Ibrahim Musa (RC-101)",
    requestedBy: "Funke Adebayo (Client Relations)",
    cost: "Accounts Audit",
    details:
      "Urgency: High Priority | Scope: Accounts & Ledger | Rationale: Identified variance between customer payment receipts and bank ledger settlement. Requesting formal MD clearance for audit restatement.",
    status: "Pending",
    clientCode: "RC-101",
  },
  {
    id: "app1",
    title: "Project Budget Increase: Serene Hills",
    requestedBy: "Sarah Jenkins (Finance)",
    cost: "+$120,000.00",
    details:
      "Additional excavation and pegging materials required due to swamp terrain layout changes.",
    status: "Pending",
    clientCode: "RC-4109",
  },
  {
    id: "app2",
    title: "New Client Onboarding: Zenith Global",
    requestedBy: "Michael Thompson (BD)",
    cost: "VETTING PASS",
    details:
      "Onboarding clearance for Dr. Folake Adebayo. KYC documents verified by internal compliance team.",
    status: "Pending",
    clientCode: "RC-8812",
  },
  {
    id: "app3",
    title: "Operational Variance Waiver: Block A",
    requestedBy: "Tunde Alao (Site Inspector)",
    cost: "CRITICAL",
    details:
      "Requesting immediate structural code variance waiver for Chief Amadi Chukwuemeka foundation.",
    status: "Pending",
    clientCode: "RC-3810",
  },
];

const initialActivities: ActivityLog[] = [
  {
    id: "act1",
    message: "Chief Amadi Chukwuemeka payment of $280,000 logged",
    timestamp: "2026-07-12 10:15:30",
    operator: "Ngozi Eze",
  },
  {
    id: "act2",
    message: "C of O Certificate uploaded for Alhaji Ibrahim Musa",
    timestamp: "2026-07-10 14:32:00",
    operator: "Adaobi Rolad",
  },
  {
    id: "act3",
    message: "Client record initialized for Engr. Babatunde Ogunlesi",
    timestamp: "2026-06-28 09:12:00",
    operator: "Chuka Rolad",
  },
];

const initialCommissions: CommissionItem[] = [
  {
    id: "comm-1",
    clientId: "emaar",
    clientName: "Chief Amadi Chukwuemeka",
    amount: 15000,
    date: "2026-07-12 11:30:00",
    status: "Paid",
    details: "Referral Commission for Tayo Bankole",
  },
  {
    id: "comm-2",
    clientId: "serene",
    clientName: "Alhaji Ibrahim Musa",
    amount: 25000,
    date: "2026-07-15 14:22:15",
    status: "Pending",
    details: "Upcoming commission verification for Epe phase 2",
  },
];

const initialRois: RoiItem[] = [
  {
    id: "roi-1",
    clientId: "zenith",
    clientName: "Dr. Folake Adebayo",
    amount: 45000,
    date: "2026-07-04 09:00:00",
    details: "ROI Dividend allocation for Zenith Global Portfolio",
  },
];

export const useMockStore = create<DataState>((set) => ({
  clients: initialClients,
  projects: initialProjects,
  employees: initialEmployees,
  leaveRequests: initialLeaveRequests,
  approvals: initialApprovals,
  activities: initialActivities,
  commissions: initialCommissions,
  rois: initialRois,

  logActivity: (message, operator) => {
    const log: ActivityLog = {
      id: `act${Date.now()}`,
      message,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      operator,
    };
    set((s) => ({ activities: [log, ...s.activities].slice(0, 50) })); // limit to 50
  },

  addClient: (c) => {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const code = `RC-${codeNum}`;
    const id = c.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const newClient: Client = {
      ...c,
      id,
      code,
      outstanding: c.outstanding || 0,
      overdue: c.overdue || 0,
      paid: c.paid || 0,
      documents: c.documents || [],
      ledger: c.ledger || [],
      journalNotes: c.journalNotes || ["Client record initialized."],
      campaignDetails: c.campaignDetails || "Direct Marketing Campaign",
      lands:
        c.lands ||
        (c.productType === "Land & Property"
          ? [
              {
                id: `${id}-l1`,
                name: `${c.name} Plot 1`,
                estateLabel: c.estateLabel || "Lekki Oceanfront Gate B",
                coordinates: c.coordinates || "6.4290° N, 3.4250° E",
                status: "Active Land Development",
              },
            ]
          : []),
    };

    set((s) => {
      // Also register a project if it is Land & Property
      let updatedProjects = [...s.projects];
      if (
        newClient.productType === "Land & Property" &&
        newClient.estateLabel
      ) {
        updatedProjects.push({
          id: `${id}-proj`,
          clientName: newClient.name,
          landName: `${newClient.name} Plot 1`,
          estateLabel: newClient.estateLabel,
          coordinates: newClient.coordinates || "6.4000° N, 3.4000° E",
          architectural: "pending",
          structural: "pending",
          civil: "pending",
        });
      }

      const updatedClients = [...s.clients, newClient];
      return { clients: updatedClients, projects: updatedProjects };
    });
  },

  updateClientStage: (id, stage) => {
    set((s) => {
      const updated = s.clients.map((c) =>
        c.id === id ? { ...c, journeyStage: stage } : c,
      );
      return { clients: updated };
    });
  },

  updateClientCampaignDetails: (id, campaignDetails) => {
    set((s) => ({
      clients: s.clients.map((c) =>
        c.id === id ? { ...c, campaignDetails } : c,
      ),
    }));
  },

  updateClientClosureAgent: (id, closureAgent) => {
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, closureAgent } : c)),
    }));
  },

  updateClientLands: (id, lands) => {
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, lands } : c)),
    }));
  },

  logPayment: (clientId, invoiceId, amount, isNewClient, newClientData) => {
    let finalClientId = clientId;
    if (isNewClient && newClientData) {
      finalClientId =
        newClientData.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") ||
        `client-${Date.now()}`;
    }
    set((s) => {
      let updatedClients = [...s.clients];

      if (isNewClient && newClientData) {
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const code = `RC-${codeNum}`;
        const id = finalClientId;

        const newClient: Client = {
          id,
          name: newClientData.name || "Unnamed Client",
          code,
          phone: newClientData.phone || "+234 800 000 0000",
          email: newClientData.email || "unknown@domain.com",
          address: newClientData.address || "No address",
          productType: newClientData.productType || "Land & Property",
          journeyStage: "Payment & Setup",
          paymentStatus: "Paid",
          outstanding: 0,
          overdue: 0,
          paid: amount,
          documents: [
            {
              name: "Intake Biometrics File",
              status: "filed",
              updatedBy: "Accounts Team",
              timestamp: new Date()
                .toISOString()
                .replace("T", " ")
                .substring(0, 19),
            },
          ],
          ledger: [
            {
              invoiceId:
                invoiceId ||
                `INV-INIT-${Math.floor(100 + Math.random() * 900)}`,
              amount,
              dueDate: new Date().toISOString().substring(0, 10),
              status: "Paid",
            },
          ],
          lands:
            newClientData.productType === "Land & Property"
              ? [
                  {
                    id: `${id}-l1`,
                    name: `${newClientData.name} Plot 1`,
                    estateLabel:
                      newClientData.estateLabel || "Lekki Oceanfront Gate B",
                    coordinates:
                      newClientData.coordinates || "6.4290° N, 3.4250° E",
                    status: "Active Land Development",
                  },
                ]
              : [],
          estateLabel: newClientData.estateLabel,
          coordinates: newClientData.coordinates,
          campaignDetails: newClientData.campaignDetails || "Direct Ledger Log",
        };
        updatedClients.push(newClient);
        return { clients: updatedClients };
      }

      const client = s.clients.find((c) => c.id === clientId);
      if (!client) return {};

      const updatedLedger = client.ledger.map((item) =>
        item.invoiceId === invoiceId
          ? { ...item, status: "Paid" as const }
          : item,
      );

      const updatedPaid = client.paid + amount;
      const updatedOutstanding = Math.max(0, client.outstanding - amount);
      const updatedOverdue = Math.max(
        0,
        client.overdue - (itemOverdue(client.ledger, invoiceId) ? amount : 0),
      );

      const newStatus =
        updatedOverdue > 0
          ? "Late"
          : updatedOutstanding > 0
            ? "Outstanding"
            : "Paid";

      const nextClients = s.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              paid: updatedPaid,
              outstanding: updatedOutstanding,
              overdue: updatedOverdue,
              paymentStatus: newStatus as any,
              ledger: updatedLedger,
            }
          : c,
      );

      return { clients: nextClients };
    });
    return finalClientId;
  },

  addAdjustment: (clientId, amount, details) => {
    set((s) => {
      const client = s.clients.find((c) => c.id === clientId);
      if (!client) return {};

      const invoiceId = `INV-ADJ-${Math.floor(100 + Math.random() * 900)}`;
      const newLedgerItem: LedgerItem = {
        invoiceId,
        amount,
        dueDate: new Date().toISOString().substring(0, 10),
        status: "Outstanding",
      };

      const updatedClients = s.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              outstanding: c.outstanding + amount,
              paymentStatus: "Outstanding" as const,
              ledger: [...c.ledger, newLedgerItem],
              journalNotes: [
                ...(c.journalNotes || []),
                `Adjustment added: ${details} (${amount}) on ${new Date().toISOString().replace("T", " ").substring(0, 19)}`,
              ],
            }
          : c,
      );

      return { clients: updatedClients };
    });
  },

  addJournalNote: (clientId, note) => {
    set((s) => ({
      clients: s.clients.map((c) =>
        c.id === clientId
          ? {
              ...c,
              journalNotes: [
                ...(c.journalNotes || []),
                `${note} (${new Date().toISOString().replace("T", " ").substring(0, 19)})`,
              ],
            }
          : c,
      ),
    }));
  },

  toggleDocumentStatus: (clientId, docName, operator, fileUrl) => {
    set((s) => {
      const client = s.clients.find((c) => c.id === clientId);
      if (!client) return {};

      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      const updatedDocs = client.documents.map((doc) =>
        doc.name === docName
          ? {
              ...doc,
              status:
                doc.status === "filed" && !fileUrl
                  ? ("pending" as const)
                  : ("filed" as const),
              updatedBy: operator,
              timestamp,
              fileUrl:
                fileUrl || (doc.status === "filed" ? undefined : doc.fileUrl),
            }
          : doc,
      );

      return {
        clients: s.clients.map((c) =>
          c.id === clientId ? { ...c, documents: updatedDocs } : c,
        ),
      };
    });
  },

  updateProjectMilestone: (projectId, milestone, status) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, [milestone]: status } : p,
      ),
    }));
  },

  updateEmployeeAppraisal: (employeeId, rating, notes) => {
    set((s) => ({
      employees: s.employees.map((emp) =>
        emp.id === employeeId
          ? { ...emp, appraisalRating: rating, appraisalNotes: notes }
          : emp,
      ),
    }));
  },

  actionLeaveRequest: (requestId, status) => {
    set((s) => {
      const request = s.leaveRequests.find((r) => r.id === requestId);
      let updatedEmployees = [...s.employees];

      if (request && status === "Approved") {
        updatedEmployees = s.employees.map((emp) =>
          emp.name === request.employeeName
            ? { ...emp, status: "On Leave" as const }
            : emp,
        );
      }

      return {
        leaveRequests: s.leaveRequests.map((r) =>
          r.id === requestId ? { ...r, status } : r,
        ),
        employees: updatedEmployees,
      };
    });
  },

  submitLeaveRequest: (req) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `lv${Date.now()}`,
      status: "Pending",
    };
    set((s) => ({ leaveRequests: [...s.leaveRequests, newReq] }));
  },

  submitApprovalRequest: (app) => {
    const newApp: ApprovalItem = {
      ...app,
      id: `app${Date.now()}`,
      status: "Pending",
    };
    set((s) => ({ approvals: [...s.approvals, newApp] }));
  },

  actionApprovalRequest: (id, status, operator) => {
    set((s) => {
      const item = s.approvals.find((a) => a.id === id);
      let updatedClients = [...s.clients];

      if (item && status === "Approved" && item.clientCode) {
        // If it's a client onboarding vetting approval
        if (item.title.includes("Onboarding")) {
          updatedClients = s.clients.map((c) =>
            c.code === item.clientCode
              ? {
                  ...c,
                  journeyStage:
                    c.productType === "Land & Property"
                      ? "Allocation"
                      : "Subscription",
                  journalNotes: [
                    ...(c.journalNotes || []),
                    `Onboarding vetting approved by ${operator} on ${new Date().toISOString().replace("T", " ").substring(0, 19)}.`,
                  ],
                }
              : c,
          );
        }
        // If it's a budget increase log
        else if (item.title.includes("Budget Increase") && item.cost) {
          const costVal = parseFloat(item.cost.replace(/[^0-9.]/g, ""));
          updatedClients = s.clients.map((c) =>
            c.code === item.clientCode
              ? {
                  ...c,
                  outstanding: c.outstanding + costVal,
                  journalNotes: [
                    ...(c.journalNotes || []),
                    `Budget increase of ${item.cost} approved by ${operator} on ${new Date().toISOString().replace("T", " ").substring(0, 19)}.`,
                  ],
                }
              : c,
          );
        }
        // If it's an operational variance waiver
        else if (item.title.includes("Variance")) {
          updatedClients = s.clients.map((c) =>
            c.code === item.clientCode
              ? {
                  ...c,
                  journalNotes: [
                    ...(c.journalNotes || []),
                    `Variance waiver approved by ${operator} on ${new Date().toISOString().replace("T", " ").substring(0, 19)}.`,
                  ],
                }
              : c,
          );
        }
      }

      return {
        approvals: s.approvals.map((a) => (a.id === id ? { ...a, status } : a)),
        clients: updatedClients,
      };
    });
  },

  logCommission: (comm) => {
    const newComm: CommissionItem = {
      ...comm,
      id: `comm-${Date.now()}`,
    };
    set((s) => ({ commissions: [...s.commissions, newComm] }));
  },

  logRoi: (roi) => {
    const newRoi: RoiItem = {
      ...roi,
      id: `roi-${Date.now()}`,
    };
    set((s) => ({ rois: [...s.rois, newRoi] }));
  },

  actionCommission: (id, status) => {
    set((s) => ({
      commissions: s.commissions.map((c) =>
        c.id === id ? { ...c, status } : c,
      ),
    }));
  },
}));

function itemOverdue(ledger: LedgerItem[], invoiceId: string): boolean {
  const item = ledger.find((l) => l.invoiceId === invoiceId);
  return !!item && (item.status === "Late" || item.status === "Missed");
}
