export default function RatingDistribution({ stats }) {
  if (!stats?.distribution) return null;
  
  return (
    <div className="rating-distribution mb-4">
      <h6 className="mb-3">Phân bố đánh giá</h6>
      {stats.distribution.map(({ rating, count, percentage }) => (
        <div key={rating} className="d-flex align-items-center mb-2">
          <div style={{ width: 60 }}>
            {rating} ⭐
          </div>
          <div className="flex-grow-1 px-2">
            <div className="progress" style={{ height: 8 }}>
              <div
                className="progress-bar bg-warning"
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
          <div style={{ width: 100 }} className="text-end text-muted small">
            {count} ({percentage}%)
          </div>
        </div>
      ))}
      <div className="text-muted small mt-2">
        Tổng số {stats.total} đánh giá
      </div>
    </div>
  );
}