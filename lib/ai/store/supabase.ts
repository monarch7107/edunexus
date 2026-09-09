/**
 * Supabase implementations of the V2 ports.
 *
 * Defence in depth: every statement is filtered by `user_id` in addition
 * to the RLS policies in the migration. RLS is the authoritative boundary;
 * these filters make an application-level mistake fail closed too.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudySession, Subject, Task } from "../../types";
import { RepoError, toRepoError } from "../../repo/errors";
import type {
  AgentActionRecord,
  AgentApprovalRecord,
  AgentRunRecord,
  ChangeItemRecord,
  ChangeSetRecord,
  ChangeSetStatus,
  SessionWritePayload,
} from "../types";
import type { AcademicPort, AgentStore } from "./types";

type Client = SupabaseClient;

export class SupabaseAcademicPort implements AcademicPort {
  constructor(private client: Client) {}

  async listSubjects(userId: string): Promise<Subject[]> {
    const { data, error } = await this.client
      .from("subjects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw toRepoError(error, "Could not load your subjects.");
    return (data as Subject[]) ?? [];
  }

  async listTasks(userId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });
    if (error) throw toRepoError(error, "Could not load your tasks.");
    return (data as Task[]) ?? [];
  }

  async listSessions(userId: string): Promise<StudySession[]> {
    const { data, error } = await this.client
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("planned_date", { ascending: true });
    if (error) throw toRepoError(error, "Could not load your study sessions.");
    return (data as StudySession[]) ?? [];
  }

  async getSession(userId: string, id: string): Promise<StudySession | null> {
    const { data, error } = await this.client
      .from("study_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw toRepoError(error, "Could not load that study session.");
    return (data as StudySession | null) ?? null;
  }

  async createSession(
    userId: string,
    payload: SessionWritePayload,
  ): Promise<StudySession> {
    const { data, error } = await this.client
      .from("study_sessions")
      .insert({
        user_id: userId,
        subject_id: payload.subject_id,
        title: payload.title,
        planned_date: payload.planned_date,
        duration_minutes: payload.duration_minutes,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not plan the study session.");
    return data as StudySession;
  }

  async updateSession(
    userId: string,
    id: string,
    payload: SessionWritePayload,
  ): Promise<StudySession> {
    const { data, error } = await this.client
      .from("study_sessions")
      .update({
        subject_id: payload.subject_id,
        title: payload.title,
        planned_date: payload.planned_date,
        duration_minutes: payload.duration_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) throw toRepoError(error, "Could not update the study session.");
    if (!data) throw new RepoError("not-found", "Study session not found");
    return data as StudySession;
  }

  async deleteSession(userId: string, id: string): Promise<void> {
    const { data, error } = await this.client
      .from("study_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");
    if (error) throw toRepoError(error, "Could not delete the study session.");
    if (!data || data.length === 0) {
      throw new RepoError("not-found", "Study session not found");
    }
  }
}

export class SupabaseAgentStore implements AgentStore {
  constructor(private client: Client) {}

  async createRun(
    run: Omit<AgentRunRecord, "id" | "started_at"> & { id?: string },
  ): Promise<AgentRunRecord> {
    const { data, error } = await this.client
      .from("agent_runs")
      .insert({
        user_id: run.user_id,
        agent_type: run.agent_type,
        intent: run.intent,
        status: run.status,
        input_summary: run.input_summary,
        output_summary: run.output_summary,
        error_class: run.error_class,
        metadata: run.metadata,
        request_id: run.request_id,
        completed_at: run.completed_at,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not start the assistant run.");
    return data as AgentRunRecord;
  }

  async updateRun(
    userId: string,
    runId: string,
    patch: Partial<AgentRunRecord>,
  ): Promise<void> {
    const { error } = await this.client
      .from("agent_runs")
      .update(patch)
      .eq("id", runId)
      .eq("user_id", userId);
    if (error) throw toRepoError(error, "Could not update the assistant run.");
  }

  async getRun(userId: string, runId: string): Promise<AgentRunRecord | null> {
    const { data, error } = await this.client
      .from("agent_runs")
      .select("*")
      .eq("id", runId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw toRepoError(error, "Could not load the assistant run.");
    return (data as AgentRunRecord | null) ?? null;
  }

  async listRuns(userId: string, limit = 20): Promise<AgentRunRecord[]> {
    const { data, error } = await this.client
      .from("agent_runs")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw toRepoError(error, "Could not load agent activity.");
    return (data as AgentRunRecord[]) ?? [];
  }

  async recordAction(
    action: Omit<AgentActionRecord, "id" | "created_at"> & { id?: string },
  ): Promise<AgentActionRecord> {
    const { data, error } = await this.client
      .from("agent_actions")
      .insert({
        agent_run_id: action.agent_run_id,
        user_id: action.user_id,
        agent_type: action.agent_type,
        tool_name: action.tool_name,
        action_type: action.action_type,
        target_type: action.target_type,
        target_id: action.target_id,
        input_summary: action.input_summary,
        status: action.status,
        requires_approval: action.requires_approval,
        approved_at: action.approved_at,
        executed_at: action.executed_at,
        verified_at: action.verified_at,
        error_class: action.error_class,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not record the agent action.");
    return data as AgentActionRecord;
  }

  async updateAction(
    userId: string,
    actionId: string,
    patch: Partial<AgentActionRecord>,
  ): Promise<void> {
    const { error } = await this.client
      .from("agent_actions")
      .update(patch)
      .eq("id", actionId)
      .eq("user_id", userId);
    if (error) throw toRepoError(error, "Could not update the agent action.");
  }

  async listActions(userId: string, runId: string): Promise<AgentActionRecord[]> {
    const { data, error } = await this.client
      .from("agent_actions")
      .select("*")
      .eq("user_id", userId)
      .eq("agent_run_id", runId)
      .order("created_at", { ascending: true });
    if (error) throw toRepoError(error, "Could not load agent actions.");
    return (data as AgentActionRecord[]) ?? [];
  }

  async createChangeSet(
    changeSet: Omit<ChangeSetRecord, "id" | "created_at"> & { id?: string },
  ): Promise<ChangeSetRecord> {
    const { data, error } = await this.client
      .from("change_sets")
      .insert({
        agent_run_id: changeSet.agent_run_id,
        user_id: changeSet.user_id,
        title: changeSet.title,
        reason: changeSet.reason,
        status: changeSet.status,
        expires_at: changeSet.expires_at,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not prepare the proposed changes.");
    return data as ChangeSetRecord;
  }

  async getChangeSet(userId: string, id: string): Promise<ChangeSetRecord | null> {
    const { data, error } = await this.client
      .from("change_sets")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw toRepoError(error, "Could not load the proposed changes.");
    return (data as ChangeSetRecord | null) ?? null;
  }

  async updateChangeSetStatus(
    userId: string,
    id: string,
    status: ChangeSetStatus,
  ): Promise<void> {
    const { error } = await this.client
      .from("change_sets")
      .update({ status })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw toRepoError(error, "Could not update the proposed changes.");
  }

  async createChangeItems(
    changeSetId: string,
    userId: string,
    items: Omit<ChangeItemRecord, "id" | "change_set_id">[],
  ): Promise<ChangeItemRecord[]> {
    if (items.length === 0) return [];
    const { data, error } = await this.client
      .from("change_items")
      .insert(
        items.map((item) => ({
          change_set_id: changeSetId,
          user_id: userId,
          operation: item.operation,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          payload: item.payload,
          previous_state: item.previous_state,
          status: item.status,
          error: item.error,
          label: item.label,
          detail: item.detail,
          reason: item.reason,
        })),
      )
      .select("*");
    if (error) throw toRepoError(error, "Could not save the proposed changes.");
    return (data as ChangeItemRecord[]) ?? [];
  }

  async listChangeItems(
    userId: string,
    changeSetId: string,
  ): Promise<ChangeItemRecord[]> {
    const { data, error } = await this.client
      .from("change_items")
      .select("*")
      .eq("change_set_id", changeSetId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw toRepoError(error, "Could not load the proposed changes.");
    return (data as ChangeItemRecord[]) ?? [];
  }

  async updateChangeItem(
    userId: string,
    itemId: string,
    patch: Partial<ChangeItemRecord>,
  ): Promise<void> {
    const { error } = await this.client
      .from("change_items")
      .update(patch)
      .eq("id", itemId)
      .eq("user_id", userId);
    if (error) throw toRepoError(error, "Could not update the proposed change.");
  }

  async createApproval(
    approval: Omit<AgentApprovalRecord, "id"> & { id?: string },
  ): Promise<AgentApprovalRecord> {
    const { data, error } = await this.client
      .from("agent_approvals")
      .insert({
        agent_run_id: approval.agent_run_id,
        change_set_id: approval.change_set_id,
        user_id: approval.user_id,
        status: approval.status,
        reviewed_at: approval.reviewed_at,
        expires_at: approval.expires_at,
        change_fingerprint: approval.change_fingerprint,
      })
      .select("*")
      .single();
    if (error) throw toRepoError(error, "Could not record your approval.");
    return data as AgentApprovalRecord;
  }

  async getApprovalForChangeSet(
    userId: string,
    changeSetId: string,
  ): Promise<AgentApprovalRecord | null> {
    const { data, error } = await this.client
      .from("agent_approvals")
      .select("*")
      .eq("change_set_id", changeSetId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw toRepoError(error, "Could not load your approval.");
    return (data as AgentApprovalRecord | null) ?? null;
  }

  async updateApproval(
    userId: string,
    approvalId: string,
    patch: Partial<AgentApprovalRecord>,
  ): Promise<void> {
    const { error } = await this.client
      .from("agent_approvals")
      .update(patch)
      .eq("id", approvalId)
      .eq("user_id", userId);
    if (error) throw toRepoError(error, "Could not update your approval.");
  }
}
