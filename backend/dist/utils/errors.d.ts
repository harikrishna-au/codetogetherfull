import { Response } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number, code: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, _details?: any);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string);
}
export declare class ExternalServiceError extends AppError {
    constructor(message?: string);
}
export declare const sendErrorResponse: (res: Response, error: Error | AppError, requestId?: string) => void;
export declare const globalErrorHandler: (error: Error, req: any, res: Response, _next: any) => void;
export declare const asyncHandler: (fn: Function) => (req: any, res: Response, next: any) => void;
//# sourceMappingURL=errors.d.ts.map