import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/aladin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title : "";
  const author = typeof body?.author === "string" ? body.author : "";
  const query = [title, author].filter(Boolean).join(" ").trim();

  if (!query) {
    return NextResponse.json(
      { error: "알라딘에서 이 책을 찾지 못했어요" },
      { status: 400 }
    );
  }

  try {
    const results = await searchBooks(query);
    if (results.length === 0) {
      return NextResponse.json(
        { error: "알라딘에서 이 책을 찾지 못했어요" },
        { status: 404 }
      );
    }
    return NextResponse.json(results[0]);
  } catch {
    return NextResponse.json(
      { error: "일시적인 오류가 발생했어요, 다시 시도해주세요" },
      { status: 500 }
    );
  }
}
