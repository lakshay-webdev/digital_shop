import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

// ── Auth Store ────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      setAuth: (user, token) => {
        Cookies.set("token", token, { expires: 30, secure: true, sameSite: "strict" });
        localStorage.setItem("token", token);
        set({ user, token });
      },

      logout: () => {
        Cookies.remove("token");
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      isAdmin: () => ["admin", "superadmin"].includes(get().user?.role),
      isLoggedIn: () => !!get().token,
    }),
    { name: "digisho-auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// ── Cart Store ────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, qty = 1, variant = "") => {
        const items = get().items;
        const key   = `${product._id}-${variant}`;
        const idx   = items.findIndex((i) => `${i._id}-${i.variant}` === key);
        if (idx > -1) {
          const updated = [...items];
          updated[idx].qty += qty;
          set({ items: updated });
        } else {
          set({ items: [...items, { ...product, qty, variant }] });
        }
      },

      removeItem: (productId, variant = "") => {
        set({ items: get().items.filter((i) => !(i._id === productId && i.variant === variant)) });
      },

      updateQty: (productId, qty, variant = "") => {
        if (qty <= 0) return get().removeItem(productId, variant);
        set({
          items: get().items.map((i) =>
            i._id === productId && i.variant === variant ? { ...i, qty } : i
          ),
        });
      },

      clear: () => set({ items: [] }),

      // ✅ FIX: `get total()` and `get itemCount()` syntax doesn't work inside Zustand state objects.
      // They must be regular functions that call get() to read current state.
      total:     () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "digisho-cart" }
  )
);

// ── Wishlist Store ────────────────────────────────────────
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem:    (p)  => set({ items: [...get().items.filter((i) => i._id !== p._id), p] }),
      removeItem: (id) => set({ items: get().items.filter((i) => i._id !== id) }),
      toggle: (p) => {
        const exists = get().items.some((i) => i._id === p._id);
        exists ? get().removeItem(p._id) : get().addItem(p);
        return !exists;
      },
      isWishlisted: (id) => get().items.some((i) => i._id === id),
    }),
    { name: "digisho-wishlist" }
  )
);