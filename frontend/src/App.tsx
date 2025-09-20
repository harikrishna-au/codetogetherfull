
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Matchmaking from "./pages/Matchmaking";
import { MatchmakingProvider } from "@/context/MatchmakingContext";
import CodingSession from "./pages/CodingSession";
import NotFound from "./pages/NotFound";
import React from "react";
import { getOrCreateSessionId } from "@/lib/session";
import { AuthProvider } from "@/context/AuthContext";

import { SessionAuthProvider } from "@/context/SessionAuthContext";
import { SocketProvider } from "@/context/SocketContext";
import NoInternetWidget from "@/components/ui/no-internet-widget";

const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SocketProvider>
          <SessionAuthProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/matchmaking" element={
                  <MatchmakingProvider>
                    <Matchmaking />
                  </MatchmakingProvider>
                } />
                <Route path="/session/:roomId" element={<CodingSession />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <NoInternetWidget />
          </SessionAuthProvider>
        </SocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
