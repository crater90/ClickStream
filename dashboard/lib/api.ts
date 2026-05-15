const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Session {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_seen: string;
  last_seen: string;
  pages_visited: number;
  duration_seconds: number;
}

export interface Event {
  _id: string;
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  click_x?: number;
  click_y?: number;
  viewport_width?: number;
  viewport_height?: number;
  referrer?: string;
}

export interface ClickPoint {
  click_x: number;
  click_y: number;
  viewport_width: number;
  viewport_height: number;
  timestamp: string;
  session_id: string;
}

export interface HeatmapData {
  page_url: string;
  total_clicks: number;
  clicks: ClickPoint[];
  available_pages: string[];
}

export interface PageStat {
  page_url: string;
  total_events: number;
  total_clicks: number;
  total_views: number;
  last_activity: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getSessions: () =>
    fetchJson<{ sessions: Session[] }>('/api/events/sessions'),

  getSessionEvents: (sessionId: string) =>
    fetchJson<{ session_id: string; events: Event[] }>(
      `/api/events/sessions/${encodeURIComponent(sessionId)}`
    ),

  getHeatmap: (pageUrl: string) =>
    fetchJson<HeatmapData>(
      `/api/events/heatmap?page_url=${encodeURIComponent(pageUrl)}`
    ),

  getPages: () =>
    fetchJson<{ pages: PageStat[] }>('/api/events/pages'),
};
