import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { API_ENDPOINTS } from "@/lib/api";

const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export default function ActiveUserHeartbeat({ userId }: { userId: string }) {
  const [showIdleDialog, setShowIdleDialog] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef(Date.now());

  // Send heartbeat to backend
  const sendHeartbeat = async () => {
    try {
      await fetch(API_ENDPOINTS.HEARTBEAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      // Optionally handle error
    }
  };

  // Mark user as inactive when they leave
  const markUserInactive = async () => {
    try {
      await fetch(API_ENDPOINTS.USER_INACTIVE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      // Handle error silently
    }
  };

  // Reset idle timer on user activity
  const resetIdleTimer = () => {
    lastActivity.current = Date.now();
    if (showIdleDialog) setShowIdleDialog(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setShowIdleDialog(true);
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Send initial heartbeat when component mounts (user comes to app)
    sendHeartbeat();
    
    // Listen for user activity
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    // Cleanup when component unmounts or page unloads
    const handleBeforeUnload = () => {
      markUserInactive();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      // Mark user inactive when component unmounts
      markUserInactive();
    };
  }, []);

  useEffect(() => {
    // Heartbeat interval
    heartbeatTimer.current = setInterval(() => {
      if (!showIdleDialog) sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [showIdleDialog]);

  // When user confirms they're active, reset idle timer and send heartbeat
  const handleContinue = () => {
    setShowIdleDialog(false);
    resetIdleTimer();
    sendHeartbeat();
  };

  return (
    <Dialog open={showIdleDialog}>
      <DialogContent className="flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-semibold mb-2">Thank you for using our site!</h2>
        <p className="mb-4">Are you still there? Click below to continue your session.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleContinue}
        >
          I'm still active
        </button>
      </DialogContent>
    </Dialog>
  );
}
