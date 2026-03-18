import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "sonner";
import { VisualEditsMessenger as VisualEditsMessengerComponent } from "orchids-visual-edits";
import NotificationPermissionHandler from "@/components/NotificationPermissionHandler";

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://hastagcars.in'),
  title: {
    default: "Hastag Cars | Premium Car Care in Raipur",
    template: "%s | Hastag Cars"
  },
  description: "Raipur's premier modern mechanized car care brand. Professional car cleaning, detailing, and auto services. Best car wash, ceramic coating, and detailing in Raipur.",
  keywords: ["car care Raipur", "car wash Raipur", "ceramic coating Raipur", "car detailing Raipur", "Hastag Cars Raipur", "best car service Raipur"],
  manifest: "/manifest.json",
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hastag Cars",
  },
  formatDetection: {
    telephone: true,
  },
  applicationName: "Hastag Cars",
  icons: {
    icon: [
      { url: "/hastag-logo.png", sizes: "32x32" },
      { url: "/hastag-logo.png", sizes: "16x16" },
      { url: "/hastag-logo.png" },
    ],
    apple: "/hastag-logo.png",
    shortcut: "/hastag-logo.png",
  },
  openGraph: {
    title: "Hastag Cars | Premium Car Care in Raipur",
    description: "Raipur's premier modern mechanized car care brand. Professional car cleaning, detailing, and auto services.",
    url: 'https://hastagcars.in',
    siteName: "Hastag Cars",
    images: [
      {
        url: '/hastag-logo.png',
        width: 1200,
        height: 630,
        alt: "Hastag Cars - Premium Car Care Raipur",
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hastag Cars | Premium Car Care in Raipur",
    description: "Professional car cleaning, detailing, and auto services in Raipur.",
    images: ['/hastag-logo.png'],
  },
  other: {
    "msapplication-TileColor": "#1e3a8a",
    "msapplication-tap-highlight": "no"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="95f0b210-6c16-41b5-8de6-4fad9412ab9c"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
        <Script id="json-ld" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Hastag Cars",
              "image": "https://hastagcars.in/hastag-logo.png",
              "@id": "https://hastagcars.in",
              "url": "https://hastagcars.in",
              "telephone": "+918889822220",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Kota canal road, near Vivekanand stadium",
                "addressLocality": "Raipur",
                "addressRegion": "Chhattisgarh",
                "postalCode": "492001",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 21.2333,
                "longitude": 81.6333
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "09:00",
                "closes": "21:00"
              },
              "sameAs": [
                "https://www.instagram.com/theurbanauto"
              ],
              "priceRange": "$$"
            }
          `}
        </Script>
          <AuthProvider>
            <NotificationPermissionHandler />
            {children}
            <BottomNav />
            <Toaster position="top-center" richColors closeButton />
          </AuthProvider>
          <VisualEditsMessengerComponent />
        </body>
    </html>
  );
}