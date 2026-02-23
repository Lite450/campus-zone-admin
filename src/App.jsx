import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import StudentsPage from './components/ViewAllUsers';
import ViewAllTeachers from './components/ViewAllTeachers';
import UsersRequest from './components/UsersRequest';
import Drivers from './components/Drivers';
import AdminBroadcast from './components/AdminBroadcast';
import AddUser from './components/AddUser';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { supabase } from './supabaseClient';

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function LiveMap() {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('live_bus_location').select('*');
      if (data) setBuses(data);
    };
    load();

    const channel = supabase
      .channel('live-bus-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_bus_location' }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const activeBuses = buses.filter(b => b.lat && b.lng);

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 18 }}>
        🚌 Live Bus Tracker — {activeBuses.length} bus{activeBuses.length !== 1 ? 'es' : ''} active
      </div>
      <MapContainer center={[11.0168, 76.9558]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {activeBuses.map(b => (
          <Marker key={b.driver_id} position={[b.lat, b.lng]}>
            <Popup>
              Driver ID: {b.driver_id}<br />
              Speed: {b.speed || 0} km/h<br />
              Updated: {new Date(b.last_updated).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="Users" element={<StudentsPage />} />
        <Route path="teachers" element={<ViewAllTeachers />} />
        <Route path="Requests" element={<UsersRequest />} />
        <Route path="requests" element={<UsersRequest />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
        <Route path="add-user" element={<AddUser />} />
        <Route path="map" element={<LiveMap />} />
      </Route>
    </Routes>
  );
}

export default App;
