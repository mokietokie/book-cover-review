import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const GENERAL_ERROR = { error: "일시적인 오류가 발생했어요, 다시 시도해주세요" };

interface BookRow {
  id: string;
  category_name: string | null;
  [key: string]: unknown;
}

export async function GET() {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("category_name", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(GENERAL_ERROR, { status: 500 });
  }

  const grouped = new Map<string, BookRow[]>();
  for (const book of (data ?? []) as BookRow[]) {
    const key = book.category_name ?? "미분류";
    const existing = grouped.get(key);
    if (existing) {
      existing.push(book);
    } else {
      grouped.set(key, [book]);
    }
  }

  const categories = Array.from(grouped.entries())
    .map(([categoryName, books]) => ({ categoryName, books }))
    .sort((a, b) => b.books.length - a.books.length);

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json(GENERAL_ERROR, { status: 400 });
  }

  const kyoboSearchUrl = `https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent(title)}`;
  const yes24SearchUrl = `https://www.yes24.com/product/search?query=${encodeURIComponent(title)}`;

  const { data, error } = await supabase
    .from("books")
    .insert({
      image_url: typeof body.imageUrl === "string" ? body.imageUrl : null,
      title,
      author: typeof body.author === "string" ? body.author : null,
      isbn: typeof body.isbn === "string" ? body.isbn : null,
      aladin_item_id:
        typeof body.aladinItemId === "string" ? body.aladinItemId : null,
      category_name:
        typeof body.categoryName === "string" ? body.categoryName : null,
      cover_url: typeof body.coverUrl === "string" ? body.coverUrl : null,
      customer_review_rank:
        typeof body.customerReviewRank === "number"
          ? body.customerReviewRank
          : null,
      reviews: body.reviews ?? null,
      kyobo_search_url: kyoboSearchUrl,
      yes24_search_url: yes24SearchUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(GENERAL_ERROR, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
