
"use client";

import type { Profile, CurvePoint } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs

// Helper function for linear interpolation
const interpolateVolume = (speed: number, userCurve: CurvePoint[], minSpeed: number, minVolume: number, maxSpeed: number, maxVolume: number): number => {
  // 1. Construct the full curve including thresholds
  const pointsMap = new Map<number, number>();
  pointsMap.set(minSpeed, minVolume); // Start with min threshold

  // Add user-defined points, ensuring they are strictly between min and max speed
  userCurve.forEach(p => {
    if (p.speed > minSpeed && p.speed < maxSpeed) {
      pointsMap.set(p.speed, p.volume);
    }
  });
  pointsMap.set(maxSpeed, maxVolume); // Ensure max threshold is authoritative

  const sortedFullCurve = Array.from(pointsMap.entries())
                         .map(([s, v]) => ({ speed: s, volume: v }))
                         .sort((a, b) => a.speed - b.speed);

  if (sortedFullCurve.length === 0) {
    return minVolume; 
  }
  if (sortedFullCurve.length === 1) {
    return sortedFullCurve[0].volume; 
  }

  if (speed <= sortedFullCurve[0].speed) {
    return sortedFullCurve[0].volume;
  }
  if (speed >= sortedFullCurve[sortedFullCurve.length - 1].speed) {
    return sortedFullCurve[sortedFullCurve.length - 1].volume;
  }

  for (let i = 0; i < sortedFullCurve.length - 1; i++) {
    const p1 = sortedFullCurve[i];
    const p2 = sortedFullCurve[i + 1];
    if (speed >= p1.speed && speed <= p2.speed) {
      const speedRange = p2.speed - p1.speed;
      if (speedRange === 0) { 
        return p1.volume;
      }
      const volumeRange = p2.volume - p1.volume;
      return p1.volume + ((speed - p1.speed) / speedRange) * volumeRange;
    }
  }
  
  return sortedFullCurve[sortedFullCurve.length - 1].volume;
};

