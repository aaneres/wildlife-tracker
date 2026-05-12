import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// This sub-component handles the "click to drop pin" logic
function LocationMarker({ onNewSighting }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onNewSighting(lat, lng);
    },
  });
  return null;
}

function App() {
  const [sightings, setSightings] = useState([]);
  const [animalName, setAnimalName] = useState('Moolet');

  // Load existing sightings from FastAPI when the app starts
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/sightings/')
      .then(res => res.json())
      .then(data => setSightings(data))
      .catch(err => console.error("Error fetching sightings:", err));
  }, []);

  const handleNewSighting = async (lat, lng) => {
    const newSighting = {
      species_or_name: animalName,
      latitude: lat,
      longitude: lng,
      notes: "Morning routine check-in",
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/sightings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSighting),
      });
      
      if (response.ok) {
        // Update local state so the pin appears immediately without a refresh
        setSightings([...sightings, newSighting]);
      }
    } catch (error) {
      console.error("Failed to post sighting:", error);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div className="ui-overlay">
        <h2>Wildlife Tracker</h2>
        <input 
          value={animalName} 
          onChange={(e) => setAnimalName(e.target.value)}
          placeholder="Animal name..."
        />
        <p>Click map to log {animalName}</p>
      </div>

      <MapContainer center={[49.2606, -123.2460]} zoom={15} style={{ height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {sightings.map((s, idx) => (
          <Marker key={idx} position={[s.latitude, s.longitude]}>
            <Popup>
              <strong>{s.species_or_name}</strong> <br />
              {s.notes} <br />
              <small>{new Date(s.timestamp).toLocaleString()}</small>
            </Popup>
          </Marker>
        ))}

        <LocationMarker onNewSighting={handleNewSighting} />
      </MapContainer>
    </div>
  );
}

export default App;