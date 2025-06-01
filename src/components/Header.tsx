
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import type { PremiumUpgradeModalRef } from '@/components/PremiumUpgradeModal'; // Ensure correct path

interface HeaderProps {
  onUpgradeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onUpgradeClick }) => {
  return (
    <header className="bg-card p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-2xl font-headline font-semibold text-primary">SpeedVolumePro</h1>
      <Button onClick={onUpgradeClick} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
        <Crown className="mr-2 h-5 w-5" />
        Upgrade to Premium
      </Button>
    </header>
  );
};

export default Header;
