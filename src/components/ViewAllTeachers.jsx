import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, MapPin, X, CheckCircle, Clock, Users, BookOpen, Mail, UserCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ViewAllTeachers.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function ViewAllTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, is_approved, home_lat, home_lng, role')
        .eq('role', 'teacher')
        .order('name');
      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="teachers-page">
      <div className="page-header">
        <div className="header-info">
          <div className="icon-badge"><BookOpen size={22} color="#8b5cf6" /></div>
          <div>
            <h1>Faculty Directory</h1>
            <p>All teachers registered in Campus Zone</p>
          </div>
        </div>
        <div className="search-box">
          <Search size={18} className="s-icon" />
          <input type="text" placeholder="Search faculty..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-ui">
            <div className="pulse-loader"></div>
            <p>Loading Faculty Data...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="loading-ui">
            <UserCheck size={48} color="#334155" />
            <p>No teachers found. Teachers register via the Campus App.</p>
          </div>
        ) : (
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Teacher Details</th>
                <th>Account Status</th>
                <th>Email</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <div className="teacher-profile">
                      <div className="t-avatar">{teacher.name?.charAt(0)}</div>
                      <div className="t-info">
                        <span className="t-name">{teacher.name}</span>
                        <span className="t-email">{teacher.id?.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {teacher.is_approved ? (
                      <span className="status-tag approved"><CheckCircle size={12} /> Approved</span>
                    ) : (
                      <span className="status-tag pending"><Clock size={12} /> Pending</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} color="#94a3b8" />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{teacher.email}</span>
                    </div>
                  </td>
                  <td>
                    {teacher.home_lat && teacher.home_lat !== 0 ? (
                      <button className="loc-btn" onClick={() => { setSelectedTeacher(teacher); setShowMap(true); }}>
                        <MapPin size={14} /> View Map
                      </button>
                    ) : (
                      <span className="no-loc">No GPS Data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showMap && selectedTeacher && (
        <div className="modal-overlay">
          <div className="modal-card map-modal">
            <div className="modal-header">
              <h3>Residence: {selectedTeacher.name}</h3>
              <button className="close-modal" onClick={() => setShowMap(false)}><X size={20} /></button>
            </div>
            <div className="modal-body map-body">
              <MapContainer center={[selectedTeacher.home_lat, selectedTeacher.home_lng]} zoom={14} className="leaflet-map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedTeacher.home_lat, selectedTeacher.home_lng]}>
                  <Popup>{selectedTeacher.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAllTeachers;