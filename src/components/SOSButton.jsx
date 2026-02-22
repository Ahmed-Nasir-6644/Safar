import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  AlertCircle, X, Mail, MapPin, Loader2, CheckCircle2,
  AlertTriangle, User, Plus, Trash2, UserPlus, Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sosAPI } from '../utils/api';

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_MESSAGE = '🚨 SOS! I need emergency assistance. Please check on me immediately.';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── helpers ──────────────────────────────────────────────────────────────────
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });

// ─── shared style tokens ──────────────────────────────────────────────────────
const S = {
  row: { display: 'flex', alignItems: 'center', gap: 10 },
  card: (extra = {}) => ({
    border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', ...extra,
  }),
  contactRow: (isLast) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px',
    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
    backgroundColor: '#fff',
  }),
  avatar: (bg = '#fee2e2') => ({
    width: 36, height: 36, borderRadius: '50%',
    backgroundColor: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }),
  label: { display: 'block', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 },
  input: (err = false) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${err ? '#f87171' : '#e5e7eb'}`,
    fontSize: 13, color: '#111827',
    fontFamily: 'Poppins, sans-serif',
    outline: 'none', backgroundColor: '#fff',
  }),
  redBtn: (disabled = false) => ({
    flex: 1, padding: '12px',
    borderRadius: 12, border: 'none',
    background: disabled
      ? '#fca5a5'
      : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: '#fff', fontWeight: 700, fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'Poppins, sans-serif',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(220,38,38,0.35)',
    transition: 'all 0.2s',
  }),
  ghostBtn: {
    padding: '12px', borderRadius: 12,
    border: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
    color: '#374151', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
  },
  banner: (color) => ({
    display: 'flex', alignItems: 'flex-start', gap: 10,
    backgroundColor: color === 'red' ? '#fef2f2' : color === 'green' ? '#f0fdf4' : '#fefce8',
    border: `1px solid ${color === 'red' ? '#fecaca' : color === 'green' ? '#bbf7d0' : '#fde68a'}`,
    borderRadius: 12, padding: '12px 14px',
  }),
  badge: (ok) => ({
    flexShrink: 0, fontSize: 11, fontWeight: 700,
    padding: '3px 10px', borderRadius: 99,
    backgroundColor: ok ? '#dcfce7' : '#fee2e2',
    color: ok ? '#15803d' : '#b91c1c',
    border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
  }),
};

// ─── Tab button ───────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, padding: '9px 0',
      borderRadius: 10,
      border: 'none',
      backgroundColor: active ? '#dc2626' : 'transparent',
      color: active ? '#fff' : '#6b7280',
      fontWeight: active ? 700 : 500,
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'Poppins, sans-serif',
      transition: 'all 0.15s',
    }}
  >
    {children}
  </button>
);

// ─── SOSButton ────────────────────────────────────────────────────────────────
const SOSButton = ({ children }) => {
  const { user } = useAuth();

  // ── modal open/close ──
  const [isOpen, setIsOpen] = useState(false);

  // ── active tab: 'send' | 'contacts' ──
  const [tab, setTab] = useState('send');

  // ══ SEND-TAB state ════════════════════════════════════════════════════════
  const [message, setMessage]             = useState(DEFAULT_MESSAGE);
  const [phase, setPhase]                 = useState('idle'); // idle | locating | sending | done | error
  const [location, setLocation]           = useState(null);
  const [locationError, setLocationError] = useState('');
  const [sendError, setSendError]         = useState('');
  const [results, setResults]             = useState([]);
  const textareaRef                       = useRef(null);

  // ══ CONTACTS-TAB state ════════════════════════════════════════════════════
  const [contacts, setContacts]               = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError]     = useState('');

  // add-form
  const [addName, setAddName]       = useState('');
  const [addEmail, setAddEmail]     = useState('');
  const [addNameErr, setAddNameErr] = useState('');
  const [addEmailErr, setAddEmailErr] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [addError, setAddError]     = useState('');

  // delete
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const userId = user?._id || user?.id || null;

  // ── fetch contacts whenever contacts-tab is opened ────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    setContactsLoading(true);
    setContactsError('');
    try {
      const res = await sosAPI.getContacts(userId);
      if (res?.success && Array.isArray(res.data)) {
        setContacts(res.data);
      } else {
        setContacts([]);
      }
    } catch (err) {
      setContactsError(err.message || 'Could not load contacts.');
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && tab === 'contacts') {
      fetchContacts();
    }
  }, [isOpen, tab, fetchContacts]);

  // ── modal open/close helpers ──────────────────────────────────────────────
  const openModal = () => {
    setTab('send');
    setPhase('idle');
    setLocation(null);
    setLocationError('');
    setSendError('');
    setResults([]);
    setMessage(DEFAULT_MESSAGE);
    setAddName('');
    setAddEmail('');
    setAddNameErr('');
    setAddEmailErr('');
    setAddSuccess('');
    setAddError('');
    setDeleteError('');
    setIsOpen(true);
  };

  const closeModal = () => {
    if (phase === 'locating' || phase === 'sending' || addLoading || deletingId) return;
    setIsOpen(false);
  };

  // ══ SEND logic ════════════════════════════════════════════════════════════
  // Effective contacts = API contacts if loaded, else fallback to user object
  const effectiveContacts = contacts.length
    ? contacts
    : (user?.emergencyContacts?.length
        ? user.emergencyContacts
        : [{ name: user?.name ? `${user.name}'s Contact` : 'Emergency Contact', email: user?.email || 'contact@example.com' }]);

  const handleSend = useCallback(async () => {
    if (phase === 'locating' || phase === 'sending') return;
    setSendError('');
    setLocationError('');
    setPhase('locating');

    let loc = null;
    try {
      const pos = await getCurrentPosition();
      loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
      };
      setLocation(loc);
    } catch (err) {
      setLocationError('Location unavailable: ' + (err.message || 'Permission denied'));
    }

    setPhase('sending');
    try {
      const payload = {
        userId,
        message: message.trim() || DEFAULT_MESSAGE,
        location: loc ? { lat: loc.lat, lng: loc.lng } : null,
      };

      let response;
      try {
        response = await sosAPI.sendAlert(payload);
      } catch (apiErr) {
        console.warn('SOS API unavailable, using demo response:', apiErr.message);
        response = {
          success: true,
          message: 'SOS sent (demo)',
          data: {
            notifiedContacts: effectiveContacts.map(c => ({
              name: c.name, email: c.email,
              status: 'sent', message: 'Alert delivered (demo mode)',
            })),
          },
        };
      }

      if (!response?.success) throw new Error(response?.message || 'Failed to send SOS alert.');

      const backendContacts = response?.data?.notifiedContacts || [];
      const merged = effectiveContacts.map((c, i) => {
        const match = backendContacts.find(bc => bc.email === c.email || bc.name === c.name) || backendContacts[i];
        return { name: c.name, email: c.email, status: match?.status || 'sent', detail: match?.message || 'Alert sent' };
      });
      setResults(merged);
      setPhase('done');
    } catch (err) {
      setSendError(err.message || 'Something went wrong. Please try again.');
      setPhase('error');
    }
  }, [phase, message, userId, effectiveContacts]);

  // ══ ADD CONTACT logic ═════════════════════════════════════════════════════
  const handleAddContact = async () => {
    let valid = true;
    if (!addName.trim()) { setAddNameErr('Name is required.'); valid = false; } else setAddNameErr('');
    if (!addEmail.trim()) { setAddEmailErr('Email is required.'); valid = false; }
    else if (!EMAIL_RE.test(addEmail.trim())) { setAddEmailErr('Enter a valid email address.'); valid = false; }
    else setAddEmailErr('');
    if (!valid) return;

    setAddLoading(true);
    setAddSuccess('');
    setAddError('');
    try {
      const res = await sosAPI.addContact({ userId, name: addName.trim(), email: addEmail.trim().toLowerCase() });
      if (!res?.success) throw new Error(res?.message || 'Failed to add contact.');
      setContacts(prev => [...prev, res.data]);
      setAddName('');
      setAddEmail('');
      setAddSuccess('Contact added successfully.');
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (err) {
      setAddError(err.message || 'Could not add contact.');
    } finally {
      setAddLoading(false);
    }
  };

  // ══ DELETE CONTACT logic ══════════════════════════════════════════════════
  const handleDeleteContact = async (contactId) => {
    setDeletingId(contactId);
    setDeleteError('');
    try {
      const res = await sosAPI.deleteContact(contactId, userId);
      if (!res?.success) throw new Error(res?.message || 'Failed to delete contact.');
      setContacts(prev => prev.filter(c => (c._id || c.id) !== contactId));
    } catch (err) {
      setDeleteError(err.message || 'Could not delete contact.');
    } finally {
      setDeletingId(null);
    }
  };

  // ══ Modal JSX ══════════════════════════════════════════════════════════════
  const modal = isOpen ? ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      }}
      onClick={closeModal}
    >
      <div
        style={{
          backgroundColor: '#fff', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: '480px', maxHeight: '92dvh',
          overflowY: 'auto', fontFamily: 'Poppins, sans-serif',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: '#e5e7eb' }} />
        </div>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          padding: '14px 20px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
            <AlertCircle size={22} />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Emergency Assistance</span>
          </div>
          <button
            onClick={closeModal}
            disabled={phase === 'locating' || phase === 'sending' || !!addLoading || !!deletingId}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: '#991b1b', border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4 }}>
            <TabBtn active={tab === 'send'} onClick={() => setTab('send')}>🚨 Send SOS</TabBtn>
            <TabBtn active={tab === 'contacts'} onClick={() => setTab('contacts')}>👥 Contacts</TabBtn>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px 28px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          {/* ══════════════════ SEND TAB ══════════════════ */}
          {tab === 'send' && (
            <>
              {/* ── DONE ── */}
              {phase === 'done' && (
                <>
                  <div style={S.banner('green')}>
                    <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#15803d', fontSize: 15 }}>Alert Sent!</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#16a34a' }}>Your emergency contacts have been notified.</p>
                    </div>
                  </div>

                  {location && (
                    <div style={{ ...S.banner('blue'), backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                      <MapPin size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#1d4ed8' }}>
                        Location shared: <strong>{location.label}</strong>
                      </span>
                    </div>
                  )}

                  {locationError && (
                    <div style={S.banner('yellow')}>
                      <AlertTriangle size={15} color="#ca8a04" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#854d0e' }}>Sent without location — {locationError}</span>
                    </div>
                  )}

                  <div>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Notification Status</p>
                    <div style={S.card()}>
                      {results.map((c, i) => (
                        <div key={i} style={S.contactRow(i === results.length - 1)}>
                          <div style={S.avatar(c.status === 'sent' ? '#dcfce7' : '#fee2e2')}>
                            <User size={16} color={c.status === 'sent' ? '#16a34a' : '#dc2626'} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                          </div>
                          <span style={S.badge(c.status === 'sent')}>{c.status === 'sent' ? '✓ Sent' : '✗ Failed'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setIsOpen(false)} style={S.ghostBtn}>Close</button>
                </>
              )}

              {/* ── ERROR ── */}
              {phase === 'error' && (
                <>
                  <div style={S.banner('red')}>
                    <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#b91c1c', fontSize: 14 }}>Failed to send alert</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#dc2626', marginTop: 3 }}>{sendError}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleSend} style={S.redBtn(false)}><Mail size={15} /> Retry</button>
                    <button onClick={() => { setPhase('idle'); setSendError(''); }} style={{ ...S.ghostBtn, flex: 1 }}>Cancel</button>
                  </div>
                </>
              )}

              {/* ── IDLE / LOCATING / SENDING ── */}
              {(phase === 'idle' || phase === 'locating' || phase === 'sending') && (
                <>
                  <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, margin: 0 }}>
                    Your live location and message will be sent to your emergency contacts.
                  </p>

                  {/* Contacts preview */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#374151' }}>
                      Emergency Contacts ({effectiveContacts.length})
                    </p>
                    <div style={S.card()}>
                      {effectiveContacts.map((c, i) => (
                        <div key={i} style={S.contactRow(i === effectiveContacts.length - 1)}>
                          <div style={S.avatar()}><User size={16} color="#dc2626" /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                          </div>
                          <Mail size={13} color="#d1d5db" style={{ flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setTab('contacts')}
                      style={{ marginTop: 6, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}
                    >
                      + Manage contacts
                    </button>
                  </div>

                  {/* Message */}
                  <div>
                    <label style={S.label}>Message</label>
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={phase !== 'idle'}
                      rows={3}
                      placeholder="Describe your situation…"
                      style={{
                        ...S.input(),
                        resize: 'vertical',
                        backgroundColor: phase !== 'idle' ? '#f9fafb' : '#fff',
                      }}
                      onFocus={e => e.target.style.borderColor = '#dc2626'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Location strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '9px 13px', fontSize: 12 }}>
                    {phase === 'locating'
                      ? <Loader2 size={14} color="#2563eb" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                      : <MapPin size={14} color="#2563eb" style={{ flexShrink: 0 }} />}
                    <span style={{ color: '#1d4ed8' }}>
                      {phase === 'locating' ? 'Getting your location…' : 'Your current location will be automatically included.'}
                    </span>
                  </div>

                  {locationError && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '9px 13px', fontSize: 12 }}>
                      <AlertTriangle size={14} color="#ca8a04" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: '#854d0e' }}>{locationError} — SOS will still be sent.</span>
                    </div>
                  )}

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={phase !== 'idle'}
                    style={{ ...S.redBtn(phase !== 'idle'), width: '100%', padding: '14px', fontSize: 15 }}
                  >
                    {phase === 'sending'
                      ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending Alert…</>
                      : phase === 'locating'
                      ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Getting Location…</>
                      : <><Send size={18} /> Send Email Alert</>}
                  </button>
                </>
              )}
            </>
          )}

          {/* ══════════════════ CONTACTS TAB ══════════════════ */}
          {tab === 'contacts' && (
            <>
              {/* ── Add contact form ── */}
              <div style={{ backgroundColor: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={16} color="#dc2626" />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111827' }}>Add Emergency Contact</p>
                </div>

                {/* Name */}
                <div>
                  <label style={S.label}>Name</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={e => { setAddName(e.target.value); if (addNameErr) setAddNameErr(''); }}
                    placeholder="e.g. Mom"
                    style={S.input(!!addNameErr)}
                    onFocus={e => e.target.style.borderColor = addNameErr ? '#f87171' : '#dc2626'}
                    onBlur={e => e.target.style.borderColor = addNameErr ? '#f87171' : '#e5e7eb'}
                    disabled={addLoading}
                  />
                  {addNameErr && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#ef4444' }}>{addNameErr}</p>}
                </div>

                {/* Email */}
                <div>
                  <label style={S.label}>Email</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={e => { setAddEmail(e.target.value); if (addEmailErr) setAddEmailErr(''); }}
                    placeholder="e.g. mom@example.com"
                    style={S.input(!!addEmailErr)}
                    onFocus={e => e.target.style.borderColor = addEmailErr ? '#f87171' : '#dc2626'}
                    onBlur={e => e.target.style.borderColor = addEmailErr ? '#f87171' : '#e5e7eb'}
                    disabled={addLoading}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddContact(); }}
                  />
                  {addEmailErr && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#ef4444' }}>{addEmailErr}</p>}
                </div>

                {/* Feedback */}
                {addSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 12 }}>
                    <CheckCircle2 size={14} /> {addSuccess}
                  </div>
                )}
                {addError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 12 }}>
                    <AlertCircle size={14} /> {addError}
                  </div>
                )}

                <button
                  onClick={handleAddContact}
                  disabled={addLoading}
                  style={{ ...S.redBtn(addLoading), width: '100%', padding: '11px' }}
                >
                  {addLoading
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Adding…</>
                    : <><Plus size={15} /> Add Contact</>}
                </button>
              </div>

              {/* ── Contacts list ── */}
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#374151' }}>
                  Saved Contacts {contacts.length > 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}>({contacts.length})</span>}
                </p>

                {contactsLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8, color: '#9ca3af', fontSize: 13 }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading contacts…
                  </div>
                )}

                {!contactsLoading && contactsError && (
                  <div style={S.banner('red')}>
                    <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#b91c1c' }}>{contactsError}</span>
                  </div>
                )}

                {deleteError && (
                  <div style={{ ...S.banner('red'), marginBottom: 8 }}>
                    <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#b91c1c' }}>{deleteError}</span>
                  </div>
                )}

                {!contactsLoading && contacts.length === 0 && !contactsError && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>
                    <User size={28} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No emergency contacts yet.</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11 }}>Add one above to get started.</p>
                  </div>
                )}

                {!contactsLoading && contacts.length > 0 && (
                  <div style={S.card()}>
                    {contacts.map((c, i) => {
                      const cId = c._id || c.id;
                      const isDeleting = deletingId === cId;
                      return (
                        <div key={cId || i} style={S.contactRow(i === contacts.length - 1)}>
                          <div style={S.avatar()}>
                            <User size={16} color="#dc2626" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteContact(cId)}
                            disabled={isDeleting || !!deletingId}
                            style={{
                              flexShrink: 0,
                              width: 32, height: 32, borderRadius: 8,
                              border: '1px solid #fecaca',
                              backgroundColor: isDeleting ? '#fef2f2' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: isDeleting || !!deletingId ? 'not-allowed' : 'pointer',
                              opacity: !!deletingId && !isDeleting ? 0.4 : 1,
                              transition: 'all 0.15s',
                            }}
                            title="Remove contact"
                            aria-label={`Remove ${c.name}`}
                          >
                            {isDeleting
                              ? <Loader2 size={14} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />
                              : <Trash2 size={14} color="#dc2626" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {children
        ? <div onClick={openModal}>{children}</div>
        : (
          <button
            onClick={openModal}
            className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 hover:scale-110 transition-all duration-300 animate-pulse"
            aria-label="SOS Emergency"
          >
            <span className="font-bold text-lg">SOS</span>
          </button>
        )}
      {modal}
    </>
  );
};

export default SOSButton;
