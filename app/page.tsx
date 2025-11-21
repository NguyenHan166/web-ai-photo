"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Upload, Sparkles } from "lucide-react";
import Header from "@/components/header";
import FeaturesSidebar from "@/components/features-sidebar";
import FeatureForm from "@/components/feature-form";
import ImagePreview from "@/components/image-preview";

interface ProcessResult {
    status: "success" | "error";
    request_id?: string;
    story_id?: string;
    data?: {
        url?: string;
        presigned_url?: string;
        key?: string;
        outputs?: Array<{ url: string; index: number }>;
    };
    page_url?: string;
    pages?: Array<{
        page_index: number;
        page_url: string;
        key: string;
        presigned_url: string;
        panels: Array<{
            id: number;
            dialogue: string;
            speaker: string;
            emotion: string;
        }>;
    }>;
    meta?: Record<string, any>;
    error?: {
        message: string;
        code: string;
    };
    timestamp?: string;
}

const FEATURE_TIME: Record<string, string> = {
    upscale: "15-90s",
    clarity: "20-120s",
    "portraits/ic-light": "30-120s",
    enhance: "15-60s",
    "ai-beautify": "30-90s",
    "replace-bg": "20-60s",
    style: "30-150s",
    "comic/generate": "60-240s",
    "story-comic": "90-240s",
};

