import React, { useEffect, useState } from 'react';
import { fetchGoogleReviews, fetchPlaceSuggestions, fetchNearbyPlaces, fetchContentBasedRecommendations } from '../services/api';
import BarChart from '../components/BarChart';
import dynamic from 'next/dynamic';
import MusicProfile from '../components/MusicProfile';
import DistanceSlider from '../components/DistanceSlider';
import RecommendationCard from '../components/RecommendationCard';
import { MapPin } from 'lucide-react';

const WordCloudComponent = dynamic(() => import('../components/WordCloud'), { ssr: false });
const Map = dynamic(() => import('../components/Map'), { ssr: false });

// Constants for distance settings
const MAX_DISTANCE_MILES = 30; // ~48 km, just under Google's 50km limit
const DEFAULT_DISTANCE_MILES = 5;

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
  const [distance, setDistance] = useState(DEFAULT_DISTANCE_MILES);
  const [error, setError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Successfully got user location:', coordinates);
          setUserLocation(coordinates);
          setError('');
        },
        (error) => {
          console.error('Error getting user location:', {
            code: error.code,
            message: error.message
          });
          // Set default coordinates for Boston, MA 02215
          const defaultCoordinates = {
            lat: 42.3505,
            lng: -71.1054
          };
          console.log('Using default Boston coordinates:', defaultCoordinates);
          setUserLocation(defaultCoordinates);
          setError('Using default location (Boston, MA)');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const loadReviews = async () => {
    if (!placeId) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await fetchGoogleReviews(placeId);
      const reviewArray = Array.isArray(data) ? data : [];
      setReviews(reviewArray);
      const attributes = analyzePlaceAttributesFromReviews(reviewArray);
      setPlaceAttributes(attributes);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Failed to load reviews');
      setReviews([]);
      setPlaceAttributes({});
    } finally {
      setIsLoading(false);
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
    if (e.target.value.trim()) {
      try {
        const places = await fetchPlaceSuggestions(e.target.value);
        setSuggestions(places || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handlePlaceSelect = (place) => {
    setPlaceId(place.place_id);
    setQuery(place.description);
    setSuggestions([]);
    setPlaceAttributes({});
    setError('');
  };

  const fetchRecommendations = async () => {
    if (!userLocation) {
      setError('Location data is not available');
      return;
    }

    setIsLoading(true);
    setError('');
    console.log(`Fetching recommendations within ${distance} miles of`, userLocation);

    try {
      const nearbyPlaces = await fetchNearbyPlaces(userLocation, distance);
      if (nearbyPlaces && nearbyPlaces.length > 0) {
        const recommendations = await fetchContentBasedRecommendations(userPreferences, nearbyPlaces);
        setRecommendations(recommendations || []);
      } else {
        setRecommendations([]);
        console.log('No places found within the specified radius');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareWordCloudData = () => {
    const wordFrequency = reviews.flatMap((review) => {
      const keywordsString = review.keywords || ''; // Ensure keywords are a string
      const keywordsArray = keywordsString.split(',').map((keyword) => keyword.trim()); // Split by commas and trim whitespace
  
      return keywordsArray.map((keyword) => ({
        word: keyword,
        sentiment: review.sentiment || 0.5,
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
      .filter(([_, { count }]) => count >= 1) // Filter out words with zero occurrences
      .map(([text, { count, totalSentiment }]) => ({
        text,
        value: count,
        sentiment: totalSentiment / count,
        originalValue: count,
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
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12 text-blue-400">VibeScout</h1>

        {error && (
          <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-900/50 text-red-200 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search for a place..."
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => handlePlaceSelect(suggestion)}
                    className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 text-gray-200"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button
            onClick={loadReviews}
            disabled={!placeId || isLoading}
            className="mt-4 w-full bg-blue-600 text-white p-4 rounded-lg disabled:bg-gray-700 disabled:text-gray-400 hover:bg-blue-700 transition-all transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : 'Load Reviews'}
          </button>
        </div>

        {/* Music Profile and Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Your Music Profile</h2>
            <MusicProfile setUserPreferences={setUserPreferences} />
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Profile Comparison</h2>
            <BarChart userData={userPreferencesData} placeData={placeFeatures} />
          </div>
        </div>

        {/* Reviews Analysis Section */}
        {reviews.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white">Review Analysis</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-200">Word Cloud</h3>
              <WordCloudComponent words={prepareWordCloudData()} reviews={reviews} />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4 text-gray-200">Reviews</h3>
              <div className="simple-card-grid">
                {reviews.map((review, index) => (
                  <div key={index} className="simple-card">
                    <div className="flex items-center mb-3">
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-200 mb-4">{review.text}</p>
                   <div className="flex flex-wrap gap-2 mt-2">
                  {review.keywords &&
                    review.keywords
                      .split(',')
                      .map((keyword, kidx) => (
                        <span key={kidx} className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs">
                          {keyword.trim()} {/* Trim whitespace for better display */}
                        </span>
                      ))}
                </div>
                    <div className="mt-3 text-gray-400 text-sm">
                      Sentiment: {review.sentiment?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {userLocation && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white">Recommendations</h2>

            {/* Distance Slider */}
            <DistanceSlider
              distance={distance}
              setDistance={setDistance}
              maxDistance={MAX_DISTANCE_MILES}
            />

            {/* Fetch Recommendations Button */}
            <button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="w-full mb-8 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                 <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : 'Find Recommendations'}
            </button>

            {/* Map View */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-200">Map View</h3>
              <div className="h-96 rounded-lg overflow-hidden">
                <Map center={userLocation} markers={markers} />
              </div>
            </div>

            {/* Recommendations List */}
            {recommendations.length > 0 ? (
              <div className="simple-card-grid">
                {recommendations.map((place, index) => (
                  <RecommendationCard key={index} place={place} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">
                No recommendations found. Try adjusting the distance or updating your preferences.
              </p>
            )}
          </div>
        )}

        {/* Status Message for when userLocation is not available */}
        {!userLocation && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-12">
            <p className="text-gray-400 text-center">
              Waiting for location data... Please make sure location services are enabled in your browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}