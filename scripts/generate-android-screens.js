const fs = require("fs");
const path = require("path");

const WIDTH = 1080;
const HEIGHT = 2400;
const CARD_X = 60;
const CARD_WIDTH = WIDTH - CARD_X * 2;
const FIELD_HEIGHT = 120;
const FIELD_GAP = 24;
const UPLOAD_HEIGHT = 220;
const PREVIEW_HEIGHT = 400;

const features = [
    {
        id: "upscale",
        name: "Image Upscaling (GFPGAN)",
        tag: "Upscale",
        eta: "15-90s",
        description: "Khôi phục khuôn mặt và upscale 1x/2x/4x.",
        accent: { from: "#3b82f6", to: "#06b6d4" },
        uploads: [
            { label: "Ảnh nguồn", hint: "JPG/PNG/WebP · ≤10MB" },
        ],
        fields: [
            { label: "Scale", hint: "1x / 2x / 4x" },
            { label: "Model version", hint: "v1.3 / v1.4" },
            { label: "Face restore", hint: "GFPGAN bật sẵn" },
        ],
        chips: ["Giữ chi tiết", "Khử noise", "Preview song song"],
    },
    {
        id: "clarity",
        name: "Clarity Improvement",
        tag: "Clarity",
        eta: "20-120s",
        description: "Tăng độ nét/super-resolution 2x hoặc 4x.",
        accent: { from: "#a855f7", to: "#ec4899" },
        uploads: [
            { label: "Ảnh nguồn", hint: "JPG/PNG/WebP · ≤10MB" },
        ],
        fields: [
            { label: "Scale", hint: "2x / 4x" },
            { label: "Face enhance", hint: "Tùy chọn bật/tắt" },
            { label: "Output", hint: "Giữ màu sắc gốc" },
        ],
        chips: ["Real-ESRGAN", "High frequency detail", "Ảnh khuôn mặt"],
    },
    {
        id: "enhance",
        name: "Image Enhancement",
        tag: "Enhance",
        eta: "15-60s",
        description:
            "Tăng phân giải 2x/4x với Real-ESRGAN, hỗ trợ bổ trợ khuôn mặt.",
        accent: { from: "#22c55e", to: "#10b981" },
        uploads: [
            { label: "Ảnh nguồn", hint: "JPG/PNG/WebP · ≤10MB" },
        ],
        fields: [
            { label: "Scale", hint: "2x / 4x" },
            { label: "Face enhance", hint: "Bật khi có chân dung" },
            { label: "Model", hint: "real-esrgan" },
        ],
        chips: ["Nhanh", "Giữ chi tiết", "Chống bệt màu"],
    },
    {
        id: "ai-beautify",
        name: "AI Beautify",
        tag: "Beautify",
        eta: "30-90s",
        description: "Pipeline nhiều bước cho ảnh chân dung, scale 2-4-8.",
        accent: { from: "#ef4444", to: "#f43f5e" },
        uploads: [
            { label: "Ảnh nguồn", hint: "JPG/PNG/WebP · ≤10MB" },
        ],
        fields: [
            { label: "Scale", hint: "2x / 4x / 8x" },
            { label: "Skin tone", hint: "Giữ màu da tự nhiên" },
            { label: "Beauty level", hint: "Làm mịn + giữ texture" },
        ],
        chips: ["Chân dung", "Làm mịn thông minh", "Preserve identity"],
    },
    {
        id: "replace-bg",
        name: "Background Replacement",
        tag: "Background",
        eta: "20-60s",
        description: "Xóa nền hoặc thay nền mới.",
        accent: { from: "#6366f1", to: "#3b82f6" },
        uploads: [
            { label: "Foreground (fg)", hint: "Ảnh chính · ≤10MB" },
            { label: "Background (bg)", hint: "Ảnh nền · replace mode" },
        ],
        fields: [
            { label: "Mode", hint: "remove / replace" },
            { label: "Fit", hint: "cover / contain / fill" },
            { label: "Position", hint: "centre / top / bottom / left / right" },
            { label: "Feather", hint: "Mềm viền 0-20 px" },
            { label: "Shadow", hint: "Bật/tắt đổ bóng" },
            { label: "Presigned TTL", hint: "60 - 86400s" },
        ],
        chips: ["Matting", "Giữ chủ thể", "Blend nền"],
    },
    {
        id: "style",
        name: "Style Transfer",
        tag: "Style",
        eta: "30-150s",
        description: "Biến đổi ảnh sang phong cách nghệ thuật.",
        accent: { from: "#ec4899", to: "#a855f7" },
        uploads: [
            { label: "Ảnh nguồn", hint: "JPG/PNG/WebP · ≤10MB" },
        ],
        fields: [
            { label: "Style", hint: "anime / ghibli / watercolor / oil..." },
            { label: "Extra", hint: "Mô tả thêm, ví dụ: sunset, neon" },
            { label: "Output", hint: "webp/png/jpg" },
        ],
        chips: ["Giữ bố cục", "Tăng màu sắc", "Artistic filter"],
    },
    {
        id: "portraits/ic-light",
        name: "Portrait Relighting",
        tag: "Relight",
        eta: "30-120s",
        description: "Đổi ánh sáng chân dung với prompt.",
        accent: { from: "#eab308", to: "#f97316" },
        uploads: [
            { label: "Ảnh nguồn hoặc image_url", hint: "Chọn 1 trong 2" },
        ],
        fields: [
            { label: "Prompt", hint: "Mô tả ánh sáng" },
            { label: "Appended prompt", hint: "best quality..." },
            { label: "Negative prompt", hint: "lowres, bad hands..." },
            { label: "Light source", hint: "None / Left / Right / Top / Bottom" },
            { label: "Steps", hint: "1 - 100 (mặc định 25)" },
            { label: "CFG", hint: "1 - 32 (mặc định 2)" },
            { label: "Width", hint: "256-1024, bội số 64" },
            { label: "Height", hint: "256-1024, bội số 64" },
            { label: "Số ảnh", hint: "1 - 12" },
            { label: "Output format", hint: "webp / jpg / png" },
            { label: "Output quality", hint: "1 - 100 (đề xuất 80-90)" },
        ],
        chips: ["Studio look", "Giữ khuôn mặt", "Hỗ trợ image_url"],
    },
    {
        id: "comic/generate",
        name: "Comic Generation",
        tag: "Comic",
        eta: "60-240s",
        description: "Tạo truyện tranh anime nhiều trang.",
        accent: { from: "#f97316", to: "#eab308" },
        uploads: [],
        fields: [
            { label: "Story prompt", hint: "≥ 5 ký tự, thoại tiếng Việt" },
            { label: "Pages", hint: "1 - 3" },
            { label: "Panels per page", hint: "3 - 9" },
            { label: "Style", hint: "anime / manga / webtoon" },
            { label: "Dialogue", hint: "Tự sinh theo prompt" },
        ],
        chips: ["Nhiều trang", "Bảng truyện 3-9", "Màu anime"],
    },
    {
        id: "story-comic",
        name: "Story Comic (Multi-page)",
        tag: "Story Comic",
        eta: "90-240s",
        description: "Truyện tranh anime màu 2-3 trang, chọn style/quality.",
        accent: { from: "#d946ef", to: "#8b5cf6" },
        uploads: [],
        fields: [
            { label: "Story prompt", hint: "≥ 8 ký tự" },
            { label: "Pages", hint: "2 hoặc 3" },
            { label: "Panels per page", hint: "3 hoặc 4" },
            { label: "Style preset", hint: "Anime / Manga / Cinematic ..." },
            { label: "Quality preset", hint: "Standard v3.0 / v3.1 / Light / Heavy" },
        ],
        chips: ["Multi-page", "Preset chất lượng", "Tự sinh thoại"],
    },
];

