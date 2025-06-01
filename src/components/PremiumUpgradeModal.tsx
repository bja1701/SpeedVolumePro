
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Infinite, ShieldOff } from 'lucide-react';

export interface PremiumUpgradeModalRef {
  openModal: () => void;
}

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const PremiumUpgradeModal = React.forwardRef<PremiumUpgradeModalRef, PremiumUpgradeModalProps>(
  ({ isOpen, onClose }, ref) => {
    React.useImperativeHandle(ref, () => ({
      openModal: () => {
        // This modal is controlled by isOpen prop passed from parent
      }
    }));
  
    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card shadow-xl rounded-lg">
          <DialogHeader className="pt-6 px-6">
            <DialogTitle className="text-3xl font-headline font-bold text-center text-primary flex items-center justify-center">
              <Crown className="mr-3 h-8 w-8 text-yellow-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2 text-lg">
              Unlock the full potential of SpeedVolumePro!
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <ul className="space-y-4 text-foreground text-lg">
              <li className="flex items-start">
                <ShieldOff className="h-7 w-7 text-accent mr-3 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Remove All Ads:</span> Enjoy an uninterrupted, ad-free experience.
                </div>
              </li>
              <li className="flex items-start">
                <Infinite className="h-7 w-7 text-accent mr-3 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Unlimited Profiles:</span> Create and save as many custom profiles as you need.
                </div>
              </li>
              <li className="flex items-start">
                <Zap className="h-7 w-7 text-accent mr-3 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Advanced Customization:</span> More granular control over your volume curves. (Coming Soon!)
                </div>
              </li>
            </ul>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-xl font-semibold">
              Upgrade Now - $9.99 (One-Time)
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              This is a simulated In-App Purchase for demonstration purposes.
            </p>
          </div>

          <DialogFooter className="px-6 pb-6">
            <DialogClose asChild>
              <Button variant="outline" className="w-full">Maybe Later</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

PremiumUpgradeModal.displayName = 'PremiumUpgradeModal';
export default PremiumUpgradeModal;
