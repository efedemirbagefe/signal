import type { AppStoreConfig } from "./types";

interface RawSignal {
  channel: string;
  sender: string;
  content: string;
  timestamp: string;
}

export async function fetchAppStoreReviews(config: AppStoreConfig): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  // iOS — iTunes RSS feed (public, no auth required)
  if (config.app_id_ios) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/rss/customerreviews/id=${config.app_id_ios}/sortBy=mostRecent/page=1/json`,
        { headers: { "Accept": "application/json" } }
      );
      if (res.ok) {
        const data = await res.json() as { feed?: { entry?: AppStoreEntry[] } };
        // First entry is app metadata — skip it with slice(1)
        const entries: AppStoreEntry[] = (data.feed?.entry ?? []).slice(1);
        for (const entry of entries) {
          const rating = entry["im:rating"]?.label ?? "?";
          const title = entry.title?.label ?? "";
          const body = entry.content?.label ?? "";
          const author = entry.author?.name?.label ?? "anonymous";
          const updated = entry.updated?.label ?? new Date().toISOString();
          signals.push({
            channel: `appstore-ios-${config.app_id_ios}`,
            sender: author,
            content: `[${rating}/5] ${title}: ${body}`.trim(),
            timestamp: new Date(updated).toISOString(),
          });
        }
      }
    } catch (e) {
      console.error("App Store iOS fetch error:", e);
    }
  }

  // Android (Google Play) — no reliable public API without google-play-scraper package.
  // Add app_id_android to config for future use when that dependency is approved.
  if (config.app_id_android) {
    console.warn(
      "Google Play reviews require the google-play-scraper npm package. " +
      "Android reviews are not fetched in this version."
    );
  }

  return signals;
}

interface AppStoreEntry {
  "im:rating"?: { label: string };
  title?: { label: string };
  content?: { label: string };
  author?: { name?: { label: string } };
  updated?: { label: string };
  id?: { label: string };
}
