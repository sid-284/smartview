import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amazon Review Scraper",
  description: "Analyze Amazon product reviews with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="bg-slate-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">Amazon Review Scraper</h1>
              <div className="flex gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </header>
          <main className="container mx-auto p-4">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
} 