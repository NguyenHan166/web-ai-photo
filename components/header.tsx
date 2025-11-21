"use client";

import { Button } from "@/components/ui/button";
import ThemeToggle from "./theme-toggle";
import { Menu, X, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

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
        <header className="relative h-16 sm:h-20 bg-gradient-to-r from-background via-card to-background border-b border-border/50 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-50" />

            <div className="relative h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between max-w-[1920px] mx-auto">
                {/* Logo Section */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={handleMenuClick}
                        className="lg:hidden p-2 hover:bg-primary/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-5 h-5 text-foreground" />
                        ) : (
                            <Menu className="w-5 h-5 text-foreground" />
                        )}
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Logo Icon */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-purple-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center shadow-lg">
                                <Sparkles
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                                    strokeWidth={2.5}
                                />
                            </div>
                        </div>

                        {/* Logo Text */}
                        <div className="hidden sm:block">
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                                AI Photo Studio
                            </h1>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide">
                                Professional Image Enhancement
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                            Powered by AI
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
