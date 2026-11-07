import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-config";
import Navbar from "@/components/Navbar";

async function AuthGate({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();
  if (!session) redirect("/login");
  return <>{children}</>;
}

function NavbarFallback() {
  return (
    <div className="sticky top-0 z-50 h-14 bg-white/90 dark:bg-gray-900/90 border-b border-gray-100 dark:border-white/5" />
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </div>
    </div>
  );
}