const designDir = path.join(__dirname, "..", "design", "android");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function renderField(field, x, y, width) {
    const labelY = y + 44;
    const hintY = y + 82;
    return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${FIELD_HEIGHT}" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
      <text x="${x + 22}" y="${labelY}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="700">${field.label}</text>
      <text x="${x + 22}" y="${hintY}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="500">${field.hint}</text>
    </g>`;
}

function renderChips(chips, startX, startY, maxWidth, accentId) {
    if (!chips || !chips.length) return { svg: "", height: 0 };
    const rows = [];
    let x = startX;
    let y = startY;
    const lineHeight = 44;
    chips.forEach((chip) => {
        const width = Math.min(
            maxWidth - 16,
            Math.max(140, chip.length * 10 + 40)
        );
        if (x + width > startX + maxWidth) {
            x = startX;
            y += lineHeight + 10;
        }
        rows.push(`
        <g>
          <rect x="${x}" y="${y}" width="${width}" height="${lineHeight}" rx="18" fill="url(#${accentId})" opacity="0.22" stroke="rgba(255,255,255,0.16)"/>
          <text x="${x + width / 2}" y="${y + lineHeight / 2 + 8}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700" text-anchor="middle">${chip}</text>
        </g>`);
        x += width + 12;
    });
    const height = y - startY + lineHeight;
    return { svg: rows.join("\n"), height };
}

function renderUploads(uploads, x, y, width, accentId) {
    if (!uploads || uploads.length === 0) {
        return { svg: "", height: 0 };
    }

    if (uploads.length === 1) {
        const upload = uploads[0];
        const inner = `
        <g>
          <rect x="${x}" y="${y}" width="${width}" height="${UPLOAD_HEIGHT}" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
          <rect x="${x + 24}" y="${y + 32}" width="96" height="96" rx="24" fill="url(#${accentId})" opacity="0.45"/>
          <text x="${x + 140}" y="${y + 86}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="28" font-weight="700">${upload.label}</text>
          <text x="${x + 140}" y="${y + 126}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">${upload.hint}</text>
          <text x="${x + width - 220}" y="${y + UPLOAD_HEIGHT - 28}" fill="#A5B4FC" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="700">Kéo thả / Chọn tệp</text>
        </g>`;
        return { svg: inner, height: UPLOAD_HEIGHT };
    }

    const colWidth = (width - 20) / 2;
    const boxHeight = UPLOAD_HEIGHT;
    const boxes = uploads.map((upload, index) => {
        const boxX = x + index * (colWidth + 20);
        return `
        <g>
          <rect x="${boxX}" y="${y}" width="${colWidth}" height="${boxHeight}" rx="24" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
          <rect x="${boxX + 22}" y="${y + 28}" width="88" height="88" rx="22" fill="url(#${accentId})" opacity="0.45"/>
          <text x="${boxX + 130}" y="${y + 82}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="700">${upload.label}</text>
          <text x="${boxX + 130}" y="${y + 118}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">${upload.hint}</text>
          <text x="${boxX + colWidth - 200}" y="${y + boxHeight - 28}" fill="#A5B4FC" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700">Chọn ảnh</text>
        </g>`;
    });
    return { svg: boxes.join("\n"), height: boxHeight };
}

function renderFields(fields, x, y, width) {
    if (!fields || fields.length === 0) return { svg: "", height: 0 };
    const colWidth = (width - 60) / 2;
    const colGap = 20;
    const items = [];
    const rowCount = Math.ceil(fields.length / 2);
    for (let i = 0; i < fields.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const fieldX = x + 20 + col * (colWidth + colGap);
        const fieldY = y + row * (FIELD_HEIGHT + FIELD_GAP);
        items.push(renderField(fields[i], fieldX, fieldY, colWidth));
    }
    const height = rowCount * (FIELD_HEIGHT + FIELD_GAP) - FIELD_GAP;
    return { svg: items.join("\n"), height };
}

function renderSelectableChips(items, startX, startY, maxWidth, accentId) {
    if (!items || !items.length) return { svg: "", height: 0 };
    const rows = [];
    let x = startX;
    let y = startY;
    const lineHeight = 50;
    items.forEach((item) => {
        const width = Math.min(
            maxWidth - 16,
            Math.max(140, item.text.length * 10 + 48)
        );
        if (x + width > startX + maxWidth) {
            x = startX;
            y += lineHeight + 12;
        }
        const active = item.active;
        const fill = active
            ? `url(#${accentId})`
            : "rgba(255,255,255,0.04)";
        const stroke = active
            ? "rgba(255,255,255,0.24)"
            : "rgba(255,255,255,0.10)";
        const textColor = active ? "#0B1221" : "#E5E7EB";
        rows.push(`
        <g>
          <rect x="${x}" y="${y}" width="${width}" height="${lineHeight}" rx="18" fill="${fill}" stroke="${stroke}"/>
          <text x="${x + width / 2}" y="${y + lineHeight / 2 + 7}" fill="${textColor}" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="800" text-anchor="middle">${item.text}</text>
        </g>`);
        x += width + 12;
    });
    const height = y - startY + lineHeight;
    return { svg: rows.join("\n"), height };
}

