'use client';

import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';

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
  if (isLoading) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-muted-foreground">Processing image...</p>
        </div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No image</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square relative overflow-hidden bg-muted">
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
