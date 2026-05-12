import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Helper to format current time for the datetime-local input
const getLocalISOTime = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
};

// 1. Fixed the typo here and changed it to just report the click coordinates
function LocationMarker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function App() {
  const [sightings, setSightings] = useState([]);
  
  // New state to track if a location was clicked
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Form State Variables
  const [species, setSpecies] = useState('Coyote');
  const [customSpecies, setCustomSpecies] = useState(''); // Tracks the "Other" input
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(getLocalISOTime());

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/sightings/')
      .then(res => res.json())
      .then(data => setSightings(data))
      .catch(err => console.error("Error fetching sightings:", err));
  }, []);

  const handleSubmit = async () => {
    // Determine which species name to save based on the dropdown
    const finalSpecies = species === 'Other' ? customSpecies : species;

    const newSighting = {
      species: finalSpecies,
      count: parseInt(count, 10),
      notes: notes,
      timestamp: timestamp, 
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/sightings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSighting),
      });
      
      if (response.ok) {
        setSightings([...sightings, newSighting]);
        
        // Reset the form and hide it
        setSelectedLocation(null);
        setSpecies('Coyote');
        setCustomSpecies('');
        setCount(1);
        setNotes('');
        setTimestamp(getLocalISOTime());
      }
    } catch (error) {
      console.error("Failed to post sighting:", error);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      
      {/* 2. Form only renders if selectedLocation is NOT null */}
      {selectedLocation && (
        <div className="ui-overlay">
          <h2>Log Sighting</h2>
          
          <div className="form-group">
            <label>Species</label>
            <select value={species} onChange={(e) => setSpecies(e.target.value)}>
              <option value="Coyote">Coyote</option>
              <option value="Raccoon">Raccoon</option>
              <option value="Skunk">Skunk</option>
              <option value="Community Cat">Community Cat</option>
              <option value="Other">Other...</option>
            </select>
          </div>

          {/* 3. Conditional rendering: Only shows if "Other" is selected */}
          {species === 'Other' && (
            <div className="form-group">
              <label>Specify Animal</label>
              <input 
                type="text" 
                placeholder="e.g., Bear" 
                value={customSpecies} 
                onChange={(e) => setCustomSpecies(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Number Spotted</label>
            <input 
              type="number" 
              min="1" 
              value={count} 
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Time of Sighting</label>
            <input 
              type="datetime-local" 
              value={timestamp} 
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea 
              rows="2" 
              placeholder="Behavior, direction headed..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* 4. Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => setSelectedLocation(null)}
              style={{ flex: 1, padding: '10px', cursor: 'pointer', background: '#ccc', border: 'none', borderRadius: '4px' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              style={{ flex: 1, padding: '10px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
            >
              Submit Log
            </button>
          </div>
        </div>
      )}

      {/* Helper text when no location is selected */}
      {!selectedLocation && (
        <div className="ui-overlay" style={{ pointerEvents: 'none', background: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' }}>
           <h3 style={{ margin: 0, color: '#333' }}>Tap anywhere on the map to log a sighting</h3>
        </div>
      )}

      <MapContainer center={[49.2606, -123.2460]} zoom={15} style={{ height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {/* Render saved sightings */}
        {sightings.map((s, idx) => (
          <Marker key={idx} position={[s.latitude, s.longitude]}>
            <Popup>
              <strong>{s.count}x {s.species}</strong> <br />
              {s.notes && <span><em>"{s.notes}"</em><br /></span>}
              <small>{new Date(s.timestamp).toLocaleString()}</small>
            </Popup>
          </Marker>
        ))}

        {/* Listen for clicks to open the form */}
        <LocationMarker onMapClick={(lat, lng) => setSelectedLocation({ lat, lng })} />

        {/* Drop a temporary faded pin where the user just clicked */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} opacity={0.5} />
        )}
      </MapContainer>
    </div>
  );
}

export default App;