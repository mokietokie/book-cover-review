"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface AladinReview {
  title: string;
  content: string;
}

interface BookDetail {
  title: string;
  author: string;
  isbn13: string;
  itemId: string;
  cover: string;
  categoryName: string;
  customerReviewRank: number;
  ratingCount: number;
  commentReviewCount: number;
  myReviewCount: number;
  reviews: AladinReview[];
}

interface SavedBook {
  kyobo_search_url: string;
  yes24_search_url: string;
}

type Status = "idle" | "selected" | "identifying" | "result" | "error";

const STEP_LABELS = [
  "표지에서 제목·저자 인식",
  "알라딘에서 도서 검색",
  "상세정보 · 리뷰 불러오는 중",
];

const GENERAL_ERROR = "일시적인 오류가 발생했어요, 다시 시도해주세요";

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round((rating / 10) * 5)));
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className="text-neutral-900">
        {"★".repeat(filled)}
        <span className="text-neutral-300">{"★".repeat(5 - filled)}</span>
      </span>
      <span className="text-sm text-neutral-500">{rating.toFixed(1)}</span>
    </span>
  );
}

function TopNav() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <span className="text-base font-semibold text-neutral-900">
          📚 표지리뷰
        </span>
        <Link
          href="/books"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          내 목록 →
        </Link>
      </div>
    </header>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [saved, setSaved] = useState<SavedBook | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileSelected(selected: File | null) {
    if (!selected) return;
    setFile(selected);
    setStatus("selected");
  }

  function resetToIdle() {
    setFile(null);
    setDetail(null);
    setSaved(null);
    setErrorMessage("");
    setStatus("idle");
  }

  async function runIdentification() {
    if (!file) return;
    setStatus("identifying");
    setCurrentStep(0);

    try {
      const identifyForm = new FormData();
      identifyForm.set("image", file);
      const identifyRes = await fetch("/api/identify", {
        method: "POST",
        body: identifyForm,
      });
      const identifyData = await identifyRes.json();
      if (!identifyRes.ok) {
        throw new Error(identifyData.error || GENERAL_ERROR);
      }

      setCurrentStep(1);
      const searchRes = await fetch("/api/aladin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: identifyData.title,
          author: identifyData.author,
        }),
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) {
        throw new Error(searchData.error || GENERAL_ERROR);
      }

      setCurrentStep(2);
      const lookupRes = await fetch("/api/aladin/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn13: searchData.isbn13 }),
      });
      const lookupData: BookDetail = await lookupRes.json();
      if (!lookupRes.ok) {
        throw new Error(
          (lookupData as unknown as { error?: string }).error || GENERAL_ERROR
        );
      }

      const saveRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lookupData.title,
          author: lookupData.author,
          isbn: lookupData.isbn13,
          aladinItemId: lookupData.itemId,
          categoryName: lookupData.categoryName,
          customerReviewRank: lookupData.customerReviewRank,
          reviews: {
            ratingCount: lookupData.ratingCount,
            commentReviewCount: lookupData.commentReviewCount,
            myReviewCount: lookupData.myReviewCount,
          },
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(GENERAL_ERROR);
      }

      setDetail(lookupData);
      setSaved(saveData as SavedBook);
      setStatus("result");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : GENERAL_ERROR);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <TopNav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        {status === "idle" && (
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-neutral-900">
              표지 사진을 업로드하세요
            </h1>
            <p className="text-sm text-neutral-500">
              찍어둔 책 표지로 리뷰와 평점을 바로 확인
            </p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFileSelected(e.dataTransfer.files?.[0] ?? null);
              }}
              className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white py-16 text-center transition-colors ${
                dragActive
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-300 hover:border-neutral-400"
              }`}
            >
              <svg
                className="mb-3 h-8 w-8 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                />
              </svg>
              <span className="text-sm text-neutral-700">
                이미지를 드래그하거나 클릭해서 업로드
              </span>
              <span className="mt-1 text-xs text-neutral-500">
                JPG / PNG, 최대 10MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) =>
                  handleFileSelected(e.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
        )}

        {(status === "selected" ||
          status === "identifying" ||
          status === "error") &&
          previewUrl && (
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="선택한 표지 미리보기"
                  className="aspect-[3/4] w-40 rounded-md border border-neutral-200 object-cover"
                />
                {status === "selected" && file && (
                  <div className="flex flex-col justify-center">
                    <span className="text-sm text-neutral-700">
                      선택한 이미지
                    </span>
                    <span className="text-xs text-neutral-500">
                      {file.name} · {formatFileSize(file.size)}
                    </span>
                  </div>
                )}
              </div>

              {status === "selected" && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetToIdle}
                    className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                  >
                    다시 선택
                  </button>
                  <button
                    onClick={runIdentification}
                    className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    이 책 식별하기 →
                  </button>
                </div>
              )}

              {status === "identifying" && (
                <ul className="flex flex-col gap-3">
                  {STEP_LABELS.map((label, index) => (
                    <li key={label} className="flex items-center gap-3">
                      {index < currentStep && (
                        <span className="text-neutral-900">✓</span>
                      )}
                      {index === currentStep && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
                      )}
                      {index > currentStep && (
                        <span className="text-neutral-300">○</span>
                      )}
                      <span
                        className={
                          index <= currentStep
                            ? "text-sm text-neutral-900"
                            : "text-sm text-neutral-400"
                        }
                      >
                        {label}
                        {index === currentStep ? " 중..." : index < currentStep ? " 완료" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {status === "error" && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border border-red-200 bg-white p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-red-600">
                      <span aria-hidden>⚠</span>
                      {errorMessage}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={resetToIdle}
                      className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                    >
                      다른 사진 선택
                    </button>
                    <button
                      onClick={runIdentification}
                      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {status === "result" && detail && (
          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.cover}
                alt={detail.title}
                className="aspect-[3/4] w-24 rounded-md border border-neutral-200 object-cover"
              />
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-medium text-neutral-900">
                  {detail.title}
                </h2>
                <p className="text-sm text-neutral-500">{detail.author} 지음</p>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={detail.customerReviewRank} />
                  <span className="text-xs text-neutral-500">
                    (알라딘 리뷰 {detail.ratingCount}건)
                  </span>
                </div>
                <span className="mt-1 w-fit rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-600">
                  {detail.categoryName}
                </span>
              </div>
            </div>

            {saved && (
              <p className="text-xs text-neutral-500">✓ 내 목록에 저장됨</p>
            )}

            <div className="border-t border-neutral-200 pt-4">
              <h3 className="mb-2 text-lg font-medium text-neutral-900">
                알라딘 리뷰
              </h3>
              {detail.reviews.length > 0 ? (
                <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
                  {detail.reviews.map((review, index) => (
                    <p
                      key={index}
                      className="line-clamp-2 px-4 py-3 text-sm text-neutral-700"
                    >
                      {review.content || review.title}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  알라딘 리뷰 원문은 제공되지 않아요.
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-900">
                다른 서점에서도 보기
              </h3>
              <div className="flex gap-2">
                <a
                  href={saved?.kyobo_search_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                >
                  교보문고에서 검색 →
                </a>
                <a
                  href={saved?.yes24_search_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                >
                  YES24에서 검색 →
                </a>
              </div>
            </div>

            <button
              onClick={resetToIdle}
              className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              다른 표지 업로드하기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
