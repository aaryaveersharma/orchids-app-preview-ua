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
  metadataBase: new URL('https://urbanauto.in'),
  title: {
    default: "Urban Auto | Premium Car Care in Raipur",
    template: "%s | Urban Auto"
  },
  description: "Raipur's premier modern mechanized car care brand. Professional car cleaning, detailing, and auto services. Best car wash, ceramic coating, and detailing in Raipur.",
  keywords: ["car care Raipur", "car wash Raipur", "ceramic coating Raipur", "car detailing Raipur", "Urban Auto Raipur", "best car service Raipur"],
  manifest: "/manifest.json",
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Urban Auto",
  },
  formatDetection: {
    telephone: true,
  },
  applicationName: "Urban Auto",
  icons: {
    icon: [
      { url: "/urban-auto-logo.jpg", sizes: "32x32" },
      { url: "/urban-auto-logo.jpg", sizes: "16x16" },
      { url: "/urban-auto-logo.jpg" },
    ],
    apple: "/urban-auto-logo.jpg",
    shortcut: "/urban-auto-logo.jpg",
  },
  openGraph: {
    title: "Urban Auto | Premium Car Care in Raipur",
    description: "Raipur's premier modern mechanized car care brand. Professional car cleaning, detailing, and auto services.",
    url: 'https://urbanauto.in',
    siteName: 'Urban Auto',
    images: [
      {
        url: '/urban-auto-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Urban Auto - Premium Car Care Raipur',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Urban Auto | Premium Car Care in Raipur',
    description: "Professional car cleaning, detailing, and auto services in Raipur.",
    images: ['/urban-auto-logo.jpg'],
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

                // Register Firebase messaging SW for background push support
                navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function(reg) {
                  console.log('Firebase messaging SW registered:', reg.scope);
                  // Send Firebase config so the SW can initialize Firebase for background messages
                  function sendConfig(sw) {
                    sw.postMessage({
                      type: 'FIREBASE_CONFIG',
                      config: {
                        apiKey: '${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}',
                        authDomain: '${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}',
                        projectId: '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}',
                        storageBucket: '${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}',
                        messagingSenderId: '${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}',
                        appId: '${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}',
                      }
                    });
                  }
                  if (reg.active) sendConfig(reg.active);
                  reg.addEventListener('updatefound', function() {
                    var newSW = reg.installing;
                    if (newSW) newSW.addEventListener('statechange', function() {
                      if (newSW.state === 'activated') sendConfig(newSW);
                    });
                  });
                  navigator.serviceWorker.ready.then(function(r) {
                    if (r.active) sendConfig(r.active);
                  });
                }).catch(function(err) {
                  console.warn('Firebase messaging SW failed:', err);
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
              "name": "Urban Auto",
              "image": "https://urbanauto.in/urban-auto-logo.jpg",
              "@id": "https://urbanauto.in",
              "url": "https://urbanauto.in",
              "telephone": "+918889822220",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Sunder Nagar",
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