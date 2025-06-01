
"use client";

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Power } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const OnOffToggle: React.FC = () => {
  const { isOn, toggleIsOn } = useAppContext();

  return (
    <div className="flex flex-col items-center space-y-3 p-6 bg-card rounded-lg shadow-lg">
      <Label htmlFor="on-off-switch" className="text-xl font-semibold text-foreground flex items-center">
        <Power className={`mr-2 h-8 w-8 ${isOn ? 'text-accent' : 'text-muted-foreground'}`} />
        Automatic Volume Control
      </Label>
      <Switch
        id="on-off-switch"
        checked={isOn}
        onCheckedChange={toggleIsOn}
        className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-muted"
        style={{ transform: 'scale(1.8)' }} 
      />
      <p className={`text-lg font-medium ${isOn ? 'text-accent' : 'text-muted-foreground'}`}>
        {isOn ? 'ACTIVE' : 'INACTIVE'}
      </p>
    </div>
  );
};

export default OnOffToggle;
