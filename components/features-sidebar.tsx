"use client";

import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Zap,
    Lightbulb,
    Palette,
    MapIcon as MagicWand,
    Wand2,
    Copy,
    Film,
    Search,
} from "lucide-react";
import { useState } from "react";

interface Feature {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    time: string;
    color: string;
}

const FEATURES: Feature[] = [
    {
        id: "upscale",
        name: "Upscale",
        description: "Face restoration & enhance",
        icon: <Sparkles className="w-5 h-5" />,
        time: "15-90s",
        color: "from-blue-500 to-cyan-500",
    },
    {
        id: "clarity",
        name: "Clarity",
        description: "Super-resolution enhancement",
        icon: <Search className="w-5 h-5" />,
        time: "20-120s",
        color: "from-purple-500 to-pink-500",
    },
    {
        id: "portraits/ic-light",
        name: "Relight",
        description: "Portrait relighting",
        icon: <Lightbulb className="w-5 h-5" />,
        time: "30-120s",
        color: "from-yellow-500 to-orange-500",
    },
    {
        id: "enhance",
        name: "Enhance",
        description: "Professional enhancement",
        icon: <Zap className="w-5 h-5" />,
        time: "30-180s",
        color: "from-green-500 to-emerald-500",
    },
    {
        id: "ai-beautify",
        name: "Beautify",
        description: "Multi-step portrait pipeline",
        icon: <MagicWand className="w-5 h-5" />,
        time: "30-90s",
        color: "from-red-500 to-rose-500",
    },
    {
        id: "replace-bg",
        name: "Background",
        description: "Remove or replace background",
        icon: <Wand2 className="w-5 h-5" />,
        time: "20-60s",
        color: "from-indigo-500 to-blue-500",
    },
    {
        id: "style",
        name: "Style",
        description: "Artistic style transfer",
        icon: <Palette className="w-5 h-5" />,
        time: "30-150s",
        color: "from-pink-500 to-purple-500",
    },
    {
        id: "comic/generate",
        name: "Comic",
        description: "Generate comic stories",
        icon: <Film className="w-5 h-5" />,
        time: "60-240s",
        color: "from-orange-500 to-yellow-500",
    },
];

interface FeaturesSidebarProps {
    selectedFeature: string | null;
    onSelectFeature: (featureId: string) => void;
}

export default function FeaturesSidebar({
    selectedFeature,
    onSelectFeature,
}: FeaturesSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFeatures = FEATURES.filter(
        (feature) =>
            feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full h-full bg-sidebar flex flex-col overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-sidebar-border flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary placeholder:text-muted-foreground"
                />
            </div>

            {/* Features List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs font-semibold text-sidebar-muted-foreground px-2 mb-3">
                    {filteredFeatures.length} Available Tools
                </p>

                {filteredFeatures.map((feature) => (
                    <button
                        key={feature.id}
                        onClick={() => onSelectFeature(feature.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                            selectedFeature === feature.id
                                ? "bg-gradient-to-r " +
                                  feature.color +
                                  " text-white shadow-lg scale-105"
                                : "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                {feature.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">
                                    {feature.name}
                                </p>
                                <p className="text-xs opacity-75 leading-tight">
                                    {feature.description}
                                </p>
                                <p className="text-xs opacity-60 mt-1">
                                    {feature.time}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-sidebar-border flex-shrink-0 bg-sidebar/50">
                <p className="text-xs text-sidebar-muted-foreground leading-relaxed">
                    Select a tool to start editing with AI.
                </p>
            </div>
        </div>
    );
}
