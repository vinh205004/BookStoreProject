import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { toast } from 'react-toastify';

// Fix Leaflet marker icon issue in React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerMapProps {
  onLocationSelect: (address: string) => void;
  defaultAddress?: string;
}

export default function LocationPickerMap({ onLocationSelect, defaultAddress }: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number]>([21.028511, 105.804817]); // Default Hanoi
  const [address, setAddress] = useState(defaultAddress || '');
  const [loading, setLoading] = useState(false);

  // Component to handle map clicks
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });

    return position === null ? null : (
      <Marker position={position}></Marker>
    );
  };

  const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onLocationSelect(data.display_name);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Không thể lấy địa chỉ từ bản đồ.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    toast.info('Đang lấy vị trí của bạn...');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
      },
      (err) => {
        console.error(err);
        toast.error('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <label className="block text-sm font-bold text-gray-700">Chọn vị trí trên bản đồ</label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 text-sm font-medium"
        >
          <Navigation size={16} />
          {loading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
        </button>
      </div>
      
      <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          <MapUpdater center={position} />
        </MapContainer>
      </div>
      
      {address && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
           <span className="font-semibold">Vị trí đã chọn: </span> {address}
        </div>
      )}
    </div>
  );
}