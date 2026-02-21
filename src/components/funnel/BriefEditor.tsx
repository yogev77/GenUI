"use client";

import { useState, useRef } from "react";
import type { FunnelConfig, ProductInfo, FunnelColors } from "@/lib/funnel-claude";

const DEFAULT_COLORS: FunnelColors = {
  primary: "#2563eb",
  secondary: "#1e293b",
  accent: "#f59e0b",
  background: "#ffffff",
  dark: "#0f172a",
};

const DEFAULT_STYLE = {
  colors: DEFAULT_COLORS,
  fonts: { heading: "", body: "" },
  styleNotes: "",
};

interface Props {
  funnel: FunnelConfig;
  onUpdate: (funnel: FunnelConfig) => void;
}

export default function BriefEditor({ funnel, onUpdate }: Props) {
  const [info, setInfo] = useState<ProductInfo>({ ...funnel.productInfo });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const hasChanges =
    JSON.stringify(info) !== JSON.stringify(funnel.productInfo);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      // Collect image URL changes (old → new) to update page source code
      const oldContexts = funnel.productInfo.imageContexts ?? [];
      const newContexts = info.imageContexts ?? [];
      const replacements: { oldUrl: string; newUrl: string }[] = [];

      // Detect replaced images by position
      for (let i = 0; i < Math.min(oldContexts.length, newContexts.length); i++) {
        if (oldContexts[i].url !== newContexts[i].url) {
          replacements.push({ oldUrl: oldContexts[i].url, newUrl: newContexts[i].url });
        }
      }
      // Detect logo URL change (if not already covered by position changes)
      if (
        funnel.productInfo.logoUrl &&
        info.logoUrl &&
        funnel.productInfo.logoUrl !== info.logoUrl &&
        !replacements.some((r) => r.oldUrl === funnel.productInfo.logoUrl)
      ) {
        replacements.push({ oldUrl: funnel.productInfo.logoUrl, newUrl: info.logoUrl });
      }

      const res = await fetch("/api/funnel/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ funnelId: funnel.id, productInfo: info }),
      });
      if (res.ok) {
        // Apply image URL replacements to page source code
        for (const { oldUrl, newUrl } of replacements) {
          await fetch("/api/funnel/replace-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ funnelId: funnel.id, oldUrl, newUrl }),
          });
        }

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
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Replace */}
                      <button
                        onClick={() => {
                          setReplacingIdx(i);
                          replaceRef.current?.click();
                        }}
                        className="w-6 h-6 bg-white/90 hover:bg-leaf-400/10 border border-gray-200 rounded-full flex items-center justify-center cursor-pointer"
                        title="Replace image"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          const next = info.imageContexts!.filter((_, j) => j !== i);
                          const nextUrls = (info.imageUrls || []).filter((u) => u !== ic.url);
                          const nextLogo = isLogo ? undefined : info.logoUrl;
                          setInfo({ ...info, imageContexts: next, imageUrls: nextUrls, logoUrl: nextLogo });
                        }}
                        className="w-6 h-6 bg-white/90 hover:bg-red-50 border border-gray-200 rounded-full flex items-center justify-center cursor-pointer"
                        title="Remove image"
                      >
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
        {/* Hidden input for replacing images */}
        <input
          ref={replaceRef}
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            const idx = replacingIdx;
            if (!file || idx === null || !info.imageContexts?.[idx]) {
              setReplacingIdx(null);
              return;
            }
            setUploading(true);
            try {
              const oldUrl = info.imageContexts[idx].url;

              // Upload new image
              const formData = new FormData();
              formData.append("file", file);
              formData.append("context", info.imageContexts[idx].context);
              const res = await fetch("/api/funnel/upload-image", {
                method: "POST",
                credentials: "include",
                body: formData,
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Upload failed");

              const newUrl = data.url;

              // Replace in deployed pages immediately
              await fetch("/api/funnel/replace-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ funnelId: funnel.id, oldUrl, newUrl }),
              });

              // Update local state
              const nextContexts = info.imageContexts.map((ic, j) =>
                j === idx ? { ...ic, url: newUrl } : ic
              );
              const nextUrls = (info.imageUrls || []).map((u) =>
                u === oldUrl ? newUrl : u
              );
              const nextLogo = info.logoUrl === oldUrl ? newUrl : info.logoUrl;
              setInfo({ ...info, imageContexts: nextContexts, imageUrls: nextUrls, logoUrl: nextLogo });
            } catch (err) {
              console.error("Image replace failed:", err);
            } finally {
              setUploading(false);
              setReplacingIdx(null);
              if (replaceRef.current) replaceRef.current.value = "";
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

      {/* Design */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">Design</label>

        {/* Color Palette */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Color Palette</p>
          <div className="flex flex-wrap gap-3">
            {(["primary", "secondary", "accent", "background", "dark"] as const).map((key) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <label className="relative w-10 h-10 rounded-lg border border-gray-200 overflow-hidden cursor-pointer">
                  <input
                    type="color"
                    value={info.style?.colors?.[key] || DEFAULT_COLORS[key]}
                    onChange={(e) => {
                      const colors: FunnelColors = {
                        ...DEFAULT_COLORS,
                        ...info.style?.colors,
                        [key]: e.target.value,
                      };
                      setInfo({
                        ...info,
                        style: { ...DEFAULT_STYLE, ...info.style, colors },
                      });
                    }}
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: info.style?.colors?.[key] || DEFAULT_COLORS[key] }}
                  />
                </label>
                <span className="text-[10px] text-gray-400 capitalize">{key}</span>
                <span className="text-[10px] text-gray-300 font-mono">
                  {(info.style?.colors?.[key] || DEFAULT_COLORS[key]).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Heading Font</label>
            <input
              type="text"
              value={info.style?.fonts?.heading || ""}
              placeholder="e.g. Poppins, Inter, system-ui"
              onChange={(e) => {
                const fonts = {
                  heading: e.target.value,
                  body: info.style?.fonts?.body || "",
                };
                setInfo({
                  ...info,
                  style: { ...DEFAULT_STYLE, ...info.style, fonts },
                });
              }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Body Font</label>
            <input
              type="text"
              value={info.style?.fonts?.body || ""}
              placeholder="e.g. Inter, system-ui"
              onChange={(e) => {
                const fonts = {
                  heading: info.style?.fonts?.heading || "",
                  body: e.target.value,
                };
                setInfo({
                  ...info,
                  style: { ...DEFAULT_STYLE, ...info.style, fonts },
                });
              }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400"
            />
          </div>
        </div>

        {/* Style Notes */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Style Notes</label>
          <textarea
            value={info.style?.styleNotes || ""}
            onChange={(e) =>
              setInfo({
                ...info,
                style: { ...DEFAULT_STYLE, ...info.style, styleNotes: e.target.value },
              })
            }
            rows={2}
            placeholder="Additional design instructions..."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 resize-none"
          />
        </div>
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