function renderPreview(x, y, width, height, accentId) {
    const gap = 24;
    const cardWidth = (width - gap) / 2;
    const titleY = y + 32;
    const boxY = y + 68;
    const boxHeight = height - 90;
    return `
    <g>
      <text x="${x}" y="${titleY}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="800">Preview</text>
      <text x="${x + 140}" y="${titleY}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">Original vs Result</text>
      <g>
        <rect x="${x}" y="${boxY}" width="${cardWidth}" height="${boxHeight}" rx="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
        <rect x="${x + 20}" y="${boxY + 20}" width="${cardWidth - 40}" height="${boxHeight - 40}" rx="18" fill="#111827" stroke="rgba(255,255,255,0.06)"/>
        <text x="${x + 24}" y="${boxY + boxHeight - 20}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">Ảnh gốc</text>
      </g>
      <g>
        <rect x="${x + cardWidth + gap}" y="${boxY}" width="${cardWidth}" height="${boxHeight}" rx="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
        <rect x="${x + cardWidth + gap + 20}" y="${boxY + 20}" width="${cardWidth - 40}" height="${boxHeight - 40}" rx="18" fill="#0B1221" stroke="url(#${accentId})" stroke-opacity="0.45"/>
        <text x="${x + cardWidth + gap + 24}" y="${boxY + boxHeight - 20}" fill="#10B981" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="700">Kết quả AI</text>
      </g>
    </g>`;
}

