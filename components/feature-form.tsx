"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, X, ChevronDown } from "lucide-react";

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
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-gateway-datn-v2-production.up.railway.app/api"
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
        label: "Image Enhancement (Real-ESRGAN)",
        description:
            "Tăng độ phân giải 2x/4x với Real-ESRGAN, hỗ trợ bổ trợ khuôn mặt",
        inputs: ["image", "scale", "faceEnhance", "model"],
        defaultValues: {
            scale: "2",
            faceEnhance: "false",
            model: "real-esrgan",
        },
    },
    "ai-beautify": {
        label: "AI Beautify (GFPGAN-based)",
        description:
            "Upscale + phục hồi khuôn mặt với Replicate alexgenovese/upscaler (scale 1-10).",
        inputs: ["image", "scale", "faceEnhance"],
        defaultValues: { scale: "4", faceEnhance: "true" },
    },
    "replace-bg": {
        label: "Background Replacement",
        description: "Xóa nền hoặc thay nền mới",
        inputs: [
            "fg",
            "bg",
            "mode",
            "fit",
            "position",
            "featherPx",
            "shadow",
            "signTtl",
        ],
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
            const allowed = ["2", "4"];
            if (formData.scale && !allowed.includes(formData.scale)) {
                setError("Scale hợp lệ cho enhance: 2x hoặc 4x.");
                return false;
            }
            if (formData.model && formData.model !== "real-esrgan") {
                setError("Model hợp lệ cho enhance: real-esrgan.");
                return false;
            }
        }

        if (selectedFeature === "ai-beautify") {
            const scale = Number(formData.scale ?? config.defaultValues?.scale ?? 4);
            if (
                Number.isNaN(scale) ||
                scale < 1 ||
                scale > 10
            ) {
                setError("Scale hợp lệ cho beautify: 1-10.");
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
            faceEnhance: "face_enhance",
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
    const inputClass =
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/60 transition";
    const selectClass =
        "w-full appearance-none rounded-xl border border-transparent bg-transparent px-3 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/65 focus:ring-offset-2 focus:ring-offset-background transition";
    const selectWrapper =
        "relative rounded-xl border border-white/10 bg-white/5 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.65)] hover:border-primary/50 focus-within:border-primary/60 focus-within:shadow-[0_12px_40px_-18px_rgba(59,130,246,0.55)] transition";
    const SelectCaret = () => (
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    );

    return (
        <Card className="relative h-fit w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/90 via-background to-background/90 shadow-2xl">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-12 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute right-[-20%] top-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <div className="relative space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            Control Panel
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                                {config.label}
                            </h2>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/30">
                                {selectedFeature}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {config.description ||
                                "Tùy chỉnh tham số và gửi yêu cầu đến máy chủ AI."}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                            Giới hạn tệp 10MB
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                            {isProcessing ? "Đang xử lý" : "Sẵn sàng gửi"}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="hidden rounded-full border-white/20 bg-white/5 text-xs font-semibold text-foreground shadow-sm hover:border-primary/40 hover:bg-primary/10 sm:inline-flex"
                            onClick={() => setUseImageUrl(false)}
                        >
                            <Sparkles className="mr-2 h-4 w-4 text-primary" />
                            Làm mới form
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <div className="absolute inset-y-0 left-0 w-1 bg-destructive/50" />
                        {error}
                    </div>
                )}

                {showProgress && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <span>Trạng thái</span>
                            <span className="text-primary">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary/80 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {isProcessing
                                ? "Server đang xử lý yêu cầu của bạn."
                                : "Đang chuẩn bị gửi..."}
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 border-t border-white/5 pt-6"
                >
                    {needsImage && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm sm:p-5">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold">
                                        {selectedFeature === "replace-bg"
                                            ? "Foreground (fg)"
                                            : "Ảnh nguồn"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Kéo thả hoặc chọn tệp. Hỗ trợ JPG/PNG/
                                        WebP, tối đa 10MB.
                                    </p>
                                </div>
                                {selectedFeature === "portraits/ic-light" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setUseImageUrl(!useImageUrl)
                                        }
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/10"
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
                                        onChange={(e) =>
                                            handleImageChange(e, "main")
                                        }
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-gradient-to-r from-white/5 to-transparent px-4 py-5 text-center transition hover:border-primary/50 hover:bg-primary/5"
                                    >
                                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-primary shadow-inner">
                                            <Upload className="h-5 w-5" />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {hasImage
                                                    ? "Đã thêm ảnh ✓"
                                                    : "Chọn ảnh để bắt đầu"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Click để chọn hoặc kéo thả vào
                                                đây
                                            </p>
                                        </div>
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
                                    className={inputClass}
                                />
                            )}
                        </div>
                    )}

                    {config.inputs.includes("prompt") && (
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm sm:p-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <label className="text-sm font-semibold">
                                    {selectedFeature === "comic/generate"
                                        ? "Story Prompt"
                                        : "Lighting Prompt"}
                                </label>
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Càng chi tiết càng tốt
                                </span>
                            </div>
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
                                className={`${inputClass} min-h-[120px] resize-none`}
                            />
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        {config.inputs.includes("appended_prompt") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {config.inputs.includes("negative_prompt") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {config.inputs.includes("scale") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Scale
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={
                                            formData.scale ||
                                            config.defaultValues?.scale ||
                                            "2"
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                scale: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        {selectedFeature === "enhance" ||
                                        selectedFeature === "clarity" ? (
                                            <>
                                                <option value="2">2x</option>
                                                <option value="4">4x</option>
                                            </>
                                        ) : selectedFeature === "ai-beautify" ? (
                                            Array.from({ length: 10 }).map(
                                                (_, idx) => (
                                                    <option
                                                        key={idx + 1}
                                                        value={idx + 1}
                                                    >
                                                        {idx + 1}x
                                                    </option>
                                                )
                                            )
                                        ) : (
                                            <>
                                                <option value="1">1x</option>
                                                <option value="2">2x</option>
                                                <option value="4">4x</option>
                                            </>
                                        )}
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("version") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Model Version
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={formData.version || "v1.4"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                version: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="v1.3">v1.3</option>
                                        <option value="v1.4">v1.4</option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("light_source") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Light Source
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={formData.light_source || "None"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                light_source: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="None">None</option>
                                        <option value="Left Light">
                                            Left Light
                                        </option>
                                        <option value="Right Light">
                                            Right Light
                                        </option>
                                        <option value="Top Light">
                                            Top Light
                                        </option>
                                        <option value="Bottom Light">
                                            Bottom Light
                                        </option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("steps") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {config.inputs.includes("cfg") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {config.inputs.includes("width") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {config.inputs.includes("height") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {config.inputs.includes("number_of_images") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Số ảnh (1-12)
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={formData.number_of_images || "1"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                number_of_images:
                                                    e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        {Array.from({ length: 12 }).map(
                                            (_, idx) => (
                                                <option
                                                    key={idx + 1}
                                                    value={idx + 1}
                                                >
                                                    {idx + 1}
                                                </option>
                                            )
                                        )}
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("panels") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Number of Panels
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={formData.panels || "4"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                panels: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("output_format") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Output Format
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={formData.output_format || "webp"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                output_format: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="webp">webp</option>
                                        <option value="jpg">jpg</option>
                                        <option value="png">png</option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("model") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    Model (Real-ESRGAN)
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={formData.model || "real-esrgan"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                model: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="real-esrgan">
                                            real-esrgan
                                        </option>
                                    </select>
                                    <SelectCaret />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Giữ tham số để tương thích với API cũ.
                                </p>
                            </div>
                        )}

                        {config.inputs.includes("style") && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">
                                    {selectedFeature === "style"
                                        ? "Artistic Style"
                                        : "Comic Style"}
                                </label>
                                <div className={selectWrapper}>
                                    <select
                                        value={
                                            formData.style ||
                                            config.defaultValues?.style ||
                                            "anime"
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                style: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        {selectedFeature === "style" ? (
                                            <>
                                                <option value="anime">
                                                    anime
                                                </option>
                                                <option value="ghibli">
                                                    ghibli
                                                </option>
                                                <option value="watercolor">
                                                    watercolor
                                                </option>
                                                <option value="oil-painting">
                                                    oil-painting
                                                </option>
                                                <option value="sketches">
                                                    sketches
                                                </option>
                                                <option value="cartoon">
                                                    cartoon
                                                </option>
                                            </>
                                        ) : (
                                            <option value="anime_color">
                                                anime_color
                                            </option>
                                        )}
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                        {config.inputs.includes("extra") && (
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-semibold">
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
                                    className={inputClass}
                                />
                            </div>
                        )}
                    </div>

                    {config.inputs.includes("output_quality") && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm sm:px-5">
                            <div className="flex items-center justify-between text-sm font-semibold">
                                <span>Output Quality</span>
                                <span className="text-primary">
                                    {formData.output_quality || "80"}
                                </span>
                            </div>
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
                                className="mt-2 w-full accent-primary"
                            />
                            <p className="text-xs text-muted-foreground">
                                Chọn 80-90 để cân bằng chất lượng và dung lượng.
                            </p>
                        </div>
                    )}

                    {(config.inputs.includes("mode") ||
                        config.inputs.includes("bg")) && (
                        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm sm:p-5">
                            {config.inputs.includes("mode") && (
                                <div>
                                    <p className="mb-3 text-sm font-semibold">
                                        Background Mode
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    mode: "remove",
                                                })
                                            }
                                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                                                bgMode !== "replace"
                                                    ? "border-primary/50 bg-primary/15 text-primary"
                                                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30"
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
                                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                                                bgMode === "replace"
                                                    ? "border-primary/50 bg-primary/15 text-primary"
                                                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30"
                                            }`}
                                        >
                                            Replace
                                        </button>
                                    </div>
                                </div>
                            )}

                            {config.inputs.includes("bg") &&
                                bgMode === "replace" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">
                                            Background Image (bg)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleImageChange(
                                                        e,
                                                        "background"
                                                    )
                                                }
                                                className="hidden"
                                                id="background-upload"
                                            />
                                            <label
                                                htmlFor="background-upload"
                                                className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-gradient-to-r from-white/5 to-transparent px-4 py-4 text-center transition hover:border-primary/50 hover:bg-primary/5"
                                            >
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-primary shadow-inner">
                                                    <Upload className="h-4 w-4" />
                                                </span>
                                                <span className="text-sm text-foreground">
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
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:border-destructive/60"
                                            >
                                                <X className="h-4 w-4" />
                                                Remove Background
                                            </button>
                                        )}
                                    </div>
                                )}
                        </div>
                    )}

                    {(config.inputs.includes("fit") ||
                        config.inputs.includes("position") ||
                        config.inputs.includes("featherPx") ||
                        config.inputs.includes("shadow") ||
                        config.inputs.includes("signTtl")) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {config.inputs.includes("fit") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">
                                        Fit
                                    </label>
                                    <div className={selectWrapper}>
                                        <select
                                            value={formData.fit || "cover"}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                fit: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="cover">cover</option>
                                        <option value="contain">contain</option>
                                        <option value="fill">fill</option>
                                        <option value="inside">inside</option>
                                        <option value="outside">outside</option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                            {config.inputs.includes("position") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">
                                        Position
                                    </label>
                                    <div className={selectWrapper}>
                                        <select
                                            value={formData.position || "centre"}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                position: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="centre">centre</option>
                                        <option value="top">top</option>
                                        <option value="bottom">bottom</option>
                                        <option value="left">left</option>
                                        <option value="right">right</option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                            {config.inputs.includes("featherPx") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">
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
                                        className={inputClass}
                                    />
                                </div>
                            )}

                            {config.inputs.includes("shadow") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">
                                        Shadow
                                    </label>
                                    <div className={selectWrapper}>
                                        <select
                                            value={formData.shadow || "1"}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                shadow: e.target.value,
                                            })
                                        }
                                        className={selectClass}
                                    >
                                        <option value="1">Có</option>
                                        <option value="0">Không</option>
                                    </select>
                                    <SelectCaret />
                                </div>
                            </div>
                        )}

                            {config.inputs.includes("signTtl") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">
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
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {config.inputs.includes("faceEnhance") && (
                        <label
                            htmlFor="faceEnhance"
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">
                                    Enhance faces
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Bật Real-ESRGAN hỗ trợ khuôn mặt.
                                </p>
                            </div>
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
                                className="h-5 w-5 rounded border border-white/30 bg-background text-primary focus:ring-2 focus:ring-primary/60"
                            />
                        </label>
                    )}

                    <Button
                        type="submit"
                        disabled={
                            isProcessing ||
                            (!isProcessing &&
                                needsImage &&
                                !useImageUrl &&
                                !imageFile &&
                                selectedFeature !== "comic/generate")
                        }
                        className="w-full rounded-2xl bg-gradient-to-r from-primary via-accent to-primary/80 text-base font-semibold shadow-lg transition hover:brightness-110 disabled:opacity-50"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isProcessing ? "Processing..." : "Gửi đến AI"}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
