import type { BadgeVariant } from "@/components/ui/Badge";
import type { ProcessCategory, ProcessPriority, ProcessStatus, TaskStatus } from "@/types/domain";

export const PROCESS_CATEGORIES: ProcessCategory[] = [
  "government",
  "tax",
  "healthcare",
  "employment",
  "education",
  "housing",
  "vehicles",
  "banking",
  "immigration",
  "other",
];

export const PROCESS_STATUSES: ProcessStatus[] = [
  "not_started",
  "in_progress",
  "waiting",
  "action_required",
  "completed",
  "cancelled",
];

export const PROCESS_PRIORITIES: ProcessPriority[] = ["low", "medium", "high"];

export const STATUS_BADGE_VARIANT: Record<ProcessStatus, BadgeVariant> = {
  not_started: "neutral",
  in_progress: "info",
  waiting: "warning",
  action_required: "danger",
  completed: "success",
  cancelled: "neutral",
};

export const PRIORITY_BADGE_VARIANT: Record<ProcessPriority, BadgeVariant> = {
  low: "neutral",
  medium: "info",
  high: "warning",
};

export const TASK_STATUS_BADGE_VARIANT: Record<TaskStatus, BadgeVariant> = {
  todo: "neutral",
  done: "success",
  skipped: "warning",
};

/** Category -> a simple emoji glyph, used as a lightweight visual anchor on cards. No icon library needed. */
export const CATEGORY_EMOJI: Record<ProcessCategory, string> = {
  government: "\u{1F3DB}\u{FE0F}",
  tax: "\u{1F4B0}",
  healthcare: "\u{1FA7A}",
  employment: "\u{1F4BC}",
  education: "\u{1F393}",
  housing: "\u{1F3E0}",
  vehicles: "\u{1F697}",
  banking: "\u{1F3E6}",
  immigration: "\u{1F6C2}",
  other: "\u{1F4CB}",
};
