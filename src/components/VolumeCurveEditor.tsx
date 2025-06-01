
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { CurvePoint, Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";

interface VolumeCurveEditorProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

const VolumeCurveEditor: React.FC<VolumeCurveEditorProps> = ({ profile: initialProfile, onProfileUpdate }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [newPointSpeed, setNewPointSpeed] = useState('');
  const [newPointVolume, setNewPointVolume] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const displayCurvePoints = useMemo(() => {
    const points: Array<CurvePoint & { isThreshold?: boolean; isEditable?: boolean }> = [];
    
    points.push({
      id: 'threshold-min',
      speed: profile.minSpeed,
      volume: profile.minVolume,
      isThreshold: true,
      isEditable: false,
    });

    profile.curve.forEach(p => {
      points.push({
        ...p,
        isThreshold: false,
        isEditable: true,
      });
    });

    points.push({
      id: 'threshold-max',
      speed: profile.maxSpeed,
      volume: profile.maxVolume,
      isThreshold: true,
      isEditable: false,
    });
    
    return points.sort((a, b) => a.speed - b.speed);
  }, [profile.minSpeed, profile.minVolume, profile.curve, profile.maxSpeed, profile.maxVolume]);


  const handleAddPoint = () => {
    const speed = parseInt(newPointSpeed);
    const volume = parseInt(newPointVolume);

    if (isNaN(speed) || isNaN(volume) || speed < 0 || volume < 0 || volume > 100) {
      toast({ title: "Error", description: "Invalid speed or volume. Speed must be non-negative, volume must be between 0 and 100.", variant: "destructive" });
      return;
    }
    if (speed <= profile.minSpeed || speed >= profile.maxSpeed) {
      toast({ title: "Error", description: `Speed must be between min speed (${profile.minSpeed} MPH) and max speed (${profile.maxSpeed} MPH).`, variant: "destructive" });
      return;
    }
    if (profile.curve.some(p => p.speed === speed)) {
      toast({ title: "Error", description: `A point with speed ${speed} MPH already exists.`, variant: "destructive" });
      return;
    }

    const newPoint: CurvePoint = { id: uuidv4(), speed, volume };
    const updatedCurve = [...profile.curve, newPoint].sort((a, b) => a.speed - b.speed);
    setProfile(prev => ({ ...prev, curve: updatedCurve }));
    setNewPointSpeed('');
    setNewPointVolume('');
  };

  const handleRemovePoint = (pointId: string) => {
    const updatedCurve = profile.curve.filter(p => p.id !== pointId);
    setProfile(prev => ({ ...prev, curve: updatedCurve }));
  };

  const handlePointChange = (pointId: string, field: 'speed' | 'volume', value: string) => {
    const numericValue = parseInt(value);
    // Allow empty input for typing, but don't parse NaN yet
    if (value !== "" && isNaN(numericValue)) return;


    const updatedCurve = profile.curve.map(p => {
      if (p.id === pointId) {
        let validatedValue: number | string = value === "" ? "" : numericValue;
        if (value !== "") {
            if (field === 'speed') {
                 validatedValue = Math.max(0, numericValue); // Basic validation, more on blur/save
            } else if (field === 'volume') {
                validatedValue = Math.max(0, Math.min(100, numericValue));
            }
        }
        return { ...p, [field]: validatedValue };
      }
      return p;
    });
    setProfile(prev => ({ ...prev, curve: updatedCurve as CurvePoint[] }));
  };
  
  const handlePointBlur = (pointId: string, field: 'speed' | 'volume') => {
    const pointIndex = profile.curve.findIndex(p => p.id === pointId);
    if (pointIndex === -1) return;

    const point = profile.curve[pointIndex];
    let numericValue = Number(point[field]);

    if (isNaN(numericValue) || String(point[field]).trim() === "") {
      // Revert to original if invalid or empty on blur
      const originalPointValue = initialProfile.curve.find(p => p.id === pointId)?.[field] ?? (field === 'speed' ? (profile.minSpeed + profile.maxSpeed)/2 : 50);
      numericValue = Number(originalPointValue);
    }
    
    if (field === 'speed') {
        if (numericValue <= profile.minSpeed || numericValue >= profile.maxSpeed) {
            toast({ title: "Validation Error", description: `Speed must be between ${profile.minSpeed} and ${profile.maxSpeed} MPH. Reverting.`, variant: "destructive"});
            numericValue = initialProfile.curve.find(p => p.id === pointId)?.speed ?? (profile.minSpeed + profile.maxSpeed)/2;
        } else if (profile.curve.some((p, idx) => p.speed === numericValue && idx !== pointIndex)) {
            toast({ title: "Validation Error", description: `Another point with speed ${numericValue} MPH already exists. Reverting.`, variant: "destructive"});
            numericValue = initialProfile.curve.find(p => p.id === pointId)?.speed ?? (profile.minSpeed + profile.maxSpeed)/2;
        }
    } else if (field === 'volume') {
        numericValue = Math.max(0, Math.min(100, numericValue));
    }
    
    const finalCurve = profile.curve.map(p => p.id === pointId ? { ...p, [field]: numericValue } : p).sort((a,b) => a.speed - b.speed);
    setProfile(prev => ({...prev, curve: finalCurve}));
  };


  const handleThresholdChange = (field: keyof Pick<Profile, 'minSpeed' | 'minVolume' | 'maxSpeed' | 'maxVolume'>, value: string) => {
    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
        let validatedValue = numericValue;
        if (field.includes('Volume')) {
            validatedValue = Math.max(0, Math.min(100, numericValue));
        } else {
            validatedValue = Math.max(0, numericValue);
        }
        setProfile(prev => ({ ...prev, [field]: validatedValue }));
    } else if (value === "") {
       setProfile(prev => ({ ...prev, [field]: "" as any })); 
    }
  };
  
  const handleThresholdBlur = (field: keyof Pick<Profile, 'minSpeed' | 'minVolume' | 'maxSpeed' | 'maxVolume'>) => {
    let currentValue = profile[field];
    let initialValue = initialProfile[field];
    let numericValue = Number(currentValue);

    if (currentValue === "" || isNaN(numericValue)) {
        numericValue = initialValue; // Revert to initial on invalid blur
    }

    // Additional validation for min/max speed relationship
    if (field === 'minSpeed' && numericValue >= profile.maxSpeed) {
        toast({title: "Validation Error", description: "Min speed cannot be greater than or equal to max speed. Reverting.", variant: "destructive"});
        numericValue = initialValue;
    } else if (field === 'maxSpeed' && numericValue <= profile.minSpeed) {
        toast({title: "Validation Error", description: "Max speed cannot be less than or equal to min speed. Reverting.", variant: "destructive"});
        numericValue = initialValue;
    }
    
    // Filter curve points to be within new thresholds
    const updatedCurve = profile.curve.filter(p => p.speed > (field === 'minSpeed' ? numericValue : profile.minSpeed) && p.speed < (field === 'maxSpeed' ? numericValue : profile.maxSpeed));

    setProfile(prev => ({
        ...prev, 
        [field]: numericValue,
        curve: updatedCurve.sort((a,b) => a.speed - b.speed) // Ensure curve is sorted after potential filtering
    }));
  };

  const handleSaveChanges = () => {
    if (profile.minSpeed >= profile.maxSpeed) {
        toast({ title: "Error", description: "Minimum speed must be less than maximum speed.", variant: "destructive" });
        return;
    }

    const validatedCurve = profile.curve
      .filter(p => String(p.speed).trim() !== "" && String(p.volume).trim() !== "" && !isNaN(Number(p.speed)) && !isNaN(Number(p.volume)))
      .map(p => ({...p, speed: Number(p.speed), volume: Number(p.volume)}))
      .filter(p => p.speed > profile.minSpeed && p.speed < profile.maxSpeed) // Final check
      .sort((a,b) => a.speed - b.speed);

    const uniqueSpeeds = new Set(validatedCurve.map(p => p.speed));
    if (uniqueSpeeds.size !== validatedCurve.length) {
        toast({ title: "Error", description: "Duplicate speeds found in curve points. Please ensure all speeds are unique.", variant: "destructive" });
        return;
    }

    const validatedProfile = {
        ...profile,
        curve: validatedCurve,
        minSpeed: Number(profile.minSpeed),
        minVolume: Number(profile.minVolume),
        maxSpeed: Number(profile.maxSpeed),
        maxVolume: Number(profile.maxVolume),
    };
    onProfileUpdate(validatedProfile);
  };


  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Edit Volume Curve: {profile.name}</CardTitle>
        <CardDescription>Define thresholds and add custom (speed, volume) points for this profile. Volume is a percentage (0-100).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Thresholds</h3>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="minSpeed">Min Speed (MPH)</Label>
                    <Input id="minSpeed" type="number" value={profile.minSpeed} onChange={e => handleThresholdChange('minSpeed', e.target.value)} onBlur={() => handleThresholdBlur('minSpeed')} />
                </div>
                <div>
                    <Label htmlFor="minVolume">Min Volume (%)</Label>
                    <Input id="minVolume" type="number" value={profile.minVolume} onChange={e => handleThresholdChange('minVolume', e.target.value)} onBlur={() => handleThresholdBlur('minVolume')} />
                </div>
                <div>
                    <Label htmlFor="maxSpeed">Max Speed (MPH)</Label>
                    <Input id="maxSpeed" type="number" value={profile.maxSpeed} onChange={e => handleThresholdChange('maxSpeed', e.target.value)} onBlur={() => handleThresholdBlur('maxSpeed')} />
                </div>
                <div>
                    <Label htmlFor="maxVolume">Max Volume (%)</Label>
                    <Input id="maxVolume" type="number" value={profile.maxVolume} onChange={e => handleThresholdChange('maxVolume', e.target.value)} onBlur={() => handleThresholdBlur('maxVolume')} />
                </div>
            </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Curve Points</h3>
          {displayCurvePoints.map((point) => (
            <div key={point.id} className={`flex items-center space-x-2 p-3 rounded-md ${point.isThreshold ? 'bg-muted/50 border-dashed' : 'border'}`}>
              <Input
                type="number"
                aria-label="Speed (MPH)"
                value={point.speed}
                onChange={(e) => point.isEditable && handlePointChange(point.id, 'speed', e.target.value)}
                onBlur={() => point.isEditable && handlePointBlur(point.id, 'speed')}
                className="w-1/3"
                disabled={!point.isEditable}
              />
              <Input
                type="number"
                aria-label="Volume (%)"
                value={point.volume}
                onChange={(e) => point.isEditable && handlePointChange(point.id, 'volume', e.target.value)}
                onBlur={() => point.isEditable && handlePointBlur(point.id, 'volume')}
                className="w-1/3"
                disabled={!point.isEditable}
              />
              {point.isEditable ? (
                <Button variant="ghost" size="icon" onClick={() => handleRemovePoint(point.id)} className="text-destructive hover:text-destructive" aria-label="Remove point">
                  <Trash2 className="h-5 w-5" />
                </Button>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center" aria-label="Threshold point">
                    <LockKeyhole className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <h4 className="text-md font-medium">Add New Intermediate Point</h4>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Speed (MPH)"
              value={newPointSpeed}
              onChange={(e) => setNewPointSpeed(e.target.value)}
              className="w-2/5"
              aria-label="New point speed"
            />
            <Input
              type="number"
              placeholder="Volume (%)"
              value={newPointVolume}
              onChange={(e) => setNewPointVolume(e.target.value)}
              className="w-2/5"
              aria-label="New point volume"
            />
            <Button onClick={handleAddPoint} size="icon" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" aria-label="Add new point">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          Save Changes to Profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VolumeCurveEditor;

