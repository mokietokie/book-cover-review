export interface AladinReview {
  title: string;
  content: string;
}

export interface BookDetailViewData {
  title: string;
  author: string | null;
  cover: string | null;
  categoryName: string | null;
  customerReviewRank: number | null;
  ratingCount: number | null;
  reviews: AladinReview[];
  kyoboSearchUrl: string | null;
  yes24SearchUrl: string | null;
}
