// User state is now managed by the backend API instead of Firestore
export type UserState = "na" | "waiting" | "matched" | "in-session";

export interface UserStateData {
  state: UserState;
  mode?: string;
  difficulty?: string;
  queueKey?: string;
  roomId?: string;
  updatedAt?: any;
}

import { API_ENDPOINTS } from './api';

export async function fetchUserState(userId: string, token?: string | null): Promise<UserStateData | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_ENDPOINTS.USERS_BASE}/${userId}/state`, {
      method: "GET",
      headers,
      credentials: 'include'
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user state:', error);
    return null;
  }
}
