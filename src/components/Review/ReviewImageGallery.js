export default function ReviewImageGallery({ images }) {
  if (!images?.length) return null;

  return (
    <div className="review-images mb-3">
      <div className="row g-2">
        {images.map((img, i) => (
          <div key={i} className="col-auto">
            <img
              src={img}
              alt={`#${i + 1}`}
              className="rounded"
              style={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                cursor: 'pointer'
              }}
              data-bs-toggle="modal"
              data-bs-target="#reviewImageModal"
              onClick={() => {
                // TODO: Open image in modal/lightbox
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}