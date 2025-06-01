
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Volume2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const VolumeDisplay: React.FC = () => {
  const { currentVolume } = useAppContext();

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-center text-xl font-semibold text-foreground">
          <Volume2 className="mr-2 h-6 w-6 text-primary" />
          Current Volume
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-3 pt-2">
        <Progress value={currentVolume} className="w-full h-6 [&>div]:bg-primary" />
        <p className="text-4xl font-bold text-primary">{currentVolume}%</p>
      </CardContent>
    </Card>
  );
};

export default VolumeDisplay;
