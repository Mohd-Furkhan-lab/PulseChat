import { useCallback, useEffect, useRef, useState } from "react";
import { api, WS_URL } from "./api";

const messageOf = (error) => error instanceof Error ? error.message : "Something went wrong";

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      if (mode === "signup") {
        const result = await api.signUp(email, password);
        setMode("login"); setPassword("");
        setError(`Account created. Your username is ${result.user_name}. Please log in.`);
      } else {
        await api.login(email, password);
        onLogin(await api.me());
      }
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <h1>Chat</h1><p>{mode === "login" ? "Log in to continue." : "Create an account."}</p>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {error && <p className="form-message">{error}</p>}
      <button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}</button>
      <button className="text-button" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </form>
  </main>;
}

function ChatApp({ user, onLogout }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [newContact, setNewContact] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Connecting…");
  const socketRef = useRef(null);
  const selectedRef = useRef("");

  useEffect(() => { selectedRef.current = selectedContact; }, [selectedContact]);

  const loadContacts = useCallback(async () => {
    try {
      const result = await api.contacts();
      const items = [...(result.chats || [])].sort();
      setContacts(items);
      setSelectedContact((current) => current || items[0] || "");
    } catch (requestError) {
      if (messageOf(requestError) !== "No Chats Found") setError(messageOf(requestError));
      setContacts([]);
    }
  }, []);

  const loadMessages = useCallback(async (username) => {
    if (!username) return setMessages([]);
    try { const result = await api.messages(username); setMessages(Array.isArray(result) ? result : []); }
    catch (requestError) { setError(messageOf(requestError)); }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadMessages(selectedContact); }, [selectedContact, loadMessages]);
  useEffect(() => {
    let manuallyClosed = false;
    const socket = new WebSocket(WS_URL); socketRef.current = socket;
    socket.onopen = () => setStatus("Online");
    socket.onerror = () => setStatus("Connection error");
    socket.onclose = () => { if (!manuallyClosed) setStatus("Offline"); };
    socket.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);
        setContacts((current) => [...new Set([...current, incoming.from])].sort());
        if (selectedRef.current === incoming.from) setMessages((current) => [...current, { msg_id: `live-${Date.now()}`, msg: incoming.message, timestamp: new Date().toISOString(), incoming: true }]);
      } catch { /* Ignore malformed socket messages. */ }
    };
    return () => { manuallyClosed = true; socket.close(); };
  }, []);

  function addContact(event) {
    event.preventDefault(); const username = newContact.trim(); if (!username) return;
    setContacts((current) => [...new Set([...current, username])].sort());
    setSelectedContact(username); setNewContact("");
  }

  async function sendMessage(event) {
    event.preventDefault(); const message = text.trim(); if (!message || !selectedContact) return;
    const optimistic = { msg_id: `local-${Date.now()}`, msg: message, timestamp: new Date().toISOString(), incoming: false };
    setMessages((current) => [...current, optimistic]); setText(""); setError("");
    try { await api.sendMessage(selectedContact, message); }
    catch (requestError) { setMessages((current) => current.filter((item) => item.msg_id !== optimistic.msg_id)); setText(message); setError(messageOf(requestError)); }
  }

  async function clearChat() {
    if (!selectedContact || !window.confirm(`Clear chat with ${selectedContact}?`)) return;
    try { await api.clearChat(selectedContact); setContacts((current) => current.filter((contact) => contact !== selectedContact)); setSelectedContact(""); setMessages([]); }
    catch (requestError) { setError(messageOf(requestError)); }
  }

  async function logout() { try { await api.logout(); } catch { /* Local session still clears. */ } socketRef.current?.close(); onLogout(); }

  return <main className="chat-layout">
    <aside className="sidebar">
      <div className="sidebar-header"><div><strong>{user.user_name}</strong><span className="connection-status">{status}</span></div><button className="text-button" onClick={logout}>Log out</button></div>
      <form className="add-contact" onSubmit={addContact}><input placeholder="Username to message" value={newContact} onChange={(event) => setNewContact(event.target.value)} /><button>Add</button></form>
      <nav className="contacts" aria-label="Chats">
        {contacts.map((contact) => <button key={contact} className={contact === selectedContact ? "contact active" : "contact"} onClick={() => setSelectedContact(contact)}>{contact}</button>)}
        {!contacts.length && <p className="empty">No chats yet. Add a username to start one.</p>}
      </nav>
    </aside>
    <section className="conversation">
      {selectedContact ? <>
        <header className="conversation-header"><h2>{selectedContact}</h2><button className="text-button" onClick={clearChat}>Clear chat</button></header>
        {error && <p className="error-banner">{error}</p>}
        <div className="message-list">{messages.map((message) => <div key={message.msg_id} className={message.incoming ? "message incoming" : "message outgoing"}><p>{message.msg}</p><time>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}{!messages.length && <p className="empty">No messages yet.</p>}</div>
        <form className="composer" onSubmit={sendMessage}><input placeholder="Write a message" value={text} onChange={(event) => setText(event.target.value)} /><button>Send</button></form>
      </> : <div className="empty-state">Select or add a username to begin a chat.</div>}
    </section>
  </main>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("chat-theme") || "light");
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("chat-theme", theme); }, [theme]);
  useEffect(() => { (async () => { try { setUser(await api.me()); } catch { try { await api.refresh(); setUser(await api.me()); } catch { setUser(null); } } finally { setLoading(false); } })(); }, []);
  if (loading) return <main className="loading">Loading…</main>;
  return <><button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>{theme === "dark" ? "Light mode" : "Dark mode"}</button>{user ? <ChatApp user={user} onLogout={() => setUser(null)} /> : <AuthScreen onLogin={setUser} />}</>;
}
