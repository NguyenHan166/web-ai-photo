import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const feature = request.headers.get("x-feature-type") || "upscale";

        let endpoint = "";
        let isJson = false;

        switch (feature) {
            case "upscale":
                endpoint = "/upscale";
                break;
            case "ic-light":
                endpoint = "/portraits/ic-light";
                break;
            case "clarity":
                endpoint = "/clarity";
                break;
            case "enhance":
                endpoint = "/enhance";
                break;
            case "beautify":
                endpoint = "/ai-beautify";
                break;
            case "replace-bg":
                endpoint = "/replace-bg";
                break;
            case "style":
                endpoint = "/style";
                break;
            case "comic":
                endpoint = "/comic/generate";
                isJson = true;
                break;
            default:
                return NextResponse.json(
                    {
                        status: "error",
                        error: {
                            message: "Unknown feature",
                            code: "VALIDATION_ERROR",
                        },
                    },
                    { status: 400 }
                );
        }

        console.log(
            `[Gateway] Calling API endpoint: ${API_BASE_URL}${endpoint}`
        );

        // Prepare request based on content type
        let body: FormData | string;
        let headers: Record<string, string> = {};

        if (isJson) {
            // For comic generation, convert FormData to JSON
            const prompt = formData.get("prompt") as string;
            const panels = formData.get("panels") as string;
            const style = formData.get("style") as string;

            body = JSON.stringify({
                prompt,
                panels: panels ? parseInt(panels) : 4,
                style: style || "anime_color",
            });
            headers["Content-Type"] = "application/json";
        } else {
            body = formData;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers,
            body,
        });

        const result = await response.json();
        console.log(`[Gateway] API response:`, result);

        if (!response.ok) {
            // Handle error response format
            return NextResponse.json(
                {
                    status: "error",
                    request_id: result.request_id,
                    error: {
                        message:
                            result.error?.message ||
                            result.error ||
                            "Processing failed",
                        code: result.error?.code || "PROCESSING_ERROR",
                    },
                    timestamp: result.timestamp || new Date().toISOString(),
                },
                { status: response.status }
            );
        }

        // Return success response in standardized format
        return NextResponse.json({
            status: "success",
            request_id: result.request_id,
            data: result.data,
            meta: result.meta,
            page_url: result.page_url, // For comic generation
            timestamp: result.timestamp || new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Gateway] Route handler error:", error);
        return NextResponse.json(
            {
                status: "error",
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal server error",
                    code: "INTERNAL_ERROR",
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
