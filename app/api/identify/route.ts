import { NextRequest, NextResponse } from "next/server";
import { identifyBook, VisionRecognitionError } from "@/lib/vision";

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");

  if (!(file instanceof Blob) || !ALLOWED_MEDIA_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_TYPES)[number])) {
    return NextResponse.json(
      { error: "표지를 인식하지 못했어요, 다시 시도해주세요" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await identifyBook(
      buffer.toString("base64"),
      file.type as (typeof ALLOWED_MEDIA_TYPES)[number]
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VisionRecognitionError) {
      return NextResponse.json(
        { error: "표지를 인식하지 못했어요, 다시 시도해주세요" },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "일시적인 오류가 발생했어요, 다시 시도해주세요" },
      { status: 500 }
    );
  }
}
