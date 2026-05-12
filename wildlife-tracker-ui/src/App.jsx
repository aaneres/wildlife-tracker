import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

const getLocalISOTime = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
};

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
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Form State
  const [species, setSpecies] = useState('Coyote');
  const [customSpecies, setCustomSpecies] = useState('');
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(getLocalISOTime());

  // NEW: Log Panel State
  const [showLog, setShowLog] = useState(false);
  const [filterSpecies, setFilterSpecies] = useState('All');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/sightings/')
      .then(res => res.json())
      .then(data => setSightings(data))
      .catch(err => console.error("Error fetching sightings:", err));
  }, []);

  const handleSubmit = async () => {
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

  const uniqueSpeciesList = ['All', ...new Set(sightings.map(s => s.species))];

  const displayedSightings = filterSpecies === 'All' 
    ? sightings 
    : sightings.filter(s => s.species === filterSpecies);

  const sortedSightings = [...displayedSightings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <button 
        onClick={() => setShowLog(!showLog)}
        style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, padding: '10px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        {showLog ? 'Hide Data Log' : 'View Data Log'}
      </button>

      {showLog && (
        <div className="log-panel">
          <div className="header-row">
            <h2 style={{ margin: 0 }}>Sighting History</h2>
          </div>

          <div className="form-group">
            <label>Filter by Species:</label>
            <select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)}>
              {uniqueSpeciesList.map((animal) => (
                <option key={animal} value={animal}>{animal}</option>
              ))}
            </select>
          </div>

          <div className="log-list">
            {sortedSightings.length === 0 ? (
              <p>No sightings found.</p>
            ) : (
              sortedSightings.map((s, idx) => (
                <div key={idx} className="log-card">
                  <strong>{s.count}x {s.species}</strong>
                  <div style={{ color: '#666', fontSize: '0.85em', margin: '4px 0' }}>
                    {new Date(s.timestamp).toLocaleString()}
                  </div>
                  {s.notes && <div><em>"{s.notes}"</em></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

      {!selectedLocation && !showLog && (
        <div className="ui-overlay" style={{ pointerEvents: 'none', background: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' }}>
           <h3 style={{ margin: 0, color: '#333' }}>Tap anywhere on the map to log a sighting</h3>
        </div>
      )}

      <MapContainer center={[49.2606, -123.2460]} zoom={15} style={{ height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {sortedSightings.map((s, idx) => (
          <Marker key={idx} position={[s.latitude, s.longitude]}>
            <Popup>
              <strong>{s.count}x {s.species}</strong> <br />
              {s.notes && <span><em>"{s.notes}"</em><br /></span>}
              <small>{new Date(s.timestamp).toLocaleString()}</small>
            </Popup>
          </Marker>
        ))}

        <LocationMarker onMapClick={(lat, lng) => setSelectedLocation({ lat, lng })} />

        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} opacity={0.5} />
        )}
      </MapContainer>
    </div>
  );
}

export default App;