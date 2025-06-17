import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Jost } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-bricolage-grotesque",
    weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const jost = Jost({
    subsets: ["latin"],
    variable: "--font-jost",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const theme = createTheme({
    fontFamily: "var(--font-jost), sans-serif",
    primaryColor: "cyan",
});

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

// app/page.tsx
export const metadata = {
  title: 'Fitlog',
  description: 'AI powered Workout Tracker App and Fitness Journal',
  keywords: ['fitness', 'workout tracker', 'fitness journal', 'AI powered fitness', 'exercise log'],
  authors: [{ name: 'Chirag', url: 'https://chirxg.is-a.dev' }],
  creator: 'Chirag',
  applicationName: 'Fitlog',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Fitlog',
    description: 'AI powered Workout Tracker App and Fitness Journal',
    url: 'https://fitlog-drab.vercel.app',
    siteName: 'Fitlog',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fitlog',
    description: 'AI powered Workout Tracker App and Fitness Journal',
    images: ['/og.png'],
  },
};


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} ${jost.variable} antialiased`}
            >
                <ClerkProvider
                    appearance={{
                        baseTheme: [dark],
                        variables: {
                            // colorPrimary: "blue",
                            // colorBackground: "rgba(20, 69, 47, 1)",
                            fontFamily: "roboto",
                            borderRadius: "0.7rem",
                            colorInputBackground: "white",
                            spacingUnit: "0.9rem",
                        },
                        elements: {},
                        layout: {
                            animations: true,
                            logoLinkUrl: "https://telegra.ph/file/7790682e4986dbb174428.png",
                            logoPlacement: "outside",
                        },
                    }}
                >
                    <main className="mx-auto bg-slate-900">
                        {/* <div className="flex items-start justify-center min-h-screen ">
              <div className="px-10 py-10 mt-24 mw-1 rounded-3xl bg-black shadow-3xl "> */}
                        {/* <div className="mt-4"> */}
                        <MantineProvider defaultColorScheme="dark" theme={theme} forceColorScheme="dark">
                            {children}
                        </MantineProvider>
                        {/* </div> */}
                        {/* </div>
            </div> */}
                    </main>
                </ClerkProvider>
            </body>
        </html>
    );
}
