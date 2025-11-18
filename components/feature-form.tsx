"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, X } from "lucide-react";

interface FeatureFormProps {
    selectedFeature: string;
    onImageUpload: (imageUrl: string) => void;
    onProcess: (result: ProcessResult) => Promise<void>;
    isProcessing: boolean;
    hasImage: boolean;
}

interface ProcessResult {
    status: "success" | "error";
    request_id?: string;
    data?: {
        url?: string;
        presigned_url?: string;
        key?: string;
        outputs?: Array<{ url: string; index: number }>;
    };
    page_url?: string; // For comic generation
    meta?: Record<string, any>;
    error?: {
        message: string;
        code: string;
        details?: string;
    };
    timestamp?: string;
}

const FEATURE_CONFIGS: Record<string, { label: string; inputs: string[] }> = {
    upscale: {
        label: "Image Upscaling",
        inputs: ["image", "scale", "version"],
    },
    "ic-light": {
        label: "Portrait Relighting",
        inputs: ["image", "prompt", "light_source"],
    },
    clarity: {
        label: "Clarity Improvement",
        inputs: ["image", "scale", "faceEnhance"],
    },
    enhance: {
        label: "Professional Enhancement",
        inputs: ["image", "scale", "model"],
    },
    beautify: {
        label: "AI Beautify Portrait",
        inputs: ["image"],
    },
    "replace-bg": {
        label: "Background Replacement",
        inputs: ["image", "mode", "background"],
    },
    style: {
        label: "Style Transfer",
        inputs: ["image", "style"],
    },
    comic: {
        label: "Comic Generation",
        inputs: ["prompt", "panels", "style"],
    },
};

