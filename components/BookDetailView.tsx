import type { BookDetailViewData } from "@/lib/types";

export function StarRating({ rating }: { rating: number }) {
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

export function BookDetailView({
  detail,
  showSavedNote = false,
}: {
  detail: BookDetailViewData;
  showSavedNote?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={detail.cover ?? ""}
          alt={detail.title}
          className="aspect-[3/4] w-24 rounded-md border border-neutral-200 object-cover"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium text-neutral-900">
            {detail.title}
          </h2>
          {detail.author && (
            <p className="text-sm text-neutral-500">{detail.author} 지음</p>
          )}
          {detail.customerReviewRank !== null && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={detail.customerReviewRank} />
              {detail.ratingCount !== null && (
                <span className="text-xs text-neutral-500">
                  (알라딘 리뷰 {detail.ratingCount}건)
                </span>
              )}
            </div>
          )}
          {detail.categoryName && (
            <span className="mt-1 w-fit rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-600">
              {detail.categoryName}
            </span>
          )}
        </div>
      </div>

      {showSavedNote && (
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
            href={detail.kyoboSearchUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            교보문고에서 검색 →
          </a>
          <a
            href={detail.yes24SearchUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            YES24에서 검색 →
          </a>
        </div>
      </div>
    </div>
  );
}
