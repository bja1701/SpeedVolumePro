
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image'; // Assuming next/image is configured

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center text-primary">Advertisement</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
            {/* Replace with actual ad content or image */}
            <Image 
              src="https://placehold.co/300x200.png?text=Your+Ad+Here" 
              alt="Advertisement" 
              width={300} 
              height={200}
              className="rounded"
              data-ai-hint="advertisement banner"
            />
          </div>
          <DialogDescription className="text-center text-muted-foreground">
            Thank you for using SpeedVolumePro! This ad helps keep the app free.
          </DialogDescription>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue to App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterstitialAd;
