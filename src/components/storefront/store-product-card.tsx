"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency, img } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";

export function StoreProductCard({
  product,
  accent = "#7c3aed",
  onAdd,
}: {
  product: Product;
  accent?: string;
  onAdd?: (p: Product) => void;
}) {
  const onSale = !!product.compareAt && product.compareAt > product.price;
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-white/20">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={product.imageUrl || img(product.imageSeed, 500, 380)}
          alt={product.name}
          fill
          sizes="(max-width:768px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.type === "Digital" && <Badge variant="secondary">Digital</Badge>}
          {product.badge === "BESTSELLER" && (
            <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white" style={{ backgroundColor: accent }}>
              Bestseller
            </span>
          )}
          {product.badge === "NEW" && <Badge variant="success">New</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        {product.rating > 0 && <StarRating rating={product.rating} size={12} reviewCount={product.reviewCount} />}
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-foreground">{product.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-foreground">{formatCurrency(product.price)}</span>
            {onSale && <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.compareAt!)}</span>}
          </div>
          {onAdd && (
            <button
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-transform active:scale-90"
              style={{ backgroundColor: accent }}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
