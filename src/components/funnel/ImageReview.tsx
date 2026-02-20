"use client";

import { useState, useRef } from "react";
import type { FunnelImage } from "@/lib/funnel-types";

interface ImageReviewProps {
  images: FunnelImage[];
  onChange: (images: FunnelImage[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ImageReview({
  images,
  onChange,
  onContinue,
  onBack,
}: ImageReviewProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDelete(index: number) {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleContextChange(index: number, context: string) {
    const next = images.map((img, i) =>
      i === index ? { ...img, context } : img
    );
    onChange(next);
  }

  function handleToggleLogo(index: number) {
    const next = images.map((img, i) =>
      i === index ? { ...img, isLogo: !img.isLogo } : img
    );
    onChange(next);
  }

  async function handleAddFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "User uploaded image");

      const res = await fetch("/api/funnel/upload-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const newImage: FunnelImage = {
        url: data.url,
        originalUrl: data.url,
        context: "User uploaded image",
        isLogo: false,
      };
      onChange([...images, newImage]);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Review Images
          </h2>
          <p className="text-xs text-gray-400">
            Edit, remove, or add images before continuing
          </p>
        </div>
      </div>

      {/* Image grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className="relative group bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-50 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.context}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23ddd'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";
                  }}
                />

                {/* Logo badge */}
                {img.isLogo && (
                  <span className="absolute top-1.5 left-1.5 bg-leaf-400 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                    Logo
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-red-50 border border-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Context + controls */}
              <div className="p-2 space-y-1.5">
                <textarea
                  value={img.context}
                  onChange={(e) => handleContextChange(i, e.target.value)}
                  rows={2}
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-leaf-400 transition-colors"
                  placeholder="Describe this image..."
                />
                <button
                  onClick={() => handleToggleLogo(i)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                    img.isLogo
                      ? "bg-leaf-400/10 border-leaf-400 text-leaf-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {img.isLogo ? "✓ Logo" : "Mark as logo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400 mb-4">
          No images found. You can add your own below.
        </div>
      )}

      {/* Add image button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleAddFile}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full mb-4 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm hover:border-leaf-400 hover:text-leaf-700 transition-colors cursor-pointer disabled:opacity-50"
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-t-leaf-400 border-gray-200 animate-spin" />
            Uploading...
          </span>
        ) : (
          "+ Add Image"
        )}
      </button>

      {/* Continue */}
      <button
        onClick={onContinue}
        className="w-full px-4 py-3 rounded-xl bg-leaf-400 text-white font-medium hover:bg-leaf-400/90 transition-colors cursor-pointer"
      >
        Continue to Chat
      </button>
    </div>
  );
}
