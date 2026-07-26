export interface AladinReview {
  title: string;
  content: string;
}

export interface BookDetailViewData {
  title: string;
  author: string | null;
  cover: string | null;
  categoryName: string | null;
  publisher: string | null;
  pubDate: string | null;
  description: string | null;
  aladinProductUrl: string | null;
  customerReviewRank: number | null;
  ratingCount: number | null;
  commentReviewCount: number | null;
  myReviewCount: number | null;
  reviews: AladinReview[];
  kyoboSearchUrl: string | null;
  yes24SearchUrl: string | null;
  viewedAt: string | null;
}
