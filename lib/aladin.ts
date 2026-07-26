import "server-only";

const BASE_URL = "https://www.aladin.co.kr/ttb/api";

function getTtbKey(): string {
  const key = process.env.ALADIN_TTBKEY;
  if (!key) {
    throw new Error("Missing ALADIN_TTBKEY env var");
  }
  return key;
}

export interface AladinSearchItem {
  title: string;
  author: string;
  isbn13: string;
  cover: string;
  categoryName: string;
}

export interface AladinReview {
  title: string;
  content: string;
}

export interface AladinBookDetail {
  title: string;
  author: string;
  isbn13: string;
  cover: string;
  categoryName: string;
  customerReviewRank: number;
  reviews: AladinReview[];
}

export async function searchBooks(query: string): Promise<AladinSearchItem[]> {
  const url = new URL(`${BASE_URL}/ItemSearch.aspx`);
  url.searchParams.set("ttbkey", getTtbKey());
  url.searchParams.set("Query", query);
  url.searchParams.set("QueryType", "Keyword");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Aladin ItemSearch failed: ${res.status}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.item) ? data.item : [];

  return items.map((item: Record<string, unknown>) => ({
    title: String(item.title ?? ""),
    author: String(item.author ?? ""),
    isbn13: String(item.isbn13 ?? ""),
    cover: String(item.cover ?? ""),
    categoryName: String(item.categoryName ?? ""),
  }));
}

export async function lookupBook(isbn13: string): Promise<AladinBookDetail | null> {
  const url = new URL(`${BASE_URL}/ItemLookUp.aspx`);
  url.searchParams.set("ttbkey", getTtbKey());
  url.searchParams.set("itemIdType", "ISBN13");
  url.searchParams.set("ItemId", isbn13);
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");
  url.searchParams.set("OptResult", "reviewList");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Aladin ItemLookUp failed: ${res.status}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.item) ? data.item : [];
  const item = items[0];
  if (!item) {
    return null;
  }

  const reviewList = Array.isArray(item.subInfo?.reviewList)
    ? item.subInfo.reviewList
    : [];

  return {
    title: String(item.title ?? ""),
    author: String(item.author ?? ""),
    isbn13: String(item.isbn13 ?? ""),
    cover: String(item.cover ?? ""),
    categoryName: String(item.categoryName ?? ""),
    customerReviewRank: Number(item.customerReviewRank ?? 0),
    reviews: reviewList.map((r: Record<string, unknown>) => ({
      title: String(r.title ?? ""),
      content: String(r.content ?? ""),
    })),
  };
}
