import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimitByUser: (maxRequests: number, windowMs: number) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authenticateSocket: (token: string) => Promise<any>;
//# sourceMappingURL=auth.d.ts.map