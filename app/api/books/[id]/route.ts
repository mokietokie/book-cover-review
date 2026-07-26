import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GENERAL_ERROR = { error: "일시적인 오류가 발생했어요, 다시 시도해주세요" };
const UNAUTHORIZED = { error: "로그인이 필요해요" };
const VALID_STATUSES = ["wishlist", "passed"];

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const { error, count } = await supabase
    .from("books")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(GENERAL_ERROR, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: "책을 찾을 수 없어요" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(GENERAL_ERROR, { status: 400 });
  }

  const { data, error } = await supabase
    .from("books")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "책을 찾을 수 없어요" }, { status: 404 });
    }
    return NextResponse.json(GENERAL_ERROR, { status: 500 });
  }

  return NextResponse.json(data);
}
