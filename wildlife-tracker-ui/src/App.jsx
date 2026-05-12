import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import HeatmapLayer from './HeatmapLayer';

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
  
  const [species, setSpecies] = useState('Coyote');
  const [customSpecies, setCustomSpecies] = useState('');
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(getLocalISOTime());
  const [showLog, setShowLog] = useState(false);
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [mapView, setMapView] = useState('pins');

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
      
      {/* --- 1. TOP LEFT ZONE: Controls & Filter --- */}
      <div className="top-left-controls">
        <button 
          onClick={() => setShowLog(!showLog)}
          style={{ padding: '10px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showLog ? 'Hide Data Log' : 'View Data Log'}
        </button>

        <div className="filter-box">
          <label>Filter Map Data</label>
          <select 
            value={filterSpecies} 
            onChange={(e) => setFilterSpecies(e.target.value)}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
          >
            {uniqueSpeciesList.map((animal) => (
              <option key={animal} value={animal}>{animal}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- 2. THE DATA LOG PANEL --- */}
      {showLog && (
        <div className="log-panel">
          <div className="header-row">
            <h2 style={{ margin: 0 }}>Sighting History</h2>
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

      {/* --- 3. BOTTOM CENTER ZONE: Map Toggle --- */}
      <div className="bottom-center-controls">
        <button 
          onClick={() => setMapView(mapView === 'pins' ? 'heatmap' : 'pins')}
          style={{ 
            padding: '12px 24px', 
            background: mapView === 'heatmap' ? '#ff4b4b' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '30px',
            cursor: 'pointer', 
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            fontSize: '1.1rem'
          }}
        >
          {mapView === 'pins' ? '🔥 Switch to Heatmap' : '📍 Switch to Pins'}
        </button>
      </div>

      {/* --- 4. THE ENTRY FORM (Appears on click) --- */}
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

      {/* Prompt text when no location is selected */}
      {!selectedLocation && !showLog && (
        <div className="ui-overlay" style={{ pointerEvents: 'none', background: 'rgba(255, 255, 255, 0.85)', textAlign: 'center', top: '20px', left: '50%', transform: 'translateX(-50%)' }}>
           <h3 style={{ margin: 0, color: '#333' }}>Tap anywhere on the map to log a sighting</h3>
        </div>
      )}

      {/* --- 5. THE MAP --- */}
      <MapContainer center={[49.2606, -123.2460]} zoom={15} style={{ height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {mapView === 'pins' && sortedSightings.map((s, idx) => (
          <Marker key={idx} position={[s.latitude, s.longitude]}>
            <Popup>
              <strong>{s.count}x {s.species}</strong> <br />
              {s.notes && <span><em>"{s.notes}"</em><br /></span>}
              <small>{new Date(s.timestamp).toLocaleString()}</small>
            </Popup>
          </Marker>
        ))}

        {mapView === 'heatmap' && (
           <HeatmapLayer sightings={sortedSightings} />
        )}

        <LocationMarker onMapClick={(lat, lng) => setSelectedLocation({ lat, lng })} />

        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} opacity={0.5} />
        )}
      </MapContainer>
    </div>
  );
}

export default App;