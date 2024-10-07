import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { GoogleTagManager } from '@next/third-parties/google'

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });


function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();
  
  return (
    <div className={inter.className}>
      <GoogleTagManager gtmId="GTM-W55ZK7" />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </div>
  );
}

export default appWithTranslation(App);
