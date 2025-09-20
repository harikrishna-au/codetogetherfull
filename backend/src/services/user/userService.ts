import { User } from '../../models/User';
import { User as IUser } from '../../types/auth';

class UserService {
  async findOrCreateUser(googleUserData: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<IUser> {
    try {
      // Try to find existing user by Google ID
      let user = await User.findByGoogleId(googleUserData.googleId);
      
      if (user) {
        // Update existing user with latest info from Google
        user.name = googleUserData.name;
        user.email = googleUserData.email;
        if (googleUserData.avatar) {
          user.avatar = googleUserData.avatar;
        }
        user.lastActive = new Date();
        user.isActive = true;
        await user.save();
        return user;
      }

      // Try to find by email (in case they had an account but different Google ID)
      user = await User.findByEmail(googleUserData.email);
      
      if (user) {
        // Update the Google ID for existing email user
        user.googleId = googleUserData.googleId;
        user.name = googleUserData.name;
        if (googleUserData.avatar) {
          user.avatar = googleUserData.avatar;
        }
        user.lastActive = new Date();
        user.isActive = true;
        await user.save();
        return user;
      }

      // Create new user
      user = new User({
        googleId: googleUserData.googleId,
        email: googleUserData.email,
        name: googleUserData.name,
        avatar: googleUserData.avatar,
        skillLevel: 'beginner',
        preferredLanguages: [],
        completedQuestions: [],
        totalSessions: 0,
        isActive: true,
        lastActive: new Date()
      });

      await user.save();
      return user;
    } catch (error) {
      console.error('Error finding or creating user:', error);
      throw new Error('Failed to find or create user');
    }
  }

  async updateUserDetails(userId: string, details: {
    username?: string;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
    preferredLanguages?: string[];
  }): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Update provided fields
      if (details.username !== undefined) {
        // Check if username is already taken
        const existingUser = await User.findOne({ 
          username: details.username, 
          _id: { $ne: userId } 
        });
        if (existingUser) {
          throw new Error('Username already taken');
        }
        user.username = details.username;
      }

      if (details.skillLevel) {
        user.skillLevel = details.skillLevel;
      }

      if (details.preferredLanguages) {
        user.preferredLanguages = details.preferredLanguages;
      }

      user.lastActive = new Date();
      await user.save();
      return user;
    } catch (error) {
      console.error('Error updating user details:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async setUserInactive(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      await user.setInactive();
      return true;
    } catch (error) {
      console.error('Error setting user inactive:', error);
      return false;
    }
  }

  async getActiveUsers(): Promise<IUser[]> {
    try {
      return await User.getActiveUsers();
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  async updateUserActivity(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      await user.updateActivity();
      return true;
    } catch (error) {
      console.error('Error updating user activity:', error);
      return false;
    }
  }

  async incrementUserSessions(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      user.totalSessions = (user.totalSessions || 0) + 1;
      await user.save();
      return true;
    } catch (error) {
      console.error('Error incrementing user sessions:', error);
      return false;
    }
  }

  async addCompletedQuestion(userId: string, questionId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      if (!user.completedQuestions) {
        user.completedQuestions = [];
      }

      if (!user.completedQuestions.includes(questionId)) {
        user.completedQuestions.push(questionId);
        await user.save();
      }

      return true;
    } catch (error) {
      console.error('Error adding completed question:', error);
      return false;
    }
  }
}

export const userService = new UserService();
export default userService;
