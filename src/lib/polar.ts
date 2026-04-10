import type { Workspace } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIAL_LIMIT = 10;
const PAST_DUE_GRACE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ─── Plan status gate ─────────────────────────────────────────────────────────

export interface PlanStatus {
  allowed: boolean;
  reason?: "trial_expired" | "trial_limit" | "payment_failed" | "no_plan";
  daysLeft?: number;
  runsLeft?: number;
}

/**
 * Determines whether a workspace is allowed to run an analysis.
 * Single source of truth for billing gates.
 */
export function getPlanStatus(workspace: Workspace): PlanStatus {
  const plan = workspace.plan ?? "trial";
  const now = Date.now();

  if (plan === "trial") {
    const trialEnds = workspace.trial_ends_at
      ? new Date(workspace.trial_ends_at).getTime()
      : now - 1; // treat missing as expired

    if (now > trialEnds) {
      return { allowed: false, reason: "trial_expired" };
    }

    const count = workspace.analysis_count ?? 0;
    if (count >= TRIAL_LIMIT) {
      return { allowed: false, reason: "trial_limit" };
    }

    const daysLeft = Math.ceil((trialEnds - now) / (24 * 60 * 60 * 1000));
    return { allowed: true, daysLeft, runsLeft: TRIAL_LIMIT - count };
  }

  if (plan === "pro" || plan === "past_due") {
    const status = workspace.polar_status;

    if (status === "active") {
      return { allowed: true };
    }

    if (status === "past_due") {
      // 3-day grace window after period ends
      const endsAt = workspace.polar_ends_at
        ? new Date(workspace.polar_ends_at).getTime()
        : 0;
      if (now < endsAt + PAST_DUE_GRACE_MS) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "payment_failed" };
  }

  // cancelled / expired / unknown
  return { allowed: false, reason: "no_plan" };
}
