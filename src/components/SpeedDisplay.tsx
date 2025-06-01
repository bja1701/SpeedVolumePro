
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react'; // Using Gauge as a speedometer icon
import { useAppContext } from '@/contexts/AppContext';

const SpeedDisplay: React.FC = () => {
  const { currentSpeed, isGpsSignalLost } = useAppContext();

  return (
    <Card className="text-center shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-center text-xl font-semibold text-foreground">
          <Gauge className="mr-2 h-6 w-6 text-primary" />
          Current Speed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isGpsSignalLost ? (
          <p className="text-4xl font-bold text-destructive animate-pulse">GPS Signal Lost</p>
        ) : (
          <p className="text-6xl font-bold text-primary">
            {currentSpeed} <span className="text-2xl font-medium text-muted-foreground">MPH</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SpeedDisplay;
