
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import OnOffToggle from '@/components/OnOffToggle';
import SpeedDisplay from '@/components/SpeedDisplay';
import VolumeDisplay from '@/components/VolumeDisplay';
import ProfileManager from '@/components/ProfileManager';
import VolumeCurveChart from '@/components/VolumeCurveChart';
import InterstitialAd from '@/components/InterstitialAd';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import type { PremiumUpgradeModalRef } from '@/components/PremiumUpgradeModal';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function HomePage() {
  const { 
    showInterstitialAd, 
    resetInterstitialAd,
    isGpsSignalLost,
    setIsGpsSignalLost
  } = useAppContext();
  
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const premiumModalRef = useRef<PremiumUpgradeModalRef>(null);

  const handleUpgradeClick = () => {
    setIsPremiumModalOpen(true);
  };
  
  // Mock GPS signal loss toggle for testing
  const toggleGpsSignal = () => {
    setIsGpsSignalLost(!isGpsSignalLost);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onUpgradeClick={handleUpgradeClick} />
      
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column / Control Panel */}
          <div className="md:col-span-1 space-y-6 md:space-y-8">
            <OnOffToggle />
            <SpeedDisplay />
            <VolumeDisplay />
             {/* GPS Signal Simulation Button - For Dev/Demo */}
            <Button onClick={toggleGpsSignal} variant="outline" className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Toggle GPS Signal ({isGpsSignalLost ? "Lost" : "OK"})
            </Button>
          </div>

          {/* Right Column / Configuration & Visualization */}
          <div className="md:col-span-2 space-y-6 md:space-y-8">
            <ProfileManager />
            <VolumeCurveChart />
          </div>
        </div>
      </main>

      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        SpeedVolumePro &copy; {new Date().getFullYear()}. All rights reserved. (Demo Version)
      </footer>

      <InterstitialAd isOpen={showInterstitialAd} onClose={resetInterstitialAd} />
      <PremiumUpgradeModal 
        ref={premiumModalRef} 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
      />
    </div>
  );
}
