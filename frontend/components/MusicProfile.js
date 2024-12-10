import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

  useEffect(() => {
    if (selectedTracks.length > 0) {
      const averages = calculateAverages(selectedTracks);
      setUserPreferences(averages);
    }
  }, [selectedTracks, setUserPreferences]);

  const calculateAverages = (tracks) => {
    if (!tracks.length) return {
      valence: 0,
      energy: 0,
      loudness: 0,
      ambiance: 0,
      liveness: 0
    };

    const sum = tracks.reduce((acc, track) => ({
      valence: acc.valence + (track.valence || 0),
      energy: acc.energy + (track.energy || 0),
      loudness: acc.loudness + ((track.valence > 0.5 ? 0.7 : 0.3) || 0),
      ambiance: acc.ambiance + ((track.energy > 0.5 ? 0.7 : 0.3) || 0),
      liveness: acc.liveness + ((track.acousticness > 0.5 ? 0.7 : 0.3) || 0)
    }), { valence: 0, energy: 0, loudness: 0, ambiance: 0, liveness: 0 });

    return Object.keys(sum).reduce((acc, key) => {
      acc[key] = sum[key] / tracks.length;
      return acc;
    }, {});
  };

  const generateRandomProfile = () => {
    const availableTracks = [...tracks];
    const randomTracks = [];
    
    while (randomTracks.length < 10 && availableTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTracks.length);
      randomTracks.push(availableTracks.splice(randomIndex, 1)[0]);
    }
    
    setSelectedTracks(randomTracks);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      loadSpotifyData();
      return;
    }
    
    const filtered = tracks.filter(track => {
      if (!track || typeof track.track_name !== 'string' || typeof track.artist !== 'string') {
        return false;
      }
      return track.track_name.toLowerCase().includes(query.toLowerCase()) ||
             track.artist.toLowerCase().includes(query.toLowerCase());
    }).slice(0, 50);
    
    setTracks(filtered);
  };

  const averageAttributes = calculateAverages(selectedTracks);
  
  const chartData = [
    {
      name: 'Valence',
      'User Preferences': averageAttributes.valence,
      'Place Attributes': 0
    },
    {
      name: 'Energy',
      'User Preferences': averageAttributes.energy,
      'Place Attributes': 0
    },
    {
      name: 'Loudness',
      'User Preferences': averageAttributes.loudness,
      'Place Attributes': 0
    },
    {
      name: 'Ambiance',
      'User Preferences': averageAttributes.ambiance,
      'Place Attributes': 0
    },
    {
      name: 'Liveness',
      'User Preferences': averageAttributes.liveness,
      'Place Attributes': 0
    }
  ];

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6">
        <CardContent>
          <div className="flex justify-center items-center h-32">
            Loading music data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6">
        <CardContent>
          <div className="flex justify-center items-center h-32 text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-center gap-4 mb-6">
        <button 
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 transition-colors"
        >
          {isCustomizing ? 'Cancel' : 'Customize Profile'}
        </button>
        <button 
          onClick={generateRandomProfile}
          className="bg-green-500 text-white px-6 py-3 rounded-lg shadow hover:bg-green-600 transition-colors"
        >
          Generate Random Profile
        </button>
      </div>

      {isCustomizing ? (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full max-w-xl mx-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="max-h-96 overflow-y-auto bg-white rounded-lg shadow">
            {tracks.map((track, index) => (
              <div 
                key={`${track.track_name}-${track.artist}-${index}`}
                onClick={() => {
                  if (selectedTracks.length < 10) {
                    setSelectedTracks([...selectedTracks, track]);
                  }
                }}
                className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="font-semibold text-gray-800">{track.track_name}</div>
                <div className="text-gray-600">{track.artist}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {selectedTracks.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Music Profile Analysis</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[-6, 1]} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="User Preferences" fill="#ffb6c1" />
                    <Bar dataKey="Place Attributes" fill="#87ceeb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          <div className="grid gap-4">
            {selectedTracks.map((track, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg transition-transform hover:scale-[1.02]">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{track.track_name}</h3>
                <p className="text-gray-600 mb-4">{track.artist}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Positivity:</span> {(track.valence * 100).toFixed(1)}%
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Energy:</span> {(track.energy * 100).toFixed(1)}%
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Danceability:</span> {(track.danceability * 100).toFixed(1)}%
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-medium">Acousticness:</span> {(track.acousticness * 100).toFixed(1)}%
                  </div>
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