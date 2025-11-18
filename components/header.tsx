'use client';

import { Button } from '@/components/ui/button';
import ThemeToggle from './theme-toggle';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuClick?.();
  };

  return (
    <header className="h-16 sm:h-20 bg-gradient-to-r from-card to-card/50 border-b border-border sticky top-0 z-40">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between max-w-full">
        {/* Logo Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleMenuClick}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm sm:text-lg font-bold text-primary-foreground">AI</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold hidden sm:block text-balance">
            Photo Editor
          </h1>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
