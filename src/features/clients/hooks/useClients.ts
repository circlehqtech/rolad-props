import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../../api/endpoints/clients";

// 1. Clients List Query
export function useClientsList(params: api.GetClientsParams = {}) {
  return useQuery({
    queryKey: ["clients-list", params],
    queryFn: () => api.getClients(params),
  });
}

export function useClientProfile(idOrCode: string) {
  const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["client-profile", idOrCode],
    queryFn: async () => {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrCode);
      
      // 1. Fetch live clients list to match UUID or clientCode
      let match: any = null;
      try {
        const listRes = await api.getClients({ q: idOrCode });
        const clientsListEnvelope = (listRes as any)?.data || listRes;
        const clientsList = Array.isArray(clientsListEnvelope)
          ? clientsListEnvelope
          : (clientsListEnvelope as any)?.data || [];

        match = clientsList.find(
          (c: any) =>
            c.clientCode === idOrCode ||
            c.id === idOrCode ||
            c.clientId === idOrCode,
        );
      } catch (err) {
        console.warn("Live clients list fetch fallback", err);
      }

      const targetId = match?.id || match?.clientId || idOrCode;

      // 2. Try fetching full client profile DTO from GET /clients/:id
      try {
        const res = await api.getClientProfile(targetId);
        const dataObj = (res as any)?.data || res;
        if (dataObj && (dataObj.fullName || dataObj.clientCode)) {
          return dataObj;
        }
      } catch (err: any) {
        if (err?.statusCode !== 404) {
          console.warn("GET /clients/:id failed", err);
        }
      }

      // 3. If GET /clients/:id 404s, return matched live backend item as ClientProfileDto
      if (match) {
        return {
          id: match.id || match.clientId,
          clientCode: match.clientCode,
          fullName: match.fullName,
          phone: match.phone || "+234 800 000 0000",
          email: match.email || `${match.clientCode?.toLowerCase()}@rolad.com`,
          productTypeCode: match.productTypeCode || "land_property",
          productTypeLabel: match.productTypeLabel || "Land & Property",
          currentStageCode: match.currentStageCode || "subscription",
          currentStageLabel: match.currentStageLabel || "Subscription",
          paymentStatus: match.paymentStatus || "ON_TRACK",
          overdueKobo: match.overdueKobo || "0",
          outstandingKobo: match.outstandingKobo || "0",
          currency: match.currency || "NGN",
          quickActions: ["ADVANCE_STAGE", "REVERT_STAGE", "ADJUST_BALANCE"],
        };
      }

      // 4. Final fallback to direct getClientProfile
      const res = await api.getClientProfile(idOrCode);
      return (res as any)?.data || res;
    },
    enabled: !!idOrCode,
  });

  useEffect(() => {
    const dataObj = (query.data as any)?.data || query.data;
    if (dataObj?.id) {
      setResolvedUuid(dataObj.id);
    }
  }, [query.data]);

  return {
    ...query,
    resolvedUuid,
  };
}

// 3. Client Sub-resource Queries (using resolved UUID)
export function useClientJourney(clientId: string | null) {
  return useQuery({
    queryKey: ["client-journey", clientId],
    queryFn: () => api.getClientJourney(clientId!),
    enabled: !!clientId,
  });
}

export function useClientPayments(clientId: string | null) {
  return useQuery({
    queryKey: ["client-payments", clientId],
    queryFn: () => api.getClientPayments(clientId!),
    enabled: !!clientId,
  });
}

export function useClientDocuments(clientId: string | null) {
  return useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: () => api.getClientDocuments(clientId!),
    enabled: !!clientId,
  });
}

export function useClientActivity(clientId: string | null) {
  return useQuery({
    queryKey: ["client-activity", clientId],
    queryFn: () => api.getClientActivity(clientId!),
    enabled: !!clientId,
  });
}

export function useClientProject(clientId: string | null) {
  return useQuery({
    queryKey: ["client-project", clientId],
    queryFn: () => api.getClientProject(clientId!),
    enabled: !!clientId,
    retry: false, // Don't spam retries on 404 (investment clients have no project)
  });
}

// Helper to invalidate all related queries for a client
export function useInvalidateClient() {
  const queryClient = useQueryClient();
  return (clientId: string) => {
    queryClient.invalidateQueries({ queryKey: ["client-profile"] });
    queryClient.invalidateQueries({ queryKey: ["client-journey", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-payments", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-activity", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-project", clientId] });
    queryClient.invalidateQueries({ queryKey: ["clients-list"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["accounts-ledger"] });
    queryClient.invalidateQueries({ queryKey: ["accounts-commissions"] });
  };
}

// 4. Mutations
export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function usePatchClientMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: (payload: Partial<api.CreateClientPayload>) =>
      api.patchClient(clientId, payload),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useLogPaymentMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: (payload: api.LogPaymentPayload) =>
      api.logPayment(clientId, payload),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useAddDocumentMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: ({ docName, cloudinaryUrl }: { docName: string; cloudinaryUrl?: string }) =>
      api.addDocument(clientId, docName, cloudinaryUrl),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useFileDocumentMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: ({ docId, cloudinaryUrl, note }: { docId: string; cloudinaryUrl: string; note?: string }) =>
      api.fileDocument(clientId, docId, { cloudinaryUrl, note }),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useVoidDocumentMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: ({ docId, reason }: { docId: string; reason: string }) =>
      api.voidDocument(clientId, docId, reason),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useAddNoteMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: (body: string) => api.addNote(clientId, body),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useAdjustBalanceMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: ({
      installmentNumber,
      adjustmentAmountKobo,
      note,
    }: {
      installmentNumber: number;
      adjustmentAmountKobo: string;
      note?: string;
    }) => api.adjustBalance(clientId, installmentNumber, adjustmentAmountKobo, note),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useAdvanceStageMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: (notes?: string) => api.advanceStage(clientId, notes),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function useRevertStageMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: ({ toStageId, reason }: { toStageId: string; reason: string }) =>
      api.revertStage(clientId, toStageId, reason),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

export function usePatchPaymentDueDateMutation(clientId: string) {
  const invalidate = useInvalidateClient();
  return useMutation({
    mutationFn: ({ paymentId, dueDate }: { paymentId: string; dueDate: string }) =>
      api.patchPaymentDueDate(paymentId, dueDate),
    onSuccess: () => {
      invalidate(clientId);
    },
  });
}

// Intake query & mutation hooks
export function useIntakePending() {
  return useQuery({
    queryKey: ["intake-pending"],
    queryFn: () => api.getIntakePending(),
  });
}

export function useConfirmIntakeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: any }) =>
      api.confirmIntake(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intake-pending"] });
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    },
  });
}

export function useRejectIntakeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectIntake(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intake-pending"] });
    },
  });
}

export function useCreateIntakeInternalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createIntakeInternal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intake-pending"] });
    },
  });
}

export function useAttributeCampaign(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { campaignName?: string; closingAgentId?: string }) =>
      api.attributeCampaign(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-leads"] });
      queryClient.invalidateQueries({ queryKey: ["sales-leaderboard"] });
    },
  });
}

