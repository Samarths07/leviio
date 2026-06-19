"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  Download,
  FileText,
  Package,
  PlayCircle,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { matchOrders } from "@/lib/portal";
import {
  downloadDeliverable,
  fulfillmentVariant,
  orderType,
} from "@/lib/delivery";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate, formatTime } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "Digital", label: "Courses & PDFs" },
  { value: "Service", label: "Coaching" },
  { value: "Physical", label: "Merch" },
];

export default function PortalLibrary() {
  const { clientUser, orders, products } = useApp();
  const [filter, setFilter] = useState("all");

  const myOrders = useMemo(
    () => (clientUser ? matchOrders(orders, clientUser) : []),
    [orders, clientUser]
  );

  if (!clientUser) return null;

  const counts = {
    all: myOrders.length,
    Digital: myOrders.filter((o) => orderType(o) === "Digital").length,
    Service: myOrders.filter((o) => orderType(o) === "Service").length,
    Physical: myOrders.filter((o) => orderType(o) === "Physical").length,
  };

  const visible =
    filter === "all"
      ? myOrders
      : myOrders.filter((o) => orderType(o) === filter);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          My Library
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything you&apos;ve purchased, all in one place.
        </p>
      </div>

      <Tabs
        tabs={FILTERS.map((f) => ({
          ...f,
          count: counts[f.value as keyof typeof counts],
        }))}
        value={filter}
        onChange={setFilter}
      />

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          <p className="font-bold text-foreground">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            Items you buy will show up here instantly.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => (
            <LibraryCard
              key={o.id}
              order={o}
              fileType={
                products.find((p) => p.id === o.productId || p.name === o.product)
                  ?.fileType
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({
  order,
  fileType,
}: {
  order: Order;
  fileType?: string;
}) {
  const { toast } = useToast();
  const type = orderType(order);
  const isVideo = !!fileType && /video|course/i.test(fileType);

  const Icon =
    type === "Service"
      ? CalendarCheck
      : type === "Physical"
        ? Package
        : isVideo
          ? PlayCircle
          : FileText;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-foreground">{order.product}</p>
            {fileType && type === "Digital" && (
              <Badge variant="secondary">{fileType}</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Purchased {formatDate(order.date)} · {formatCurrency(order.amount)} ·
            #{order.id.replace(/^#/, "")}
          </p>

          {/* Type-specific status line */}
          {type === "Physical" && (
            <div className="mt-2 space-y-1 text-xs">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                {order.fulfillment === "Delivered"
                  ? "Delivered"
                  : order.fulfillment === "Shipped"
                    ? "On the way"
                    : "Preparing your order"}
                {order.tracking && (
                  <span className="font-semibold text-foreground">
                    · {order.tracking}
                  </span>
                )}
              </p>
              {order.address && (
                <p className="text-muted-foreground">Ships to: {order.address}</p>
              )}
            </div>
          )}
          {type === "Service" && order.sessionDate && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
              <CalendarCheck className="h-3.5 w-3.5" />
              {formatDate(order.sessionDate, "long")} at{" "}
              {formatTime(order.sessionDate.slice(11, 16))}
            </p>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
        {type === "Digital" && (
          <Button
            size="sm"
            onClick={() => {
              downloadDeliverable({
                product: order.product,
                id: order.id,
                client: order.client,
              });
              toast("Access file downloaded", { variant: "success" });
            }}
          >
            {isVideo ? (
              <PlayCircle className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isVideo ? "Watch" : "Open"}
          </Button>
        )}

        {type === "Service" &&
          (order.sessionDate ? (
            <Link
              href="/portal/sessions"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View session
            </Link>
          ) : order.fulfillment === "Completed" ? (
            <Badge variant="success">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Completed
            </Badge>
          ) : (
            <Link
              href={`/book/${order.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <CalendarCheck className="h-4 w-4" /> Book session
            </Link>
          ))}

        {type === "Physical" && (
          <div className="flex flex-col items-end gap-2 sm:items-stretch">
            <Badge variant={fulfillmentVariant(order.fulfillment ?? "Processing")}>
              {order.fulfillment ?? "Processing"}
            </Badge>
            {order.tracking && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast("Opening carrier tracking (demo)", { variant: "info" })}
              >
                <Truck className="h-4 w-4" /> Track
              </Button>
            )}
          </div>
        )}

        {type === "Membership" && (
          <Badge variant="success">
            <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Active
          </Badge>
        )}
      </div>
    </Card>
  );
}
