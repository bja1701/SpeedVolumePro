
"use client";

import type { Profile, CurvePoint } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs

// Helper function for linear interpolation
const interpolateVolume = (speed: number, curve: CurvePoint[], minSpeed: number, minVolume: number, maxSpeed: number, maxVolume: number): number => {
  if (curve.length === 0) {
    // If no curve points, interpolate between min/max speed/volume
    if (speed <= minSpeed) return minVolume;
    if (speed >= maxSpeed) return maxVolume;
    const speedRange = maxSpeed - minSpeed;
    if (speedRange <= 0) return maxVolume; // Avoid division by zero
    const volumeRange = maxVolume - minVolume;
    return minVolume + ((speed - minSpeed) / speedRange) * volumeRange;
  }

  const sortedCurve = [...curve].sort((a, b) => a.speed - b.speed);

  if (speed <= sortedCurve[0].speed) return sortedCurve[0].volume;
  if (speed >= sortedCurve[sortedCurve.length - 1].speed) return sortedCurve[sortedCurve.length - 1].volume;

  for (let i = 0; i < sortedCurve.length - 1; i++) {
    const p1 = sortedCurve[i];
    const p2 = sortedCurve[i + 1];
    if (speed >= p1.speed && speed <= p2.speed) {
      const speedRange = p2.speed - p1.speed;
      if (speedRange === 0) return p1.volume; // Avoid division by zero, return lower point's volume
      const volumeRange = p2.volume - p1.volume;
      return p1.volume + ((speed - p1.speed) / speedRange) * volumeRange;
    }
  }
  return maxVolume; // Fallback, should ideally be handled by checks above
};


