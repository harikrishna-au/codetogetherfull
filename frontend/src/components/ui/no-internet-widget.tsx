import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';

const NoInternetWidget: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDialog, setShowDialog] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowDialog(false);
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowDialog(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowDialog(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    // Try to make a test request to check connectivity
    try {
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      
      // If we reach here, we're likely online
      setIsOnline(true);
      setShowDialog(false);
      setIsReconnecting(false);
    } catch (error) {
      // Still offline
      setIsReconnecting(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Centered Dialog */}
      <Dialog open={showDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-red-500" />
              <span>No Internet Connection</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please check your internet connection and try again. Some features may not work properly without an active connection.
            </p>
            <Alert className="border-amber-200 bg-amber-50">
              <WifiOff className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                You're currently offline. Please reconnect to continue.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="w-full sm:w-auto"
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Try Reconnect
                </>
              )}
            </Button>
            <Button 
              onClick={handleRefresh}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay Component when offline */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:w-80">
          <Alert className="border-red-200 bg-red-50 shadow-lg">
            <WifiOff className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 pr-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">No internet connection</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="h-6 px-2 text-xs text-red-700 hover:text-red-800 hover:bg-red-100"
                >
                  {isReconnecting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    'Retry'
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default NoInternetWidget;
