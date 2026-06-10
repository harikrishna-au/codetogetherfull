// src/lib/api.ts
// Centralized API endpoint definitions

// Use relative path for proxying in dev, or absolute env var in prod
const API_BASE_URL = "/api";

export const API_ENDPOINTS = {
  SESSION_LOGIN: `${API_BASE_URL}/session/login`,
  SESSION_LOGOUT: `${API_BASE_URL}/session/logout`,
  QUEUE_COUNT: `${API_BASE_URL}/queue/count`,
  CANCEL_QUEUE: `${API_BASE_URL}/queue/cancel`,
  END_ROOM: `${API_BASE_URL}/session/end-room`,
  HEARTBEAT: `${API_BASE_URL}/users/heartbeat`,
  USER_INACTIVE: `${API_BASE_URL}/users/inactive`,
  ACTIVE_USERS: `${API_BASE_URL}/active-users`,
  VALIDATE_SESSION: `${API_BASE_URL}/session/validate`,
  EXECUTE: `${API_BASE_URL}/execute`,
  SESSION_RESULTS: `${API_BASE_URL}/session/results`,
  SAVE_SESSION_RESULTS: `${API_BASE_URL}/session/save-results`,
  USER_STATS: `${API_BASE_URL}/users/stats`,
  USER_HISTORY: `${API_BASE_URL}/users/history`,
  USERS_BASE: `${API_BASE_URL}/users`,
  LEADERBOARD: `${API_BASE_URL}/leaderboard`,
};