interface AppContextType {
  isOn: boolean;
  toggleIsOn: () => void;
  currentSpeed: number;
  setCurrentSpeed: (speed: number) => void;
  currentVolume: number;
  isGpsSignalLost: boolean;
  setIsGpsSignalLost: (lost: boolean) => void;
  profiles: Profile[];
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  addProfile: (name: string) => Profile;
  updateProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  getProfileById: (id: string | null) => Profile | undefined;
  showInterstitialAd: boolean;
  triggerInterstitialAd: () => void;
  resetInterstitialAd: () => void;
  interactionsSinceLastAd: number;
  incrementInteractions: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultProfileId = uuidv4();
const defaultProfile: Profile = {
  id: defaultProfileId,
  name: 'Default Car',
  curve: [
    { id: uuidv4(), speed: 0, volume: 20 },
    { id: uuidv4(), speed: 30, volume: 60 },
    { id: uuidv4(), speed: 60, volume: 100 },
  ],
  minSpeed: 0,
  minVolume: 0,
  maxSpeed: 100,
  maxVolume: 100,
};

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isOn, setIsOn] = useState(false);
  const [currentSpeed, setCurrentSpeedState] = useState(0);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isGpsSignalLost, setIsGpsSignalLost] = useState(false);
  
  const [profiles, setProfiles] = useState<Profile[]>(() => {
     if (typeof window !== 'undefined') {
      const savedProfiles = localStorage.getItem('speedVolumeProfiles');
      if (savedProfiles) {
        try {
          const parsedProfiles = JSON.parse(savedProfiles);
          return parsedProfiles.length > 0 ? parsedProfiles : [defaultProfile];
        } catch (error) {
          console.error("Failed to parse profiles from localStorage", error);
          return [defaultProfile];
        }
      }
    }
    return [defaultProfile];
  });

  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedActiveId = localStorage.getItem('speedVolumeActiveProfileId');
      if (savedActiveId && profiles.find(p => p.id === savedActiveId)) {
        return savedActiveId;
      }
    }
    return profiles.length > 0 ? profiles[0].id : null;
  });
  
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interactionsSinceLastAd, setInteractionsSinceLastAd] = useState(0);

  // Persist profiles and activeProfileId to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('speedVolumeProfiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeProfileId) {
        localStorage.setItem('speedVolumeActiveProfileId', activeProfileId);
      } else {
        localStorage.removeItem('speedVolumeActiveProfileId');
      }
    }
  }, [activeProfileId]);
  
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Speed simulation and volume calculation
  useEffect(() => {
    let speedInterval: NodeJS.Timeout;
    let stationaryTimer: NodeJS.Timeout;

    if (isOn && activeProfile) {
      speedInterval = setInterval(() => {
        if (isGpsSignalLost) {
          // Keep last known volume or a default if signal lost
          // For simulation, we'll just stop changing speed
          return;
        }
        // Simulate speed change - realistic would be GPS data
        const newSpeed = Math.max(0, Math.floor(Math.random() * (activeProfile.maxSpeed + 20))); // Simulate speed up to maxSpeed + 20
        setCurrentSpeedState(newSpeed);

        if (newSpeed === 0) {
          // Start timer if stationary
          if (!stationaryTimer) {
            stationaryTimer = setTimeout(() => {
              const newVolume = interpolateVolume(0, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume);
              setCurrentVolume(Math.round(newVolume));
            }, 5000); // 5 second delay
          }
        } else {
          // Clear timer if moving
          if (stationaryTimer) {
            clearTimeout(stationaryTimer);
          }
          const newVolume = interpolateVolume(newSpeed, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume);
          setCurrentVolume(Math.round(newVolume));
        }
      }, 2000); // Update speed every 2 seconds
    } else {
      // If turned off, reset volume or set to a user-defined manual volume (not implemented here)
      // For now, let's set volume based on speed 0 when turned off
      if (activeProfile) {
         setCurrentVolume(interpolateVolume(0, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume));
      } else {
        setCurrentVolume(0);
      }
    }

    return () => {
      clearInterval(speedInterval);
      clearTimeout(stationaryTimer);
    };
  }, [isOn, activeProfile, isGpsSignalLost]);

  const toggleIsOn = useCallback(() => setIsOn(prev => !prev), []);
  const setCurrentSpeed = useCallback((speed: number) => setCurrentSpeedState(speed), []);

  const setActiveProfileId = useCallback((id: string | null) => {
    setActiveProfileIdState(id);
  }, []);

  const addProfile = useCallback((name: string): Profile => {
    const newProfile: Profile = {
      id: uuidv4(),
      name,
      curve: [
        { id: uuidv4(), speed: 0, volume: 20 },
        { id: uuidv4(), speed: 30, volume: 60 },
        { id: uuidv4(), speed: 60, volume: 100 },
      ],
      minSpeed: 0,
      minVolume: 0,
      maxSpeed: 100,
      maxVolume: 100,
    };
    setProfiles(prev => [...prev, newProfile]);
    incrementInteractions();
    return newProfile;
  }, []);

  const updateProfile = useCallback((updatedProfile: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    incrementInteractions();
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const newProfiles = prev.filter(p => p.id !== id);
      if (activeProfileId === id) {
        setActiveProfileIdState(newProfiles.length > 0 ? newProfiles[0].id : null);
      }
      return newProfiles;
    });
    incrementInteractions();
  }, [activeProfileId]);

  const getProfileById = useCallback((id: string | null) => profiles.find(p => p.id === id), [profiles]);

  const triggerInterstitialAd = useCallback(() => {
    if(!isOn) { // Only show ads if app is not actively controlling volume
        setShowInterstitialAd(true);
    }
  }, [isOn]);
  
  const resetInterstitialAd = useCallback(() => {
    setShowInterstitialAd(false);
    setInteractionsSinceLastAd(0);
  }, []);

  const incrementInteractions = useCallback(() => {
    setInteractionsSinceLastAd(prev => {
      const newCount = prev + 1;
      if (newCount >= 2) { // Trigger ad every 2 significant interactions
        triggerInterstitialAd();
      }
      return newCount;
    });
  }, [triggerInterstitialAd]);


  return (
    <AppContext.Provider value={{ 
      isOn, toggleIsOn, 
      currentSpeed, setCurrentSpeed, 
      currentVolume, 
      isGpsSignalLost, setIsGpsSignalLost,
      profiles, activeProfileId, setActiveProfileId, 
      addProfile, updateProfile, deleteProfile, getProfileById,
      showInterstitialAd, triggerInterstitialAd, resetInterstitialAd,
      interactionsSinceLastAd, incrementInteractions
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppProvider;
