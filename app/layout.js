import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "/components/ui/toaster"

import Providers from './providers';


const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Virtual TA',
  description: 'UTD Virtual TA',
  icons: {
    icon: [
      '/favicon.ico?v=4',
    ],
    apple: [
      '/apple-touch-icon.png?v=4',
    ],
    shortcut: [
      '/apple-touch-icon.png'
    ]
  },
  manifest: '.site.webmanifest'
};


export default function RootLayout({ children }) {
  return (
 
      <html lang="en">
        <body className={inter.className}>
          <Providers>{children}</Providers>
          <Toaster />
        </body>
      </html>
  
  );
}
