import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Decown | Decor & Gifting Collection",
  description:
    "Decown: curated decor and gifting pieces for festivals, weddings, housewarmings and meaningful moments. Enquire on WhatsApp.",
  icons: { icon: "/brand/logo-mark.webp" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&family=Tiro+Devanagari+Hindi&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