function renderCTA(x, y, width, accentId, tag) {
    return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="108" rx="22" fill="url(#${accentId})" />
      <text x="${x + width / 2}" y="${y + 66}" fill="#0B1221" font-family="Inter, 'Segoe UI', sans-serif" font-size="30" font-weight="800" text-anchor="middle">Gửi đến AI · ${tag}</text>
    </g>
    <g>
      <rect x="${x}" y="${y + 134}" width="${width}" height="18" rx="9" fill="rgba(255,255,255,0.08)"/>
      <rect x="${x}" y="${y + 134}" width="${width * 0.35}" height="18" rx="9" fill="url(#${accentId})" opacity="0.9"/>
      <text x="${x + width - 12}" y="${y + 150}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="18" font-weight="700" text-anchor="end">Đang chuẩn bị...</text>
    </g>`;
}

function generateSVG(feature) {
    const accentId = `${feature.id.replace(/[^a-z0-9]/gi, "-")}-accent`;
    const chipsHeightApprox = feature.chips?.length
        ? Math.ceil(feature.chips.length / 3) * 50
        : 0;

    const rowCount = Math.ceil(feature.fields.length / 2);
    const fieldsHeight =
        rowCount > 0 ? rowCount * (FIELD_HEIGHT + FIELD_GAP) - FIELD_GAP : 0;

    const cardHeight =
        140 +
        chipsHeightApprox +
        UPLOAD_HEIGHT +
        40 +
        fieldsHeight +
        40 +
        PREVIEW_HEIGHT +
        160;

    const cardY = 260;
    const cardX = CARD_X;
    const cardWidth = CARD_WIDTH;

    const uploadsBlock = renderUploads(feature.uploads, cardX + 20, cardY + 120, cardWidth - 40, accentId);
    const chipsBlock = renderChips(
        feature.chips || [],
        cardX + 20,
        cardY + 70,
        cardWidth - 40,
        accentId
    );
    const fieldsStartY = cardY + 120 + uploadsBlock.height + 40;
    const fieldsBlock = renderFields(
        feature.fields,
        cardX,
        fieldsStartY,
        cardWidth
    );
    const previewStartY = fieldsStartY + fieldsBlock.height + 40;
    const previewBlock = renderPreview(
        cardX + 20,
        previewStartY,
        cardWidth - 40,
        PREVIEW_HEIGHT,
        accentId
    );
    const ctaStartY = previewStartY + PREVIEW_HEIGHT + 40;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="${WIDTH}" y2="${HEIGHT}">
      <stop offset="0%" stop-color="#0B1221"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#0B1327"/>
    </linearGradient>
    <linearGradient id="${accentId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${feature.accent.from}"/>
      <stop offset="100%" stop-color="${feature.accent.to}"/>
    </linearGradient>
    <linearGradient id="panelStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="120" result="blur"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGradient)"/>
  <circle cx="${WIDTH * 0.75}" cy="240" r="320" fill="${feature.accent.to}" opacity="0.12" filter="url(#glow)"/>
  <circle cx="${WIDTH * 0.25}" cy="520" r="260" fill="${feature.accent.from}" opacity="0.10" filter="url(#glow)"/>

  <g>
    <rect x="${CARD_X}" y="80" width="${CARD_WIDTH}" height="140" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>
    <text x="${CARD_X + 32}" y="140" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="34" font-weight="800">AI Photo Studio · Android</text>
    <text x="${CARD_X + 32}" y="180" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="24" font-weight="600">${feature.description}</text>
    <rect x="${CARD_X + CARD_WIDTH - 200}" y="104" width="170" height="44" rx="16" fill="url(#${accentId})" opacity="0.9"/>
    <text x="${CARD_X + CARD_WIDTH - 115}" y="133" fill="#0B1221" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="800" text-anchor="middle">${feature.tag}</text>
    <rect x="${CARD_X + CARD_WIDTH - 200}" y="154" width="170" height="44" rx="16" fill="rgba(255,255,255,0.06)"/>
    <text x="${CARD_X + CARD_WIDTH - 115}" y="183" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700" text-anchor="middle">ETA ${feature.eta}</text>
  </g>

  <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="36" fill="rgba(255,255,255,0.04)" stroke="url(#panelStroke)" />
  <text x="${cardX + 24}" y="${cardY + 44}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="30" font-weight="800">Control Panel</text>
  <text x="${cardX + 24}" y="${cardY + 78}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">${feature.name}</text>
  ${chipsBlock.svg}
  ${uploadsBlock.svg}
  ${fieldsBlock.svg}
  ${previewBlock}
  ${renderCTA(cardX + 20, ctaStartY, cardWidth - 40, accentId, feature.tag)}

    <text x="${CARD_X}" y="${HEIGHT - 60}" fill="#6B7280" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Figma import · SVG · ${feature.id}</text>
</svg>`;

    return svg;
}

