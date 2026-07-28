const API = "/api";

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
  const res = await fetch(`${API}${path}`, { ...opts, headers });
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

// Admin
export async function getAdminRequests(status = "Passed") {
  return request(`/admin/requests?status=${status}`);
}

export async function releaseRequest(id, payoutTxHash) {
  return request(`/admin/requests/${id}/release`, { method: "POST", body: { payoutTxHash } });
}

export async function rejectRequest(id, reason) {
  return request(`/admin/requests/${id}/reject`, { method: "POST", body: { reason } });
}
