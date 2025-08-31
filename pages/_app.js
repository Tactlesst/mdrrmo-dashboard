import "@/styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Admin Dashboard</title> {/* Default title for all pages */}
        <meta name="description" content="Admin dashboard for managing logs" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}