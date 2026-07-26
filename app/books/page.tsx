"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookDetailView, StarRating } from "@/components/BookDetailView";
import { TopNav } from "@/components/TopNav";
import { ViewedDate } from "@/components/ViewedDate";
import { StatusToggle } from "@/components/StatusToggle";
import { DateRangePicker } from "@/components/DateRangePicker";
import { simplifyCategoryName } from "@/lib/category";
import type { BookDetailViewData, BookStatus } from "@/lib/types";

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
  updated_at: string;
  status: BookStatus;
}

interface CategoryGroup {
  categoryName: string;
  books: BookRow[];
}

type SortBy = "recent" | "rating" | "title";

const GENERAL_ERROR = "일시적인 오류가 발생했어요, 다시 시도해주세요";
const SORT_LABELS: Record<SortBy, string> = {
  recent: "최근 조회순",
  rating: "평점 높은순",
  title: "제목순",
};
const STATUS_FILTER_LABELS: Record<BookStatus, string> = {
  wishlist: "사고싶음",
  passed: "패스",
};

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
    viewedAt: book.updated_at,
  };
}

function groupByCategory(books: BookRow[]): CategoryGroup[] {
  const grouped = new Map<string, BookRow[]>();
  for (const book of books) {
    const key = simplifyCategoryName(book.category_name) ?? "미분류";
    const existing = grouped.get(key);
    if (existing) {
      existing.push(book);
    } else {
      grouped.set(key, [book]);
    }
  }
  return Array.from(grouped.entries()).map(([categoryName, groupBooks]) => ({
    categoryName,
    books: groupBooks,
  }));
}

function sortBooks(books: BookRow[], sortBy: SortBy): BookRow[] {
  const sorted = [...books];
  if (sortBy === "rating") {
    sorted.sort(
      (a, b) => (b.customer_review_rank ?? -1) - (a.customer_review_rank ?? -1)
    );
  } else if (sortBy === "title") {
    sorted.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "ko"));
  } else {
    sorted.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }
  return sorted;
}

function sortGroups(groups: CategoryGroup[], sortBy: SortBy): CategoryGroup[] {
  const withSortedBooks = groups.map((group) => ({
    ...group,
    books: sortBooks(group.books, sortBy),
  }));

  if (sortBy === "title") {
    withSortedBooks.sort((a, b) => a.categoryName.localeCompare(b.categoryName, "ko"));
  } else if (sortBy === "rating") {
    withSortedBooks.sort(
      (a, b) =>
        (b.books[0]?.customer_review_rank ?? -1) -
        (a.books[0]?.customer_review_rank ?? -1)
    );
  } else {
    withSortedBooks.sort(
      (a, b) =>
        new Date(b.books[0]?.updated_at ?? 0).getTime() -
        new Date(a.books[0]?.updated_at ?? 0).getTime()
    );
  }
  return withSortedBooks;
}

