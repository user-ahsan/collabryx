/**
 * Notification Engine Service
 * Server-side notification delivery using Supabase service_role client.
 * Bypasses RLS for system-level notification operations.
 *
 * @module services/notification-engine
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";
import type { NotificationPreference } from "@/types/database.types";

const log = logger.app;

export const NotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["connect", "message", "like", "comment", "system", "match"]),
  content: z.string().min(1).max(500),
  actorId: z.string().uuid().optional(),
  actorName: z.string().max(100).optional(),
  actorAvatar: z.string().url().optional(),
  resourceType: z.enum(["post", "profile", "conversation", "match"]).optional(),
  resourceId: z.string().uuid().optional(),
});

export type NotificationInput = z.infer<typeof NotificationSchema>;

export interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export interface DigestResult {
  digestsQueued: number;
  digestsSent: number;
  digestsFailed: number;
  errors: string[];
}

export interface CleanupResult {
  notificationsDeleted: number;
  notificationsArchived: number;
  errors: string[];
}

/**
 * SECURITY: Service role client bypasses RLS policies.
 * All database operations through this client run with admin privileges.
 * Callers MUST pass a verified callerId (from auth.getUser()) for authorization
 * validation. Never expose this client to the browser.
 */
function getServiceClient() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Supabase service role credentials not configured");
  }
  return createSupabaseClient<import("@/types/database.types").Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
  );
}

/**
 * Verify the caller is authorized to send notifications to the target user.
 * - The caller ID must match actorId when actorId is provided
 * - Prevents impersonation: only the acting user can send as themselves
 */
function verifyCallerAuthorization(
  callerId: string,
  actorId?: string,
): { authorized: boolean; reason?: string } {
  if (actorId && callerId !== actorId) {
    return {
      authorized: false,
      reason: "Caller does not match actor — impersonation attempt blocked",
    };
  }
  return { authorized: true };
}

const TYPE_TO_PREF: Record<string, keyof NotificationPreference> = {
  connect: "email_new_connections",
  message: "email_messages",
  match: "ai_smart_match_alerts",
  like: "email_post_likes",
  comment: "email_comments",
  system: "push_enabled",
};

export interface SendNotificationOptions {
  /** The authenticated caller's user ID — required for authorization */
  callerId?: string;
}

export async function sendNotification(
  input: NotificationInput,
  options?: SendNotificationOptions,
): Promise<SendNotificationResult> {
  const validation = NotificationSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message };
  }

  // Authorization: verify the caller is authorized to act as the actor
  if (options?.callerId) {
    const auth = verifyCallerAuthorization(options.callerId, input.actorId);
    if (!auth.authorized) {
      log.warn("Notification auth blocked", { reason: auth.reason, userId: input.userId, callerId: options.callerId });
      return { success: false, error: auth.reason };
    }
  }

  const allowed = await checkNotificationPreferences(input.userId, input.type);
  if (!allowed) {
    return { success: true, error: "Notification disabled by user preferences" };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      content: input.content,
      actor_id: input.actorId,
      actor_name: input.actorName,
      actor_avatar: input.actorAvatar,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
    })
    .select("id")
    .single();

  if (error) {
    log.error("Failed to send notification", error, { userId: input.userId });
    return { success: false, error: error.message };
  }

  // Broadcast for real-time delivery (best-effort)
  try {
    const channel = supabase.channel(`notifications:user:${input.userId}`);
    channel.subscribe((_status: string) => {
      channel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: { id: data.id },
      });
    });
  } catch {
    // Best-effort broadcast - notification already persisted to DB
  }

  return { success: true, notificationId: data.id };
}

export async function sendBulkNotifications(
  inputs: NotificationInput[],
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const input of inputs) {
    const result = await sendNotification(input);
    if (result.success && result.notificationId) sent++;
    else { failed++; if (result.error) errors.push(result.error); }
  }
  return { sent, failed, errors };
}

