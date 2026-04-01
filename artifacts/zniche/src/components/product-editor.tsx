import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, X, Loader2, Eye, Pencil, DollarSign, FileText, Tag, Globe, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductEditorProps {
  product: any;
  onSave: (updates: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export function ProductEditor({ product, onSave, onClose }: ProductEditorProps) {
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    productName: product.productName || "",
    tagline: product.tagline || "",
    productDescription: product.productDescription || "",
    price: product.price || "29",
    category: product.category || "",
    productFormat: product.productFormat || "",
    headline: product.headline || "",
    marketplaceListed: product.marketplaceListed ?? true,
    waitlistMode: product.waitlistMode ?? false,
    pppEnabled: product.pppEnabled ?? false,
  });

  const updateField = (key: string, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(fields);
      toast.success("Product updated!");
      onClose();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(fields).some(
    key => (fields as any)[key] !== (product[key] ?? "")
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#0E0E1C] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#0E0E1C] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Product</h2>
              <p className="text-xs text-muted-foreground">Customize your AI-generated product</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-5">
          {/* Product Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Tag className="w-3.5 h-3.5 text-primary" /> Product Name
            </label>
            <input
              value={fields.productName}
              onChange={e => updateField("productName", e.target.value)}
              className="w-full p-3 rounded-xl bg-[#08080F] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm transition-all"
              placeholder="e.g. Ammi's Kitchen: Pakistani Cooking Masterclass"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-3.5 h-3.5 text-primary" /> Tagline
            </label>
            <input
              value={fields.tagline}
              onChange={e => updateField("tagline", e.target.value)}
              className="w-full p-3 rounded-xl bg-[#08080F] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm transition-all"
              placeholder="Short, punchy description"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <DollarSign className="w-3.5 h-3.5 text-[#00F0A0]" /> Price (USD)
              </label>
              <input
                type="number"
                min="1"
                max="9999"
                value={fields.price}
                onChange={e => updateField("price", e.target.value)}
                className="w-full p-3 rounded-xl bg-[#08080F] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Tag className="w-3.5 h-3.5 text-primary" /> Category
              </label>
              <select
                value={fields.category}
                onChange={e => updateField("category", e.target.value)}
                className="w-full p-3 rounded-xl bg-[#08080F] border border-white/10 focus:border-primary outline-none text-sm"
              >
                <option value="">Select category</option>
                <option value="Education">Education</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Food & Cooking">Food & Cooking</option>
                <option value="Design & Creative">Design & Creative</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Language">Language</option>
                <option value="Music">Music</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-3.5 h-3.5 text-primary" /> Description
            </label>
            <textarea
              value={fields.productDescription}
              onChange={e => updateField("productDescription", e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl bg-[#08080F] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm resize-none transition-all"
              placeholder="Detailed product description..."
            />
          </div>

          {/* Headline */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Eye className="w-3.5 h-3.5 text-primary" /> Sales Headline
            </label>
            <input
              value={fields.headline}
              onChange={e => updateField("headline", e.target.value)}
              className="w-full p-3 rounded-xl bg-[#08080F] border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm transition-all"
              placeholder="The main headline on your sales page"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "marketplaceListed", label: "Listed on Marketplace", icon: Globe },
              { key: "waitlistMode", label: "Waitlist Mode", icon: FileText },
              { key: "pppEnabled", label: "PPP Pricing", icon: DollarSign },
            ].map(toggle => (
              <button
                key={toggle.key}
                onClick={() => updateField(toggle.key, !(fields as any)[toggle.key])}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  (fields as any)[toggle.key]
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-[#08080F] text-muted-foreground"
                }`}
              >
                <toggle.icon className="w-3.5 h-3.5" />
                {toggle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/10 sticky bottom-0 bg-[#0E0E1C]">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? "Unsaved changes" : "No changes"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="rounded-full gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
