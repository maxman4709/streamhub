const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';
const TOKEN_KEY = 'streamhub_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// local-only per-browser sets for like/save/watch-later — no backend needed,
// just toggled chips that persist across visits via localStorage
function loadIdSet(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set(raw.map(String));
  } catch {
    return new Set();
  }
}
function saveIdSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}
function makeToggleSet(key) {
  return {
    has: (id) => loadIdSet(key).has(String(id)),
    toggle: (id) => {
      const set = loadIdSet(key);
      const sid = String(id);
      if (set.has(sid)) set.delete(sid); else set.add(sid);
      saveIdSet(key, set);
      return set.has(sid);
    },
    all: () => [...loadIdSet(key)],
  };
}
export const likedVideos = makeToggleSet('streamhub_liked');
export const savedVideos = makeToggleSet('streamhub_saved');
export const watchLaterVideos = makeToggleSet('streamhub_watch_later');

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event('streamhub:session-expired'));
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }).catch(() => {}),

  getVideos: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request(`/videos${suffix}`);
  },
  getVideo: (id) => request(`/videos/${id}`),
  registerView: (id) => request(`/videos/${id}/view`, { method: 'POST' }),
  createVideo: (data) => request('/videos', { method: 'POST', body: JSON.stringify(data) }),
  updateVideo: (id, data) => request(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  getCreators: () => request('/creators'),
  createCreator: (data) => request('/creators', { method: 'POST', body: JSON.stringify(data) }),
  updateCreator: (id, data) => request(`/creators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCreator: (id) => request(`/creators/${id}`, { method: 'DELETE' }),

  getActors: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request(`/actors${suffix}`);
  },
  getActor: (id) => request(`/actors/${id}`),
  createActor: (data) => request('/actors', { method: 'POST', body: JSON.stringify(data) }),
  updateActor: (id, data) => request(`/actors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteActor: (id) => request(`/actors/${id}`, { method: 'DELETE' }),

  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

export function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const DIRECT_MEDIA_RE = /\.(mp4|webm|ogg|m3u8|mov)(\?.*)?$/i;

// true when the URL points straight at a media file the <video> tag can play;
// false for webpage links (YouTube, Vimeo, Telegram posts, etc.) that should
// instead be opened in a new tab so the source site's own player handles it
export function isDirectMediaUrl(url) {
  return DIRECT_MEDIA_RE.test(url || '');
}

export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}
