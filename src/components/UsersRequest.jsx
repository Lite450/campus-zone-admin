import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  User,
  Bus,
  Briefcase,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import './UsersRequest.css';

function UsersRequest() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPendingUsers();

    // Real-time subscription — updates instantly when new user registers in app
    const channel = supabase
      .channel('app_users_pending')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_users',
        filter: 'is_approved=eq.false',
      }, () => fetchPendingUsers())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, role, teacher_request_status, created_at')
        .eq('is_approved', false)
        .neq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      showToast('Failed to load requests. ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (userId, userName) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;

      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`✅ ${userName} approved — they can now log into the app!`, 'success');
    } catch (err) {
      showToast('Approval failed: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Permanently delete ${userName}'s request?`)) return;
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`🗑️ ${userName}'s request rejected and deleted.`, 'error');
    } catch (err) {
      showToast('Rejection failed: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = pendingUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case 'teacher': return <GraduationCap size={18} />;
      case 'driver': return <Bus size={18} />;
      case 'non-faculty': return <Briefcase size={18} />;
      default: return <User size={18} />;
    }
  };

  return (
    <div className="requests-page">

      {/* Fixed toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
          color: '#fff', padding: '12px 22px', borderRadius: '12px', fontWeight: '600',
          fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          maxWidth: '460px', textAlign: 'center',
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="requests-header">
        <div className="header-text">
          <div className="icon-wrapper">
            <ShieldAlert size={24} color="#6366f1" />
          </div>
          <div>
            <h1>Verification Center</h1>
            <p>Review and authorize access requests from the Campus App — updates live in real-time</p>
          </div>
        </div>
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, role or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="requests-content">
        {loading ? (
          <div className="center-state">
            <Loader2 className="spinner" size={40} />
            <p>Loading pending requests from Supabase...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="request-grid">
            {filteredUsers.map((user) => (
              <div className="request-card" key={user.id}>
                <div className="card-top">
                  <div className={`role-badge ${user.role}`}>
                    {getRoleIcon(user.role)}
                    <span>{user.role}</span>
                  </div>
                  <span className="date-stamp">
                    {new Date(user.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="card-user">
                  <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-meta">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(user.id, user.name)}
                    disabled={processingId === user.id}
                  >
                    {processingId === user.id
                      ? <Loader2 size={16} className="spinner" />
                      : <CheckCircle2 size={16} />
                    }
                    {processingId === user.id ? 'Processing...' : 'Authorize Access'}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(user.id, user.name)}
                    disabled={processingId === user.id}
                  >
                    <XCircle size={16} /> Reject & Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="center-state empty">
            <UserCheck size={60} color="#334155" />
            <h2>All Clear — No Pending Requests</h2>
            <p>New registrations from the Campus App will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersRequest;