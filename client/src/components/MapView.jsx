import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDateTime } from '../lib/constants';

// react-leaflet's default marker icons reference asset paths that Vite
// doesn't resolve out of the box; point them at the CDN instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DEFAULT_CENTER = [41.7, -71.5]; // Rhode Island

export default function MapView({ events }) {
  const withCoords = events.filter((e) => e.parish_lat != null && e.parish_lng != null);
  const center = withCoords.length > 0 ? [withCoords[0].parish_lat, withCoords[0].parish_lng] : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={9} style={{ height: '600px', width: '100%', borderRadius: 'var(--radius)' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((event) => (
        <Marker key={event.id} position={[event.parish_lat, event.parish_lng]} icon={markerIcon}>
          <Popup>
            <strong>{event.title}</strong>
            <br />
            {event.parish_name}
            <br />
            {formatDateTime(event.start_datetime)}
            <br />
            <Link to={`/events/${event.id}`}>View details →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
