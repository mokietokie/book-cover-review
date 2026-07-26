"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookDetailView, StarRating } from "@/components/BookDetailView";
import type { BookDetailViewData } from "@/lib/types";

interface BookRow {
  id: string;
  title: string | null;
  author: string | null;
  category_name: string | null;
  publisher: string | null;
  pub_date: string | null;
  description: string | null;
  cover_url: string | null;
  aladin_item_id: string | null;
  customer_review_rank: number | null;
  reviews: {
    ratingCount?: number;
    commentReviewCount?: number;
    myReviewCount?: number;
  } | null;
  kyobo_search_url: string | null;
  yes24_search_url: string | null;
}

interface CategoryGroup {
  categoryName: string;
  books: BookRow[];
}

const GENERAL_ERROR = "일시적인 오류가 발생했어요, 다시 시도해주세요";

function TopNav() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <span className="text-base font-semibold text-neutral-900">
          📚 표지리뷰
        </span>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          + 새로 업로드
        </Link>
      </div>
    </header>
  );
}

function bookToDetail(book: BookRow): BookDetailViewData {
  return {
    title: book.title ?? "",
    author: book.author,
    cover: book.cover_url,
    categoryName: book.category_name,
    publisher: book.publisher,
    pubDate: book.pub_date,
    description: book.description,
    aladinProductUrl: book.aladin_item_id
      ? `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${book.aladin_item_id}`
      : null,
    customerReviewRank: book.customer_review_rank,
    ratingCount: book.reviews?.ratingCount ?? null,
    commentReviewCount: book.reviews?.commentReviewCount ?? null,
    myReviewCount: book.reviews?.myReviewCount ?? null,
    reviews: [],
    kyoboSearchUrl: book.kyobo_search_url,
    yes24SearchUrl: book.yes24_search_url,
  };
}

export default function BooksPage() {
  const [categories, setCategories] = useState<CategoryGroup[] | null>(null);
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);

  useEffect(() => {
    fetch("/api/books")
      .then(async (res) => {
        if (!res.ok) throw new Error(GENERAL_ERROR);
        const data = await res.json();
        setCategories(data.categories ?? []);
      })
      .catch(() => setError(GENERAL_ERROR));
  }, []);

  const totalCount =
    categories?.reduce((sum, group) => sum + group.books.length, 0) ?? 0;

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        {error && (
          <div className="rounded-lg border border-red-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span aria-hidden>⚠</span>
              {error}
            </p>
          </div>
        )}

        {!error && selectedBook && (
          <div className="flex flex-col gap-6">
            <button
              onClick={() => setSelectedBook(null)}
              className="w-fit text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← 목록으로
            </button>
            <BookDetailView detail={bookToDetail(selectedBook)} />
          </div>
        )}

        {!error && !selectedBook && categories && categories.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium text-neutral-900">
              아직 저장된 책이 없어요
            </p>
            <p className="text-sm text-neutral-500">
              표지 사진을 업로드하면 여기에 쌓여요
            </p>
            <Link
              href="/"
              className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              표지 업로드하러 가기
            </Link>
          </div>
        )}

        {!error && !selectedBook && categories && categories.length > 0 && (
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold text-neutral-900">
              내 책 목록 ({totalCount})
            </h1>

            {categories.map((group) => (
              <section key={group.categoryName} className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-neutral-900">
                  {group.categoryName} ({group.books.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {group.books.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-2 text-left transition-colors hover:border-neutral-400"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={book.cover_url ?? ""}
                        alt={book.title ?? ""}
                        className="aspect-[3/4] w-full rounded object-cover"
                      />
                      <span className="truncate text-sm font-medium text-neutral-900">
                        {book.title}
                      </span>
                      {book.customer_review_rank !== null && (
                        <StarRating rating={book.customer_review_rank} />
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
