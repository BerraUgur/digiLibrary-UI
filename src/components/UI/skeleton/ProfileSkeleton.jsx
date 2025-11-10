import './ProfileSkeleton.css';

function ProfileSkeleton() {
  return (
    <div className="profile-skeleton">
      <div className="profile-skeleton-header skeleton-shimmer">
        <div className="skeleton-avatar skeleton-shimmer"></div>
        <div className="skeleton-info">
          <div className="skeleton-name skeleton-shimmer"></div>
          <div className="skeleton-email skeleton-shimmer"></div>
        </div>
      </div>

      <div className="profile-skeleton-stats">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-stat-card skeleton-shimmer">
            <div className="skeleton-stat-title skeleton-shimmer"></div>
            <div className="skeleton-stat-value skeleton-shimmer"></div>
          </div>
        ))}
      </div>

      <div className="profile-skeleton-details">
        <div className="skeleton-detail-row skeleton-shimmer"></div>
        <div className="skeleton-detail-row skeleton-shimmer"></div>
        <div className="skeleton-detail-row skeleton-shimmer"></div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
