import type { Metadata } from "next";
import localFont from "next/font/local";
import { Bricolage_Grotesque, Jost } from "next/font/google";
import "./globals.css";
import "@mantine/core/styles.css";
import { dark, neobrutalism } from "@clerk/themes";
import { createTheme, MantineProvider } from "@mantine/core";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

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

export const metadata: Metadata = {
  title: "FitLog",
  description: "Workout Tracker App",
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
                  <MantineProvider
                    defaultColorScheme="dark"
                    theme={theme}
                    forceColorScheme="dark"
                  >
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
