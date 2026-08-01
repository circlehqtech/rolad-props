import client from "../client";

export type MessageType =
  | "payment_reminder"
  | "follow_up"
  | "roi_payout"
  | "allocation_congratulations"
  | "stage_update"
  | "welcome"
  | "custom"
  | string;
export type MessageChannel = "whatsapp" | "email" | "sms" | string;
export type MessageStatus = "draft" | "sent" | "delivered" | "failed";

export interface ClientMessageDto {
  id: string;
  clientId?: string;
  messageType: MessageType;
  channel: MessageChannel;
  body?: string;
  aiDraft?: string;
  finalContent?: string;
  status: MessageStatus;
  provider?: string;
  providerMessageId?: string;
  sentAt?: string;
  sentByStaffId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientMessagesResponse {
  data: ClientMessageDto[];
}

export interface DraftMessagePayload {
  messageType: MessageType;
  channel: MessageChannel;
  template?: string;
}

export interface DraftMessageResponse {
  draft: string;
  aiDraft?: string;
}

export interface SaveMessagePayload {
  messageType: MessageType;
  channel: MessageChannel;
  body?: string;
  aiDraft?: string;
  finalContent?: string;
}

export interface SendMessagePayload {
  provider?: string;
  providerMessageId?: string;
}

export const draftClientMessage = async (clientId: string, payload: DraftMessagePayload) => {
  try {
    const res = await client.post<any, DraftMessageResponse>(`/clients/${clientId}/draft-message`, {
      messageType: payload.messageType,
      channel: payload.channel,
      ...(payload.template ? { template: payload.template } : {}),
    });
    return res;
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] POST /clients/${clientId}/draft-message for ClientProfile Message Drafter`);
    }
    throw err;
  }
};

export const draftMessage = draftClientMessage;

export const saveClientMessage = async (clientId: string, payload: SaveMessagePayload) => {
  try {
    const bodyToSend = {
      messageType: payload.messageType,
      channel: payload.channel,
      body: payload.body || payload.finalContent || payload.aiDraft || "",
      aiDraft: payload.aiDraft || payload.body || "",
      finalContent: payload.finalContent || payload.body || "",
    };
    return await client.post<any, ClientMessageDto>(`/clients/${clientId}/messages`, bodyToSend);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] POST /clients/${clientId}/messages for ClientProfile Save Message`);
    }
    throw err;
  }
};

export const getClientMessages = async (clientId: string, params?: { limit?: number }) => {
  try {
    return await client.get<any, ClientMessagesResponse>(`/clients/${clientId}/messages`, { params });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] GET /clients/${clientId}/messages for ClientProfile Messages List`);
      return { data: [] };
    }
    throw err;
  }
};

export const patchClientMessage = async (clientId: string, messageId: string, finalContent: string) => {
  try {
    return await client.patch<any, ClientMessageDto>(`/clients/${clientId}/messages/${messageId}`, { finalContent });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] PATCH /clients/${clientId}/messages/${messageId} for ClientProfile Edit Draft`);
    }
    throw err;
  }
};

export const sendClientMessage = async (clientId: string, messageId: string, payload: SendMessagePayload) => {
  try {
    return await client.post<any, ClientMessageDto>(`/clients/${clientId}/messages/${messageId}/send`, payload);
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] POST /clients/${clientId}/messages/${messageId}/send for ClientProfile Send Message`);
    }
    throw err;
  }
};

export const updateMessageDelivery = async (clientId: string, messageId: string, status: "delivered" | "failed") => {
  try {
    return await client.post<any, ClientMessageDto>(`/clients/${clientId}/messages/${messageId}/delivery`, { status });
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn(`[MISSING ENDPOINT] POST /clients/${clientId}/messages/${messageId}/delivery for ClientProfile Delivery Status`);
    }
    throw err;
  }
};

export const getGlobalMessages = async () => {
  try {
    return await client.get<any, ClientMessagesResponse>("/messages");
  } catch (err: any) {
    if (err?.statusCode === 404) {
      console.warn("[MISSING ENDPOINT] GET /messages for Global Messages Console");
      return { data: [] };
    }
    throw err;
  }
};
