"use client";

import { useState, useRef } from "react";
import type { FunnelConfig, ProductInfo } from "@/lib/funnel-claude";

interface Props {
  funnel: FunnelConfig;
  onUpdate: (funnel: FunnelConfig) => void;
}

export default function BriefEditor({ funnel, onUpdate }: Props) {
  const [info, setInfo] = useState<ProductInfo>({ ...funnel.productInfo });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasChanges =
    JSON.stringify(info) !== JSON.stringify(funnel.productInfo);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/funnel/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ funnelId: funnel.id, productInfo: info }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.funnel);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Product Name"
          value={info.productName}
          onChange={(v) => setInfo({ ...info, productName: v })}
        />
        <Field
          label="Price"
          value={info.price}
          onChange={(v) => setInfo({ ...info, price: v })}
        />
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <textarea
            value={info.description}
            onChange={(e) =>
              setInfo({ ...info, description: e.target.value })
            }
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 resize-none"
          />
        </div>
        <Field
          label="Target Audience"
          value={info.targetAudience}
          onChange={(v) => setInfo({ ...info, targetAudience: v })}
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Product Type</label>
          <select
            value={info.productType}
            onChange={(e) =>
              setInfo({
                ...info,
                productType: e.target.value as ProductInfo["productType"],
              })
            }
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400"
          >
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
            <option value="service">Service</option>
            <option value="saas">SaaS</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tone</label>
          <select
            value={info.tone}
            onChange={(e) =>
              setInfo({
                ...info,
                tone: e.target.value as ProductInfo["tone"],
              })
            }
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="urgent">Urgent</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">
            Unique Selling Points (one per line)
          </label>
          <textarea
            value={info.uniqueSellingPoints.join("\n")}
            onChange={(e) =>
              setInfo({
                ...info,
                uniqueSellingPoints: e.target.value
                  .split("\n")
                  .filter((l) => l.trim()),
              })
            }
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 resize-none"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Product Images</label>
        {(info.imageContexts?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {info.imageContexts!.map((ic, i) => {
              const isLogo = ic.url === info.logoUrl;
              return (
                <div
                  key={`${ic.url}-${i}`}
                  className="relative group bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="aspect-square bg-gray-50 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ic.url}
                      alt={ic.context}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23ddd'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    {isLogo && (
                      <span className="absolute top-1.5 left-1.5 bg-leaf-400 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        Logo
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const next = info.imageContexts!.filter((_, j) => j !== i);
                        const nextUrls = (info.imageUrls || []).filter((u) => u !== ic.url);
                        const nextLogo = isLogo ? undefined : info.logoUrl;
                        setInfo({ ...info, imageContexts: next, imageUrls: nextUrls, logoUrl: nextLogo });
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-red-50 border border-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <textarea
                      value={ic.context}
                      onChange={(e) => {
                        const next = info.imageContexts!.map((item, j) =>
                          j === i ? { ...item, context: e.target.value } : item
                        );
                        setInfo({ ...info, imageContexts: next });
                      }}
                      rows={2}
                      className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-leaf-400 transition-colors"
                      placeholder="Describe this image..."
                    />
                    <button
                      onClick={() => {
                        if (isLogo) {
                          setInfo({ ...info, logoUrl: undefined });
                        } else {
                          setInfo({ ...info, logoUrl: ic.url });
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                        isLogo
                          ? "bg-leaf-400/10 border-leaf-400 text-leaf-700"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {isLogo ? "✓ Logo" : "Mark as logo"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-gray-400 mb-3 border border-dashed border-gray-200 rounded-xl">
            No images yet
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={async (e) => {
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
              setInfo({
                ...info,
                imageUrls: [...(info.imageUrls || []), data.url],
                imageContexts: [...(info.imageContexts || []), { url: data.url, context: "User uploaded image" }],
              });
            } catch (err) {
              console.error("Image upload failed:", err);
            } finally {
              setUploading(false);
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm hover:border-leaf-400 hover:text-leaf-700 transition-colors cursor-pointer disabled:opacity-50"
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
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 rounded-xl bg-leaf-400 text-white font-medium hover:bg-leaf-400/90 transition-colors text-sm disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Brief"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400"
      />
    </div>
  );
}
