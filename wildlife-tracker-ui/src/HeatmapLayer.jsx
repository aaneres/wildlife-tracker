import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ sightings }) {
  const map = useMap(); 

  useEffect(() => {
    const heatData = sightings.map(s => [
      s.latitude, 
      s.longitude, 
      s.count * 5 
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,     
      blur: 15,       
      maxZoom: 15,
      gradient: {
        0.4: 'blue', 
        0.6: 'cyan', 
        0.7: 'lime', 
        0.8: 'yellow', 
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, sightings]); 

  return null; 
}