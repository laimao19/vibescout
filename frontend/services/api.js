// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const fetchGoogleReviews = async (placeId) => {
  const response = await axios.get(`${API_BASE_URL}/api/reviews/get-reviews`, { 
    params: { place_id: placeId } 
  });
  return response.data;
};

export const fetchPlaceSuggestions = async (input) => {
  const response = await axios.get(`${API_BASE_URL}/api/google_places/autocomplete`, {
    params: { input },
  });
  return response.data.predictions;
};

export const fetchMusicData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/spotify/data`);
    return response.data.tracks.map(track => ({
      track_name: track.track_name,
      artist: track.artist,
      valence: track.valence,
      energy: track.energy,
      danceability: track.danceability,
      acousticness: track.acousticness,
      streams: track.streams,
      popularity: track.popularity
    }));
  } catch (error) {
    console.error('Error loading Spotify data:', error);
    return [];
  }
};

export const fetchNearbyPlaces = async (userCoordinates, radius) => {
  if (!userCoordinates?.lat || !userCoordinates?.lng) {
    console.error('Invalid coordinates:', userCoordinates);
    return [];
  }

  // Convert radius from miles to meters and cap at 50,000 meters (Google's limit)
  const MAX_RADIUS_METERS = 50000;
  const radiusInMeters = Math.min(radius * 1609.34, MAX_RADIUS_METERS);
  
  try {
    console.log(`Fetching places near ${userCoordinates.lat},${userCoordinates.lng} within ${radiusInMeters}m`);
    
    const response = await axios.get(`${API_BASE_URL}/api/places/nearby`, {
      params: {
        lat: userCoordinates.lat,
        lng: userCoordinates.lng,
        radius: radiusInMeters,
      },
    });

    // If we got fewer results than expected and we capped the radius,
    // log a warning to help with debugging
    if (response.data.places?.length < 5 && radius * 1609.34 > MAX_RADIUS_METERS) {
      console.warn('Got limited results due to radius cap. Consider implementing pagination or multiple searches.');
    }
    
    return response.data.places || [];
  } catch (error) {
    console.error('Error fetching nearby places:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return [];
  }
};

export const fetchContentBasedRecommendations = async (userPreferences, places) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/recommendations/content-based`, {
      user_preferences: userPreferences,
      places: places
    });
    return response.data.recommendations;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
};

export const calculateAverageAttributes = (tracks) => {
  if (!tracks.length) {
    return {
      valence: 0,
      energy: 0,
      danceability: 0,
      acousticness: 0,
      liveness: 0
    };
  }

  const sum = tracks.reduce((acc, track) => ({
    valence: acc.valence + (track.valence || 0),
    energy: acc.energy + (track.energy || 0),
    danceability: acc.danceability + (track.danceability || 0),
    acousticness: acc.acousticness + (track.acousticness || 0),
    liveness: acc.liveness + (track.liveness || 0)
  }), {
    valence: 0,
    energy: 0,
    danceability: 0,
    acousticness: 0,
    liveness: 0
  });

  return {
    valence: sum.valence / tracks.length,
    energy: sum.energy / tracks.length,
    danceability: sum.danceability / tracks.length,
    acousticness: sum.acousticness / tracks.length,
    liveness: sum.liveness / tracks.length
  };
};