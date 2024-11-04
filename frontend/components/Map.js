// components/Map.js

import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

function Map({ center, markers }) {
  const [mapCenter, setMapCenter] = useState(center); // Set initial center

  useEffect(() => {
    if (center) {
      setMapCenter(center); // Update map center if center prop changes
    }
  }, [center]);

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={12}>
        {markers && markers.map((marker, index) => (
          <Marker key={index} position={{ lat: marker.lat, lng: marker.lng }} label={marker.name} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;
