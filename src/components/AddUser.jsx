import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Phone, BookOpen, BadgeCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './AddUser.css';

const ROLES = [
    { value: 'admin', label: 'Admin / Principal' },
    { value: 'teacher', label: 'Teacher / Faculty' },
    { value: 'student', label: 'Student' },
    { value: 'driver', label: 'Bus Driver' },
    { value: 'staff', label: 'Staff / Non-Faculty' },
    { value: 'owner', label: 'Owner / Co-Owner' },
];

const initialForm = {
    full_name: '',
    email: '',
    password: '',
    role: '',
    register_id: '',
    phone: '',
    department: '',
};

const AddUser = () => {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!form.role) { setError('Please select a role.'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

        setLoading(true);
        try {
            // Check if email already exists
            const { data: existing } = await supabase
                .from('campus_users')
                .select('id')
                .eq('email', form.email.trim().toLowerCase())
                .limit(1);

            if (existing && existing.length > 0) {
                throw new Error('A user with this email already exists.');
            }

            // Check if register_id already exists (if provided)
            if (form.register_id.trim()) {
                const { data: dupId } = await supabase
                    .from('campus_users')
                    .select('id')
                    .eq('register_id', form.register_id.trim().toUpperCase())
                    .limit(1);
                if (dupId && dupId.length > 0) {
                    throw new Error('A user with this Register ID already exists.');
                }
            }

            // Insert new user into Supabase
            const { error: insertError } = await supabase
                .from('campus_users')
                .insert([{
                    full_name: form.full_name.trim(),
                    email: form.email.trim().toLowerCase(),
                    password_hash: form.password,  // store as-is (plaintext for now; upgrade later)
                    role: form.role,
                    register_id: form.register_id.trim().toUpperCase() || null,
                    phone: form.phone.trim() || null,
                    department: form.department.trim() || null,
                    is_active: true,
                }]);

            if (insertError) throw new Error(insertError.message);

            setSuccess(`✅ User "${form.full_name}" created successfully as ${form.role.toUpperCase()}! They can now log in.`);
            setForm(initialForm);

        } catch (err) {
            setError(err.message || 'Failed to create user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fadeInUp = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="add-user-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="add-user-header"
            >
                <div className="add-user-title-group">
                    <UserPlus size={28} className="add-user-icon" />
                    <div>
                        <h1>Add New User</h1>
                        <p>Create a campus account with a custom role. The user can log in immediately after creation.</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="add-user-card"
            >
                {/* Success */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="add-user-alert add-user-alert--success"
                    >
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="add-user-alert add-user-alert--error"
                    >
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="add-user-form">

                    {/* Row 1: Full Name + Role */}
                    <div className="add-user-row">
                        <div className="add-user-field">
                            <label><User size={14} /> Full Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="e.g. Rahul Sharma"
                                required
                            />
                        </div>

                        <div className="add-user-field">
                            <label><BadgeCheck size={14} /> Role <span className="required">*</span></label>
                            <select name="role" value={form.role} onChange={handleChange} required>
                                <option value="" disabled>Select role...</option>
                                {ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Email + Password */}
                    <div className="add-user-row">
                        <div className="add-user-field">
                            <label><Mail size={14} /> Email Address <span className="required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="user@campuszone.edu"
                                required
                            />
                        </div>

                        <div className="add-user-field">
                            <label><Lock size={14} /> Password <span className="required">*</span></label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min. 6 characters"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* Row 3: Register ID + Phone */}
                    <div className="add-user-row">
                        <div className="add-user-field">
                            <label><BadgeCheck size={14} /> Register ID <span className="optional">(optional)</span></label>
                            <input
                                type="text"
                                name="register_id"
                                value={form.register_id}
                                onChange={handleChange}
                                placeholder="e.g. STU001 / TCH002"
                            />
                        </div>

                        <div className="add-user-field">
                            <label><Phone size={14} /> Phone <span className="optional">(optional)</span></label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                    </div>

                    {/* Row 4: Department */}
                    <div className="add-user-row">
                        <div className="add-user-field add-user-field--full">
                            <label><BookOpen size={14} /> Department / Class <span className="optional">(optional)</span></label>
                            <input
                                type="text"
                                name="department"
                                value={form.department}
                                onChange={handleChange}
                                placeholder="e.g. Computer Science — Semester 5"
                            />
                        </div>
                    </div>

                    {/* Role badge preview */}
                    {form.role && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`role-badge-preview role-badge--${form.role}`}
                        >
                            Role assigned: <strong>{ROLES.find(r => r.value === form.role)?.label}</strong>
                        </motion.div>
                    )}

                    <button type="submit" className="add-user-submit-btn" disabled={loading}>
                        {loading ? (
                            <><div className="add-user-spinner"></div> Creating User...</>
                        ) : (
                            <><UserPlus size={18} /> Create User Account</>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AddUser;
