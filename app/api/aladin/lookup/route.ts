import { NextRequest, NextResponse } from "next/server";
import { lookupBook } from "@/lib/aladin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const isbn13 = typeof body?.isbn13 === "string" ? body.isbn13 : "";

  if (!isbn13) {
    return NextResponse.json(
      { error: "알라딘에서 이 책을 찾지 못했어요" },
      { status: 400 }
    );
  }

  try {
    const detail = await lookupBook(isbn13);
    if (!detail) {
      return NextResponse.json(
        { error: "알라딘에서 이 책을 찾지 못했어요" },
        { status: 404 }
      );
    }
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json(
      { error: "일시적인 오류가 발생했어요, 다시 시도해주세요" },
      { status: 500 }
    );
  }
}
