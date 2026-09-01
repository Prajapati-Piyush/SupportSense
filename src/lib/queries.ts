"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import * as adminApi from "./api/admin";
import * as ticketApi from "./api/tickets";
import type { DeskQueueFilters, User } from "./types";

/**
 * Query keys and hooks.
 *
 * §17 — polling rather than websockets: a ticket detail refetches every 3s while
 * the pipeline is running, and the desk queue every 10s. Drafts take 2–5s, so a
 * realtime layer here would be complexity for an imperceptible gain.
 */

export const queryKeys = {
  customerTickets: (userId: string) => ["customer", "tickets", userId] as QueryKey,
  customerTicket: (userId: string, ticketId: string) =>
    ["customer", "ticket", userId, ticketId] as QueryKey,
  deskTickets: (userId: string, filters: DeskQueueFilters) =>
    ["desk", "tickets", userId, filters] as QueryKey,
  deskTicket: (userId: string, ticketId: string) => ["desk", "ticket", userId, ticketId] as QueryKey,
  documents: (tenantId: string) => ["admin", "documents", tenantId] as QueryKey,
  document: (tenantId: string, id: string) => ["admin", "document", tenantId, id] as QueryKey,
  promotions: (tenantId: string) => ["admin", "promotions", tenantId] as QueryKey,
  metrics: (tenantId: string, days: number) => ["admin", "metrics", tenantId, days] as QueryKey,
  evaluation: (tenantId: string) => ["admin", "evaluation", tenantId] as QueryKey,
  teams: (tenantId: string) => ["admin", "teams", tenantId] as QueryKey,
  people: (tenantId: string) => ["admin", "people", tenantId] as QueryKey,
};

const PROCESSING_POLL_MS = 3000;
const QUEUE_POLL_MS = 10_000;

/* -------------------------------------------------------------- customer */

export function useCustomerTickets() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.customerTickets(user.id),
    queryFn: () => ticketApi.listCustomerTickets(user),
    refetchInterval: (query) =>
      query.state.data?.some((t) => t.status === "AI_PROCESSING" || t.status === "NEW")
        ? PROCESSING_POLL_MS
        : false,
  });
}

export function useCustomerTicket(ticketId: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.customerTicket(user.id, ticketId),
    queryFn: () => ticketApi.getCustomerTicket(user, ticketId),
    refetchInterval: (query) =>
      query.state.data?.ticket.status === "AI_PROCESSING" ? PROCESSING_POLL_MS : false,
  });
}

export function useCreateTicket() {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; body: string; categoryHint?: string | null }) =>
      ticketApi.createTicket(user, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.customerTickets(user.id) });
    },
  });
}

export function useCustomerReply(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => ticketApi.addCustomerMessage(user, ticketId, body),
    onSuccess: () => invalidateTicket(client, user, ticketId),
  });
}

/* ------------------------------------------------------------------ desk */

export function useDeskTickets(filters: DeskQueueFilters) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.deskTickets(user.id, filters),
    queryFn: () => ticketApi.listDeskTickets(user, filters),
    refetchInterval: QUEUE_POLL_MS,
    placeholderData: (previous) => previous,
  });
}

export function useDeskSummary() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ["desk", "summary", user.id],
    queryFn: () => ticketApi.getDeskSummary(user),
    refetchInterval: QUEUE_POLL_MS,
  });
}

export function useDeskTicket(ticketId: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.deskTicket(user.id, ticketId),
    queryFn: () => ticketApi.getDeskTicket(user, ticketId),
    refetchInterval: (query) =>
      query.state.data?.ticket.status === "AI_PROCESSING" ? PROCESSING_POLL_MS : false,
  });
}

function invalidateTicket(
  client: ReturnType<typeof useQueryClient>,
  user: User,
  ticketId: string,
) {
  client.invalidateQueries({ queryKey: queryKeys.deskTicket(user.id, ticketId) });
  client.invalidateQueries({ queryKey: queryKeys.customerTicket(user.id, ticketId) });
  client.invalidateQueries({ queryKey: ["desk", "tickets"] });
  client.invalidateQueries({ queryKey: ["desk", "summary"] });
  client.invalidateQueries({ queryKey: ["customer", "tickets"] });
}