export default function FeatureForm({
    selectedFeature,
    onImageUpload,
    onProcess,
    isProcessing,
    hasImage,
}: FeatureFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const config = FEATURE_CONFIGS[selectedFeature];
    const isComicMode = selectedFeature === "comic";

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "main" | "background" = "main"
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                if (type === "background") {
                    setBackgroundImage(url);
                    setBackgroundFile(file);
                } else {
                    onImageUpload(url);
                    setImageFile(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (selectedFeature === "replace-bg") {
            setFormData((prev) => ({
                ...prev,
                mode: prev.mode ?? "remove", // chỉ set nếu chưa có
            }));
        }
    }, [selectedFeature]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setProgress(0);

        try {
            const form = new FormData();

            if (imageFile && !isComicMode) {
                form.append("image", imageFile);
            }

            if (backgroundFile) {
                form.append("background", backgroundFile);
            }

            if (selectedFeature === "replace-bg") {
                if (imageFile) form.append("fg", imageFile);
                if (backgroundFile) form.append("bg", backgroundFile);

                form.delete("image");
                form.delete("background");
            }

            for (const [key, value] of Object.entries(formData)) {
                if (value) form.append(key, value);
            }

            console.log(
                "[Client] Submitting form for feature:",
                selectedFeature
            );

            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return 90;
                    return prev + Math.random() * 30;
                });
            }, 500);

            const response = await fetch(
                `https://api-gateway-datn-v2-production.up.railway.app/api/${selectedFeature}`,
                {
                    method: "POST",
                    body: form,
                }
            );

            clearInterval(progressInterval);
            setProgress(100);

            const result: ProcessResult = await response.json();
            console.log("[Client] API response:", result);
            console.log("[Client] Request ID:", result.request_id);

            if (!response.ok || result.status === "error") {
                const errorMessage =
                    typeof result.error === "string"
                        ? result.error
                        : result.error?.message || "Processing failed";
                setError(errorMessage);
                console.error(
                    "[Client] Error code:",
                    typeof result.error === "object"
                        ? result.error?.code
                        : "UNKNOWN"
                );
                setProgress(0);
                return;
            }

            await onProcess(result);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Unknown error occurred";
            console.error("[Client] Submit error:", message);
            setError(message);
            setProgress(0);
        }
    };

    const needsImage = config.inputs.includes("image");
    const bgMode = formData.mode ?? "remove";

    return (
        <Card className="bg-card border border-border p-6 space-y-6 h-fit sticky top-8">
            <div>
                <h2 className="text-xl font-bold text-balance mb-2">
                    {config.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                    Configure and process your image
                </p>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            {isProcessing && progress > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Processing
                        </span>
                        <span className="text-xs font-medium text-primary">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload - Only if feature needs image */}
                {needsImage && (
                    <div>
                        <label className="block text-sm font-semibold mb-3">
                            Upload Image
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, "main")}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                            >
                                <Upload className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {hasImage
                                        ? "Image uploaded ✓"
                                        : "Click to upload"}
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Dynamic Inputs Based on Feature */}
                {config.inputs.includes("scale") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Scale
                        </label>
                        <select
                            value={formData.scale || "2"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    scale: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="1">1x</option>
                            <option value="2">2x</option>
                            <option value="4">4x</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("version") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Model Version
                        </label>
                        <select
                            value={formData.version || "v1.4"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    version: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="v1.3">v1.3</option>
                            <option value="v1.4">v1.4</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("prompt") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            {selectedFeature === "comic"
                                ? "Story Prompt"
                                : "Lighting Description"}
                        </label>
                        <textarea
                            value={formData.prompt || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    prompt: e.target.value,
                                })
                            }
                            placeholder={
                                selectedFeature === "comic"
                                    ? "Describe your story..."
                                    : "Describe desired lighting..."
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                        />
                    </div>
                )}

                {config.inputs.includes("light_source") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Light Source
                        </label>
                        <select
                            value={formData.light_source || "None"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    light_source: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="None">None</option>
                            <option value="Left Light">Left Light</option>
                            <option value="Right Light">Right Light</option>
                            <option value="Top Light">Top Light</option>
                            <option value="Bottom Light">Bottom Light</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("model") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Model
                        </label>
                        <select
                            value={formData.model || "standard-v2"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    model: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="standard-v2">Standard v2</option>
                            <option value="low-res-v2">
                                Low Resolution v2
                            </option>
                            <option value="cgi">CGI</option>
                            <option value="high-fidelity-v2">
                                High Fidelity v2
                            </option>
                            <option value="text-refine">Text Refine</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("style") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            {selectedFeature === "style"
                                ? "Artistic Style"
                                : "Comic Style"}
                        </label>
                        <select
                            value={formData.style || "anime"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    style: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {selectedFeature === "style" ? (
                                <>
                                    <option value="anime">Anime</option>
                                    <option value="ghibli">
                                        Studio Ghibli
                                    </option>
                                    <option value="watercolor">
                                        Watercolor
                                    </option>
                                    <option value="oil-painting">
                                        Oil Painting
                                    </option>
                                    <option value="sketches">Sketches</option>
                                    <option value="cartoon">Cartoon</option>
                                </>
                            ) : (
                                <option value="anime_color">Anime Color</option>
                            )}
                        </select>
                    </div>
                )}

                {/* Improved background mode selection with toggle buttons */}
                {config.inputs.includes("mode") && (
                    <div>
                        <label className="block text-sm font-semibold mb-3">
                            Background Mode
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, mode: "remove" })
                                }
                                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                                    bgMode !== "replace"
                                        ? "bg-primary text-white"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                            >
                                Remove
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({
                                        ...formData,
                                        mode: "replace",
                                    })
                                }
                                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                                    bgMode === "replace"
                                        ? "bg-primary text-white"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                            >
                                Replace
                            </button>
                        </div>
                    </div>
                )}

                {/* Added background image upload when replace mode is selected */}
                {config.inputs.includes("background") &&
                    bgMode === "replace" && (
                        <div>
                            <label className="block text-sm font-semibold mb-3">
                                Background Image
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        handleImageChange(e, "background")
                                    }
                                    className="hidden"
                                    id="background-upload"
                                />
                                <label
                                    htmlFor="background-upload"
                                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                >
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {backgroundImage
                                            ? "Background uploaded ✓"
                                            : "Upload background"}
                                    </span>
                                </label>
                            </div>
                            {backgroundImage && (
                                <button
                                    type="button"
                                    onClick={() => setBackgroundImage(null)}
                                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Remove Background
                                </button>
                            )}
                        </div>
                    )}

                {config.inputs.includes("faceEnhance") && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="faceEnhance"
                            checked={formData.faceEnhance === "true"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    faceEnhance: e.target.checked
                                        ? "true"
                                        : "false",
                                })
                            }
                            className="w-4 h-4"
                        />
                        <label
                            htmlFor="faceEnhance"
                            className="text-sm font-semibold"
                        >
                            Enhance faces
                        </label>
                    </div>
                )}

                {config.inputs.includes("panels") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Number of Panels
                        </label>
                        <select
                            value={formData.panels || "4"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    panels: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="6">6</option>
                        </select>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isProcessing || (!isComicMode && !hasImage)}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Process Image"}
                </Button>
            </form>
        </Card>
    );
}
