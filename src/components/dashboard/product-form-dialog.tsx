"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import type { Product, ProductCategory, ProductType } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { uploadProductImage, uploadProductFile } from "@/lib/upload";

const types: ProductType[] = ["Digital", "Physical", "Service", "Membership"];
const categories: ProductCategory[] = ["Programs", "Nutrition", "Coaching", "Merch"];

const empty = {
  name: "",
  type: "Digital" as ProductType,
  category: "Programs" as ProductCategory,
  description: "",
  price: "",
  compareAt: "",
  status: "Draft" as Product["status"],
  tags: "",
  imageUrl: "",
  filePath: "",
  fileName: "",
  fileType: "PDF",
  weight: "",
  sku: "",
  stock: "",
  duration: "",
  maxClients: "",
  deliveryMethod: "Video call",
};

export function ProductFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Product | null;
}) {
  const { addProduct, updateProduct, user } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    const res = await uploadProductImage(user.id, file);
    setUploading(false);
    if (res.url) {
      setForm((f) => ({ ...f, imageUrl: res.url! }));
      toast("Image uploaded", { variant: "success" });
    } else {
      toast(res.error ?? "Upload failed", { variant: "error" });
    }
  };

  const [fileUploading, setFileUploading] = useState(false);
  const docRef = useRef<HTMLInputElement>(null);
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setFileUploading(true);
    const res = await uploadProductFile(user.id, file);
    setFileUploading(false);
    if (res.path) {
      setForm((f) => ({ ...f, filePath: res.path!, fileName: res.name || "file" }));
      toast("File uploaded", { variant: "success" });
    } else {
      toast(res.error ?? "Upload failed", { variant: "error" });
    }
  };

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        category: editing.category,
        description: editing.description,
        price: String(editing.price),
        compareAt: editing.compareAt ? String(editing.compareAt) : "",
        status: editing.status,
        tags: editing.tags.join(", "),
        imageUrl: editing.imageUrl ?? "",
        filePath: editing.filePath ?? "",
        fileName: editing.fileName ?? "",
        fileType: editing.fileType ?? "PDF",
        weight: editing.weight ?? "",
        sku: editing.sku ?? "",
        stock: editing.stock != null ? String(editing.stock) : "",
        duration: editing.duration != null ? String(editing.duration) : "",
        maxClients: editing.maxClients != null ? String(editing.maxClients) : "",
        deliveryMethod: editing.deliveryMethod ?? "Video call",
      });
    } else {
      setForm({ ...empty });
    }
    setErrors({});
  }, [editing, open]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter a product name";
    if (!Number(form.price) || Number(form.price) <= 0)
      errs.price = "Enter a valid price";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const base: Product = {
      id: editing?.id ?? uid("prod"),
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      price: Number(form.price),
      compareAt: form.compareAt ? Number(form.compareAt) : undefined,
      status: form.status,
      sales: editing?.sales ?? 0,
      revenue: editing?.revenue ?? 0,
      imageSeed: editing?.imageSeed ?? form.name.toLowerCase().replace(/\s/g, "-"),
      imageUrl: form.imageUrl || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      recurring: form.type === "Membership" || form.type === "Service",
      rating: editing?.rating ?? 0,
      reviewCount: editing?.reviewCount ?? 0,
      fileType: form.type === "Digital" ? form.fileType : undefined,
      filePath: form.type === "Digital" ? form.filePath || undefined : undefined,
      fileName: form.type === "Digital" ? form.fileName || undefined : undefined,
      weight: form.type === "Physical" ? form.weight : undefined,
      sku: form.type === "Physical" ? form.sku : undefined,
      stock: form.type === "Physical" ? Number(form.stock) || 0 : undefined,
      duration: form.type === "Service" ? Number(form.duration) || undefined : undefined,
      maxClients: form.type === "Service" ? Number(form.maxClients) || undefined : undefined,
      deliveryMethod: form.type === "Service" ? form.deliveryMethod : undefined,
    };

    if (editing) {
      updateProduct(editing.id, base);
      toast("Product updated", { variant: "success" });
    } else {
      addProduct(base);
      toast("Product created", { variant: "success" });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit Product" : "New Product"}
      description="Fill in the details below to list your product."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Type selector */}
        <div>
          <Label>Product type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ type: t })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                  form.type === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Product name</Label>
          <Input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. 12-Week Shred Program"
          />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Describe what's included and who it's for..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Price (USD)</Label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set({ price: e.target.value })}
              placeholder="49"
            />
            {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
          </div>
          <div>
            <Label>Compare-at price</Label>
            <Input
              type="number"
              min={0}
              value={form.compareAt}
              onChange={(e) => set({ compareAt: e.target.value })}
              placeholder="79 (optional)"
            />
          </div>
        </div>

        {/* Type-specific */}
        {form.type === "Digital" && (
          <div>
            <Label>File type</Label>
            <Select value={form.fileType} onChange={(e) => set({ fileType: e.target.value })}>
              <option>PDF</option>
              <option>Video Course</option>
              <option>PDF + Video</option>
              <option>ZIP</option>
            </Select>
            <input ref={docRef} type="file" hidden onChange={onPickFile} />
            {form.fileName ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-success" />
                <span className="truncate text-foreground">{form.fileName}</span>
                <button
                  type="button"
                  onClick={() => docRef.current?.click()}
                  className="ml-auto shrink-0 text-xs font-semibold text-primary hover:underline"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={fileUploading}
                onClick={() => docRef.current?.click()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {fileUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {fileUploading ? "Uploading..." : "Upload deliverable file (PDF/ZIP, max 50MB)"}
              </button>
            )}
          </div>
        )}
        {form.type === "Physical" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div>
              <Label>Weight</Label>
              <Input value={form.weight} onChange={(e) => set({ weight: e.target.value })} placeholder="0.5kg" />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => set({ sku: e.target.value })} placeholder="FP-001" />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => set({ stock: e.target.value })} placeholder="100" />
            </div>
          </div>
        )}
        {form.type === "Service" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" value={form.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="60" />
            </div>
            <div>
              <Label>Max clients</Label>
              <Input type="number" value={form.maxClients} onChange={(e) => set({ maxClients: e.target.value })} placeholder="1" />
            </div>
            <div>
              <Label>Delivery</Label>
              <Select value={form.deliveryMethod} onChange={(e) => set({ deliveryMethod: e.target.value })}>
                <option>Video call</option>
                <option>In-person</option>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => set({ category: e.target.value as ProductCategory })}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => set({ status: e.target.value as Product["status"] })}>
              <option>Draft</option>
              <option>Published</option>
            </Select>
          </div>
        </div>

        <div>
          <Label>Tags (comma separated)</Label>
          <Input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="fat loss, beginner" />
        </div>

        <div>
          <Label>Thumbnail</Label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
          {form.imageUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
                <Image src={form.imageUrl} alt="Thumbnail" fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => set({ imageUrl: "" })}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload thumbnail"}
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editing ? "Save Changes" : "Save Product"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
