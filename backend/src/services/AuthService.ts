import { env } from '@/config/env.js';
import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import { AuthenticationError, ValidationError } from '@/utils/errors.js';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export class AuthService {

  // Validate session (sync user from Clerk if needed)
  static async validateSession(userId: string): Promise<{ user: any; dbUser: any }> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Check if user exists in Supabase
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      let userEmail = '';
      let userDisplayName = '';

      if (error || !dbUser) {
        // Fetch user from Clerk to create in DB
        const clerkUser = await clerkClient.users.getUser(userId);
        userEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '';
        userDisplayName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userEmail;

        // Create new user in Supabase
        const { error: createError } = await supabase.from('users').insert({
          user_id: userId,
          email: userEmail,
          display_name: userDisplayName,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          preferences: {
            preferredDifficulty: 'Easy',
            preferredLanguage: 'javascript',
          }
        });

        if (createError) {
          logger.error('Failed to create user in Supabase:', createError);
          throw new Error('Failed to create user');
        }

        logger.info('New user synced from Clerk to Supabase', {
          userId,
          email: userEmail,
        });

        // Initialize UserState in Supabase
        await supabase.from('user_states').upsert({
          user_id: userId,
          state: 'idle',
          last_active: new Date().toISOString(),
          is_active: true
        });

      } else {
        // Update last login
        await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('user_id', userId);

        // Update UserState
        await supabase.from('user_states').upsert({
          user_id: userId,
          state: 'idle', // Or keep existing state? aligning with previous logic
          last_active: new Date().toISOString(),
          is_active: true
        }, { onConflict: 'user_id' }); // Upsert handles create or update

        userEmail = dbUser.email;
        userDisplayName = dbUser.display_name || '';
      }

      // Return a user object compatible with legacy types if needed
      const user = {
        userId,
        email: userEmail,
        displayName: userDisplayName,
      };

      return {
        user,
        dbUser: dbUser || { userId, email: userEmail, displayName: userDisplayName }, // Return minimal if created
      };
    } catch (error) {
      logger.error('Session validation failed:', error);
      throw error;
    }
  }

  // Logout user
  static async logoutUser(userId: string): Promise<void> {
    try {
      // Update user state to inactive
      await supabase.from('user_states').update({
        is_active: false,
        state: 'idle',
        socket_id: null,
        room_id: null,
        mode: null,
        difficulty: null,
        queue_joined_at: null,
        last_active: new Date().toISOString()
      }).eq('user_id', userId);

      logger.info('User logged out successfully', { userId });
    } catch (error) {
      logger.error('User logout failed:', error);
      throw error;
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select(`
          *,
          user_states (*),
          completed_questions (count),
          session_history (count)
        `)
        .eq('user_id', userId)
        .single();

      if (error || !dbUser) {
        throw new AuthenticationError('User not found');
      }

      const userState = dbUser.user_states ? (Array.isArray(dbUser.user_states) ? dbUser.user_states[0] : dbUser.user_states) : null;

      return {
        user: {
          userId: dbUser.user_id,
          email: dbUser.email,
          displayName: dbUser.display_name,
          createdAt: dbUser.created_at,
          lastLogin: dbUser.last_login,
          preferences: dbUser.preferences,
        },
        state: userState ? {
          state: userState.state,
          isActive: userState.is_active,
          lastActive: userState.last_active,
          roomId: userState.room_id,
        } : null,
        stats: {
          totalQuestionsCompleted: dbUser.completed_questions?.[0]?.count || 0, // Approx count from relational query
          totalSessions: dbUser.session_history?.[0]?.count || 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // Update user preferences
  static async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      // First get existing preferences to merge
      const { data: user } = await supabase.from('users').select('preferences').eq('user_id', userId).single();
      const currentPrefs = user?.preferences || {};

      const { error } = await supabase
        .from('users')
        .update({
          preferences: { ...currentPrefs, ...preferences }
        })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('User preferences updated', { userId, preferences });
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      throw error;
    }
  }
}