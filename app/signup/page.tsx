import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { TopNav } from "@/components/TopNav";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <TopNav primaryHref="/" primaryLabel="업로드" />
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
