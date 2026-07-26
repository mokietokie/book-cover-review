"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const HEADLINE = "사고 싶었던 그 책, 기억나세요?\n표지 한 장이면 바로 찾아드려요.";
const TYPE_SPEED_MS = 45;

const FEATURES = [
  {
    title: "표지 한 장, 자동 인식",
    description: "Vision AI가 제목·저자를 바로 찾아줘요",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.827 6.175A2.31 2.31 0 0 1 8.929 4.5h6.142a2.31 2.31 0 0 1 2.102 1.675l.545 1.91a2.25 2.25 0 0 0 2.164 1.643h.256c1.243 0 2.25 1.007 2.25 2.25v7.5c0 1.243-1.007 2.25-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 19.5V12c0-1.243 1.007-2.25 2.25-2.25h.256a2.25 2.25 0 0 0 2.164-1.643l.545-1.91Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 13.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
        />
      </svg>
    ),
  },
  {
    title: "평점 · 리뷰 즉시 확인",
    description: "알라딘 정보를 따로 찾아볼 필요 없어요",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 21.11a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    ),
  },
  {
    title: "사고 싶은 책만 정리",
    description: "카테고리별로 모아서 관리해요",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        />
      </svg>
    ),
  },
];

export function Hero({
  loggedIn,
  onStart,
}: {
  loggedIn: boolean | null;
  onStart: () => void;
}) {
  const [typedLength, setTypedLength] = useState(0);
  const done = typedLength >= HEADLINE.length;

  useEffect(() => {
    if (typedLength >= HEADLINE.length) return;
    const timer = setTimeout(() => setTypedLength((n) => n + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timer);
  }, [typedLength]);

  const lines = HEADLINE.slice(0, typedLength).split("\n");

  return (
    <section className="flex flex-col items-center gap-6 py-8 text-center">
      <h1 className="min-h-[5.5rem] text-xl font-bold leading-tight text-neutral-900 sm:text-3xl">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
            {i === lines.length - 1 && !done && (
              <span className="ml-0.5 inline-block h-[0.9em] w-[2px] animate-pulse bg-neutral-900 align-middle" />
            )}
          </span>
        ))}
      </h1>

      <p
        className={`text-sm text-neutral-400 transition-all duration-700 ease-out ${
          done ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        Snap it, Know it.
      </p>

      <div
        className={`flex gap-2 transition-all duration-700 ease-out ${
          done ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: done ? "120ms" : "0ms" }}
      >
        <button
          onClick={onStart}
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          시작하기
        </button>
        {loggedIn === false && (
          <Link
            href="/login"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            로그인
          </Link>
        )}
        {loggedIn === true && (
          <Link
            href="/books"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            내 목록
          </Link>
        )}
      </div>

      <div className="mt-2 grid w-full grid-cols-3 gap-3">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className={`flex flex-col items-center gap-1.5 transition-all duration-700 ease-out ${
              done ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: done ? `${240 + i * 120}ms` : "0ms" }}
          >
            <span className="text-neutral-900">{feature.icon}</span>
            <span className="text-xs font-semibold text-neutral-900">
              {feature.title}
            </span>
            <span className="text-[11px] leading-tight text-neutral-500">
              {feature.description}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