export default function BooksPage() {
  const [allBooks, setAllBooks] = useState<BookRow[] | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookStatus | "전체">("전체");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  useEffect(() => {
    fetch("/api/books")
      .then(async (res) => {
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
        if (!res.ok) throw new Error(GENERAL_ERROR);
        const data = await res.json();
        const flat = (data.categories ?? []).flatMap(
          (group: CategoryGroup) => group.books
        );
        setAllBooks(flat);
      })
      .catch(() => setError(GENERAL_ERROR));
  }, []);

  const categoryOptions = useMemo(() => {
    if (!allBooks) return [];
    return groupByCategory(allBooks).map((g) => g.categoryName);
  }, [allBooks]);

  const statusCounts = useMemo(() => {
    const counts: Record<BookStatus, number> = { wishlist: 0, passed: 0 };
    for (const book of allBooks ?? []) {
      counts[book.status] += 1;
    }
    return counts;
  }, [allBooks]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    categoryFilter !== "전체" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    statusFilter !== "전체";

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("전체");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("전체");
  }

  const filteredCategories = useMemo(() => {
    if (!allBooks) return null;

    const query = searchQuery.trim().toLowerCase();
    const filtered = allBooks.filter((book) => {
      if (
        query &&
        !book.title?.toLowerCase().includes(query) &&
        !book.author?.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (
        categoryFilter !== "전체" &&
        (simplifyCategoryName(book.category_name) ?? "미분류") !== categoryFilter
      ) {
        return false;
      }
      if (statusFilter !== "전체" && book.status !== statusFilter) {
        return false;
      }
      const viewedDate = book.updated_at.slice(0, 10);
      if (dateFrom && viewedDate < dateFrom) return false;
      if (dateTo && viewedDate > dateTo) return false;
      return true;
    });

    return sortGroups(groupByCategory(filtered), sortBy);
  }, [allBooks, searchQuery, categoryFilter, dateFrom, dateTo, statusFilter, sortBy]);

  const totalCount = allBooks?.length ?? 0;
  const filteredCount =
    filteredCategories?.reduce((sum, group) => sum + group.books.length, 0) ?? 0;

  async function handleDelete(bookId: string) {
    if (!window.confirm("이 책을 목록에서 삭제할까요?")) return;

    const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(GENERAL_ERROR);
      return;
    }

    setAllBooks((prev) => prev?.filter((b) => b.id !== bookId) ?? null);
    setSelectedBook((prev) => (prev?.id === bookId ? null : prev));
  }

  async function handleStatusChange(bookId: string, status: BookStatus) {
    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError(GENERAL_ERROR);
      return;
    }

    setAllBooks(
      (prev) => prev?.map((b) => (b.id === bookId ? { ...b, status } : b)) ?? null
    );
    setSelectedBook((prev) => (prev?.id === bookId ? { ...prev, status } : prev));
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <TopNav
        primaryHref="/"
        primaryLabel="+ 새로 업로드"
        maxWidthClassName="max-w-4xl"
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        {error && (
          <div className="rounded-lg border border-red-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span aria-hidden>⚠</span>
              {error}
            </p>
          </div>
        )}

        {!error && needsLogin && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium text-neutral-900">
              로그인이 필요한 화면이에요
            </p>
            <p className="text-sm text-neutral-500">
              내 목록을 보려면 먼저 로그인해주세요
            </p>
            <div className="mt-2 flex gap-2">
              <Link
                href="/login?redirect=/books"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                로그인
              </Link>
              <Link
                href="/signup?redirect=/books"
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                회원가입
              </Link>
            </div>
          </div>
        )}

        {!error && !needsLogin && selectedBook && (
          <div className="flex flex-col gap-6">
            <button
              onClick={() => setSelectedBook(null)}
              className="w-fit text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← 목록으로
            </button>
            <BookDetailView
              detail={bookToDetail(selectedBook)}
              status={selectedBook.status}
              onStatusChange={(status) => handleStatusChange(selectedBook.id, status)}
            />
          </div>
        )}

        {!error && !needsLogin && !selectedBook && allBooks && allBooks.length === 0 && (
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

        {!error && !needsLogin && !selectedBook && allBooks && allBooks.length > 0 && (
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-neutral-900">
              내 책 목록 ({totalCount})
            </h1>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("전체")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === "전체"
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                전체 ({totalCount})
              </button>
              {(Object.entries(STATUS_FILTER_LABELS) as [BookStatus, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      statusFilter === value
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {label} ({statusCounts[value]})
                  </button>
                )
              )}
            </div>

            <div className="relative">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="absolute -top-7 right-0 whitespace-nowrap text-sm font-medium text-neutral-600 underline hover:text-neutral-900"
                >
                  필터 초기화
                </button>
              )}

              <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목·저자 검색"
                    className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </div>

                <div className="flex flex-nowrap items-center justify-center gap-4 overflow-x-auto pb-1">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="전체">카테고리 전체</option>
                  {categoryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                <DateRangePicker
                  from={dateFrom}
                  to={dateTo}
                  onChange={(from, to) => {
                    setDateFrom(from);
                    setDateTo(to);
                  }}
                />

                <div className="flex shrink-0 overflow-hidden rounded-md border border-neutral-300 text-sm">
                  {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(
                    ([value, label], i) => (
                      <button
                        key={value}
                        onClick={() => setSortBy(value)}
                        className={`whitespace-nowrap px-3 py-2 font-medium transition-colors ${
                          sortBy === value
                            ? "bg-neutral-900 text-white"
                            : "bg-white text-neutral-600 hover:bg-neutral-100"
                        } ${i > 0 ? "border-l border-neutral-300" : ""}`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
                </div>

                {hasActiveFilters && (
                  <p className="text-xs text-neutral-500">
                    필터 결과: {filteredCount}권 / 전체 {totalCount}권
                  </p>
                )}
              </div>
            </div>

            {filteredCategories && filteredCategories.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-medium text-neutral-900">
                  조건에 맞는 책이 없어요
                </p>
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-neutral-600 underline hover:text-neutral-900"
                >
                  필터 초기화
                </button>
              </div>
            )}

            {filteredCategories?.map((group) => (
              <section key={group.categoryName} className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-neutral-900">
                  {group.categoryName} ({group.books.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {group.books.map((book) => (
                    <div
                      key={book.id}
                      className="relative rounded-lg border border-neutral-200 bg-white p-2 transition-colors hover:border-neutral-400"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(book.id);
                        }}
                        aria-label="삭제"
                        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs text-neutral-500 hover:border-neutral-500 hover:text-neutral-900"
                      >
                        ×
                      </button>
                      <button
                        onClick={() => setSelectedBook(book)}
                        className="flex w-full flex-col gap-2 text-left"
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
                        <ViewedDate date={book.updated_at} />
                      </button>
                      <StatusToggle
                        compact
                        status={book.status}
                        onChange={(status) => handleStatusChange(book.id, status)}
                      />
                    </div>
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
