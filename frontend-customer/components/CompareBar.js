// ============================================================
// FILE 1: components/CompareBar.js
// Drop this in Layout.js — shows floating bar when items added
// ============================================================
import { create } from "zustand";
import Link from "next/link";

// Zustand store for compare (import this in ProductCard too)
export const useCompareStore = create((set, get) => ({
  items: [],
  toggle: (product) => {
    const { items } = get();
    const exists = items.find((p) => p._id === product._id);
    if (exists) {
      set({ items: items.filter((p) => p._id !== product._id) });
    } else {
      if (items.length >= 3) {
        // max 3 items — remove oldest, add new
        set({ items: [...items.slice(1), product] });
      } else {
        set({ items: [...items, product] });
      }
    }
  },
  isInCompare: (id) => get().items.some((p) => p._id === id),
  clear: () => set({ items: [] }),
}));

export default function CompareBar() {
  const { items, clear } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t-2 border-accent shadow-2xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-primary flex-shrink-0">
          Compare ({items.length}/3):
        </span>

        {/* Product chips */}
        <div className="flex gap-2 flex-1 flex-wrap">
          {items.map((p) => (
            <div key={p._id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1 text-xs font-medium">
              <span className="line-clamp-1 max-w-[120px]">{p.name}</span>
              <button
                onClick={() => useCompareStore.getState().toggle(p)}
                className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
              >✕</button>
            </div>
          ))}
          {/* Empty slots */}
          {Array(3 - items.length).fill(null).map((_, i) => (
            <div key={i} className="flex items-center border-2 border-dashed border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-400 min-w-[80px]">
              + Add item
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={clear}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2"
          >
            Clear
          </button>
          <Link
            href={`/compare?ids=${items.map((p) => p._id).join(",")}`}
            className="bg-accent text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Compare Now →
          </Link>
        </div>
      </div>
    </div>
  );
}