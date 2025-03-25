import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <main className={`${inter.className} min-h-screen bg-gradient-to-b from-gray-50 to-gray-100`}>
      <Component {...pageProps} />
    </main>
  );
}