export default function Home() {
    const [selectedFeature, setSelectedFeature] = useState<string>("upscale");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [processedImages, setProcessedImages] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>("");
    const [requestId, setRequestId] = useState<string | null>(null);

    const handleFeatureSelect = (featureId: string) => {
        setSelectedFeature(featureId);
        setSidebarOpen(false);
        setProcessedImages([]);
        setUploadedImage(null);
        setProcessingStatus("");
        setRequestId(null);
    };

    const handleProcessingChange = (processing: boolean, status = "") => {
        setIsProcessing(processing);
        setProcessingStatus(status);
        if (processing) {
            setProcessedImages([]);
            setRequestId(null);
        }
    };

    const handleProcess = async (result: ProcessResult) => {
        console.log("[Client] Processing result:", result);
        if (result.request_id) {
            setRequestId(result.request_id);
        }

        if (result.status === "error") {
            setProcessingStatus(
                result.error?.message || "Processing failed. Vui lòng thử lại."
            );
            return;
        }

        let imageUrls: string[] = [];

        if (result.pages && Array.isArray(result.pages)) {
            imageUrls = result.pages
                .map((page) => page.page_url || page.presigned_url)
                .filter(Boolean);
        } else if (result.page_url) {
            imageUrls = [result.page_url];
        } else if (result.data?.outputs && Array.isArray(result.data.outputs)) {
            imageUrls = result.data.outputs.map((output) => output.url);
        } else if (result.data?.presigned_url || result.data?.url) {
            imageUrls = [result.data.presigned_url || result.data.url || ""];
        }

        if (imageUrls.length > 0) {
            setProcessedImages(imageUrls.filter(Boolean));
            setProcessingStatus(
                `Hoàn tất ${imageUrls.length} ảnh${
                    result.request_id ? ` · Request: ${result.request_id}` : ""
                }`
            );
        } else {
            setProcessingStatus("Xử lý xong nhưng chưa nhận được URL ảnh.");
        }
    };

    const handleDeleteImage = () => {
        setUploadedImage(null);
        setProcessedImages([]);
        setProcessingStatus("");
        setRequestId(null);
    };

    const downloadImage = async (url: string, index: number) => {
        try {
            // Tải ảnh về trước
            const response = await fetch(url, { mode: "cors" });
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch image: ${response.statusText}`
                );
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const featureName = selectedFeature.replace(/[/-]/g, "_");
            const timestamp = new Date().toISOString().slice(0, 10);

            // Tạo link download
            const downloadLink = document.createElement("a");
            downloadLink.href = blobUrl;
            downloadLink.download = `${featureName}_${timestamp}_${
                index + 1
            }.jpg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Mở ảnh trong tab mới sau khi download
            setTimeout(() => {
                window.open(url, "_blank", "noopener,noreferrer");
            }, 100);

            // Cleanup blob URL sau 2 giây
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        } catch (error) {
            console.error("[Client] Download error:", error);
            // Fallback: sử dụng link trực tiếp
            const link = document.createElement("a");
            link.href = url;
            link.download = `processed-image-${index + 1}.jpg`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Vẫn mở tab mới
            setTimeout(() => {
                window.open(url, "_blank", "noopener,noreferrer");
            }, 100);
        }
    };

    const activeTime = useMemo(
        () => FEATURE_TIME[selectedFeature] || "15-240s",
        [selectedFeature]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div
                        className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
                        style={{ animationDelay: "1s" }}
                    />
                </div>

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40 animate-fade-in"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div
                    className={`fixed lg:relative w-80 h-full border-r border-sidebar-border/50 overflow-y-auto transition-all duration-300 ease-in-out z-50 lg:z-auto ${
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full lg:translate-x-0"
                    }`}
                >
                    <FeaturesSidebar
                        selectedFeature={selectedFeature}
                        onSelectFeature={handleFeatureSelect}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto w-full relative">
                    <div className="w-full h-full flex justify-center p-4 sm:p-6 lg:p-8 xl:p-10">
                        <div className="w-full max-w-7xl space-y-6">
                            {/* Status Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm px-5 py-4 shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <span
                                            className={`flex h-3 w-3 rounded-full ${
                                                isProcessing
                                                    ? "bg-amber-400 animate-ping absolute"
                                                    : processedImages.length > 0
                                                    ? "bg-emerald-400"
                                                    : "bg-muted-foreground/50"
                                            }`}
                                        />
                                        <span
                                            className={`flex h-3 w-3 rounded-full ${
                                                isProcessing
                                                    ? "bg-amber-400"
                                                    : processedImages.length > 0
                                                    ? "bg-emerald-400"
                                                    : "bg-muted-foreground/50"
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {processingStatus ||
                                                "Sẵn sàng xử lý"}
                                        </p>
                                        {requestId && (
                                            <p className="text-xs text-muted-foreground font-mono">
                                                ID: {requestId}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-2 border border-primary/30">
                                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                            ETA: {activeTime}
                                        </span>
                                    </div>
                                    {processedImages.length > 0 && (
                                        <div className="rounded-full bg-emerald-500/20 px-4 py-2 border border-emerald-500/30">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                ✓ {processedImages.length} ảnh
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Feature Form */}
                            <FeatureForm
                                selectedFeature={selectedFeature}
                                onImageUpload={setUploadedImage}
                                onProcess={handleProcess}
                                onProcessingChange={handleProcessingChange}
                                isProcessing={isProcessing}
                                hasImage={!!uploadedImage}
                            />

                            {/* Helper Text */}
                            <div className="flex items-center gap-2 px-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                <p className="text-xs text-muted-foreground">
                                    Ước tính: {activeTime} · Giữ tab mở khi xử
                                    lý
                                </p>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                            </div>

                            {/* Image Preview Section */}
                            <div className="space-y-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 sm:p-7 shadow-xl">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
                                            <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                                Preview Gallery
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            So sánh ảnh gốc và kết quả sau khi
                                            xử lý
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20">
                                            1. Upload
                                        </span>
                                        <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/20">
                                            2. Process
                                        </span>
                                        <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            3. Download
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
                                    {/* Original Image */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                Original
                                            </h2>
                                            {uploadedImage && (
                                                <Button
                                                    onClick={handleDeleteImage}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 border-destructive/30"
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                        {uploadedImage ? (
                                            <Card className="overflow-hidden bg-card border-2 border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                                                <ImagePreview
                                                    src={
                                                        uploadedImage ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt="Original"
                                                    isLoading={false}
                                                />
                                            </Card>
                                        ) : (
                                            <Card className="flex h-64 items-center justify-center border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 text-center">
                                                <div className="p-6">
                                                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                                        <Upload className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Chưa có ảnh
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                                        Upload ở form bên trên
                                                    </p>
                                                </div>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Processed Image */}
                                    <div className="space-y-3">
                                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    isProcessing
                                                        ? "bg-amber-400 animate-pulse"
                                                        : "bg-emerald-500"
                                                }`}
                                            />
                                            {isProcessing
                                                ? "Processing..."
                                                : "Result"}
                                        </h2>

                                        {isProcessing && (
                                            <Card className="relative flex aspect-square items-center justify-center overflow-hidden border-2 border-primary/30 bg-card shadow-xl">
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse" />
                                                <ImagePreview
                                                    src={null}
                                                    alt="Processing"
                                                    isLoading={true}
                                                />
                                            </Card>
                                        )}

                                        {processedImages.length > 0 &&
                                            !isProcessing && (
                                                <>
                                                    <Card className="overflow-hidden bg-card border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                                                        <ImagePreview
                                                            src={
                                                                processedImages[0] ||
                                                                "/placeholder.svg"
                                                            }
                                                            alt="Processed"
                                                            isLoading={false}
                                                        />
                                                    </Card>
                                                    <Button
                                                        onClick={() =>
                                                            downloadImage(
                                                                processedImages[0],
                                                                0
                                                            )
                                                        }
                                                        size="lg"
                                                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download Result
                                                    </Button>
                                                </>
                                            )}

                                        {!isProcessing &&
                                            processedImages.length === 0 &&
                                            uploadedImage && (
                                                <Card className="flex h-64 items-center justify-center border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 text-center">
                                                    <div className="p-6">
                                                        <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            Chờ xử lý
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                                            Nhấn Process để bắt
                                                            đầu
                                                        </p>
                                                    </div>
                                                </Card>
                                            )}

                                        {!uploadedImage &&
                                            !isProcessing &&
                                            processedImages.length === 0 && (
                                                <Card className="flex h-64 items-center justify-center border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 text-center">
                                                    <div className="p-6">
                                                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                                            <Sparkles className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            Chưa có kết quả
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                                            Upload và xử lý ảnh
                                                            trước
                                                        </p>
                                                    </div>
                                                </Card>
                                            )}
                                    </div>
                                </div>

                                {/* Multiple Results Grid */}
                                {processedImages.length > 1 && (
                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <span className="h-6 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
                                                Tất cả kết quả (
                                                {processedImages.length})
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {processedImages.map(
                                                (imageUrl, index) => (
                                                    <div
                                                        key={index}
                                                        className="space-y-3 group"
                                                    >
                                                        <Card className="overflow-hidden bg-card border-2 border-border/50 shadow-md hover:shadow-lg hover:border-primary/50 transition-all">
                                                            <ImagePreview
                                                                src={
                                                                    imageUrl ||
                                                                    "/placeholder.svg"
                                                                }
                                                                alt={`Result ${
                                                                    index + 1
                                                                }`}
                                                                isLoading={
                                                                    false
                                                                }
                                                            />
                                                        </Card>
                                                        <Button
                                                            onClick={() =>
                                                                downloadImage(
                                                                    imageUrl,
                                                                    index
                                                                )
                                                            }
                                                            size="sm"
                                                            className="w-full opacity-80 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Download className="w-3 h-3 mr-2" />
                                                            Download #
                                                            {index + 1}
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
