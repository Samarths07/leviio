"use client";

import { useState } from "react";

/** Immutably move an item from one index to another. */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Lightweight, handle-based drag-and-drop reordering using the native HTML5
 * Drag and Drop API — no external library.
 *
 * Spread `containerProps(i)` on each list item and `handleProps(i)` on its
 * drag handle. Dragging is only armed when the user grabs the handle, so inputs
 * inside the item stay fully usable.
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
    setArmed(null);
  };

  const handleProps = (index: number) => ({
    onMouseDown: () => setArmed(index),
    onTouchStart: () => setArmed(index),
    style: { cursor: "grab" as const, touchAction: "none" as const },
  });

  const containerProps = (index: number) => ({
    draggable: armed === index,
    onDragStart: (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", String(index));
      } catch {
        /* some browsers disallow setData in tests */
      }
    },
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null && index !== dragIndex) setOverIndex(index);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
      reset();
    },
    onDragEnd: reset,
  });

  return { dragIndex, overIndex, handleProps, containerProps };
}
