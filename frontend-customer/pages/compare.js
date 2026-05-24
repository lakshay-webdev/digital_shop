// FILE 2: pages/compare.js
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "../components/Layout";
import { productAPI } from "../lib/api";
import { useCartStore } from "../store";
import toast from "react-hot-toast";

const fmt = (n) => (n != null ? `₹${n.toLocaleString("en-IN")}` : "—");

const FIELDS = [
  { label: "Price",    key: (p) => fmt(p.price) },
  { label: "MRP",     key: (p) => fmt(p.mrp) },
  { label: "Discount",key: (p) => p.discount ? `${p.discount}%` : "—" },
  { label: "Brand",   key: (p) => p.brand || "—" },
  { label: "Rating",  key: (p) => p.avgRating ? `${p.avgRating} ★ (${p.numReviews} reviews)` : "—" },
  { label: "Category",key: (p) => p.category || "—" },
  { label: "In Stock",key: (p) => (p.stock > 0 ? "✅ Yes" : "❌ No") },
];

export default function ComparePage() {
  const router = useRouter();
  const ids    = (router.query.ids || "").split(",").filter(Boolean);
  const addItem = useCartStore((s) => s.addItem);

  const { data: products, isLoading } = useQuery({
    queryKey: ["compare", ids.join(",")],
    queryFn: () =>
      Promise.all(ids.map((id) => productAPI.getById(id).then((r) => r.data.product))),
    enabled: ids.length > 0,
  });

  return (
    <>
      <Head><title>Compare Products | DigiSho</title></Head>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">
            📊 Product <span className="text-accent">Comparison</span>
          </h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-accent transition-colors">
            ← Back to Home
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading products...</div>
        ) : !products?.length ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No products selected for comparison.</p>
            <Link href="/products" className="text-accent hover:underline">Browse Products →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Product images & names */}
              <thead>
                <tr>
                  <th className="text-left text-sm font-semibold text-gray-400 py-3 pr-6 w-32 align-bottom">
                    Feature
                  </th>
                  {products.map((p) => (
                    <th key={p._id} className="px-4 pb-4 align-top">
                      <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center min-w-[160px]">
                        <div className="h-32 relative mb-3">
                          {p.thumbnail ? (
                            <Image src={p.thumbnail} alt={p.name} fill className="object-contain" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-4xl">📦</div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-primary leading-tight line-clamp-2 mb-3">{p.name}</p>
                        <button
                          onClick={() => { addItem(p); toast.success("Added to cart! 🛒"); }}
                          className="w-full bg-accent text-white text-xs font-semibold py-2 rounded-xl hover:bg-red-600 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Comparison rows */}
              <tbody>
                {FIELDS.map(({ label, key }, i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="py-3 pr-6 text-sm font-medium text-gray-500 rounded-l-xl pl-3">
                      {label}
                    </td>
                    {products.map((p) => (
                      <td key={p._id} className="px-4 py-3 text-sm font-semibold text-primary text-center">
                        {key(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

ComparePage.getLayout = (page) => <Layout>{page}</Layout>;