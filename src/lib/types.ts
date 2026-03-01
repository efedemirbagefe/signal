export type SignalSource =
  | "slack" | "email" | "whatsapp"
  | "zendesk" | "intercom" | "jira"
  | "appstore" | "github" | "reddit";

export type Severity = "high" | "medium" | "low";
export type ClusterStatus = "active" | "reviewed" | "actioned" | "dismissed";
export type DeliveryChannel = "slack" | "whatsapp" | "email";
export type DeliveryStatus = "sent" | "failed" | "pending";

export interface Signal {
  id: string;
  workspace_id: string;
  source: SignalSource;
  channel: string;
  sender?: string;
  content: string;
  timestamp: string;
  sentiment?: "positive" | "negative" | "neutral";
  tags?: string[];
  reviewed: boolean;
  created_at: string;
}

export interface SourceBreakdown {
  slack: number;
  email: number;
  whatsapp: number;
  zendesk: number;
  intercom: number;
  jira: number;
  appstore: number;
  github: number;
  reddit: number;
}

export interface Cluster {
  id: string;
  workspace_id: string;
  title: string;
  severity: number; // 0-100
  severity_label: Severity;
  confidence: number; // 0-1
  evidence_count: number;
  source_breakdown: SourceBreakdown;
  business_case: string;
  recommended_action: string;
  customer_quote?: string;
  status: ClusterStatus;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  cluster_id: string;
  channel: DeliveryChannel;
  recipient: string;
  sent_at: string;
  status: DeliveryStatus;
  response?: string;
}

// ─── Integration Configs ──────────────────────────────────────────────────────

export interface ZendeskConfig {
  enabled: boolean;
  subdomain: string;
  email: string;
  api_token: string;
  last_sync: string | null;
}

export interface IntercomConfig {
  enabled: boolean;
  access_token: string;
  last_sync: string | null;
}

export interface JiraConfig {
  enabled: boolean;
  domain: string; // e.g. yourcompany.atlassian.net (no https://)
  email: string;
  api_token: string;
  project_key: string;
  last_sync: string | null;
}

export interface AppStoreConfig {
  enabled: boolean;
  app_id_ios: string;
  app_id_android: string;
  last_sync: string | null;
}

export interface GitHubConfig {
  enabled: boolean;
  token: string;
  owner: string;
  repo: string;
  last_sync: string | null;
}

export interface RedditConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  subreddits: string; // comma-separated: "r/typescript, r/nextjs"
  last_sync: string | null;
}

export interface IntegrationsConfig {
  zendesk: ZendeskConfig;
  intercom: IntercomConfig;
  jira: JiraConfig;
  appstore: AppStoreConfig;
  github: GitHubConfig;
  reddit: RedditConfig;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface WhatsAppConfig {
  enabled: boolean;
  webhook_verified: boolean;
  recipient_numbers: string[];
  critical_only: boolean;
}

export interface DistributionConfig {
  slack: {
    enabled: boolean;
    channels: string[];
    severity_threshold: Severity;
    schedule: "instant" | "hourly" | "daily";
  };
  whatsapp: {
    enabled: boolean;
    recipient_numbers: string[];
    critical_only: boolean;
  };
  email: {
    enabled: boolean;
    recipients: string[];
    schedule: "instant" | "daily" | "weekly";
  };
}

export interface Workspace {
  id: string;
  name: string;
  slack_token?: string;
  slack_team_id?: string;
  slack_monitored_channels?: string[];
  gmail_token?: string;
  gmail_refresh_token?: string;
  whatsapp_config?: WhatsAppConfig;
  distribution_config?: DistributionConfig;
  integrations_config?: IntegrationsConfig;
  created_at: string;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface IntentSnapshot {
  problem_statement: string;
  recommended_solution: string;
  acceptance_criteria: string[];
  success_metrics: string[];
  effort_estimate: string;
  cluster: Cluster;
}

export interface AnalysisResult {
  title: string;
  severity: number;
  confidence: number;
  evidence_count: number;
  source_breakdown: SourceBreakdown;
  business_case: string;
  recommended_action: string;
  customer_quote?: string;
}

// ─── Sprint (Jira) ────────────────────────────────────────────────────────────

export interface SprintItem {
  id: string;
  key?: string;
  title: string;
  status?: string;
  priority?: string;
  type?: string;
  category?: string;
}
