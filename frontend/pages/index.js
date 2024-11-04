// frontend/pages/index.js
import React, { useEffect, useState } from 'react';
import { fetchGoogleReviews, fetchSpotifyData, fetchPlaceSuggestions, fetchNearbyPlaces, fetchContentBasedRecommendations } from '../services/api';
import BarChart from '../components/BarChart';
import dynamic from 'next/dynamic';
import Map from '../components/Map';

const WordCloudComponent = dynamic(() => import('../components/WordCloud'), { ssr: false });

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [placeId, setPlaceId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [spotifyData, setSpotifyData] = useState([]);
  const [placeAttributes, setPlaceAttributes] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPreferences, setUserPreferences] = useState({});

  // Check if redirected from Spotify login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spotify_login') === 'success') {
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch Spotify data if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const loadSpotifyData = async () => {
        const data = await fetchSpotifyData();
        setSpotifyData(data);
        setUserPreferences({
          valence: data[0]?.valence || 0.5,
          energy: data[0]?.energy || 0.5,
          loudness: data[0]?.loudness || 0.5,
          ambiance: data[0]?.ambiance || 0.5,
          liveness: data[0]?.liveness || 0.5,
        });
      };
      loadSpotifyData();
    }
  }, [isLoggedIn]);

  // Function to load Google reviews and update place attributes
  const loadReviews = async () => {
    if (placeId) {
      const data = await fetchGoogleReviews(placeId);
      const reviewArray = Array.isArray(data) ? data : [];
      setReviews(reviewArray);

      const attributes = analyzePlaceAttributesFromReviews(reviewArray);
      setPlaceAttributes(attributes);
    }
  };

  const analyzePlaceAttributesFromReviews = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      console.warn("No reviews to analyze for this place.");
      return {
        valence: "No data",
        energy: "No data",
        loudness: "No data",
        ambiance: "No data",
        liveness: "No data",
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
      valence: reviewCount ? valenceSum / reviewCount : 0.5,
      energy: reviewCount ? energySum / reviewCount : 0.5,
      loudness: reviewCount ? loudnessSum / reviewCount : 0.5,
      ambiance: reviewCount ? ambianceSum / reviewCount : 0.5,
      liveness: reviewCount ? livenessSum / reviewCount : 0.5,
    };
  };

  // Handle input changes for autocomplete
  const handleInputChange = async (e) => {
    setQuery(e.target.value);
    if (e.target.value) {
      const places = await fetchPlaceSuggestions(e.target.value);
      setSuggestions(places);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selecting a suggestion
  const handlePlaceSelect = (place) => {
    setPlaceId(place.place_id);
    setQuery(place.description);
    setSuggestions([]);
    setPlaceAttributes({});
  };

  // Spotify login handler
  const handleSpotifyLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/login`;
  };

  // Fetch recommendations within a specified radius using content-based filtering
  const fetchRecommendations = async (radius) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const userCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const nearbyPlaces = await fetchNearbyPlaces(userCoordinates, radius);
        console.log("Nearby places received on frontend:", nearbyPlaces);

        if (nearbyPlaces.length === 0) {
          setRecommendations([]);
          console.log("No places found within the specified radius.");
        } else {
          const recommendations = await fetchContentBasedRecommendations(userPreferences, nearbyPlaces);
          setRecommendations(recommendations);
        }
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  // Prepare data for BarChart
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

  // Prepare words for WordCloudComponent from keywords in reviews, only including words that appear more than five times
  const wordFrequency = reviews.flatMap((review) => review.keywords || []).reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const wordArray = Object.entries(wordFrequency)
    .filter(([_, count]) => count >= 1)  // Only show words that appear more than 5 times
    .map(([text, value]) => ({ text, value }));

  return (
    <div>
      <h1>Search for a Place</h1>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Enter a place name"
      />
      {suggestions.length > 0 && (
        <ul style={{ border: '1px solid #ccc', maxHeight: '200px', overflowY: 'scroll' }}>
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handlePlaceSelect(suggestion)}
              style={{ cursor: 'pointer', padding: '5px' }}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
      <button onClick={loadReviews} disabled={!placeId}>Load Reviews</button>

      <h2>Reviews</h2>
      <ul>
        {reviews.map((review, index) => (
          <li key={index}>
            <p>Rating: {review.rating} - {review.text}</p>
            <p>Sentiment: {review.sentiment?.toFixed(2)}</p>
            <p>Keywords: {review.keywords?.join(", ")}</p>
          </li>
        ))}
      </ul>

      <h1>Your Spotify Vibe</h1>
      {!isLoggedIn ? (
        <button onClick={handleSpotifyLogin}>Login with Spotify</button>
      ) : (
        <ul>
          {spotifyData.map((track, index) => (
            <li key={index}>
              <strong>{track.track_name}</strong> by {track.artist}
              <ul>
                <li>Valence: {track.valence}</li>
                <li>Energy: {track.energy}</li>
                <li>Loudness: {track.loudness}</li>
                <li>Ambiance: {track.ambiance}</li>
                <li>Liveness: {track.liveness}</li>
              </ul>
            </li>
          ))}
        </ul>
      )}

      <h2>Word Cloud of Review Keywords</h2>
      <WordCloudComponent words={wordArray} />

      <h2>User Preferences vs. Place Features</h2>
      <BarChart userData={userPreferencesData} placeData={placeFeatures} />

      <h2>Map of Recommended Places</h2>
      <Map />

      <h2>Recommendations Near You</h2>
      <div>
        <button onClick={() => fetchRecommendations(5)}>5 miles</button>
        <button onClick={() => fetchRecommendations(10)}>10 miles</button>
        <button onClick={() => fetchRecommendations(15)}>15 miles</button>
      </div>
      {recommendations.length > 0 ? (
        <ul>
          {recommendations.map((place, index) => (
            <li key={index}>
              <h3>{place.name}</h3>
              <p>Similarity Score: {place.similarity_score.toFixed(2)}</p>
              <ul>
                <li>Sentiment Variance: {place.category_scores.sentiment_variance.toFixed(2)}</li>
                <li>Average Review Length: {place.category_scores.review_length.toFixed(2)}</li>
                <li>Keyword Frequency - Clean: {place.category_scores.keyword_clean}</li>
                <li>Keyword Frequency - Comfortable: {place.category_scores.keyword_comfortable}</li>
                <li>Keyword Frequency - Friendly: {place.category_scores.keyword_friendly}</li>
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recommendations found.</p>
      )}
    </div>
  );
}
