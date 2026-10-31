import { auth } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export const instant = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}