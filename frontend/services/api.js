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
  const convertedRadius = radius ? radius * 1609.34 : 5000; // Convert miles to meters

  try {
    const response = await axios.get(`${API_BASE_URL}/api/places/nearby`, {
      params: {
        lat: userCoordinates?.lat,
        lng: userCoordinates?.lng,
        radius: convertedRadius,
      },
    });
    return response.data.places;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
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