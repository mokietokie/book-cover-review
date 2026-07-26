import type { BookDetailViewData } from "@/lib/types";
import { ViewedDate } from "@/components/ViewedDate";
import { simplifyCategoryName } from "@/lib/category";

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

function ReviewStatTiles({
  ratingCount,
  commentReviewCount,
  myReviewCount,
  productUrl,
}: {
  ratingCount: number | null;
  commentReviewCount: number | null;
  myReviewCount: number | null;
  productUrl: string | null;
}) {
  const stats = [
    { label: "평점 참여", value: ratingCount, clickable: false },
    { label: "한줄 리뷰", value: commentReviewCount, clickable: Boolean(productUrl) },
    { label: "마이리뷰", value: myReviewCount, clickable: Boolean(productUrl) },
  ];

  if (stats.every((stat) => !stat.value)) {
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Tag = stat.clickable ? "a" : "div";
          return (
            <Tag
              key={stat.label}
              {...(stat.clickable
                ? { href: productUrl!, target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white py-4 text-center ${
                stat.clickable ? "transition-colors hover:border-neutral-400" : ""
              }`}
            >
              <span className="text-2xl font-semibold text-neutral-900">
                {(stat.value ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-neutral-500">{stat.label}</span>
            </Tag>
          );
        })}
      </div>
      {productUrl && (
        <p className="mt-2 text-xs text-neutral-400">
          한줄 리뷰 · 마이리뷰를 누르면 알라딘 리뷰 페이지로 이동해요.
        </p>
      )}
    </div>
  );
}

function ReviewCards({
  reviews,
  productUrl,
}: {
  reviews: BookDetailViewData["reviews"];
  productUrl: string | null;
}) {
  const CardTag = productUrl ? "a" : "div";
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {reviews.map((review, index) => (
        <CardTag
          key={index}
          {...(productUrl
            ? { href: productUrl, target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
              {index + 1}
            </span>
            {review.title && (
              <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                {review.title}
              </p>
            )}
          </div>
          {review.content && (
            <p className="line-clamp-3 text-sm text-neutral-600">
              {review.content}
            </p>
          )}
        </CardTag>
      ))}
    </div>
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
          {(detail.publisher || detail.pubDate) && (
            <p className="text-xs text-neutral-400">
              {[detail.publisher, detail.pubDate].filter(Boolean).join(" · ")}
            </p>
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
              {simplifyCategoryName(detail.categoryName)}
            </span>
          )}
        </div>
      </div>

      {(showSavedNote || detail.viewedAt) && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {showSavedNote && <span>✓ 내 목록에 저장됨</span>}
          {detail.viewedAt && <ViewedDate date={detail.viewedAt} />}
        </div>
      )}

      {detail.description && (
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="mb-2 text-lg font-medium text-neutral-900">
            책 소개
          </h3>
          <p className="whitespace-pre-line text-sm text-neutral-700">
            {detail.description}
          </p>
        </div>
      )}

      <div className="border-t border-neutral-200 pt-4">
        <h3 className="mb-2 text-lg font-medium text-neutral-900">
          리뷰 참여 현황
        </h3>
        <ReviewStatTiles
          ratingCount={detail.ratingCount}
          commentReviewCount={detail.commentReviewCount}
          myReviewCount={detail.myReviewCount}
          productUrl={detail.aladinProductUrl}
        />
      </div>

      <div className="border-t border-neutral-200 pt-4">
        <h3 className="mb-2 text-lg font-medium text-neutral-900">
          알라딘 리뷰
        </h3>
        {detail.reviews.length > 0 ? (
          <ReviewCards reviews={detail.reviews} productUrl={detail.aladinProductUrl} />
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
