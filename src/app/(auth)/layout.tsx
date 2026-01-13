import * as React from "react";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <AuthProvider session={session}>
      <div className="min-h-screen">
        <div className="view-fade-in">{children}</div>
      </div>
    </AuthProvider>
  );
}
