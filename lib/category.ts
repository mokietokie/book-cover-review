/**
 * 알라딘 categoryName(가장 구체적인 리프 카테고리, 예: "국내도서>소설/시/희곡>일본소설>1950년대 이후 일본소설")을
 * 리프 바로 상위 1단계("일본소설")로 줄여서 표시/그룹핑용으로 쓴다.
 * 알라딘이 제공하는 카테고리 계층에서 한 단계를 고르는 것일 뿐, 자체 재분류는 아니다.
 */
export function simplifyCategoryName(categoryName: string | null | undefined): string | null {
  if (!categoryName) return categoryName ?? null;
  const parts = categoryName.split(">").filter(Boolean);
  if (parts.length === 0) return categoryName;
  if (parts.length <= 2) return parts[parts.length - 1];
  return parts[parts.length - 2];
}
