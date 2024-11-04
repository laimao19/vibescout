// frontend/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchGoogleReviews = async (placeId) => {
  const response = await axios.get(`${API_BASE_URL}/api/reviews/get-reviews`, { params: { place_id: placeId } });
  return response.data;
};

export const fetchPlaceSuggestions = async (input) => {
  const response = await axios.get(`${API_BASE_URL}/api/google_places/autocomplete`, {
    params: { input },
  });
  return response.data.predictions;
};

export const fetchSpotifyData = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/spotify/user-data`, {
    withCredentials: true,  // This line ensures cookies (sessions) are included
  });
  return response.data;
};

export const fetchNearbyPlaces = async (userCoordinates, radius) => {
  const convertedRadius = radius ? radius * 1609.34 : 5000; // Default to 5000 meters if radius is undefined

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
    console.error('Error fetching nearby places:', error.response?.data || error.message);
    return [];
  }
};

// New function for fetching content-based recommendations
export const fetchContentBasedRecommendations = async (userPreferences, places) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/recommendations/content-based`, {
      user_preferences: userPreferences,
      places: places
    });
    return response.data.recommendations;
  } catch (error) {
    console.error('Error fetching content-based recommendations:', error.response?.data || error.message);
    return [];
  }
};
