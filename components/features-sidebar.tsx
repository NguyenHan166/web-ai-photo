"use client";

import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Zap,
    Lightbulb,
    Palette,
    MapIcon as MagicWand,
    Wand2,
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
    badge?: string;
    available?: boolean;
}

const FEATURES: Feature[] = [
    {
        id: "upscale",
        name: "Upscale",
        description: "Face restoration & enhance",
        icon: <Sparkles className="w-5 h-5" />,
        time: "15-90s",
        color: "from-blue-500 to-cyan-500",
        badge: "Sharp",
        available: true,
    },
    {
        id: "clarity",
        name: "Clarity",
        description: "Super-resolution enhancement",
        icon: <Search className="w-5 h-5" />,
        time: "20-120s",
        color: "from-purple-500 to-pink-500",
        badge: "HD",
        available: true,
    },
    {
        id: "portraits/ic-light",
        name: "Relight",
        description: "Portrait relighting",
        icon: <Lightbulb className="w-5 h-5" />,
        time: "30-120s",
        color: "from-yellow-500 to-orange-500",
        badge: "Studio",
        available: true,
    },
    {
        id: "enhance",
        name: "Enhance",
        description: "Real-ESRGAN 2x/4x, face enhance option",
        icon: <Zap className="w-5 h-5" />,
        time: "15-60s",
        color: "from-green-500 to-emerald-500",
        badge: "Fast",
        available: true,
    },
    {
        id: "ai-beautify",
        name: "Beautify",
        description: "Multi-step portrait pipeline",
        icon: <MagicWand className="w-5 h-5" />,
        time: "30-90s",
        color: "from-red-500 to-rose-500",
        badge: "Portrait",
        available: true,
    },
    {
        id: "replace-bg",
        name: "Background",
        description: "Remove or replace background",
        icon: <Wand2 className="w-5 h-5" />,
        time: "20-60s",
        color: "from-indigo-500 to-blue-500",
        badge: "Cutout",
        available: true,
    },
    {
        id: "style",
        name: "Style",
        description: "Artistic style transfer",
        icon: <Palette className="w-5 h-5" />,
        time: "30-150s",
        color: "from-pink-500 to-purple-500",
        badge: "Art",
        available: true,
    },
    {
        id: "comic/generate",
        name: "Comic",
        description: "Generate comic stories",
        icon: <Film className="w-5 h-5" />,
        time: "60-240s",
        color: "from-orange-500 to-yellow-500",
        badge: "Story",
        available: true,
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

    const visibleFeatures = FEATURES.filter((feature) => feature.available !== false);

    const filteredFeatures = visibleFeatures.filter(
        (feature) =>
            feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const primaryFeatureId = filteredFeatures[0]?.id ?? visibleFeatures[0]?.id ?? FEATURES[0].id;

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-sidebar-border/60 bg-sidebar/85 shadow-lg">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(52,211,153,0.08),transparent_40%)]" />
            </div>

            <div className="relative flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-sidebar-muted-foreground">
                            Công cụ AI
                        </p>
                        <h2 className="text-lg font-semibold text-foreground">
                            Bộ lọc gọn nhẹ
                        </h2>
                        <p className="text-xs text-sidebar-muted-foreground">
                            Chỉ hiển thị các tính năng đang sử dụng.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden h-9 w-9 rounded-full border-sidebar-border/60 bg-white/5 text-sidebar-foreground hover:border-sidebar-primary/50 hover:bg-sidebar-primary/10 lg:inline-flex"
                        onClick={() => onSelectFeature(primaryFeatureId)}
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm công cụ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-sidebar-border/60 bg-white/5 px-9 py-2.5 text-sm text-foreground placeholder:text-sidebar-muted-foreground focus:border-sidebar-primary/70 focus:outline-none focus:ring-2 focus:ring-sidebar-primary/60"
                    />
                </div>
            </div>

            <div className="relative flex-1 overflow-y-auto px-3 pb-4">
                <div className="space-y-2">
                    {filteredFeatures.map((feature) => {
                        const isActive = selectedFeature === feature.id;
                        return (
                            <button
                                key={feature.id}
                                onClick={() => onSelectFeature(feature.id)}
                                className={`group flex w-full items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar/80 p-3 text-left transition hover:border-sidebar-primary/60 hover:bg-sidebar/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary/70 ${
                                    isActive
                                        ? "border-transparent bg-gradient-to-r " +
                                          feature.color +
                                          " text-white shadow-md"
                                        : ""
                                }`}
                            >
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} text-white shadow-sm shadow-black/20 ring-1 ring-white/15`}
                                >
                                    {feature.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold leading-tight">
                                            {feature.name}
                                        </p>
                                        {feature.badge ? (
                                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                                                {feature.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p
                                        className={`text-xs leading-relaxed ${
                                            isActive
                                                ? "text-white/90"
                                                : "text-sidebar-muted-foreground"
                                        }`}
                                    >
                                        {feature.description}
                                    </p>
                                    <p className="text-[11px] font-medium text-white/80">
                                        {feature.time}
                                    </p>
                                </div>
                                {isActive && (
                                    <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                                        Đang chọn
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {!filteredFeatures.length && (
                    <div className="mt-4 rounded-xl border border-dashed border-sidebar-border/70 bg-sidebar/60 p-4 text-center text-sm text-sidebar-muted-foreground">
                        Không tìm thấy công cụ phù hợp.
                    </div>
                )}
            </div>
        </div>
    );
}
