// src/lib/api.ts
// Centralized API endpoint definitions

const API_BASE_URL = "http://localhost:4000/api";

export const API_ENDPOINTS = {
  SESSION_LOGIN: `${API_BASE_URL}/session/login`,
  SESSION_LOGOUT: `${API_BASE_URL}/session/logout`,
  QUEUE_COUNT: `${API_BASE_URL}/queue-count`,
  CANCEL_QUEUE: `${API_BASE_URL}/matchmaking/cancel-queue`,
  END_ROOM: `${API_BASE_URL}/session/end-room`,
  HEARTBEAT: `${API_BASE_URL}/heartbeat`,
  USER_INACTIVE: `${API_BASE_URL}/user-inactive`,
  ACTIVE_USERS: `${API_BASE_URL}/active-users`,
  VALIDATE_SESSION: `${API_BASE_URL}/validate-session`,
};
