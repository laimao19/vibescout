import React, { useState, useEffect } from 'react';
import { X, Music } from 'lucide-react';
import axios from 'axios';

const MusicProfile = ({ setUserPreferences }) => {
  const [tracks, setTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSpotifyData();
  }, []);

  const loadSpotifyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/spotify');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data format received');
      }

      const processedData = response.data
        .filter(track => track && track.track_name && track['artist(s)_name'])
        .map(track => ({
          id: `${track.track_name}-${track['artist(s)_name']}`,
          track_name: String(track.track_name),
          artist: String(track['artist(s)_name']),
          valence: Number(track['valence_%'] || 0) / 100,
          energy: Number(track['energy_%'] || 0) / 100,
          danceability: Number(track['danceability_%'] || 0) / 100,
          acousticness: Number(track['acousticness_%'] || 0) / 100,
          streams: Number(track.streams || 0),
          popularity: Number(track.in_spotify_playlists || 0)
        }));

      setTracks(processedData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load music data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      loadSpotifyData();
      return;
    }
    
    const filtered = tracks.filter(track => {
      return track.track_name.toLowerCase().includes(query.toLowerCase()) ||
             track.artist.toLowerCase().includes(query.toLowerCase());
    }).slice(0, 50);
    
    setTracks(filtered);
  };

  const addTrack = (track) => {
    if (selectedTracks.length >= 10) {
      return; // Max 10 songs
    }
    
    if (!selectedTracks.some(selected => selected.id === track.id)) {
      const newSelectedTracks = [...selectedTracks, track];
      setSelectedTracks(newSelectedTracks);
      updateUserPreferences(newSelectedTracks);
    }
  };

  const removeTrack = (trackId) => {
    const newSelectedTracks = selectedTracks.filter(track => track.id !== trackId);
    setSelectedTracks(newSelectedTracks);
    updateUserPreferences(newSelectedTracks);
  };

  const updateUserPreferences = (tracks) => {
    if (!tracks.length) {
      setUserPreferences({});
      return;
    }

    const averages = tracks.reduce((acc, track) => ({
      valence: acc.valence + (track.valence || 0),
      energy: acc.energy + (track.energy || 0),
      loudness: acc.loudness + ((track.valence > 0.5 ? 0.7 : 0.3) || 0),
      ambiance: acc.ambiance + ((track.energy > 0.5 ? 0.7 : 0.3) || 0),
      liveness: acc.liveness + ((track.acousticness > 0.5 ? 0.7 : 0.3) || 0)
    }), { valence: 0, energy: 0, loudness: 0, ambiance: 0, liveness: 0 });

    Object.keys(averages).forEach(key => {
      averages[key] = averages[key] / tracks.length;
    });

    setUserPreferences(averages);
  };

  const generateRandomProfile = () => {
    const availableTracks = [...tracks];
    const randomTracks = [];
    
    while (randomTracks.length < 10 && availableTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTracks.length);
      randomTracks.push(availableTracks.splice(randomIndex, 1)[0]);
    }
    
    setSelectedTracks(randomTracks);
    updateUserPreferences(randomTracks);
    setIsCustomizing(false);
  };

  const resetProfile = () => {
    setSelectedTracks([]);
    setUserPreferences({});
    setIsCustomizing(false);
  };

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading music data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isCustomizing ? 'Done' : 'Customize Profile'}
        </button>
        <button
          onClick={generateRandomProfile}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Generate Random
        </button>
        <button
          onClick={resetProfile}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset Profile
        </button>
      </div>

{/* Selected Songs Display - Always visible */}
{selectedTracks.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4">Selected Songs ({selectedTracks.length}/10)</h3>
    <div className="simple-card-grid mb-6">
      {selectedTracks.map((track) => (
        <div key={track.id} className="simple-card relative">
          <button
            onClick={() => removeTrack(track.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
          <h3 className="simple-card-title">{track.track_name}</h3>
          <p className="simple-card-subtitle">{track.artist}</p>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Positivity:</span>
            <span className="simple-card-metric-value">{(track.valence * 100).toFixed(1)}%</span>
          </div>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Energy:</span>
            <span className="simple-card-metric-value">{(track.energy * 100).toFixed(1)}%</span>
          </div>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Danceability:</span>
            <span className="simple-card-metric-value">{(track.danceability * 100).toFixed(1)}%</span>
          </div>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Acousticness:</span>
            <span className="simple-card-metric-value">{(track.acousticness * 100).toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Customization Section */}
{isCustomizing && (
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Search songs..."
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    
    <div className="simple-card-grid">
      {tracks.map((track) => (
        <div
          key={track.id}
          onClick={() => addTrack(track)}
          className={`simple-card cursor-pointer transition-colors ${
            selectedTracks.some(selected => selected.id === track.id)
              ? 'bg-blue-900/20'
              : 'hover:bg-gray-700/50'
          }`}
        >
          <h3 className="simple-card-title">{track.track_name}</h3>
          <p className="simple-card-subtitle">{track.artist}</p>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Positivity:</span>
            <span className="simple-card-metric-value">{(track.valence * 100).toFixed(1)}%</span>
          </div>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Energy:</span>
            <span className="simple-card-metric-value">{(track.energy * 100).toFixed(1)}%</span>
          </div>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Danceability:</span>
            <span className="simple-card-metric-value">{(track.danceability * 100).toFixed(1)}%</span>
          </div>
          <div className="simple-card-metric">
            <span className="simple-card-metric-label">Acousticness:</span>
            <span className="simple-card-metric-value">{(track.acousticness * 100).toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  );
};

export default MusicProfile;