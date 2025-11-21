"use client";

import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { ZoomIn, Maximize2 } from "lucide-react";
import { useState } from "react";

interface ImagePreviewProps {
    src: string | null;
    alt: string;
    isLoading?: boolean;
}

export default function ImagePreview({
    src,
    alt,
    isLoading = false,
}: ImagePreviewProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (isLoading) {
        return (
            <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 animate-pulse" />
                <div className="relative flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <Spinner className="relative" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground mb-1">
                            Processing image...
                        </p>
                        <p className="text-xs text-muted-foreground">
                            AI is working its magic ✨
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!src) {
        return (
            <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 border-2 border-dashed border-border/50 rounded-lg">
                <div className="text-center p-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-3">
                        <ZoomIn className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                        No image
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Upload an image to preview
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-muted/30 via-background to-muted/30 group">
            {/* Loading skeleton */}
            {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
            )}

            {/* Image */}
            <img
                src={src || "/placeholder.svg"}
                alt={alt}
                className={`w-full h-full object-contain transition-all duration-500 ${
                    isZoomed
                        ? "scale-150 cursor-zoom-out"
                        : "scale-100 cursor-zoom-in"
                } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onClick={() => setIsZoomed(!isZoomed)}
                onLoad={() => setImageLoaded(true)}
            />

            {/* Zoom overlay */}
            {imageLoaded && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all hover:scale-110"
                        aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Gradient border effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
            </div>
        </div>
    );
}
