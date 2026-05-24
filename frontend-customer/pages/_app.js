import "../styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import { DefaultSeo } from "next-seo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <QueryClientProvider client={queryClient}>
      <DefaultSeo
        titleTemplate="%s | DigiSho"
        defaultTitle="DigiSho — Premium eCommerce"
        description="Shop premium products at the best prices on DigiSho."
        openGraph={{ type: "website", locale: "en_IN", site_name: "DigiSho" }}
      />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {getLayout(<Component {...pageProps} />)}

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: "DM Sans, sans-serif", fontSize: 14, borderRadius: 10 },
          success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#e94560", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
