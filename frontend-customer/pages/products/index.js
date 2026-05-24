import { useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";
import ProductCard from "../../components/ProductCard";
import { productAPI } from "../../lib/api";

const CATEGORIES = [
  "electronics",
  "fashion",
  "home-and-living",
  "beauty",
  "gaming",
  "books",
  "sports",
];

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ProductsPage() {
  const router = useRouter();
  const { category, sort, q } = router.query;

  const params = useMemo(() => {
    const current = {};
    if (category) current.category = category;
    if (sort) current.sort = sort;
    if (q) current.search = q;
    return current;
  }, [category, sort, q]);

  const { data: products, isLoading, isError, error } = useQuery({
    queryKey: ["products", params],
    queryFn: () => productAPI.getAll(params).then((r) => r.data.products),
    keepPreviousData: true,
  });

  return (
    <>
      <Head>
        <title>Products | DigiSho</title>
      </Head>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold">Browse Products</h1>
            <p className="text-gray-500 mt-2">Find the best deals across categories and trending collections.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className={`text-sm rounded-full px-4 py-2 border ${!category ? "border-accent bg-accent text-white" : "border-gray-200 text-gray-700 hover:border-accent hover:text-accent"}`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => router.push({ pathname: "/products", query: { ...router.query, category: cat } })}
                className={`text-sm rounded-full px-4 py-2 border ${category === cat ? "border-accent bg-accent text-white" : "border-gray-200 text-gray-700 hover:border-accent hover:text-accent"}`}
              >
                {cat.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div className="text-sm text-gray-500">
            {category ? `Category: ${category.replace(/-/g, " ")}` : "Showing all products"}
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort by</label>
            <select
              id="sort"
              value={sort || ""}
              onChange={(e) => router.push({ pathname: "/products", query: { ...router.query, sort: e.target.value } })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Default</option>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 mb-6">
            Cannot load products right now. Check whether the backend server is running at <code>http://localhost:5000</code> or set <code>NEXT_PUBLIC_API_URL</code> correctly.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {(isLoading ? Array(8).fill(null) : products?.length ? products : Array(4).fill(null)).map((product, index) => (
            <ProductCard key={product?._id || index} product={product} loading={!product} />
          ))}
        </div>

        {!isLoading && !isError && products?.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No products found for the selected filters.
            <div className="mt-4">
              <Link href="/" className="text-accent font-semibold hover:underline">Return to home</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

ProductsPage.getLayout = (page) => <Layout>{page}</Layout>;
