import Layout from '@/components/Layout';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ZoomProvider } from '@/contexts/ZoomContext';
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ZoomProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ZoomProvider>
  );
}
