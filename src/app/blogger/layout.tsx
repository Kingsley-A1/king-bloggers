import * as React from "react";

import { Sidebar } from "@/components/layout/Sidebar";

export default function BloggerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[18rem_1fr]">
      <Sidebar />
      <div className="view-fade-in">{children}</div>
    </div>
  );
}
