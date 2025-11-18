'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
}

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-border hover:border-primary/50 hover:bg-card/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-4"
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 via-purple-500/20 to-accent/30 flex items-center justify-center animate-pulse">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-balance">Upload Your Image</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Drag and drop or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP (Max 10MB)
            </p>
          </div>

          <Button type="button" size="lg" className="w-full mt-2">
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Image
          </Button>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Powered by advanced AI models for professional photo enhancement
      </p>
    </div>
  );
}
