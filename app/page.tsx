"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import Header from "@/components/header";
import FeaturesSidebar from "@/components/features-sidebar";
import FeatureForm from "@/components/feature-form";
import ImagePreview from "@/components/image-preview";

interface ProcessResult {
    status: "success" | "error";
    request_id?: string;
    data?: {
        url?: string;
        presigned_url?: string;
        key?: string;
        outputs?: Array<{ url: string; index: number }>;
    };
    page_url?: string;
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

        if (result.page_url) {
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
            const response = await fetch(url, { mode: "cors" });
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const featureName = selectedFeature.replace("-", "_");
            const timestamp = new Date().toISOString().slice(0, 10);

            link.href = blobUrl;
            link.download = `${featureName}_${timestamp}_${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("[Client] Download error:", error);
            const link = document.createElement("a");
            link.href = url;
            link.download = `processed-image-${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const activeTime = useMemo(
        () => FEATURE_TIME[selectedFeature] || "15-240s",
        [selectedFeature]
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 lg:hidden z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <div
                    className={`fixed lg:relative w-80 h-full bg-sidebar border-r border-sidebar-border overflow-y-auto transition-transform duration-300 z-50 lg:z-auto ${
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

                <div className="flex-1 overflow-auto w-full">
                    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
                        <div className="w-full max-w-7xl">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
                                <div className="lg:col-span-1">
                                    <FeatureForm
                                        selectedFeature={selectedFeature}
                                        onImageUpload={setUploadedImage}
                                        onProcess={handleProcess}
                                        onProcessingChange={handleProcessingChange}
                                        isProcessing={isProcessing}
                                        hasImage={!!uploadedImage}
                                    />
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Ước tính thời gian: {activeTime}. Vui
                                        lòng giữ tab mở trong khi xử lý.
                                    </p>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    isProcessing
                                                        ? "bg-amber-500 animate-pulse"
                                                        : processedImages.length > 0
                                                          ? "bg-emerald-500"
                                                          : "bg-muted-foreground"
                                                }`}
                                            />
                                            <span>
                                                {processingStatus ||
                                                    "Sẵn sàng nhận yêu cầu"}
                                            </span>
                                        </div>
                                        {requestId && (
                                            <span className="text-[11px] font-mono px-2 py-1 rounded bg-muted text-muted-foreground">
                                                req: {requestId}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {uploadedImage && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Original
                                                    </h2>
                                                    <Button
                                                        onClick={handleDeleteImage}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                                <Card className="overflow-hidden bg-card border border-border">
                                                    <ImagePreview
                                                        src={uploadedImage || "/placeholder.svg"}
                                                        alt="Original"
                                                        isLoading={false}
                                                    />
                                                </Card>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {isProcessing && (
                                                <>
                                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Processing...
                                                    </h2>
                                                    <Card className="overflow-hidden bg-card border border-border p-8 flex items-center justify-center aspect-square relative">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse" />
                                                        <div className="relative text-center space-y-3">
                                                            <div className="w-12 h-12 border-[5px] border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {processingStatus ||
                                                                    "Server đang xử lý yêu cầu..."}
                                                            </p>
                                                        </div>
                                                    </Card>
                                                </>
                                            )}

                                            {processedImages.length > 0 &&
                                                !isProcessing && (
                                                    <>
                                                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Result
                                                        </h2>
                                                        <Card className="overflow-hidden bg-card border border-border">
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
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download
                                                        </Button>
                                                    </>
                                                )}

                                            {!isProcessing &&
                                                processedImages.length === 0 &&
                                                uploadedImage && (
                                                    <Card className="h-48 md:aspect-square flex items-center justify-center bg-muted/50 border border-border border-dashed">
                                                        <p className="text-xs text-muted-foreground">
                                                            Nhấn Process để nhận kết quả
                                                        </p>
                                                    </Card>
                                                )}
                                        </div>
                                    </div>

                                    {processedImages.length > 1 && (
                                        <div className="space-y-3">
                                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                All Results ({processedImages.length})
                                            </h2>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {processedImages.map(
                                                    (imageUrl, index) => (
                                                        <div
                                                            key={index}
                                                            className="space-y-2"
                                                        >
                                                            <Card className="overflow-hidden bg-card border border-border">
                                                                <ImagePreview
                                                                    src={
                                                                        imageUrl ||
                                                                        "/placeholder.svg"
                                                                    }
                                                                    alt={`Result ${index + 1}`}
                                                                    isLoading={false}
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
                                                                className="w-full text-xs"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Get
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!uploadedImage &&
                                        processedImages.length === 0 &&
                                        !isProcessing && (
                                            <div className="h-96 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-muted-foreground text-sm">
                                                        Upload an image hoặc dùng
                                                        comic để bắt đầu
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
