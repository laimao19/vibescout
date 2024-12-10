import React from 'react';
import { MapPin } from 'lucide-react';

const RecommendationCard = ({ place }) => {
  const matchScore = place.similarity_score * 100;
  const vibeMatch = place.category_scores?.sentiment?.average * 100 || 0;
  const atmosphere = place.metadata?.emotional_score * 100 || 0;

  return (
    <div className="simple-card">
      <h3 className="simple-card-title">{place.name}</h3>
      <p className="simple-card-subtitle flex items-center gap-2">
        <MapPin size={14} className="flex-shrink-0" />
        {place.address}
      </p>
      
      <div className="simple-card-metric">
        <span className="simple-card-metric-label">Music Match:</span>
        <span className="simple-card-metric-value">
          {matchScore.toFixed(1)}%
        </span>
      </div>
      
      <div className="simple-card-metric">
        <span className="simple-card-metric-label">Crowd Vibe:</span>
        <span className="simple-card-metric-value">
          {vibeMatch < 30 ? 'Chill' : vibeMatch < 70 ? 'Balanced' : 'Lively'}
        </span>
      </div>
      
      <div className="simple-card-metric">
        <span className="simple-card-metric-label">Overall Mood:</span>
        <span className="simple-card-metric-value">
          {atmosphere < 30 ? 'Relaxed' : atmosphere < 70 ? 'Upbeat' : 'Energetic'}
        </span>
      </div>

      {Array.isArray(place.types) && place.types.length > 0 ? (
  <div className="flex flex-wrap gap-2 mt-4">
    {place.types.map((type, index) => (
      <span
        key={index}
        className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs"
      >
        {type.replace(/_/g, ' ')} {/* Replace underscores with spaces */}
      </span>
    ))}
  </div>
) : (
  place.types && (
    <p className="text-gray-300 mt-4 text-sm">
      {place.types.replace(/_/g, ' ')} {/* Handle as a single string */}
    </p>
  )
)}

    </div>
  );
};

export default RecommendationCard;