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
    X,
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
    {
        id: "story-comic",
        name: "Story Comic",
        description: "Multi-page anime story (2-3 pages)",
        icon: <Film className="w-5 h-5" />,
        time: "90-240s",
        color: "from-fuchsia-500 to-violet-500",
        badge: "Multi-page",
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

    const visibleFeatures = FEATURES.filter(
        (feature) => feature.available !== false
    );

    const filteredFeatures = visibleFeatures.filter(
        (feature) =>
            feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
    );
    const primaryFeatureId =
        filteredFeatures[0]?.id ?? visibleFeatures[0]?.id ?? FEATURES[0].id;

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 shadow-xl">
            {/* Animated background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(52,211,153,0.08),transparent_50%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            {/* Header Section */}
            <div className="relative flex flex-col gap-4 p-5 pb-4 border-b border-sidebar-border/30">
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
                                AI Tools
                            </p>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">
                            Công cụ chỉnh sửa
                        </h2>
                        <p className="text-xs text-sidebar-muted-foreground leading-relaxed">
                            Chọn công cụ AI phù hợp cho ảnh của bạn
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm công cụ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 px-10 py-2.5 text-sm text-foreground placeholder:text-sidebar-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Features List */}
            <div className="relative flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-2.5">
                    {filteredFeatures.map((feature, index) => {
                        const isActive = selectedFeature === feature.id;
                        return (
                            <button
                                key={feature.id}
                                onClick={() => onSelectFeature(feature.id)}
                                style={{ animationDelay: `${index * 30}ms` }}
                                className={`group relative flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-fade-in ${
                                    isActive
                                        ? "border-transparent bg-gradient-to-br " +
                                          feature.color +
                                          " text-white shadow-lg shadow-primary/25"
                                        : "border-sidebar-border/40 bg-sidebar-accent/20 hover:border-primary/30 hover:bg-sidebar-accent/40 hover:shadow-md"
                                }`}
                            >
                                {/* Shine effect on active */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
                                )}

                                {/* Icon */}
                                <div
                                    className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110 ${
                                        isActive
                                            ? "bg-white/20 ring-2 ring-white/30"
                                            : "bg-gradient-to-br " +
                                              feature.color +
                                              " ring-1 ring-black/10"
                                    }`}
                                >
                                    <div
                                        className={
                                            isActive
                                                ? "text-white"
                                                : "text-white"
                                        }
                                    >
                                        {feature.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p
                                            className={`text-sm font-bold leading-tight ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            {feature.name}
                                        </p>
                                        {feature.badge && (
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                    isActive
                                                        ? "bg-white/25 text-white"
                                                        : "bg-primary/15 text-primary"
                                                }`}
                                            >
                                                {feature.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className={`text-xs leading-relaxed mb-1 ${
                                            isActive
                                                ? "text-white/90"
                                                : "text-sidebar-muted-foreground"
                                        }`}
                                    >
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                isActive
                                                    ? "bg-white/70"
                                                    : "bg-primary/60"
                                            }`}
                                        />
                                        <p
                                            className={`text-[11px] font-semibold ${
                                                isActive
                                                    ? "text-white/80"
                                                    : "text-primary"
                                            }`}
                                        >
                                            {feature.time}
                                        </p>
                                    </div>
                                </div>

                                {/* Active Indicator */}
                                {isActive && (
                                    <div className="flex-shrink-0">
                                        <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {!filteredFeatures.length && (
                    <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sidebar-border/50 bg-sidebar-accent/20 p-8 text-center">
                        <Search className="h-10 w-10 text-sidebar-muted-foreground opacity-50" />
                        <div>
                            <p className="text-sm font-semibold text-foreground mb-1">
                                Không tìm thấy kết quả
                            </p>
                            <p className="text-xs text-sidebar-muted-foreground">
                                Thử từ khóa khác hoặc xóa bộ lọc
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="relative border-t border-sidebar-border/30 p-4">
                <div className="rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-3 text-center">
                    <p className="text-xs font-semibold text-foreground mb-0.5">
                        {filteredFeatures.length} công cụ AI
                    </p>
                    <p className="text-[10px] text-sidebar-muted-foreground">
                        Powered by cutting-edge AI models
                    </p>
                </div>
            </div>
        </div>
    );
}
