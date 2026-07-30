// Point the frontend at a hosted backend by setting VITE_API_URL
// (e.g. https://your-backend.onrender.com). Defaults to the local dev proxy.
const API = import.meta.env.VITE_API_URL || "/api";

// Resolves a stored file reference to a usable URL. Uploads are stored as
// absolute Vercel Blob URLs, so they are returned unchanged.
export function fileUrl(p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p;
  try {
    return import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin + p : p;
  } catch {
    return p;
  }
}

function getToken() {
  return localStorage.getItem("hoodrelief_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("hoodrelief_token", token);
  else localStorage.removeItem("hoodrelief_token");
}

export function getStoredToken() {
  return getToken();
}

async function request(path, opts = {}) {
  const token = getToken();
  const headers = { ...opts.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }
  let res;
  try {
    res = await fetch(`${API}${path}`, { ...opts, headers });
  } catch {
    throw new Error("Cannot reach the server — check your connection and try again");
  }
  // A non-JSON reply means we hit a 404 page or a dead proxy, not the API.
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error("Server unavailable — the API backend is not reachable right now");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth
export async function authNonce(walletAddress) {
  return request("/auth/nonce", { method: "POST", body: { walletAddress } });
}

export async function authVerify(walletAddress, signature) {
  return request("/auth/verify", { method: "POST", body: { walletAddress, signature } });
}

export async function completeProfile(name, location, bio) {
  return request("/auth/complete-profile", { method: "POST", body: { name, location, bio } });
}

// Users
export async function getMe() {
  return request("/users/me");
}

export async function updateMe(data) {
  return request("/users/me", { method: "PATCH", body: data });
}

export async function uploadPhoto(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/users/me/photo", { method: "POST", body: form });
}

// Requests
export async function createRequest(data) {
  return request("/requests", { method: "POST", body: data });
}

export async function getRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/requests?${qs}`);
}

export async function getRequest(id) {
  return request(`/requests/${id}`);
}

export async function getMyRequests() {
  return request("/requests/mine/list");
}

export async function uploadEvidence(requestId, files) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  return request(`/requests/${requestId}/evidence`, { method: "POST", body: form });
}

export async function castVote(requestId, choice) {
  return request(`/requests/${requestId}/vote`, { method: "POST", body: { choice } });
}

export async function getVoteSummary(requestId) {
  return request(`/requests/${requestId}/votes/summary`);
}

export async function flagRequest(requestId, reason) {
  return request(`/requests/${requestId}/flag`, { method: "POST", body: { reason } });
}

export async function getMyVotes() {
  return request("/users/me/votes");
}

// Comments
export async function getComments(requestId) {
  return request(`/requests/${requestId}/comments`);
}

export async function addComment(requestId, body) {
  return request(`/requests/${requestId}/comments`, { method: "POST", body: { body } });
}

// Ledger & Pool
export async function getLedger(page = 1) {
  return request(`/ledger?page=${page}`);
}

export async function getPoolStats() {
  return request("/pool/stats");
}

// Donations
export async function confirmDonation(amount, txHash) {
  return request("/donations/confirm", { method: "POST", body: { amount, txHash } });
}

export async function getRecentDonations() {
  return request("/donations/recent");
}

export async function getLeaderboard() {
  return request("/donations/leaderboard");
}

// Admin
export async function getAdminOverview() {
  return request("/admin/overview");
}

export async function getAdminUsers() {
  return request("/admin/users");
}

export async function getAdminDonations() {
  return request("/admin/donations");
}

export async function getAdminLogs() {
  return request("/admin/logs");
}

export async function getAdminFlags() {
  return request("/admin/flags");
}

export async function getAdminRequests(status = "Passed") {
  return request(`/admin/requests?status=${status}`);
}

export async function releaseRequest(id, payoutTxHash) {
  return request(`/admin/requests/${id}/release`, { method: "POST", body: { payoutTxHash } });
}

export async function rejectRequest(id, reason) {
  return request(`/admin/requests/${id}/reject`, { method: "POST", body: { reason } });
}