export async function generateDigest(options?: {
  date?: string;
  batchSize?: number;
  dryRun?: boolean;
}): Promise<DigestResult> {
  const targetDate = options?.date ?? new Date().toISOString().split("T")[0];
  const batchSize = options?.batchSize ?? 100;
  const dryRun = options?.dryRun ?? false;

  const supabase = getServiceClient();
  const { data: unreadNotifications, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, content, created_at")
    .eq("is_read", false)
    .gte("created_at", `${targetDate}T00:00:00Z`)
    .lte("created_at", `${targetDate}T23:59:59Z`)
    .order("user_id")
    .limit(batchSize);

  if (error) {
    log.error("Failed to query unread notifications", error);
    return { digestsQueued: 0, digestsSent: 0, digestsFailed: 1, errors: [error.message] };
  }
  if (!unreadNotifications?.length) {
    return { digestsQueued: 0, digestsSent: 0, digestsFailed: 0, errors: [] };
  }

  const grouped = groupByUserAndType(unreadNotifications);
  let digestsSent = 0;
  let digestsFailed = 0;
  const errors: string[] = [];

  for (const [userId, typeCounts] of grouped) {
    if (dryRun) continue;
    const content = buildDigestContent(targetDate, typeCounts);
    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "system" as const,
      content,
    });
    if (insertError) { digestsFailed++; errors.push(`User ${userId}: ${insertError.message}`); }
    else digestsSent++;
  }

  return { digestsQueued: grouped.size, digestsSent, digestsFailed, errors };
}

export async function cleanupExpiredNotifications(options?: {
  olderThanDays?: number;
  batchSize?: number;
  dryRun?: boolean;
  userId?: string;
}): Promise<CleanupResult> {
  const olderThanDays = options?.olderThanDays ?? 30;
  const batchSize = options?.batchSize ?? 500;
  const dryRun = options?.dryRun ?? false;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const supabase = getServiceClient();
  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .lt("created_at", cutoffDate.toISOString());
  if (options?.userId) query = query.eq("user_id", options.userId);

  const { count, error: countError } = await query;
  if (countError) {
    log.error("Failed to count expired notifications", countError);
    return { notificationsDeleted: 0, notificationsArchived: 0, errors: [countError.message] };
  }
  if (dryRun || !count) {
    return { notificationsDeleted: 0, notificationsArchived: count ?? 0, errors: [] };
  }

  let deleted = 0;
  const errors: string[] = [];
  for (let offset = 0; offset < count; offset += batchSize) {
    // Fetch IDs first so we know exactly how many rows this batch will delete
    let fetchQ = supabase.from("notifications").select("id")
      .lt("created_at", cutoffDate.toISOString())
      .range(offset, offset + batchSize - 1);
    if (options?.userId) fetchQ = fetchQ.eq("user_id", options.userId);
    const { data: batchRows, error: fetchError } = await fetchQ;
    if (fetchError) { errors.push(`Batch ${offset}: ${fetchError.message}`); continue; }
    if (!batchRows?.length) break;

    const batchIds = batchRows.map((r) => r.id);
    const del = supabase.from("notifications").delete().in("id", batchIds);
    const { error: delError } = await del;
    if (delError) errors.push(`Batch ${offset}: ${delError.message}`);
    else deleted += batchIds.length;
  }

  return { notificationsDeleted: deleted, notificationsArchived: 0, errors };
}

export async function checkNotificationPreferences(
  userId: string,
  notificationType: string,
): Promise<boolean> {
  const prefColumn = TYPE_TO_PREF[notificationType];
  if (!prefColumn) return true;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(prefColumn)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return true;
    log.error("Failed to check notification preferences", error, { userId });
    return true;
  }

  return ((data as Record<string, unknown>)?.[prefColumn] as boolean) ?? true;
}

function groupByUserAndType(
  notifications: Array<{ user_id: string; type: string }>,
): Map<string, Map<string, number>> {
  const grouped = new Map<string, Map<string, number>>();
  for (const n of notifications) {
    if (!grouped.has(n.user_id)) grouped.set(n.user_id, new Map());
    const counts = grouped.get(n.user_id)!;
    counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
  }
  return grouped;
}

function buildDigestContent(date: string, typeCounts: Map<string, number>): string {
  const summary = Array.from(typeCounts.entries())
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");
  return `Daily digest (${date}): ${summary}`;
}
