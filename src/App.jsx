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
import { io } from 'socket.io-client';

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function LiveMap() {
  const [buses, setBuses] = useState({});
  useEffect(() => {
    // Load last known positions from Supabase
    supabase.from('live_bus_location').select('*').then(({ data }) => {
      if (data) {
        const map = {};
        data.forEach(b => { map[b.driver_id] = b; });
        setBuses(map);
      }
    });
    // Live updates via socket
    const socket = io('https://campus-zone-backend-1.onrender.com');
    socket.on('admin-map-update', ({ driverId, lat, lng }) => {
      setBuses(prev => ({ ...prev, [driverId]: { ...prev[driverId], driver_id: driverId, lat, lng } }));
    });
    return () => socket.disconnect();
  }, []);

  const entries = Object.values(buses).filter(b => b.lat && b.lng);
  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 18 }}>
        🚌 Live Bus Tracker — {entries.length} bus{entries.length !== 1 ? 'es' : ''} active
      </div>
      <MapContainer center={[11.0168, 76.9558]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {entries.map(b => (
          <Marker key={b.driver_id} position={[b.lat, b.lng]}>
            <Popup>Driver: {b.driver_id}<br />Speed: {b.speed || 0} km/h</Popup>
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
