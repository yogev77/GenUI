"use client";

import { useState } from "react";
import type { FunnelConfig, ProductInfo } from "@/lib/funnel-claude";

interface Props {
  funnel: FunnelConfig;
  onUpdate: (funnel: FunnelConfig) => void;
}

export default function BriefEditor({ funnel, onUpdate }: Props) {
  const [info, setInfo] = useState<ProductInfo>({ ...funnel.productInfo });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
