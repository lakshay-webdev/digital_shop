import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { useWishlistStore, useAuthStore } from "../store";
import { FiHeart } from "react-icons/fi";

export default function WishlistPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items } = useWishlistStore();

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token]);

  return (
    <>
      <Head><title>Wishlist | DigiSho</title></Head>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">
            My <span className="text-accent">Wishlist</span>
          </h1>
          <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <FiHeart className="mx-auto text-5xl text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-6">Save items you love to buy them later</p>
            <Link href="/products"
              className="bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

WishlistPage.getLayout = (page) => <Layout>{page}</Layout>;
