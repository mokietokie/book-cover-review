"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TopNavProps {
  primaryHref: string;
  primaryLabel: string;
  maxWidthClassName?: string;
}

export function TopNav({
  primaryHref,
  primaryLabel,
  maxWidthClassName = "max-w-md",
}: TopNavProps) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div
        className={`mx-auto flex ${maxWidthClassName} items-center justify-between px-4 py-3`}
      >
        <span className="text-base font-semibold text-neutral-900">
          📚 표지리뷰
        </span>
        <div className="flex items-center gap-4">
          <Link
            href={primaryHref}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            {primaryLabel}
          </Link>
          {loggedIn === true && (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              로그아웃
            </button>
          )}
          {loggedIn === false && (
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
