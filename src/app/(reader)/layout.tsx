import * as React from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/auth";

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <AuthProvider session={session}>
        <Navbar />
      </AuthProvider>
      <div className="view-fade-in">{children}</div>
      <Footer />
    </div>
  );
}
