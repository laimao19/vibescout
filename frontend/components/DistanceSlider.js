import React from 'react';

const DistanceSlider = ({ distance, setDistance, maxDistance }) => {
  return (
    <div className="distance-slider-container flex flex-col items-center justify-center mx-auto">
      <div className="text-center mb-4">
        <span className="text-lg font-semibold text-white">
          Search Radius
        </span>
        <div className="text-blue-400 font-bold text-lg mt-2">
          {distance} miles {distance === maxDistance ? '(maximum)' : ''}
        </div>
      </div>
      <input
        id="distance-slider"
        type="range"
        min="1"
        max={maxDistance}
        step="1"
        value={distance}
        onChange={(e) => setDistance(parseInt(e.target.value, 10))}
        className="slider-input mt-2"
      />
      <div className="text-gray-400 text-sm mt-2">
        Drag the slider to adjust the search radius
      </div>
    </div>
  );
};

export default DistanceSlider;
