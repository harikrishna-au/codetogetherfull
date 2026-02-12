import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/index.js';
export declare class SocketService {
    private io;
    private connectedUsers;
    private socketUsers;
    constructor(io: Server<ClientToServerEvents, ServerToClientEvents>);
    private setupSocketHandlers;
    private handleConnection;
    private setupEventHandlers;
    private updateUserSocketConnection;
    private handleJoinRoom;
    private handleJoinQueue;
    private handleRejoinQueue;
    private handleChatMessage;
    private handleCodeChange;
    private handleFetchChatHistory;
    private handleGetRoomQuestion;
    private handleDisconnection;
    notifyUser(userId: string, event: string, data: any): Promise<boolean>;
    notifyRoom(roomId: string, event: string, data: any): Promise<void>;
    getConnectedUserCount(): number;
    getConnectedUsers(): string[];
    isUserConnected(userId: string): boolean;
}
//# sourceMappingURL=SocketService.d.ts.map