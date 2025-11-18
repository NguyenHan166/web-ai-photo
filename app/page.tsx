"use client";

import { useState } from "react";
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
    page_url?: string; // For comic generation
    meta?: Record<string, any>;
    error?: {
        message: string;
        code: string;
    };
    timestamp?: string;
}

export default function Home() {
    const [selectedFeature, setSelectedFeature] = useState<string>("upscale");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [processedImages, setProcessedImages] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>("");

    const handleFeatureSelect = (featureId: string) => {
        setSelectedFeature(featureId);
        setSidebarOpen(false);
        setProcessedImages([]);
    };

    const handleProcess = async (result: ProcessResult) => {
        setIsProcessing(true);
        setProcessingStatus("Processing...");

        try {
            console.log("[Client] Processing result:", result);
            console.log("[Client] Request ID:", result.request_id);

            let imageUrls: string[] = [];

            if (result.status === "success") {
                // Priority 1: Comic page URL (full page comic)
                if (result.page_url) {
                    imageUrls = [result.page_url];
                }
                // Priority 2: IC-Light outputs (multiple images)
                else if (
                    result.data?.outputs &&
                    Array.isArray(result.data.outputs)
                ) {
                    imageUrls = result.data.outputs.map((output) => output.url);
                }
                // Priority 3: Single image endpoints (use presigned_url if available)
                else if (result.data?.presigned_url || result.data?.url) {
                    // Prefer presigned_url for temporary access
                    imageUrls = [
                        result.data.presigned_url || result.data.url || "",
                    ];
                }
            }

            if (imageUrls.length > 0) {
                setProcessedImages(imageUrls.filter((url) => url)); // Filter out empty strings
                setProcessingStatus(
                    `Successfully processed! ${imageUrls.length} image(s) generated.`
                );
            } else {
                setProcessingStatus(
                    "Processing completed but no images returned"
                );
            }
        } catch (error) {
            console.error("[Client] Process handler error:", error);
            setProcessingStatus("Error processing image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteImage = () => {
        setUploadedImage(null);
        setProcessedImages([]);
        setProcessingStatus("");
    };

    const downloadImage = async (url: string, index: number) => {
        try {
            console.log("[Client] Starting download for:", url);

            // Fetch image as blob
            const response = await fetch(url, { mode: "cors" });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch image: ${response.statusText}`
                );
            }

            const blob = await response.blob();

            // Create object URL from blob
            const blobUrl = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement("a");
            link.href = blobUrl;

            // Generate filename with feature name and timestamp
            const featureName = selectedFeature.replace("-", "_");
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `${featureName}_${timestamp}_${index + 1}.jpg`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);

            console.log("[Client] Download completed");
        } catch (error) {
            console.error("[Client] Download error:", error);
            // Fallback: try direct download
            const link = document.createElement("a");
            link.href = url;
            link.download = `processed-image-${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Overlay */}
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

                {/* Main Content */}
                <div className="flex-1 overflow-auto w-full">
                    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
                        <div className="w-full max-w-7xl">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
                                {/* Left: Feature Form */}
                                <div className="lg:col-span-1">
                                    <FeatureForm
                                        selectedFeature={selectedFeature}
                                        onImageUpload={setUploadedImage}
                                        onProcess={handleProcess}
                                        isProcessing={isProcessing}
                                        hasImage={!!uploadedImage}
                                    />
                                </div>

                                {/* Right: Image Preview - Reorganized Layout */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Original Image */}
                                        {uploadedImage && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Original
                                                    </h2>
                                                    <Button
                                                        onClick={
                                                            handleDeleteImage
                                                        }
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                                <Card className="overflow-hidden bg-card border border-border">
                                                    <ImagePreview
                                                        src={
                                                            uploadedImage ||
                                                            "/placeholder.svg" ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt="Original"
                                                        isLoading={false}
                                                    />
                                                </Card>
                                            </div>
                                        )}

                                        {/* Processed Image */}
                                        <div className="space-y-3">
                                            {isProcessing && (
                                                <>
                                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Processing...
                                                    </h2>
                                                    <Card className="overflow-hidden bg-card border border-border p-8 flex items-center justify-center aspect-square">
                                                        <div className="text-center space-y-3">
                                                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    processingStatus
                                                                }
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
                                                                    "/placeholder.svg" ||
                                                                    "/placeholder.svg"
                                                                }
                                                                alt="Processed"
                                                                isLoading={
                                                                    false
                                                                }
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
                                                            Process to see
                                                            result
                                                        </p>
                                                    </Card>
                                                )}
                                        </div>
                                    </div>

                                    {/* Additional Results Grid (for multiple outputs) */}
                                    {processedImages.length > 1 && (
                                        <div className="space-y-3">
                                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                All Results (
                                                {processedImages.length})
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
                                                                        "/placeholder.svg" ||
                                                                        "/placeholder.svg"
                                                                    }
                                                                    alt={`Result ${
                                                                        index +
                                                                        1
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
                                                        Upload an image to get
                                                        started
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
