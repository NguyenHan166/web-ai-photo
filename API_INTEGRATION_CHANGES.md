# API Integration Changes

## Summary

Updated the Next.js application to match the new RESTful API documentation structure with proper response handling and error formatting.

## Changes Made

### 1. Route Handler (`app/api/process/route.ts`)

#### New Features:

-   ✅ **Standardized Response Format**: All responses now follow the documented structure with `status`, `request_id`, `data`, `meta`, and `timestamp` fields
-   ✅ **Proper Error Handling**: Errors return structured format with `error.message`, `error.code`, and `error.details`
-   ✅ **Comic Generation Support**: Added JSON body handling for comic endpoint
-   ✅ **Background Replacement**: Fixed parameter mapping (`fg`/`bg` instead of `image`/`background`)
-   ✅ **Request/Response Logging**: Enhanced logging with request IDs

#### Response Format:

```json
{
    "status": "success",
    "request_id": "req_abc123",
    "data": {
        "url": "https://...",
        "presigned_url": "https://...",
        "key": "path/to/image.jpg"
    },
    "meta": {},
    "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### 2. Feature Form (`components/feature-form.tsx`)

#### Updated:

-   ✅ **ProcessResult Interface**: Matches new API response structure
-   ✅ **Error Handling**: Extracts error messages from structured error objects
-   ✅ **Form Submission**: Properly handles replace-bg with `fg`/`bg` parameters
-   ✅ **Request ID Logging**: Logs request IDs for debugging

#### Key Changes:

```typescript
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
```

### 3. Main Page (`app/page.tsx`)

#### Image URL Extraction Priority:

1. **Comic Page URL**: `result.page_url` (for comic generation)
2. **Multiple Outputs**: `result.data.outputs[]` (for IC-Light)
3. **Single Image**: `result.data.presigned_url` → `result.data.url` (for all other features)

#### Updated Features:

-   ✅ **Smart URL Extraction**: Handles different response formats automatically
-   ✅ **Presigned URL Priority**: Uses presigned URLs when available (better for temporary access)
-   ✅ **Request ID Tracking**: Displays request IDs in console for debugging
-   ✅ **Better Status Messages**: Shows exact image count and processing status

## API Endpoint Mapping

| Feature    | Endpoint               | Method | Content-Type        | Response Type    |
| ---------- | ---------------------- | ------ | ------------------- | ---------------- |
| Upscale    | `/upscale`             | POST   | multipart/form-data | Single image     |
| IC-Light   | `/portraits/ic-light`  | POST   | multipart/form-data | Multiple outputs |
| Clarity    | `/clarity`             | POST   | multipart/form-data | Single image     |
| Enhance    | `/enhance`             | POST   | multipart/form-data | Single image     |
| Beautify   | `/ai-beautify`         | POST   | multipart/form-data | Single image     |
| BG Replace | `/replace-bg`          | POST   | multipart/form-data | Single image     |
| Style      | `/style/replace-style` | POST   | multipart/form-data | Single image     |
| Comic      | `/comic/generate`      | POST   | application/json    | Page URL         |

## Error Codes Handled

| Code                  | HTTP Status | Handled In   |
| --------------------- | ----------- | ------------ |
| `VALIDATION_ERROR`    | 400         | Route + Form |
| `MISSING_FILE`        | 400         | Route + Form |
| `PROCESSING_ERROR`    | 400         | Route + Form |
| `NOT_FOUND`           | 404         | Route        |
| `RATE_LIMIT_EXCEEDED` | 429         | Route        |
| `INTERNAL_ERROR`      | 500         | Route        |
| `REPLICATE_ERROR`     | 500         | Route        |

## Testing Checklist

### ✅ Required Tests:

1. **Single Image Features** (upscale, clarity, enhance, beautify, style)

    - [ ] Upload image
    - [ ] Process successfully
    - [ ] Display presigned_url or url
    - [ ] Download works

2. **IC-Light** (multiple outputs)

    - [ ] Upload image
    - [ ] Configure lighting prompt
    - [ ] Display all output images
    - [ ] Download each image

3. **Background Replace**

    - [ ] Remove mode: Upload fg image only
    - [ ] Replace mode: Upload fg + bg images
    - [ ] Process successfully
    - [ ] Download works

4. **Comic Generation**

    - [ ] No image upload required
    - [ ] Enter prompt + panels
    - [ ] Display page_url result
    - [ ] Download works

5. **Error Handling**
    - [ ] Missing required files shows error
    - [ ] Rate limit error displays properly
    - [ ] Processing errors show message
    - [ ] Request IDs logged in console

## Environment Variables

Ensure `.env.local` contains:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Or update to your backend API URL.

## Debugging

All API calls now log:

-   `[Gateway]` - Route handler logs
-   `[Client]` - Frontend logs
-   Request IDs for tracking

Example console output:

```
[Client] Submitting form for feature: upscale
[Gateway] Calling API endpoint: http://localhost:3000/api/upscale
[Gateway] API response: { status: 'success', request_id: 'req_abc123', ... }
[Client] API response: { status: 'success', ... }
[Client] Request ID: req_abc123
```

## Migration Notes

### Breaking Changes:

1. Response structure changed from `{ success: boolean }` to `{ status: 'success' | 'error' }`
2. Error format changed from `{ error: string }` to `{ error: { message, code, details } }`
3. BG Replace parameters: `image`/`background` → `fg`/`bg`

### Backward Compatibility:

-   ❌ Old API responses will not work without updates
-   ✅ All features now follow consistent response format
-   ✅ Request IDs tracked for debugging

## Next Steps

1. Update backend API to return new response format
2. Test all 9 features with real API
3. Implement rate limiting UI feedback
4. Add retry logic with exponential backoff
5. Cache presigned URLs appropriately (< 30 min)
6. Add request ID display in UI for user feedback

---

**Last Updated**: November 18, 2025
**Version**: 1.0.0
