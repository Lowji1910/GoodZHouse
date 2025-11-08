import { useState } from 'react';

export default function StarFilter({ onFilterChange }) {
  const [selected, setSelected] = useState(0);

  const handleClick = (stars) => {
    const newValue = selected === stars ? 0 : stars;
    setSelected(newValue);
    onFilterChange(newValue);
  };

  return (
    <div className="mb-3">
      <div className="d-flex gap-2 flex-wrap">
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            className={`btn ${selected === stars ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleClick(stars)}
          >
            {stars} ⭐ {selected === stars && '✓'}
          </button>
        ))}
      </div>
    </div>
  );
}