export type GpsPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface AppContextType {
  isOn: boolean;
  toggleIsOn: () => void;
  currentSpeed: number;
  currentVolume: number;
  isGpsSignalLost: boolean;
  setIsGpsSignalLost: (lost: boolean) => void; 
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
    { id: uuidv4(), speed: 30, volume: 60 },
  ],
  minSpeed: 0,
  minVolume: 20,
  maxSpeed: 60,
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
  
  const [profiles, setProfiles] = useState<Profile[]>([defaultProfile]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(defaultProfile.id);
  
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [interactionsSinceLastAd, setInteractionsSinceLastAd] = useState(0);

  useEffect(() => {
    const savedProfiles = localStorage.getItem('speedVolumeProfiles');
    if (savedProfiles) {
      try {
        const parsedProfiles = JSON.parse(savedProfiles);
        if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
          setProfiles(parsedProfiles);
          const savedActiveId = localStorage.getItem('speedVolumeActiveProfileId');
          if (savedActiveId && parsedProfiles.find((p: Profile) => p.id === savedActiveId)) {
            setActiveProfileIdState(savedActiveId);
          } else {
            setActiveProfileIdState(parsedProfiles[0].id);
          }
        } else if (Array.isArray(parsedProfiles) && parsedProfiles.length === 0) {
           setProfiles([defaultProfile]);
           setActiveProfileIdState(defaultProfile.id);
        }
      } catch (error) {
        console.error("Failed to parse profiles from localStorage", error);
        setProfiles([defaultProfile]);
        setActiveProfileIdState(defaultProfile.id);
      }
    } else {
      setProfiles([defaultProfile]);
      setActiveProfileIdState(defaultProfile.id);
    }
  }, []);


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

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsPermissionStatus('unavailable');
      setGpsError('GPS not supported by this browser.');
      setIsGpsSignalLostInternal(true);
      return;
    }

    if (isOn) {
      setGpsError(null); 
      setIsGpsSignalLostInternal(false);

      const requestPosition = () => {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            setGpsPermissionStatus('granted');
            setIsGpsSignalLostInternal(false);
            setGpsError(null);
            const speedInMps = position.coords.speed;
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

      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        if (permission.state === 'granted') {
          setGpsPermissionStatus('granted');
          requestPosition();
        } else if (permission.state === 'denied') {
          setGpsPermissionStatus('denied');
          setGpsError('GPS permission was previously denied. Please enable it in your browser settings.');
          setIsGpsSignalLostInternal(true);
          setCurrentSpeedState(0);
        } else { 
          setGpsPermissionStatus('prompt'); 
          requestPosition(); 
        }
      }).catch(() => {
          setGpsPermissionStatus('prompt');
          requestPosition();
      });

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    } else { 
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  }, [isOn]);


  useEffect(() => {
    let stationaryTimerId: NodeJS.Timeout | undefined = undefined;

    if (isOn && activeProfile && gpsPermissionStatus === 'granted' && !isGpsSignalLost) {
      if (currentSpeed === 0) {
        stationaryTimerId = setTimeout(() => {
          if (currentSpeed === 0 && isOn && activeProfile && gpsPermissionStatus === 'granted' && !isGpsSignalLost) { 
            const newVolume = interpolateVolume(0, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume);
            setCurrentVolume(Math.round(newVolume));
          }
        }, 5000); 
      } else {
        const newVolume = interpolateVolume(currentSpeed, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume);
        setCurrentVolume(Math.round(newVolume));
      }
    } else {
      if (activeProfile) {
        setCurrentVolume(Math.round(interpolateVolume(0, activeProfile.curve, activeProfile.minSpeed, activeProfile.minVolume, activeProfile.maxSpeed, activeProfile.maxVolume)));
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
      if (newState) { 
        if (gpsPermissionStatus === 'denied') {
          setGpsError('GPS permission is denied. Please enable location services.');
        } else if (gpsPermissionStatus === 'unavailable') {
          setGpsError('GPS is not supported by this browser.');
        } else {
          setGpsError(null); 
        }
      }
      return newState;
    });
  }, [gpsPermissionStatus]);
  
  const setIsGpsSignalLost = useCallback((lost: boolean) => {
    setIsGpsSignalLostInternal(lost);
  }, []);


  const setActiveProfileId = useCallback((id: string | null) => {
    setActiveProfileIdState(id);
  }, []);

  // Ad and Interaction Logic
  const triggerInterstitialAd = useCallback(() => {
    setShowInterstitialAd(true);
  }, []); // Stable: depends only on a state setter

  const triggerInterstitialAdRef = useRef(triggerInterstitialAd);
  useEffect(() => {
    triggerInterstitialAdRef.current = triggerInterstitialAd;
  }, [triggerInterstitialAd]);

  const resetInterstitialAd = useCallback(() => {
    setShowInterstitialAd(false);
    setInteractionsSinceLastAd(0); // setInteractionsSinceLastAd is stable
  }, []); // Stable: depends only on state setters

  const incrementInteractions = useCallback(() => {
    setInteractionsSinceLastAd(prev => { // setInteractionsSinceLastAd is stable
      const newCount = prev + 1;
      if (newCount >= 2) {
        triggerInterstitialAdRef.current(); // Call via ref
      }
      return newCount;
    });
  }, []); // Stable: depends only on a state setter (implicitly) and a ref

  // Profile Management Logic (depends on stable incrementInteractions)
  const addProfile = useCallback((name: string): Profile => {
    const newProfileData: Profile = {
      id: uuidv4(),
      name,
      curve: [ 
         { id: uuidv4(), speed: 20, volume: 40 },
         { id: uuidv4(), speed: 40, volume: 80 },
      ],
      minSpeed: 0,
      minVolume: 10,
      maxSpeed: 80,
      maxVolume: 100,
    };
    setProfiles(prev => [...prev, newProfileData]);
    incrementInteractions();
    return newProfileData;
  }, [incrementInteractions]); // Now depends on a stable incrementInteractions

  const updateProfile = useCallback((updatedProfile: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    incrementInteractions();
  }, [incrementInteractions]); // Now depends on a stable incrementInteractions

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const newProfiles = prev.filter(p => p.id !== id);
      if (activeProfileId === id) {
        if (newProfiles.length > 0) {
          setActiveProfileIdState(newProfiles[0].id);
        } else {
          setActiveProfileIdState(defaultProfile.id); 
          return [defaultProfile]; 
        }
      }
      return newProfiles.length > 0 ? newProfiles : [defaultProfile];
    });
    incrementInteractions();
  }, [activeProfileId, incrementInteractions]); // Now depends on a stable incrementInteractions

  const getProfileById = useCallback((id: string | null) => profiles.find(p => p.id === id), [profiles]);


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

