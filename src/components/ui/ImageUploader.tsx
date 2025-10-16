'use client';

import { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
  images: string[];
  onChange: (next: string[]) => void;
  maxFiles?: number;
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const maxSize = 5 * 1024 * 1024; // 5MB

export default function ImageUploader({ images, onChange, maxFiles = 6 }: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = () => inputRef.current?.click();

  const validateFiles = (files: File[]) => {
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return `Invalid file type: ${file.name}`;
      }
      if (file.size > maxSize) {
        return `File too large (max 5MB): ${file.name}`;
      }
    }
    return null;
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setError(null);
    const current = images.slice();
    try {
      const token = localStorage.getItem('token') || '';
      setUploading(true);
      const err = validateFiles(files);
      if (err) {
        setError(err);
        setUploading(false);
        return;
      }
      for (const file of files) {
        if (current.length >= maxFiles) break;
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Upload failed');
        }
        const data = await res.json();
        current.push(data.url);
        onChange(current.slice());
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [images, maxFiles, onChange]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    const files = Array.from(dt.files || []);
    void uploadFiles(files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    void uploadFiles(files);
    // Reset so selecting the same file again triggers change
    e.currentTarget.value = '';
  };

  const removeImage = (url: string) => {
    const next = images.filter((u) => u !== url);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'}`}
        onClick={handleSelect}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div>
          <p className="font-medium text-slate-800">Drag & drop images here, or click to select</p>
          <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP, GIF up to 5MB each</p>
          {uploading && (
            <p className="mt-2 text-xs text-emerald-700">Uploading...</p>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="uploaded" className="h-32 w-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
