import type { GitHubConfig } from "./types";

interface RawSignal {
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
  tags?: string[];
}

export async function fetchGitHubIssues(config: GitHubConfig): Promise<RawSignal[]> {
  const { token, owner, repo, last_sync } = config;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ObserverAI/1.0",
  };

  const params = new URLSearchParams({
    state: "open",
    sort: "created",
    direction: "desc",
    per_page: "100",
  });

  if (last_sync) {
    // GitHub `since` filters by updated_at — this may re-surface updated old issues, which is acceptable
    params.set("since", last_sync);
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?${params}`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const issues = await res.json() as GitHubIssue[];

  return issues
    // Filter out pull requests (GitHub returns PRs in issues endpoint by default)
    .filter((i) => !i.pull_request)
    .map((issue) => ({
      channel: `github-${owner}-${repo}`,
      sender: issue.user.login,
      content: `[#${issue.number}] ${issue.title}\n\n${issue.body ?? ""}`.trim(),
      timestamp: issue.created_at,
      tags: issue.labels.map((l) => l.name),
    }));
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  user: { login: string };
  labels: { name: string }[];
  created_at: string;
  pull_request?: unknown;
  reactions?: { total_count: number; "+1": number };
}
