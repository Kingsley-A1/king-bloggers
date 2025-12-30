import * as React from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AuthProvider>
        <Navbar />
      </AuthProvider>
      <div className="view-fade-in">{children}</div>
      <Footer />
    </div>
  );
}
