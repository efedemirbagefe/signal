import type { JiraConfig, SprintItem } from "./types";

interface RawSignal {
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
}

export async function fetchJiraIssues(config: JiraConfig): Promise<RawSignal[]> {
  const { domain, email, api_token, project_key, last_sync } = config;
  const credentials = Buffer.from(`${email}:${api_token}`).toString("base64");
  const headers = {
    "Authorization": `Basic ${credentials}`,
    "Accept": "application/json",
  };

  let jql = `project=${project_key} ORDER BY created DESC`;
  if (last_sync) {
    const date = new Date(last_sync).toISOString().split("T")[0];
    jql = `project=${project_key} AND created>="${date}" ORDER BY created DESC`;
  }

  const params = new URLSearchParams({
    jql,
    maxResults: "100",
    fields: "summary,description,status,priority,assignee,created,issuetype",
  });

  const res = await fetch(`https://${domain}/rest/api/3/search?${params}`, { headers });
  if (!res.ok) {
    throw new Error(`Jira API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { issues?: JiraIssue[] };
  const issues: JiraIssue[] = data.issues ?? [];

  return issues.map((issue) => ({
    channel: `jira-${project_key}`,
    sender: issue.fields.assignee?.emailAddress ?? "unassigned",
    content: `[${issue.key}] ${issue.fields.summary}\n\n${extractADFText(issue.fields.description)}`.trim(),
    timestamp: issue.fields.created,
  }));
}

export async function fetchJiraCurrentSprint(config: JiraConfig): Promise<SprintItem[]> {
  const { domain, email, api_token, project_key } = config;
  const credentials = Buffer.from(`${email}:${api_token}`).toString("base64");
  const headers = {
    "Authorization": `Basic ${credentials}`,
    "Accept": "application/json",
  };

  try {
    // Step 1: Get board
    const boardRes = await fetch(
      `https://${domain}/rest/agile/1.0/board?projectKeyOrId=${project_key}`,
      { headers }
    );
    if (!boardRes.ok) return [];
    const boardData = await boardRes.json() as { values?: { id: number }[] };
    const boardId = boardData.values?.[0]?.id;
    if (!boardId) return [];

    // Step 2: Get active sprint
    const sprintRes = await fetch(
      `https://${domain}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
      { headers }
    );
    if (!sprintRes.ok) return [];
    const sprintData = await sprintRes.json() as { values?: { id: number }[] };
    const sprintId = sprintData.values?.[0]?.id;
    if (!sprintId) return [];

    // Step 3: Get sprint issues
    const issuesRes = await fetch(
      `https://${domain}/rest/agile/1.0/sprint/${sprintId}/issue?fields=summary,status,priority,issuetype&maxResults=50`,
      { headers }
    );
    if (!issuesRes.ok) return [];
    const issuesData = await issuesRes.json() as { issues?: JiraIssue[] };

    return (issuesData.issues ?? []).map((issue) => ({
      id: issue.id,
      key: issue.key,
      title: issue.fields.summary,
      status: issue.fields.status?.name ?? "Unknown",
      priority: issue.fields.priority?.name ?? "Medium",
      type: issue.fields.issuetype?.name ?? "Task",
    }));
  } catch {
    // Agile API not available on next-gen/team-managed projects — return empty
    return [];
  }
}

// Recursively extract plain text from Atlassian Document Format (ADF)
function extractADFText(node: ADFNode | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  const children = node.content ?? [];
  return children.map(extractADFText).join(" ").replace(/\s+/g, " ").trim();
}

interface ADFNode {
  type: string;
  text?: string;
  content?: ADFNode[];
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: ADFNode | null;
    status: { name: string };
    priority: { name: string } | null;
    assignee: { emailAddress: string } | null;
    created: string;
    issuetype: { name: string };
  };
}
