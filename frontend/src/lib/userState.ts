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

export async function fetchUserState(userId: string): Promise<UserStateData | null> {
  try {
    const response = await fetch(`http://localhost:4000/api/users/${userId}/state`, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user state:', error);
    return null;
  }
}
