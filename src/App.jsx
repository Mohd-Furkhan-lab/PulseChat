import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, WS_BASE } from './api';
import { SoundFX } from './sound';
import './styles.css';

function getAvatarGradient(name) {
  if (!name) return 'linear-gradient(135deg, #6366f1, #a855f7)';
  const gradients = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

// Toast System Component
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// Auth Screen Component
function AuthScreen({ onLoginSuccess, addToast }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.login(email, password);
      addToast('Signed in successfully!', 'success');
      const user = await api.me();
      onLoginSuccess(user);
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.signup(email, password);
      addToast(`Account created! Username: ${res.user_name}`, 'success');
      setTab('login');
      await api.login(email, password);
      const user = await api.me();
      onLoginSuccess(user);
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-view">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="logo-mark">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h1 class="brand-title">PulseChat</h1>
          <p className="brand-subtitle">React real-time messaging</p>
        </div>

        <div className="auth-tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`tab-btn ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Create Account</button>
          <div className={`tab-indicator ${tab === 'signup' ? 'signup' : ''}`}></div>
        </div>

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input type="email" placeholder="newuser@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input type="password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <div className="info-banner">
              <span>Your unique handle will be auto-generated upon registration.</span>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
function ChatDashboard({ user, onLogout, addToast }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeContactRef = useRef(activeContact);

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      const res = await api.contacts();
      setContacts(res.chats || []);
    } catch (err) {
      setContacts([]);
    }
  }, []);

  // Load chat history for active contact
  const loadMessages = useCallback(async (contactName) => {
    if (!contactName) {
      setMessages([]);
      return;
    }
    try {
      const res = await api.messages(contactName);
      setMessages(Array.isArray(res.messages) ? res.messages : []);
    } catch (err) {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    loadMessages(activeContact);
  }, [activeContact, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket Lifecycle & Auto-reconnect on visibility / focus / network restore
  const connectWS = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (socketRef.current) {
      try { socketRef.current.close(); } catch(e){}
    }

    const ws = new WebSocket(`${WS_BASE}/ws/connect`);
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      loadContacts();
      if (activeContactRef.current) {
        loadMessages(activeContactRef.current);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        SoundFX.receive();
        const fromUser = data.from;
        
        if (activeContactRef.current === fromUser) {
          setMessages(prev => [...prev, {
            sender: fromUser,
            content: data.message,
            created_at: new Date().toISOString()
          }]);
        } else {
          addToast(`New message from ${fromUser}`, 'info');
        }
        loadContacts();
      } catch (e) {}
    };
  }, [addToast, loadContacts, loadMessages]);

  useEffect(() => {
    connectWS();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        connectWS();
        loadContacts();
        if (activeContactRef.current) {
          loadMessages(activeContactRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED)) {
        connectWS();
      }
    }, 4000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleVisibilityOrFocus);
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWS, loadContacts, loadMessages]);

  const selectContact = (name) => {
    setActiveContact(name);
    setMobileSidebarVisible(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeContact) return;

    const text = inputMsg.trim();
    setInputMsg('');

    const optMsg = {
      sender: user.user_name,
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optMsg]);
    SoundFX.send();

    try {
      const res = await api.sendMessage(activeContact, text);
      if (res.message === 'user offline') {
        addToast(`${activeContact} is offline`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Failed to send message', 'error');
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    if (newContactName.trim() === user.user_name) {
      addToast('Cannot add yourself', 'error');
      return;
    }

    try {
      const res = await api.addContact(newContactName.trim());
      addToast(res.message || `Connected with ${newContactName}`, 'success');
      setShowModal(false);
      const name = newContactName.trim();
      setNewContactName('');
      await loadContacts();
      selectContact(name);
    } catch (err) {
      addToast(err.message || 'Could not add contact', 'error');
    }
  };

  const handleClearChat = async () => {
    if (!activeContact || !window.confirm(`Clear chat with ${activeContact}?`)) return;
    try {
      await api.clearChat(activeContact);
      addToast('Chat history cleared', 'success');
      setMessages([]);
    } catch (err) {
      addToast(err.message || 'Failed to clear chat', 'error');
    }
  };

  const filteredContacts = contacts.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="chat-view">
      <div className="dashboard-container glass-panel">
        
        {/* Sidebar */}
        <aside className={`sidebar ${!mobileSidebarVisible ? 'hidden-mobile' : ''}`}>
          <div className="user-profile-bar">
            <div className="user-info-wrapper">
              <div className="avatar avatar-md" style={{ background: getAvatarGradient(user.user_name) }}>
                {user.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <h3 className="user-name">{user.user_name}</h3>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <button className="icon-btn danger" onClick={onLogout} title="Sign Out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>

          <div className="sidebar-controls">
            <div className="search-input-wrapper">
              <input type="text" placeholder="Filter conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn btn-secondary btn-icon-only" onClick={() => setShowModal(true)} title="Add Contact">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          <div className="ws-status-bar">
            <span className={`status-dot ${wsConnected ? 'online' : 'offline'}`}></span>
            <span>{wsConnected ? 'Live WebSocket Active' : 'Disconnected'}</span>
          </div>

          <div className="contacts-section">
            <div className="section-header">
              <span>Messages</span>
              <button className="btn-text" onClick={loadContacts}>Refresh</button>
            </div>
            <div className="contacts-list">
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No contacts found. Click '+' above to add a chat.
                </div>
              ) : (
                filteredContacts.map(c => (
                  <div key={c} className={`contact-item ${activeContact === c ? 'active' : ''}`} onClick={() => selectContact(c)}>
                    <div className="avatar" style={{ background: getAvatarGradient(c) }}>{c.charAt(0).toUpperCase()}</div>
                    <div className="contact-item-info">
                      <div className="contact-item-name">{c}</div>
                      <div className="contact-item-sub">Click to view message stream</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Chat Stream */}
        <main className={`main-chat ${mobileSidebarVisible ? 'hidden-mobile' : ''}`}>
          {!activeContact ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2>Select a conversation</h2>
              <p>Choose a contact from the sidebar or start a new chat to begin messaging.</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <span>Start New Conversation</span>
              </button>
            </div>
          ) : (
            <div className="active-chat-wrapper">
              <header className="chat-header">
                <div className="chat-header-info">
                  <button className="icon-btn mobile-only" onClick={() => setMobileSidebarVisible(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  </button>
                  <div className="avatar avatar-md" style={{ background: getAvatarGradient(activeContact) }}>
                    {activeContact.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-details">
                    <h3 className="contact-name">{activeContact}</h3>
                    <div className="contact-status">
                      <span className="status-indicator-dot"></span>
                      <span>Connected</span>
                    </div>
                  </div>
                </div>

                <button className="icon-btn danger" onClick={handleClearChat} title="Clear Chat History">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </header>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                    No messages yet with <strong>{activeContact}</strong>.
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isOutgoing = m.sender === user.user_name;
                    return (
                      <div key={idx} className={`msg-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                        <div className="msg-bubble">{m.content || m.msg}</div>
                        <div className="msg-meta">
                          <span>{new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-bar">
                <form className="message-form" onSubmit={handleSendMessage}>
                  <div className="chat-input-wrapper">
                    <input type="text" placeholder="Type a message..." value={inputMsg} onChange={e => setInputMsg(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-round">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Add Contact */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Conversation</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddContact}>
              <div className="input-group">
                <label>Username / Handle</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="e.g. bold_coder_12" value={newContactName} onChange={e => setNewContactName(e.target.value)} required autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Start Chat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// App Root
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await api.me();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setUser(null);
    addToast('Signed out', 'info');
  };

  if (loading) {
    return (
      <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading session...
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="glow-bg">
        <div className="glow-blob blob-1"></div>
        <div className="glow-blob blob-2"></div>
        <div className="glow-blob blob-3"></div>
      </div>

      <ToastContainer toasts={toasts} />

      {!user ? (
        <AuthScreen onLoginSuccess={setUser} addToast={addToast} />
      ) : (
        <ChatDashboard user={user} onLogout={handleLogout} addToast={addToast} />
      )}
    </div>
  );
}
