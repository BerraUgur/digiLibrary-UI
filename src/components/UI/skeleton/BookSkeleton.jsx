import './BookSkeleton.css';

function BookSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="book-skeleton">
          <div className="book-skeleton-image skeleton-shimmer"></div>
          <div className="book-skeleton-content">
            <div className="skeleton-category skeleton-shimmer"></div>
            <div className="skeleton-title skeleton-shimmer"></div>
            <div className="skeleton-title-short skeleton-shimmer"></div>
            <div className="skeleton-author skeleton-shimmer"></div>
            <div className="skeleton-meta">
              <div className="skeleton-rating skeleton-shimmer"></div>
              <div className="skeleton-status skeleton-shimmer"></div>
            </div>
            <div className="skeleton-button skeleton-shimmer"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export default BookSkeleton;