export function useReviewDraft(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ticketApi.ReviewInput) => ticketApi.reviewDraft(user, ticketId, input),
    onSuccess: () => invalidateTicket(client, user, ticketId),
  });
}

export function useManualReply(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => ticketApi.manualReply(user, ticketId, body),
    onSuccess: () => invalidateTicket(client, user, ticketId),
  });
}

export function useResolveTicket(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (addToKb: boolean) => ticketApi.resolveTicket(user, ticketId, addToKb),
    onSuccess: () => {
      invalidateTicket(client, user, ticketId);
      client.invalidateQueries({ queryKey: queryKeys.promotions(user.tenantId) });
      client.invalidateQueries({ queryKey: queryKeys.documents(user.tenantId) });
    },
  });
}

export function useReopenTicket(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => ticketApi.reopenTicket(user, ticketId),
    onSuccess: () => invalidateTicket(client, user, ticketId),
  });
}

export function useAssignTeam(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => ticketApi.assignTeam(ticketId, teamId),
    onSuccess: () => invalidateTicket(client, user, ticketId),
  });
}

export function useClaimTicket(ticketId: string) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => ticketApi.claimTicket(user, ticketId),
    onSuccess: () => invalidateTicket(client, user, ticketId),
  });
}

/* ----------------------------------------------------------------- admin */

export function useDocuments() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.documents(user.tenantId),
    queryFn: () => adminApi.listDocuments(user),
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === "QUEUED" || d.status === "PROCESSING")
        ? PROCESSING_POLL_MS
        : false,
  });
}

export function useDocument(id: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.document(user.tenantId, id),
    queryFn: () => adminApi.getDocument(user, id),
    refetchInterval: (query) =>
      query.state.data && (query.state.data.status === "QUEUED" || query.state.data.status === "PROCESSING")
        ? PROCESSING_POLL_MS
        : false,
  });
}

function useDocumentMutation<TInput>(fn: (input: TInput) => Promise<unknown>) {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.documents(user.tenantId) });
      client.invalidateQueries({ queryKey: ["admin", "document", user.tenantId] });
    },
  });
}

export function useUploadDocument() {
  const user = useCurrentUser();
  return useDocumentMutation((input: { title: string; content: string }) =>
    adminApi.uploadDocument(user, input),
  );
}

export function useArchiveDocument() {
  return useDocumentMutation((id: string) => adminApi.archiveDocument(id));
}

export function useRestoreDocument() {
  return useDocumentMutation((id: string) => adminApi.restoreDocument(id));
}

export function useReingestDocument() {
  return useDocumentMutation((id: string) => adminApi.reingestDocument(id));
}

export function usePromotionCandidates() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.promotions(user.tenantId),
    queryFn: () => adminApi.listPromotionCandidates(user),
  });
}

export function usePromoteTicket() {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => adminApi.promoteTicket(user, ticketId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.promotions(user.tenantId) });
      client.invalidateQueries({ queryKey: queryKeys.documents(user.tenantId) });
    },
  });
}

export function useDismissPromotion() {
  const user = useCurrentUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => adminApi.dismissPromotion(ticketId),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.promotions(user.tenantId) }),
  });
}

export function useMetrics(days: number) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.metrics(user.tenantId, days),
    queryFn: () => adminApi.getMetrics(user, days),
  });
}

export function useEvaluation() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.evaluation(user.tenantId),
    queryFn: () => adminApi.getLatestEval(user),
  });
}

export function useTeams() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.teams(user.tenantId),
    queryFn: () => adminApi.listTeams(user),
  });
}

export function usePeople() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.people(user.tenantId),
    queryFn: () => adminApi.listTenantUsers(user),
  });
}
