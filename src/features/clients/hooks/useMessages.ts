import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as msgApi from "../../../api/endpoints/messages";

export function useClientMessages(clientId: string | null, params?: { limit?: number }) {
  return useQuery({
    queryKey: ["client-messages", clientId, params],
    queryFn: () => msgApi.getClientMessages(clientId!, params),
    enabled: !!clientId,
  });
}

export function useDraftMessageMutation(clientId: string) {
  return useMutation({
    mutationFn: (payload: msgApi.DraftMessagePayload) => msgApi.draftMessage(clientId, payload),
  });
}

export function useSaveMessageMutation(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: msgApi.SaveMessagePayload) => msgApi.saveClientMessage(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-messages", clientId] });
      queryClient.invalidateQueries({ queryKey: ["global-messages"] });
    },
  });
}

export function useSendMessageMutation(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, payload }: { messageId: string; payload: msgApi.SendMessagePayload }) =>
      msgApi.sendClientMessage(clientId, messageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-messages", clientId] });
      queryClient.invalidateQueries({ queryKey: ["global-messages"] });
    },
  });
}

export function useGlobalMessages(enabled: boolean = true) {
  return useQuery({
    queryKey: ["global-messages"],
    queryFn: () => msgApi.getGlobalMessages(),
    enabled,
  });
}
