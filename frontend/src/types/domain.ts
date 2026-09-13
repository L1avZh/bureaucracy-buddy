/**
 * Domain model types mirrored from the backend's Pydantic schemas
 * (see ../../../backend/app/schemas/). These are the canonical TypeScript
 * shapes; zod schemas in `src/schemas/*` validate that runtime responses
 * actually match them.
 */

export type Locale = "en" | "he";
export type ThemePreference = "light" | "dark" | "system";

export type ProcessCategory =
  | "government"
  | "tax"
  | "healthcare"
  | "employment"
  | "education"
  | "housing"
  | "vehicles"
  | "banking"
  | "immigration"
  | "other";

export type ProcessStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "action_required"
  | "completed"
  | "cancelled";

export type ProcessPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "done" | "skipped";

export type ReminderRelatedType = "process" | "task" | "document" | "custom";
export type ReminderStatus = "pending" | "dismissed" | "done";

export type SourceAddedBy = "system" | "user";

export type AiProvider = "mock" | "openai";
export type AiRole = "user" | "assistant" | "system";

export type AiConfidence = "ai_generated";

export interface User {
  id: string;
  email: string;
  display_name: string;
  locale: Locale;
  theme: ThemePreference;
  created_at: string;
}

export interface ExternalLink {
  label: string;
  url: string;
}

export interface Process {
  id: string;
  user_id: string;
  title: string;
  category: ProcessCategory;
  description: string | null;
  status: ProcessStatus;
  priority: ProcessPriority;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Task {
  id: string;
  process_id: string;
  title: string;
  explanation: string | null;
  status: TaskStatus;
  order_index: number;
  deadline: string | null;
  estimated_minutes: number | null;
  external_links: ExternalLink[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Document {
  id: string;
  user_id: string;
  process_id: string | null;
  title: string;
  category: ProcessCategory | string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  expires_at: string | null;
  notes: string | null;
  uploaded_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  related_type: ReminderRelatedType;
  related_id: string | null;
  title: string;
  remind_at: string;
  status: ReminderStatus;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  process_id: string | null;
  task_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  organization: string;
  country: string | null;
  category: ProcessCategory | string;
  last_verified_at: string;
  added_by: SourceAddedBy;
  user_id: string | null;
}

export interface AiMessage {
  role: AiRole;
  content: string;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  process_id: string | null;
  title: string;
  messages: AiMessage[];
  provider: AiProvider;
  created_at: string;
  updated_at: string;
}

export interface ApiErrorBody {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "CONFLICT"
      | "RATE_LIMITED"
      | "INTERNAL_ERROR";
    message: string;
    details: unknown[];
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface SearchResultItem {
  id: string;
  type: "process" | "task" | "document" | "note" | "source";
  title: string;
  snippet: string | null;
  url: string | null;
}

export interface SearchResults {
  processes: SearchResultItem[];
  tasks: SearchResultItem[];
  documents: SearchResultItem[];
  notes: SearchResultItem[];
  sources: SearchResultItem[];
}

export interface AiChecklistTask {
  title: string;
  explanation: string;
  estimated_minutes: number | null;
  confidence: AiConfidence;
}

export interface AiChecklistDocument {
  title: string;
  category: string;
  confidence: AiConfidence;
}

export interface AiChecklistResponse {
  process: {
    title: string;
    category: ProcessCategory;
    description: string;
    priority: ProcessPriority;
    confidence: AiConfidence;
  };
  tasks: AiChecklistTask[];
  documents: AiChecklistDocument[];
  questions: string[];
  disclaimer: string;
  provider: AiProvider;
}

export interface AiChatResponse {
  conversation_id: string;
  reply: string;
  messages: AiMessage[];
  disclaimer: string;
  provider: AiProvider;
}

export interface ExportData {
  user: User;
  processes: Process[];
  tasks: Task[];
  documents: Document[];
  reminders: Reminder[];
  notes: Note[];
  sources: Source[];
  documents_note: string;
}

export interface HealthResponse {
  status: "ok";
  version: string;
}
