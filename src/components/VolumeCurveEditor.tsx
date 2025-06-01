
"use client";

import React, { useState, useEffect } from 'react';
import type { CurvePoint, Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';

interface VolumeCurveEditorProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

const VolumeCurveEditor: React.FC<VolumeCurveEditorProps> = ({ profile: initialProfile, onProfileUpdate }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [newPointSpeed, setNewPointSpeed] = useState('');
  const [newPointVolume, setNewPointVolume] = useState('');

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const handleAddPoint = () => {
    const speed = parseInt(newPointSpeed);
    const volume = parseInt(newPointVolume);
    if (!isNaN(speed) && !isNaN(volume) && speed >= 0 && volume >= 0 && volume <= 100) {
      const newPoint: CurvePoint = { id: uuidv4(), speed, volume };
      const updatedCurve = [...profile.curve, newPoint].sort((a, b) => a.speed - b.speed);
      setProfile(prev => ({ ...prev, curve: updatedCurve }));
      setNewPointSpeed('');
      setNewPointVolume('');
    } else {
      // Basic error handling, consider using a toast for better UX
      alert("Invalid speed or volume. Speed must be non-negative, volume must be between 0 and 100.");
    }
  };

  const handleRemovePoint = (pointId: string) => {
    const updatedCurve = profile.curve.filter(p => p.id !== pointId);
    setProfile(prev => ({ ...prev, curve: updatedCurve }));
  };

  const handlePointChange = (pointId: string, field: 'speed' | 'volume', value: string) => {
    const numericValue = parseInt(value);
    if (isNaN(numericValue) && value !== "") return; // Allow empty input for typing

    const updatedCurve = profile.curve.map(p => {
      if (p.id === pointId) {
        const updatedPoint = { ...p, [field]: value === "" ? "" : Math.max(0, field === 'volume' ? Math.min(100, numericValue) : numericValue) };
        return updatedPoint;
      }
      return p;
    });
     setProfile(prev => ({ ...prev, curve: updatedCurve as CurvePoint[] })); // Type assertion for intermediate state
  };
  
  const handlePointBlur = (pointId: string, field: 'speed' | 'volume') => {
    const point = profile.curve.find(p => p.id === pointId);
    if (point && (point[field] === "" || isNaN(Number(point[field])))) {
        // If invalid or empty on blur, revert or set to a default, e.g. 0
        // For simplicity, we'll filter out invalid points on save/update rather than complex live validation
        // Or find the original value from initialProfile to revert
        const originalPoint = initialProfile.curve.find(p => p.id === pointId);
        const valueToRevert = originalPoint ? originalPoint[field] : 0;
         handlePointChange(pointId, field, String(valueToRevert));
    } else if(point) {
        // Sort curve after valid input
        const sortedCurve = [...profile.curve].sort((a,b) => a.speed - b.speed);
        setProfile(prev => ({...prev, curve: sortedCurve}));
    }
  };


  const handleThresholdChange = (field: keyof Pick<Profile, 'minSpeed' | 'minVolume' | 'maxSpeed' | 'maxVolume'>, value: string) => {
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue >= 0 && (field.includes('Volume') ? numericValue <=100 : true)) {
      setProfile(prev => ({ ...prev, [field]: numericValue }));
    } else if (value === "") {
       setProfile(prev => ({ ...prev, [field]: "" as any })); // Allow clearing input
    }
  };
  
  const handleThresholdBlur = (field: keyof Pick<Profile, 'minSpeed' | 'minVolume' | 'maxSpeed' | 'maxVolume'>) => {
      if(profile[field] === "" || isNaN(Number(profile[field]))){
          setProfile(prev => ({...prev, [field]: initialProfile[field]})); // Revert to initial on invalid blur
      }
  };

  const handleSaveChanges = () => {
    // Filter out any points that might have become invalid (e.g. empty strings)
    const validatedCurve = profile.curve
      .filter(p => p.speed !== "" && p.volume !== "" && !isNaN(Number(p.speed)) && !isNaN(Number(p.volume)))
      .map(p => ({...p, speed: Number(p.speed), volume: Number(p.volume)}))
      .sort((a,b) => a.speed - b.speed);

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
        <CardDescription>Define (speed, volume) points for this profile. Volume is a percentage (0-100).</CardDescription>
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
          {profile.curve.map((point) => (
            <div key={point.id} className="flex items-center space-x-2 p-2 border rounded-md">
              <Input
                type="number"
                placeholder="Speed (MPH)"
                value={point.speed}
                onChange={(e) => handlePointChange(point.id, 'speed', e.target.value)}
                onBlur={() => handlePointBlur(point.id, 'speed')}
                className="w-1/3"
              />
              <Input
                type="number"
                placeholder="Volume (%)"
                value={point.volume}
                onChange={(e) => handlePointChange(point.id, 'volume', e.target.value)}
                onBlur={() => handlePointBlur(point.id, 'volume')}
                className="w-1/3"
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemovePoint(point.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <h4 className="text-md font-medium">Add New Point</h4>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Speed (MPH)"
              value={newPointSpeed}
              onChange={(e) => setNewPointSpeed(e.target.value)}
              className="w-2/5"
            />
            <Input
              type="number"
              placeholder="Volume (%)"
              value={newPointVolume}
              onChange={(e) => setNewPointVolume(e.target.value)}
              className="w-2/5"
            />
            <Button onClick={handleAddPoint} size="icon" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
