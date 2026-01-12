import * as React from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <AuthProvider session={session}>
      <div className="min-h-screen">
        <Navbar />
        <div className="view-fade-in">{children}</div>
        <Footer />
      </div>
    </AuthProvider>
  );
}
