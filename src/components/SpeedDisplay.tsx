
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, ShieldAlert, MapPinOff, CircleHelp } from 'lucide-react'; 
import { useAppContext } from '@/contexts/AppContext';

const SpeedDisplay: React.FC = () => {
  const { currentSpeed, isGpsSignalLost, gpsPermissionStatus, gpsError } = useAppContext();

  let displayContent;

  if (gpsPermissionStatus === 'unavailable') {
    displayContent = (
      <div className="flex flex-col items-center text-destructive">
        <MapPinOff className="h-10 w-10 mb-2" />
        <p className="text-xl font-semibold">GPS Not Supported</p>
        <p className="text-sm text-muted-foreground">{gpsError || "Your browser does not support geolocation."}</p>
      </div>
    );
  } else if (gpsPermissionStatus === 'denied') {
    displayContent = (
      <div className="flex flex-col items-center text-destructive">
        <ShieldAlert className="h-10 w-10 mb-2" />
        <p className="text-xl font-semibold">GPS Permission Denied</p>
        <p className="text-sm text-center text-muted-foreground px-2">{gpsError || "Please enable location services in your browser settings."}</p>
      </div>
    );
  } else if (gpsPermissionStatus === 'prompt' && !isGpsSignalLost) {
     displayContent = (
      <div className="flex flex-col items-center text-primary">
        <CircleHelp className="h-10 w-10 mb-2 animate-pulse" />
        <p className="text-xl font-semibold">Waiting for GPS...</p>
        <p className="text-sm text-muted-foreground">Allow location access to begin.</p>
      </div>
    );
  }
   else if (isGpsSignalLost) {
    displayContent = (
      <div className="flex flex-col items-center text-destructive">
        <MapPinOff className="h-10 w-10 mb-2 animate-pulse" />
        <p className="text-xl font-semibold">GPS Signal Lost</p>
        {gpsError && <p className="text-sm text-muted-foreground text-center px-2">{gpsError}</p>}
      </div>
    );
  } else {
    displayContent = (
      <p className="text-6xl font-bold text-primary">
        {currentSpeed} <span className="text-2xl font-medium text-muted-foreground">MPH</span>
      </p>
    );
  }

  return (
    <Card className="text-center shadow-lg min-h-[150px] flex flex-col justify-center">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center justify-center text-xl font-semibold text-foreground">
          <Gauge className="mr-2 h-6 w-6 text-primary" />
          Current Speed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {displayContent}
      </CardContent>
    </Card>
  );
};

export default SpeedDisplay;

    