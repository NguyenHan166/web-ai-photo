"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, X } from "lucide-react";

interface FeatureFormProps {
    selectedFeature: string;
    onImageUpload: (imageUrl: string) => void;
    onProcess: (result: ProcessResult) => Promise<void>;
    onProcessingChange: (processing: boolean, status?: string) => void;
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

type FeatureConfig = {
    label: string;
    description: string;
    inputs: string[];
    defaultValues?: Record<string, string>;
};

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

const FEATURE_ENDPOINTS: Record<string, string> = {
    upscale: "/upscale",
    "portraits/ic-light": "/portraits/ic-light",
    clarity: "/clarity",
    enhance: "/enhance",
    "ai-beautify": "/ai-beautify",
    "replace-bg": "/replace-bg",
    style: "/style/replace-style",
    "comic/generate": "/comic/generate",
};

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
    upscale: {
        label: "Image Upscaling (GFPGAN)",
        description: "Khôi phục khuôn mặt và upscale 1x/2x/4x",
        inputs: ["image", "scale", "version"],
        defaultValues: { scale: "2", version: "v1.4" },
    },
    "portraits/ic-light": {
        label: "Portrait Relighting",
        description: "Thay đổi ánh sáng chân dung theo prompt",
        inputs: [
            "image",
            "image_url",
            "prompt",
            "appended_prompt",
            "negative_prompt",
            "light_source",
            "steps",
            "cfg",
            "width",
            "height",
            "number_of_images",
            "output_format",
            "output_quality",
        ],
        defaultValues: {
            prompt: "studio soft light, flattering portrait lighting",
            appended_prompt: "best quality",
            negative_prompt:
                "lowres, bad anatomy, bad hands, cropped, worst quality",
            light_source: "None",
            steps: "25",
            cfg: "2",
            number_of_images: "1",
            output_format: "webp",
            output_quality: "80",
        },
    },
    clarity: {
        label: "Clarity Improvement (Real-ESRGAN)",
        description: "Tăng độ nét/super-resolution 2x hoặc 4x",
        inputs: ["image", "scale", "faceEnhance"],
        defaultValues: { scale: "2", faceEnhance: "false" },
    },
    enhance: {
        label: "Image Enhancement (Topaz)",
        description: "Nâng chất lượng với các model chuyên biệt",
        inputs: ["image", "scale", "model"],
        defaultValues: { scale: "2", model: "standard-v2" },
    },
    "ai-beautify": {
        label: "AI Beautify",
        description: "Pipeline 4 bước cho ảnh chân dung",
        inputs: ["image"],
    },
    "replace-bg": {
        label: "Background Replacement",
        description: "Xóa nền hoặc thay nền mới",
        inputs: ["fg", "bg", "mode", "fit", "position", "featherPx", "shadow", "signTtl"],
        defaultValues: {
            mode: "replace",
            fit: "cover",
            position: "centre",
            featherPx: "1",
            shadow: "1",
            signTtl: "3600",
        },
    },
    style: {
        label: "Style Transfer",
        description: "Biến đổi ảnh sang phong cách nghệ thuật",
        inputs: ["image", "style", "extra"],
        defaultValues: { style: "anime" },
    },
    "comic/generate": {
        label: "Comic Generation",
        description: "Sinh trang comic từ prompt văn bản",
        inputs: ["prompt", "panels", "style"],
        defaultValues: { panels: "4", style: "anime_color" },
    },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FeatureForm({
    selectedFeature,
    onImageUpload,
    onProcess,
    onProcessingChange,
    isProcessing,
    hasImage,
}: FeatureFormProps) {
    const config = useMemo(
        () =>
            FEATURE_CONFIGS[selectedFeature] || {
                label: "Feature",
                description: "",
                inputs: [],
            },
        [selectedFeature]
    );

    const [formData, setFormData] = useState<Record<string, string>>(
        config.defaultValues || {}
    );
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [useImageUrl, setUseImageUrl] = useState(false);

    useEffect(() => {
        setFormData(config.defaultValues || {});
        setBackgroundImage(null);
        setBackgroundFile(null);
        setImageFile(null);
        setError(null);
        setProgress(0);
        setUseImageUrl(false);
    }, [config]);

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "main" | "background" = "main"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError("File phải nhỏ hơn 10MB theo yêu cầu API.");
            return;
        }

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
    };

    const validateInputs = () => {
        const bgMode = formData.mode || config.defaultValues?.mode || "replace";

        if (
            selectedFeature !== "comic/generate" &&
            selectedFeature !== "portraits/ic-light" &&
            config.inputs.includes("image") &&
            !imageFile
        ) {
            setError("Vui lòng upload ảnh trước khi gửi.");
            return false;
        }

        if (config.inputs.includes("fg") && !imageFile) {
            setError("Yêu cầu ảnh foreground (fg).");
            return false;
        }

        if (
            selectedFeature === "portraits/ic-light" &&
            !imageFile &&
            !formData.image_url
        ) {
            setError("Cần upload ảnh hoặc cung cấp image_url.");
            return false;
        }

        if (
            selectedFeature === "replace-bg" &&
            bgMode === "replace" &&
            !backgroundFile
        ) {
            setError("Chọn ảnh background khi ở chế độ replace.");
            return false;
        }

        if (
            selectedFeature === "comic/generate" &&
            (!formData.prompt || formData.prompt.trim().length < 5)
        ) {
            setError("Prompt tối thiểu 5 ký tự.");
            return false;
        }

        if (selectedFeature === "clarity") {
            const allowed = ["2", "4"];
            if (formData.scale && !allowed.includes(formData.scale)) {
                setError("Scale hợp lệ cho clarity: 2x hoặc 4x.");
                return false;
            }
        }

        if (selectedFeature === "enhance") {
            const allowed = ["2", "4", "6"];
            if (formData.scale && !allowed.includes(formData.scale)) {
                setError("Scale hợp lệ cho enhance: 2x, 4x hoặc 6x.");
                return false;
            }
        }

        if (selectedFeature === "portraits/ic-light") {
            const width = Number(formData.width);
            const height = Number(formData.height);
            const checkDim = (value: number) =>
                !Number.isNaN(value) &&
                value >= 256 &&
                value <= 1024 &&
                value % 64 === 0;
            if (formData.width && !checkDim(width)) {
                setError("Width phải trong 256-1024 và bội số của 64.");
                return false;
            }
            if (formData.height && !checkDim(height)) {
                setError("Height phải trong 256-1024 và bội số của 64.");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setProgress(5);

        if (!validateInputs()) return;

        const endpoint =
            FEATURE_ENDPOINTS[selectedFeature] || `/${selectedFeature}`;
        const url = `${API_BASE}${
            endpoint.startsWith("/") ? "" : "/"
        }${endpoint}`;

        const form = new FormData();
        const bgMode = formData.mode || config.defaultValues?.mode || "replace";

        if (selectedFeature === "portraits/ic-light") {
            if (imageFile) form.append("image", imageFile);
            if (!imageFile && formData.image_url) {
                form.append("image_url", formData.image_url.trim());
            }
        } else if (selectedFeature === "replace-bg") {
            if (imageFile) form.append("fg", imageFile);
            if (bgMode === "replace" && backgroundFile) {
                form.append("bg", backgroundFile);
            }
        } else if (config.inputs.includes("image") && imageFile) {
            form.append("image", imageFile);
        }

        const fieldNameMap: Record<string, string> = {
            background: "bg",
        };

        for (const key of config.inputs) {
            const value = formData[key];
            if (!value) continue;

            if (key === "image") continue;
            if (key === "fg") continue;
            if (key === "bg") continue;
            if (key === "image_url" && imageFile) continue;

            const formKey = fieldNameMap[key] || key;
            form.append(formKey, value);
        }

        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 92) return 92;
                return prev + Math.random() * 8;
            });
        }, 450);

        onProcessingChange(true, "Đang gửi yêu cầu tới máy chủ...");

        try {
            const response = await fetch(url, {
                method: "POST",
                body: form,
            });

            onProcessingChange(true, "Server đang xử lý, vui lòng đợi...");
            const result: ProcessResult = await response.json();

            if (!response.ok || result.status === "error") {
                const errorMessage =
                    typeof result.error === "string"
                        ? result.error
                        : result.error?.message ||
                          "Processing failed. Vui lòng thử lại.";
                setError(errorMessage);
                onProcessingChange(false, errorMessage);
                setProgress(0);
                return;
            }

            setProgress(100);
            await onProcess(result);
            onProcessingChange(false, "Hoàn tất. Kết quả đã sẵn sàng.");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Unknown error occurred";
            console.error("[Client] Submit error:", message);
            setError(message);
            onProcessingChange(false, message);
            setProgress(0);
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => setProgress(0), 600);
        }
    };

    const needsImage =
        config.inputs.includes("image") || config.inputs.includes("fg");
    const bgMode = formData.mode || config.defaultValues?.mode || "replace";
    const showProgress = isProcessing || progress > 0;

    return (
        <Card className="bg-card border border-border p-6 space-y-6 h-fit sticky top-8">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-balance">
                    {config.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {config.description}
                </p>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            {showProgress && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Đang xử lý
                        </span>
                        <span className="text-xs font-medium text-primary">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary via-accent to-primary/70 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {needsImage && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold">
                                {selectedFeature === "replace-bg"
                                    ? "Foreground Image (fg)"
                                    : "Upload Image"}
                            </label>
                            {selectedFeature === "portraits/ic-light" && (
                                <button
                                    type="button"
                                    onClick={() => setUseImageUrl(!useImageUrl)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {useImageUrl
                                        ? "Dùng file upload"
                                        : "Dùng image_url"}
                                </button>
                            )}
                        </div>

                        {!useImageUrl && (
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
                                            : "Click to upload (<=10MB)"}
                                    </span>
                                </label>
                            </div>
                        )}

                        {useImageUrl && (
                            <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image_url || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        image_url: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        )}
                    </div>
                )}

                {config.inputs.includes("scale") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Scale
                        </label>
                        <select
                            value={formData.scale || config.defaultValues?.scale || "2"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    scale: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {selectedFeature === "enhance" ? (
                                <>
                                    <option value="2">2x</option>
                                    <option value="4">4x</option>
                                    <option value="6">6x</option>
                                </>
                            ) : selectedFeature === "clarity" ? (
                                <>
                                    <option value="2">2x</option>
                                    <option value="4">4x</option>
                                </>
                            ) : (
                                <>
                                    <option value="1">1x</option>
                                    <option value="2">2x</option>
                                    <option value="4">4x</option>
                                </>
                            )}
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
                            {selectedFeature === "comic/generate"
                                ? "Story Prompt"
                                : "Lighting Prompt"}
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
                                selectedFeature === "comic/generate"
                                    ? "Ví dụ: Một cô gái phát hiện ra cổng thần bí trong khu rừng"
                                    : "studio soft light, flattering portrait lighting"
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                        />
                    </div>
                )}

                {config.inputs.includes("appended_prompt") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Appended Prompt
                        </label>
                        <input
                            type="text"
                            value={formData.appended_prompt || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    appended_prompt: e.target.value,
                                })
                            }
                            placeholder="best quality"
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {config.inputs.includes("negative_prompt") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Negative Prompt
                        </label>
                        <input
                            type="text"
                            value={formData.negative_prompt || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    negative_prompt: e.target.value,
                                })
                            }
                            placeholder="lowres, bad anatomy, bad hands..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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

                {config.inputs.includes("steps") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Steps (1-100)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={formData.steps || "25"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    steps: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {config.inputs.includes("cfg") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Guidance (1-32)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={32}
                            value={formData.cfg || "2"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    cfg: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {config.inputs.includes("width") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Output Width (256-1024, step 64)
                        </label>
                        <input
                            type="number"
                            min={256}
                            max={1024}
                            step={64}
                            value={formData.width || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    width: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {config.inputs.includes("height") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Output Height (256-1024, step 64)
                        </label>
                        <input
                            type="number"
                            min={256}
                            max={1024}
                            step={64}
                            value={formData.height || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    height: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {config.inputs.includes("number_of_images") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Number of Images (1-12)
                        </label>
                        <select
                            value={formData.number_of_images || "1"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    number_of_images: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {Array.from({ length: 12 }).map((_, idx) => (
                                <option key={idx + 1} value={idx + 1}>
                                    {idx + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {config.inputs.includes("output_format") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Output Format
                        </label>
                        <select
                            value={formData.output_format || "webp"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    output_format: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="webp">webp</option>
                            <option value="jpg">jpg</option>
                            <option value="png">png</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("output_quality") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Output Quality (1-100)
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={100}
                            value={formData.output_quality || "80"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    output_quality: e.target.value,
                                })
                            }
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            {formData.output_quality || "80"}
                        </p>
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
                            <option value="standard-v2">standard-v2</option>
                            <option value="low-res-v2">low-res-v2</option>
                            <option value="cgi">cgi</option>
                            <option value="high-fidelity-v2">
                                high-fidelity-v2
                            </option>
                            <option value="text-refine">text-refine</option>
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
                            value={formData.style || config.defaultValues?.style || "anime"}
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
                                    <option value="anime">anime</option>
                                    <option value="ghibli">ghibli</option>
                                    <option value="watercolor">watercolor</option>
                                    <option value="oil-painting">oil-painting</option>
                                    <option value="sketches">sketches</option>
                                    <option value="cartoon">cartoon</option>
                                </>
                            ) : (
                                <option value="anime_color">anime_color</option>
                            )}
                        </select>
                    </div>
                )}

                {config.inputs.includes("extra") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Extra Description (optional)
                        </label>
                        <input
                            type="text"
                            value={formData.extra || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    extra: e.target.value,
                                })
                            }
                            placeholder='Ví dụ: "add sunset background"'
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

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

                {config.inputs.includes("bg") && bgMode === "replace" && (
                    <div>
                        <label className="block text-sm font-semibold mb-3">
                            Background Image (bg)
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, "background")}
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
                                        : "Upload background (<=10MB)"}
                                </span>
                            </label>
                        </div>
                        {backgroundImage && (
                            <button
                                type="button"
                                onClick={() => {
                                    setBackgroundImage(null);
                                    setBackgroundFile(null);
                                }}
                                className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Remove Background
                            </button>
                        )}
                    </div>
                )}

                {config.inputs.includes("fit") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Fit
                        </label>
                        <select
                            value={formData.fit || "cover"}
                            onChange={(e) =>
                                setFormData({ ...formData, fit: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="cover">cover</option>
                            <option value="contain">contain</option>
                            <option value="fill">fill</option>
                            <option value="inside">inside</option>
                            <option value="outside">outside</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("position") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Position
                        </label>
                        <select
                            value={formData.position || "centre"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    position: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="centre">centre</option>
                            <option value="top">top</option>
                            <option value="bottom">bottom</option>
                            <option value="left">left</option>
                            <option value="right">right</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("featherPx") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Feather (0-20 px)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={20}
                            value={formData.featherPx || "1"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    featherPx: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                )}

                {config.inputs.includes("shadow") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Shadow
                        </label>
                        <select
                            value={formData.shadow || "1"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    shadow: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="1">Có</option>
                            <option value="0">Không</option>
                        </select>
                    </div>
                )}

                {config.inputs.includes("signTtl") && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Presigned TTL (60-86400s)
                        </label>
                        <input
                            type="number"
                            min={60}
                            max={86400}
                            value={formData.signTtl || "3600"}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    signTtl: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
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
                            <option value="5">5</option>
                            <option value="6">6</option>
                        </select>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isProcessing || (!isProcessing && needsImage && !useImageUrl && !imageFile && selectedFeature !== "comic/generate")}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Process"}
                </Button>
            </form>
        </Card>
    );
}
