import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { SectionHeader } from "@/components/features/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string" ? searchParams.callbackUrl : undefined;
  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-14">
      <div className="w-full max-w-[480px] space-y-6">
        <GlassCard className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <Logo className="justify-center" size={36} />
            <SectionHeader
              className="mt-6 items-center text-center"
              title="Register"
              subtitle="Choose your role, pick your state and LGA, and create your account."
            />
          </div>
        </GlassCard>

        <RegistrationForm callbackUrl={callbackUrl} />

        <div className="text-center text-sm text-foreground/60">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
