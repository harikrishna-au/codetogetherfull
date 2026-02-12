export declare class AuthService {
    static validateSession(userId: string): Promise<{
        user: any;
        dbUser: any;
    }>;
    static logoutUser(userId: string): Promise<void>;
    static getUserProfile(userId: string): Promise<any>;
    static updateUserPreferences(userId: string, preferences: any): Promise<void>;
}
//# sourceMappingURL=AuthService.d.ts.map