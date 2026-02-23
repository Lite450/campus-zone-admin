import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[Login] Attempting login for:', email);

    try {
      // Check supabase client is ready
      console.log('[Login] Supabase client:', supabase ? 'OK' : 'MISSING');

      // Query campus_users table directly for credentials
      const { data: users, error: dbError } = await supabase
        .from('campus_users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('is_active', true)
        .limit(1);

      console.log('[Login] DB result → users:', users, '| error:', dbError);

      if (dbError) throw new Error('DB Error: ' + dbError.message);

      if (!users || users.length === 0) {
        throw new Error('No account found with this email. Make sure you ran the SQL setup.');
      }

      const user = users[0];
      console.log('[Login] User found:', user.full_name, '| role:', user.role);

      if (user.password_hash !== password) {
        throw new Error('Invalid password. Please try again.');
      }

      if (!['admin', 'owner'].includes(user.role)) {
        throw new Error('Access denied. Admin or Owner role required.');
      }

      // Save session
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.full_name);
      localStorage.setItem('isLoggedIn', 'true');
      console.log('[Login] Success! Navigating to dashboard...');
      navigate('/admin/dashboard');

    } catch (err) {
      console.error('[Login] ERROR:', err.message);
      setError(err.message || 'Verification failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const fadeInUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="login-viewport">
      <div className="bg-grid-overlay"></div>
      <div className="radial-glow-1"></div>

      <div className="split-layout">

        {/* --- LEFT SIDE: BRANDING --- */}
        <section className="brand-visual-section">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="brand-content-wrapper"
          >
            {/* Badge removed as requested */}

            <div className="main-logo-area">
              <h1 className="brand-display-name brand-display-name-lg brand-dual-tone">
                Campus Zone
              </h1>
            </div>

            <h2 className="hero-heading">
              Unifying Your Campus Experience.
            </h2>
            <p className="hero-description">
              A centralized digital ecosystem bridging the gap between real-time transit tracking, automated scheduling, and complete campus safety.
            </p>

            <div className="abstract-visual-node">
              <div className="node-ring ring-1"></div>
              <ShieldCheck size={80} className="shield-icon-central" />
            </div>
          </motion.div>
        </section>

        {/* --- RIGHT SIDE: FORM --- */}
        <section className="login-form-section">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="form-container-card"
          >
            {/* Mobile Header */}
            <motion.div variants={fadeInUp} className="form-brand-header">
              <h3>Campus Zone</h3>
            </motion.div>

            <motion.div variants={fadeInUp} className="form-text-group">
              <h2>Administrator Login</h2>
              <p>Please enter your secure access credentials.</p>
            </motion.div>

            {error && (
              <motion.div variants={fadeInUp} className="status-error-box">
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="login-submission-form">
              <motion.div variants={fadeInUp} className="custom-input-group">
                <label>System Email</label>
                <div className="input-inner-wrapper">
                  <Mail className="input-icon-left" size={18} />
                  <input
                    type="email"
                    placeholder="admin@campuszone.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="custom-input-group">
                <label>Master Security Key</label>
                <div className="input-inner-wrapper">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                variants={fadeInUp}
                whileHover={{ y: -2, backgroundColor: "#4f46e5" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="auth-primary-btn"
                disabled={loading}
              >
                {loading ? <div className="auth-spinner"></div> : <>Continue to Command Center <ArrowRight size={18} /></>}
              </motion.button>
            </form>

            <motion.div variants={fadeInUp} className="auth-footer-note">
              <p>© {new Date().getFullYear()} Campus Zone. Secure Encrypted Session.</p>
            </motion.div>
          </motion.div>
        </section>
      </div>

      {/* Fixed bottom toast — always visible no matter scroll position */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.95)',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 9999,
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default AdminLogin;