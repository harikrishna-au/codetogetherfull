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
};
