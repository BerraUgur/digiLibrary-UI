import './BookDetailSkeleton.css';

function BookDetailSkeleton() {
  return (
    <div className="book-detail-skeleton">
      <div className="skeleton-breadcrumb skeleton-shimmer"></div>

      <div className="book-detail-skeleton-main">
        <div className="skeleton-book-image skeleton-shimmer"></div>

        <div className="skeleton-book-info">
          <div className="skeleton-title skeleton-shimmer"></div>
          <div className="skeleton-title-short skeleton-shimmer"></div>
          <div className="skeleton-author skeleton-shimmer"></div>
          <div className="skeleton-divider"></div>

          <div className="skeleton-meta-row">
            <div className="skeleton-label skeleton-shimmer"></div>
            <div className="skeleton-value skeleton-shimmer"></div>
          </div>
          <div className="skeleton-meta-row">
            <div className="skeleton-label skeleton-shimmer"></div>
            <div className="skeleton-value skeleton-shimmer"></div>
          </div>
          <div className="skeleton-meta-row">
            <div className="skeleton-label skeleton-shimmer"></div>
            <div className="skeleton-value skeleton-shimmer"></div>
          </div>

          <div className="skeleton-actions">
            <div className="skeleton-button-large skeleton-shimmer"></div>
            <div className="skeleton-button-icon skeleton-shimmer"></div>
          </div>
        </div>
      </div>

      <div className="skeleton-description-section">
        <div className="skeleton-section-title skeleton-shimmer"></div>
        <div className="skeleton-description-line skeleton-shimmer"></div>
        <div className="skeleton-description-line skeleton-shimmer"></div>
        <div className="skeleton-description-line-short skeleton-shimmer"></div>
      </div>

      <div className="skeleton-reviews-section">
        <div className="skeleton-section-title skeleton-shimmer"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-review-card skeleton-shimmer">
            <div className="skeleton-review-header">
              <div className="skeleton-review-user skeleton-shimmer"></div>
              <div className="skeleton-review-rating skeleton-shimmer"></div>
            </div>
            <div className="skeleton-review-text skeleton-shimmer"></div>
            <div className="skeleton-review-text-short skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookDetailSkeleton;
