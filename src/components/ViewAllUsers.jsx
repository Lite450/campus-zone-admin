import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Search, MapPin, X, Users, User, Bus,
  Briefcase, GraduationCap, ChevronDown, Filter,
  Mail, ShieldCheck, ToggleLeft, ToggleRight, Loader
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ViewAllUsers.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function ViewAllUsers() {
  const [role, setRole] = useState('student');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => { fetchUsers(); }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, role, is_approved, home_lat, home_lng, created_at')
        .eq('role', role)
        .order('name');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('fetchUsers error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle is_approved for a single user
  const toggleApproval = async (user) => {
    setTogglingId(user.id);
    const newVal = !user.is_approved;
    const { error } = await supabase
      .from('app_users')
      .update({ is_approved: newVal })
      .eq('id', user.id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_approved: newVal } : u));
    }
    setTogglingId(null);
  };

  const openMap = (user) => { setSelectedUser(user); setShowMap(true); };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (r) => {
    switch (r) {
      case 'student': return <GraduationCap size={18} />;
      case 'teacher': return <User size={18} />;
      case 'driver': return <Bus size={18} />;
      default: return <Briefcase size={18} />;
    }
  };

  return (
    <div className="viewuser-container">
      <div className="viewuser-command-bar">
        <div className="viewuser-title-section">
          <div className="viewuser-icon-bg"><Users color="#6366f1" size={24} /></div>
          <div>
            <h1 className="viewuser-main-title">Ecosystem Directory</h1>
            <p className="viewuser-sub-title">Manage and approve <span className="viewuser-highlight">{role}s</span></p>
          </div>
        </div>
        <div className="viewuser-filter-section">
          <div className="viewuser-select-box">
            <Filter className="viewuser-select-icon-l" size={16} />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="viewuser-role-dropdown">
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="driver">Drivers</option>
              <option value="non-faculty">Non-Faculty</option>
            </select>
            <ChevronDown className="viewuser-select-icon-r" size={16} />
          </div>
          <div className="viewuser-search-wrapper">
            <Search size={18} className="viewuser-search-icon" />
            <input type="text" placeholder={`Filter ${role} list...`} className="viewuser-search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="viewuser-table-wrapper">
        {loading ? (
          <div className="viewuser-loader">
            <div className="viewuser-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <table className="viewuser-data-table">
            <thead>
              <tr>
                <th>Identity Profile</th>
                <th>Communication</th>
                <th>Approved?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="viewuser-table-row">
                    <td>
                      <div className="viewuser-user-cell">
                        <div className={`viewuser-avatar viewuser-avatar-${role}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="viewuser-name-stack">
                          <span className="viewuser-user-name">{user.name}</span>
                          <span className="viewuser-id-tag">ID: {user.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="viewuser-email-box">
                        <Mail size={14} color="#94a3b8" />
                        <span className="viewuser-email-text">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      {/* Easy toggle — click to flip is_approved */}
                      <button
                        onClick={() => toggleApproval(user)}
                        disabled={togglingId === user.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          color: user.is_approved ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: 13,
                        }}
                        title={user.is_approved ? 'Click to revoke access' : 'Click to grant access'}
                      >
                        {togglingId === user.id
                          ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          : user.is_approved
                            ? <ToggleRight size={20} />
                            : <ToggleLeft size={20} />
                        }
                        {user.is_approved ? 'Approved' : 'Pending'}
                      </button>
                    </td>
                    <td>
                      <div className="viewuser-btn-group">
                        {user.home_lat && user.home_lat !== 0 ? (
                          <button className="viewuser-btn viewuser-btn-loc" onClick={() => openMap(user)}>
                            <MapPin size={14} /> Location
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#475569' }}>No GPS</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="viewuser-empty-row">No {role}s found in the database.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showMap && selectedUser && (
        <div className="viewuser-modal-overlay" onClick={() => setShowMap(false)}>
          <div className="viewuser-modal-card viewuser-map-modal" onClick={e => e.stopPropagation()}>
            <div className="viewuser-modal-header">
              <h3>Location: {selectedUser.name}</h3>
              <button className="viewuser-modal-close" onClick={() => setShowMap(false)}><X size={20} /></button>
            </div>
            <div className="viewuser-map-container">
              <MapContainer center={[selectedUser.home_lat, selectedUser.home_lng]} zoom={14} className="viewuser-leaflet">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedUser.home_lat, selectedUser.home_lng]}>
                  <Popup>{selectedUser.name}'s Home Location</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAllUsers;