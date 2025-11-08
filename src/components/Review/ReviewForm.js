import { useState } from 'react';

export default function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, title, content });
    setTitle('');
    setContent('');
    setRating(5);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded p-3 mb-4">
      <h5 className="mb-3">Viết đánh giá</h5>
      
      <div className="mb-3">
        <label className="d-block mb-2">Đánh giá</label>
        <div className="btn-group">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              className={`btn ${rating === r ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setRating(r)}
            >
              {r} ⭐
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Tiêu đề</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề đánh giá..."
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Nội dung</label>
        <textarea
          className="form-control"
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Gửi đánh giá
      </button>
    </form>
  );
}