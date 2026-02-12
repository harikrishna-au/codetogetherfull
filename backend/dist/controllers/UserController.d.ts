import { Response } from 'express';
export declare class UserController {
    static heartbeat: (req: any, res: Response, next: any) => void;
    static markInactive: (req: any, res: Response, next: any) => void;
    static getActiveUsers: (req: any, res: Response, next: any) => void;
    static getUserState: (req: any, res: Response, next: any) => void;
    static updateUserState: (req: any, res: Response, next: any) => void;
    static getQueueStats: (req: any, res: Response, next: any) => void;
    static cleanupInactiveUsers: (req: any, res: Response, next: any) => void;
}
//# sourceMappingURL=UserController.d.ts.map