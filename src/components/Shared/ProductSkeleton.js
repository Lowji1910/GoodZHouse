export default function ProductSkeleton() {
  return (
    <div className="card h-100 shadow-sm">
      <div className="ratio ratio-1x1 bg-light rounded-top"></div>
      <div className="card-body">
        <div className="placeholder-glow">
          <div className="placeholder col-8 mb-2" style={{ height: 20 }}></div>
          <div className="placeholder col-4" style={{ height: 24 }}></div>
        </div>
      </div>
    </div>
  );
}