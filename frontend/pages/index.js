import React, { useEffect, useState } from 'react';
import { fetchGoogleReviews, fetchPlaceSuggestions, fetchNearbyPlaces, fetchContentBasedRecommendations } from '../services/api';
import BarChart from '../components/BarChart';
import dynamic from 'next/dynamic';
import MusicProfile from '../components/MusicProfile';

const WordCloudComponent = dynamic(() => import('../components/WordCloud'), { ssr: false });
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [placeId, setPlaceId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [placeAttributes, setPlaceAttributes] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [userPreferences, setUserPreferences] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  }, []);

  const loadReviews = async () => {
    if (placeId) {
      setIsLoading(true);
      try {
        const data = await fetchGoogleReviews(placeId);
        const reviewArray = Array.isArray(data) ? data : [];
        setReviews(reviewArray);
        const attributes = analyzePlaceAttributesFromReviews(reviewArray);
        setPlaceAttributes(attributes);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const analyzePlaceAttributesFromReviews = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return {
        valence: 0,
        energy: 0,
        loudness: 0,
        ambiance: 0,
        liveness: 0,
      };
    }

    let valenceSum = 0;
    let energySum = 0;
    let loudnessSum = 0;
    let ambianceSum = 0;
    let livenessSum = 0;
    const reviewCount = reviews.length;

    reviews.forEach((review) => {
      const sentimentScore = review.sentiment || 0.5;
      const reviewLength = review.text?.length || 0;
      valenceSum += sentimentScore;
      energySum += Math.min(reviewLength / 100, 1);
      loudnessSum += Math.abs(sentimentScore - 0.5) * 2;
      ambianceSum += sentimentScore > 0.5 ? 0.7 : 0.3;
      livenessSum += (Math.random() * 0.5) + (sentimentScore > 0.5 ? 0.5 : 0);
    });

    return {
      valence: reviewCount ? valenceSum / reviewCount : 0,
      energy: reviewCount ? energySum / reviewCount : 0,
      loudness: reviewCount ? loudnessSum / reviewCount : 0,
      ambiance: reviewCount ? ambianceSum / reviewCount : 0,
      liveness: reviewCount ? livenessSum / reviewCount : 0,
    };
  };

  const handleInputChange = async (e) => {
    setQuery(e.target.value);
    if (e.target.value) {
      const places = await fetchPlaceSuggestions(e.target.value);
      setSuggestions(places);
    } else {
      setSuggestions([]);
    }
  };

  const handlePlaceSelect = (place) => {
    setPlaceId(place.place_id);
    setQuery(place.description);
    setSuggestions([]);
    setPlaceAttributes({});
  };

  const fetchRecommendations = async (radius) => {
    if (userLocation) {
      setIsLoading(true);
      try {
        const nearbyPlaces = await fetchNearbyPlaces(userLocation, radius);
        if (nearbyPlaces.length > 0) {
          const recommendations = await fetchContentBasedRecommendations(userPreferences, nearbyPlaces);
          setRecommendations(recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const prepareWordCloudData = () => {
    const wordFrequency = reviews.flatMap((review) => {
      const keywords = review.keywords || [];
      return keywords.map(keyword => ({
        word: keyword,
        sentiment: review.sentiment || 0.5
      }));
    }).reduce((acc, { word, sentiment }) => {
      if (!acc[word]) {
        acc[word] = { count: 0, totalSentiment: 0 };
      }
      acc[word].count += 1;
      acc[word].totalSentiment += sentiment;
      return acc;
    }, {});

    return Object.entries(wordFrequency)
      .filter(([_, { count }]) => count >= 1)
      .map(([text, { count, totalSentiment }]) => ({
        text,
        value: count,
        sentiment: totalSentiment / count,
        originalValue: count
      }));
  };

  const markers = recommendations.map((place) => ({
    lat: place.lat,
    lng: place.lng,
    name: place.name,
  }));

  const userPreferencesData = [
    userPreferences.valence || 0,
    userPreferences.energy || 0,
    userPreferences.loudness || 0,
    userPreferences.ambiance || 0,
    userPreferences.liveness || 0,
  ];

  const placeFeatures = [
    placeAttributes.valence || 0,
    placeAttributes.energy || 0,
    placeAttributes.loudness || 0,
    placeAttributes.ambiance || 0,
    placeAttributes.liveness || 0,
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">VibeScout</h1>
      
      <div className="max-w-2xl mx-auto mb-8">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for a place..."
          className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {suggestions.length > 0 && (
          <ul className="mt-2 border rounded-lg shadow-sm max-h-60 overflow-y-auto bg-white">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handlePlaceSelect(suggestion)}
                className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                {suggestion.description}
              </li>
            ))}
          </ul>
        )}
        
        <button
          onClick={loadReviews}
          disabled={!placeId || isLoading}
          className="mt-4 w-full bg-blue-500 text-white p-4 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Load Reviews'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Your Music Profile</h2>
          <MusicProfile setUserPreferences={setUserPreferences} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Profile Comparison</h2>
          <BarChart userData={userPreferencesData} placeData={placeFeatures} />
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Review Analysis</h2>
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Word Cloud</h3>
            <WordCloudComponent words={prepareWordCloudData()} reviews={reviews} />
          </div>
          
          <h3 className="text-xl font-bold mb-4">Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="font-bold mr-2">Rating:</span> 
                  <span className="text-yellow-500">{review.rating} ⭐</span>
                </div>
                <p className="mb-2">{review.text}</p>
                <div className="text-sm text-gray-600">
                  <p>Sentiment: {review.sentiment?.toFixed(2)}</p>
                  <p>Keywords: {review.keywords?.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userLocation && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
          <div className="flex gap-4 mb-6">
            {[5, 10, 15].map((radius) => (
              <button
                key={radius}
                onClick={() => fetchRecommendations(radius)}
                disabled={isLoading}
                className="flex-1 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
              >
                {radius} miles
              </button>
            ))}
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Map View</h3>
            <div className="h-96">
              <Map center={userLocation} markers={markers} />
            </div>
          </div>

          {recommendations.length > 0 ? (
  <div className="grid gap-4">
    {recommendations.map((place, index) => (
      <div key={index} className="border rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2">{place.name}</h3>
        <p className="text-gray-600 mb-2">
          Similarity Score: {place.similarity_score.toFixed(2)}
          <span className="ml-2">
            {[...Array(Math.round(place.star_rating || 0))].map((_, i) => (
              <span key={i} className="text-yellow-400">★</span>
            ))}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Sentiment: {
            place.category_scores?.sentiment?.average 
              ? place.category_scores.sentiment.average.toFixed(2) 
              : 'N/A'
          }</div>
          <div>Variance: {
            place.category_scores?.sentiment?.variance 
              ? place.category_scores.sentiment.variance.toFixed(2) 
              : 'N/A'
          }</div>
          <div>Review Quality: {
            place.category_scores?.review_quality?.average_length 
              ? place.category_scores.review_quality.average_length.toFixed(2) 
              : 'N/A'
          }</div>
          <div>Review Count: {
            place.category_scores?.review_quality?.review_count || 'N/A'
          }</div>
        </div>
        {place.category_scores?.keywords && place.category_scores.keywords.length > 0 && (
          <div className="mt-2">
            <p className="font-medium">Key Phrases:</p>
            <div className="flex flex-wrap gap-2">
              {place.category_scores.keywords.map((keyword, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {keyword.word}
                </span>
              ))}
            </div>
          </div>
        )}
        {place.address && (
          <p className="mt-2 text-gray-600 text-sm">
            📍 {place.address}
          </p>
        )}
      </div>
    ))}
  </div>
) : (
  <p className="text-center text-gray-600">
    No recommendations found. Try a different radius or update your preferences.
  </p>
          )}
        </div>
      )}
    </div>
  );
}