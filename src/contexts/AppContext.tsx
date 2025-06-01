
"use client";

import type { Profile, CurvePoint } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs

// Helper function for linear interpolation
const interpolateVolume = (speed: number, curve: CurvePoint[], minSpeed: number, minVolume: number, maxSpeed: number, maxVolume: number): number => {
  if (curve.length === 0) {
    if (speed <= minSpeed) return minVolume;
    if (speed >= maxSpeed) return maxVolume;
    const speedRange = maxSpeed - minSpeed;
    if (speedRange <= 0) return maxVolume; 
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
      if (speedRange === 0) return p1.volume; 
      const volumeRange = p2.volume - p1.volume;
      return p1.volume + ((speed - p1.speed) / speedRange) * volumeRange;
    }
  }
  return maxVolume; 
};

export type GpsPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface AppContextType {
  isOn: boolean;
  toggleIsOn: () => void;
  currentSpeed: number;
  // setCurrentSpeed: (speed: number) => void; // No longer directly set from outside, driven by GPS
  currentVolume: number;
  isGpsSignalLost: boolean;
  setIsGpsSignalLost: (lost: boolean) => void; // Keep for potential manual override or testing
  gpsPermissionStatus: GpsPermissionStatus;
  gpsError: string | null;
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
  const [isGpsSignalLost, setIsGpsSignalLostInternal] = useState(false);
  
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<GpsPermissionStatus>('prompt');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
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

  // Effect for GPS
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsPermissionStatus('unavailable');
      setGpsError('GPS not supported by this browser.');
      setIsGpsSignalLostInternal(true);
      return;
    }

    if (isOn) {
      setGpsError(null); // Clear previous errors on attempt
      setIsGpsSignalLostInternal(false);

      const requestPosition = () => {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            setGpsPermissionStatus('granted');
            setIsGpsSignalLostInternal(false);
            setGpsError(null);
            const speedInMps = position.coords.speed;
            // Speed is in meters/second, convert to MPH (1 m/s = 2.23694 MPH)
            setCurrentSpeedState(speedInMps === null ? 0 : Math.round(speedInMps * 2.23694));
          },
          (error) => {
            setIsGpsSignalLostInternal(true);
            setCurrentSpeedState(0);
            if (error.code === error.PERMISSION_DENIED) {
              setGpsPermissionStatus('denied');
              setGpsError('GPS permission denied. Please enable location services in your browser settings.');
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              setGpsError('GPS position unavailable. Ensure you have a clear view of the sky.');
            } else if (error.code === error.TIMEOUT) {
              setGpsError('GPS request timed out. Trying again.');
            } else {
              setGpsError('An unknown GPS error occurred.');
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      };

      if (gpsPermissionStatus === 'prompt') {
        navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
          if (permission.state === 'granted') {
            setGpsPermissionStatus('granted');
            requestPosition();
          } else if (permission.state === 'denied') {
            setGpsPermissionStatus('denied');
            setGpsError('GPS permission was previously denied. Please enable it in your browser settings.');
            setIsGpsSignalLostInternal(true);
            setCurrentSpeedState(0);
          } else { // 'prompt'
            requestPosition(); // This will trigger the browser's permission dialog
          }
        }).catch(() => {
            // Fallback for browsers not supporting permissions.query well, directly try watchPosition
            requestPosition();
        });
      } else if (gpsPermissionStatus === 'granted') {
        requestPosition();
      }
      // If 'denied' or 'unavailable', do nothing further here as error messages are already set.

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    } else { // isOn is false
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setCurrentSpeedState(0); // Reset speed when turned off
      // Volume adjustment will be handled by the volume effect
    }
  }, [isOn, gpsPermissionStatus]);


  // Effect for Volume Calculation
  useEffect(() => {
    let stationaryTimerId: NodeJS.Timeout | undefined = undefined;

    if (isOn && activeProfile && gpsPermissionStatus === 'granted' && !isGpsSignalLost) {
      if (currentSpeed === 0) {
         // If speed is 0, start a timer. If still 0 after 5s, then adjust volume.
        stationaryTimerId = setTimeout(() => {
          if (currentSpeed === 0) { // Check again in case speed changed during timeout
            const newVolume = interpolateVolume(0, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume);
            setCurrentVolume(Math.round(newVolume));
          }
        }, 5000); // 5 second delay
      } else {
        // If speed is not 0, calculate volume immediately
        const newVolume = interpolateVolume(currentSpeed, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume);
        setCurrentVolume(Math.round(newVolume));
      }
    } else {
      // If turned off, GPS not granted, or signal lost, set volume based on 0 speed or min volume.
      if (activeProfile) {
        setCurrentVolume(interpolateVolume(0, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume));
      } else {
        setCurrentVolume(0);
      }
    }

    return () => {
      if (stationaryTimerId) {
        clearTimeout(stationaryTimerId);
      }
    };
  }, [isOn, currentSpeed, activeProfile, gpsPermissionStatus, isGpsSignalLost]);


  const toggleIsOn = useCallback(() => {
    setIsOn(prev => {
      const newState = !prev;
      if (newState && gpsPermissionStatus === 'denied') {
        // If turning on and permission is denied, prompt user to check settings
        setGpsError('GPS permission is denied. Please enable location services in your browser settings to use this feature.');
      } else if (newState && gpsPermissionStatus === 'unavailable') {
         setGpsError('GPS is not supported by this browser.');
      }
      return newState;
    });
    // If turning on, the GPS useEffect will handle permission prompt if status is 'prompt'
  }, [gpsPermissionStatus]);
  
  // Expose setIsGpsSignalLost for potential manual override (e.g. testing)
  // Primarily, isGpsSignalLost is controlled by the GPS effect.
  const setIsGpsSignalLost = useCallback((lost: boolean) => {
    setIsGpsSignalLostInternal(lost);
  }, []);


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
    if(!isOn) { 
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
      if (newCount >= 2) { 
        triggerInterstitialAd();
      }
      return newCount;
    });
  }, [triggerInterstitialAd]);


  return (
    <AppContext.Provider value={{ 
      isOn, toggleIsOn, 
      currentSpeed, 
      currentVolume, 
      isGpsSignalLost, setIsGpsSignalLost,
      gpsPermissionStatus, gpsError,
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

    