function generateStoryComicSVG(feature) {
    const accentId = `${feature.id.replace(/[^a-z0-9]/gi, "-")}-accent`;
    const header = `
  <g>
    <rect x="${CARD_X}" y="80" width="${CARD_WIDTH}" height="140" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>
    <text x="${CARD_X + 32}" y="140" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="34" font-weight="800">AI Photo Studio · Android</text>
    <text x="${CARD_X + 32}" y="180" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="24" font-weight="600">${feature.description}</text>
    <rect x="${CARD_X + CARD_WIDTH - 200}" y="104" width="170" height="44" rx="16" fill="url(#${accentId})" opacity="0.9"/>
    <text x="${CARD_X + CARD_WIDTH - 115}" y="133" fill="#0B1221" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="800" text-anchor="middle">${feature.tag}</text>
    <rect x="${CARD_X + CARD_WIDTH - 200}" y="154" width="170" height="44" rx="16" fill="rgba(255,255,255,0.06)"/>
    <text x="${CARD_X + CARD_WIDTH - 115}" y="183" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700" text-anchor="middle">ETA ${feature.eta}</text>
  </g>`;

    const promptY = 290;
    const layoutY = promptY + 190;
    const panelY = layoutY + 150;
    const styleY = panelY + 160;
    const qualityY = styleY + 170;
    const infoY = qualityY + 170;
    const previewY = infoY + 90;
    const ctaY = previewY + 380;

    const styleChips = renderSelectableChips(
        [
            { text: "Anime", active: true },
            { text: "Manga", active: false },
            { text: "Cinematic", active: false },
            { text: "Photographic", active: false },
            { text: "Digital Art", active: false },
        ],
        CARD_X + 20,
        styleY + 50,
        CARD_WIDTH - 40,
        accentId
    );

    const qualityChips = renderSelectableChips(
        [
            { text: "Standard v3.1", active: true },
            { text: "Standard v3.0", active: false },
            { text: "Light v3.1", active: false },
            { text: "Heavy v3.1", active: false },
        ],
        CARD_X + 20,
        qualityY + 50,
        CARD_WIDTH - 40,
        accentId
    );

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="${WIDTH}" y2="${HEIGHT}">
      <stop offset="0%" stop-color="#0B1221"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#0B1327"/>
    </linearGradient>
    <linearGradient id="${accentId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${feature.accent.from}"/>
      <stop offset="100%" stop-color="${feature.accent.to}"/>
    </linearGradient>
    <linearGradient id="panelStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="120" result="blur"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGradient)"/>
  <circle cx="${WIDTH * 0.75}" cy="240" r="320" fill="${feature.accent.to}" opacity="0.12" filter="url(#glow)"/>
  <circle cx="${WIDTH * 0.25}" cy="520" r="260" fill="${feature.accent.from}" opacity="0.10" filter="url(#glow)"/>

  ${header}

  <rect x="${CARD_X}" y="260" width="${CARD_WIDTH}" height="1500" rx="36" fill="rgba(255,255,255,0.04)" stroke="url(#panelStroke)" />
  <text x="${CARD_X + 24}" y="304" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="30" font-weight="800">Story Comic</text>
  <text x="${CARD_X + 24}" y="338" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">Prompt · Layout · Preset · Preview</text>

  <g>
    <rect x="${CARD_X + 20}" y="${promptY}" width="${CARD_WIDTH - 40}" height="170" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
    <text x="${CARD_X + 48}" y="${promptY + 54}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="28" font-weight="800">Story prompt (≥ 8 ký tự)</text>
    <text x="${CARD_X + 48}" y="${promptY + 96}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">Ví dụ: Nữ sinh gặp mèo phép thuật trong đêm mưa ở Tokyo.</text>
    <rect x="${CARD_X + CARD_WIDTH - 210}" y="${promptY + 108}" width="180" height="36" rx="12" fill="url(#${accentId})" opacity="0.28"/>
    <text x="${CARD_X + CARD_WIDTH - 120}" y="${promptY + 134}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700" text-anchor="middle">Tự sinh thoại</text>
  </g>

  <g>
    <text x="${CARD_X + 20}" y="${layoutY - 8}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="24" font-weight="800">Số trang</text>
    <text x="${CARD_X + 20}" y="${layoutY + 24}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Chọn 2 hoặc 3 trang cho câu chuyện</text>
    <g>
      <rect x="${CARD_X + 20}" y="${layoutY + 36}" width="${(CARD_WIDTH - 60) / 2}" height="140" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
      <rect x="${CARD_X + 20}" y="${layoutY + 36}" width="${(CARD_WIDTH - 60) / 2}" height="140" rx="22" fill="url(#${accentId})" opacity="0.22"/>
      <text x="${CARD_X + 50}" y="${layoutY + 96}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="800">2 trang</text>
      <text x="${CARD_X + 50}" y="${layoutY + 128}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Nhịp nhanh, 6-8 panel</text>
    </g>
    <g>
      <rect x="${CARD_X + 40 + (CARD_WIDTH - 60) / 2}" y="${layoutY + 36}" width="${(CARD_WIDTH - 60) / 2}" height="140" rx="22" fill="rgba(255,255,255,0.04)" stroke="url(#${accentId})" stroke-opacity="0.55"/>
      <text x="${CARD_X + 70 + (CARD_WIDTH - 60) / 2}" y="${layoutY + 96}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="800">3 trang</text>
      <text x="${CARD_X + 70 + (CARD_WIDTH - 60) / 2}" y="${layoutY + 128}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Thêm cao trào, 9-12 panel</text>
      <rect x="${CARD_X + CARD_WIDTH - 130}" y="${layoutY + 52}" width="90" height="34" rx="12" fill="url(#${accentId})" opacity="0.9"/>
      <text x="${CARD_X + CARD_WIDTH - 85}" y="${layoutY + 76}" fill="#0B1221" font-family="Inter, 'Segoe UI', sans-serif" font-size="18" font-weight="800" text-anchor="middle">Default</text>
    </g>
  </g>

  <g>
    <text x="${CARD_X + 20}" y="${panelY - 8}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="24" font-weight="800">Panel/trang</text>
    <text x="${CARD_X + 20}" y="${panelY + 24}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Cân bằng thoại và hình</text>
    <g>
      <rect x="${CARD_X + 20}" y="${panelY + 36}" width="${(CARD_WIDTH - 60) / 2}" height="140" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
      <text x="${CARD_X + 50}" y="${panelY + 96}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="800">3 panel/trang</text>
      <text x="${CARD_X + 50}" y="${panelY + 128}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Khung lớn, ít thoại</text>
    </g>
    <g>
      <rect x="${CARD_X + 40 + (CARD_WIDTH - 60) / 2}" y="${panelY + 36}" width="${(CARD_WIDTH - 60) / 2}" height="140" rx="22" fill="rgba(255,255,255,0.04)" stroke="url(#${accentId})" stroke-opacity="0.55"/>
      <rect x="${CARD_X + 40 + (CARD_WIDTH - 60) / 2}" y="${panelY + 36}" width="${(CARD_WIDTH - 60) / 2}" height="140" rx="22" fill="url(#${accentId})" opacity="0.18"/>
      <text x="${CARD_X + 70 + (CARD_WIDTH - 60) / 2}" y="${panelY + 96}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="800">4 panel/trang</text>
      <text x="${CARD_X + 70 + (CARD_WIDTH - 60) / 2}" y="${panelY + 128}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Nhịp đều, nhiều thoại</text>
      <rect x="${CARD_X + CARD_WIDTH - 130}" y="${panelY + 52}" width="90" height="34" rx="12" fill="url(#${accentId})" opacity="0.9"/>
      <text x="${CARD_X + CARD_WIDTH - 85}" y="${panelY + 76}" fill="#0B1221" font-family="Inter, 'Segoe UI', sans-serif" font-size="18" font-weight="800" text-anchor="middle">Default</text>
    </g>
  </g>

  <g>
    <text x="${CARD_X + 20}" y="${styleY + 10}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="24" font-weight="800">Style preset</text>
    <text x="${CARD_X + 20}" y="${styleY + 42}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Chọn phong cách hội họa</text>
    ${styleChips.svg}
  </g>

  <g>
    <text x="${CARD_X + 20}" y="${qualityY + 10}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="24" font-weight="800">Quality preset</text>
    <text x="${CARD_X + 20}" y="${qualityY + 42}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Tối ưu giữa tốc độ và chi tiết</text>
    ${qualityChips.svg}
  </g>

  <g>
    <rect x="${CARD_X + 20}" y="${infoY}" width="240" height="54" rx="18" fill="url(#${accentId})" opacity="0.22" stroke="rgba(255,255,255,0.12)"/>
    <text x="${CARD_X + 140}" y="${infoY + 34}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="800" text-anchor="middle">Tự sinh thoại</text>
    <rect x="${CARD_X + 280}" y="${infoY}" width="260" height="54" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>
    <text x="${CARD_X + 410}" y="${infoY + 34}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700" text-anchor="middle">Hỗ trợ tiếng Việt</text>
    <rect x="${CARD_X + 560}" y="${infoY}" width="240" height="54" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>
    <text x="${CARD_X + 680}" y="${infoY + 34}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="700" text-anchor="middle">Màu anime</text>
  </g>

  <g>
    <text x="${CARD_X + 20}" y="${previewY}" fill="#E5E7EB" font-family="Inter, 'Segoe UI', sans-serif" font-size="26" font-weight="800">Preview</text>
    <text x="${CARD_X + 160}" y="${previewY}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">Page layout & tone</text>
    <g>
      <rect x="${CARD_X + 20}" y="${previewY + 24}" width="${(CARD_WIDTH - 60) / 2}" height="330" rx="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
      <rect x="${CARD_X + 40}" y="${previewY + 48}" width="${(CARD_WIDTH - 60) / 2 - 40}" height="240" rx="18" fill="#111827" stroke="rgba(255,255,255,0.06)"/>
      <text x="${CARD_X + 44}" y="${previewY + 310}" fill="#9CA3AF" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="600">Page 1</text>
    </g>
    <g>
      <rect x="${CARD_X + 40 + (CARD_WIDTH - 60) / 2}" y="${previewY + 24}" width="${(CARD_WIDTH - 60) / 2}" height="330" rx="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
      <rect x="${CARD_X + 60 + (CARD_WIDTH - 60) / 2}" y="${previewY + 48}" width="${(CARD_WIDTH - 60) / 2 - 40}" height="240" rx="18" fill="#0B1221" stroke="url(#${accentId})" stroke-opacity="0.45"/>
      <text x="${CARD_X + 64 + (CARD_WIDTH - 60) / 2}" y="${previewY + 310}" fill="#10B981" font-family="Inter, 'Segoe UI', sans-serif" font-size="22" font-weight="700">Page 2/3</text>
    </g>
  </g>

  ${renderCTA(CARD_X + 20, ctaY, CARD_WIDTH - 40, accentId, feature.tag)}

  <text x="${CARD_X}" y="${HEIGHT - 60}" fill="#6B7280" font-family="Inter, 'Segoe UI', sans-serif" font-size="20" font-weight="600">Figma import · SVG · ${feature.id}</text>
</svg>`;

    return svg;
}

function main() {
    ensureDir(designDir);
    features.forEach((feature) => {
        const svg =
            feature.id === "story-comic"
                ? generateStoryComicSVG(feature)
                : generateSVG(feature);
        const filePath = path.join(designDir, `${feature.id.replace(/\//g, "_")}.svg`);
        fs.writeFileSync(filePath, svg, "utf8");
        console.log(`Generated ${filePath}`);
    });
}

main();
