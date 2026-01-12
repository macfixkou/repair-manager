import "@/app/globals.css";
import { ReactNode } from "react";
import { Manrope } from "next/font/google";
import { serverClient } from "@/lib/supabaseServer";
import SupabaseProvider from "@/components/supabase-provider";
import { Toaster } from "react-hot-toast";

const manrope = Manrope({ subsets: ["latin"] });
const useLandingTheme = true;

export const metadata = {
  title: "Repair Manager",
  description: "Repair case tracking app (MVP)",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = serverClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="ja">
      <body className={`${manrope.className} ${useLandingTheme ? "theme-landing" : ""}`}>
        <SupabaseProvider initialSession={session}>
          {children}
          <Toaster position="top-right" />
        </SupabaseProvider>
      </body>
    </html>
  );
}
