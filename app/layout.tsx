import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "calculation.X | Master Mental Math 10-Mins Daily",
  description: "A premium calculation trainer. Boost your quantitative speed, memory, and accuracy by practice of just 10 minutes every day. Designed for competitive exams.",
  keywords: ["mental math", "calculation speed", "speed math", "math training", "10 minutes math", "ibps exam", "cat math", "ssc quantitative"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Navbar />
        <main style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <footer style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: 'hsl(var(--text-muted))',
          fontSize: '0.9rem',
          borderTop: '1px solid hsl(var(--border-color))',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          marginTop: '60px',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontWeight: '600' }}>
              calculation<span style={{ color: 'hsl(var(--accent-primary))' }}>.X</span> — Invest 10 Minutes a Day for Accelerated Calculations
            </p>
            <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>
              &copy; {new Date().getFullYear()} calculation.X. Built for competitive examiners, students, and brain training enthusiasts.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
