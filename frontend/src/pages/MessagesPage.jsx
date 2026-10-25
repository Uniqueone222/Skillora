import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Empty, Loading, Notice } from "../components/ui.jsx";

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const educatorId = searchParams.get("educatorId");
  const initialConversationId = searchParams.get("conversationId");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(initialConversationId || null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);

  async function loadConversations(preferredId = selected) {
    const { conversations: result } = await request("/conversations");
    setConversations(result);
    if (!preferredId && result.length) setSelected(result[0]._id);
    return result;
  }

  useEffect(() => {
    loadConversations().catch((reason) => setError(errorMessage(reason)));
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    request(`/conversations/${selected}/messages`)
      .then(({ messages: result }) => setMessages(result))
      .catch((reason) => setError(errorMessage(reason)));
  }, [selected]);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function startConversation() {
    setBusy(true);
    setError("");
    try {
      const { conversation } = await request("/conversations", {
        method: "POST",
        data: { educatorId }
      });
      setSelected(conversation._id);
      await loadConversations(conversation._id);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = form.get("body");
    setBusy(true);
    try {
      const { message } = await request(`/conversations/${selected}/messages`, {
        method: "POST",
        data: { body }
      });
      setMessages((current) => [...current, { ...message, senderId: { _id: user.id, name: user.name } }]);
      event.currentTarget.reset();
      await loadConversations();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const active = conversations.find((item) => item._id === selected);
  const other = active?.participants.find((participant) => participant._id !== user.id);
  return (
    <div className="container section">
      <div className="dashboard-welcome"><div><span className="eyebrow">Direct connection</span><h1>Your conversations.</h1><p>Messages are saved on the server. Live delivery is not enabled yet.</p></div></div>
      {error && <Notice tone="error">{error}</Notice>}
      {educatorId && !selected && <div className="start-chat"><span className="eyebrow">Contact educator</span><p>Start a private conversation. The educator must have messaging enabled.</p><button className="button" onClick={startConversation} disabled={busy}>{busy ? "Starting…" : "Start conversation"} <span>↗</span></button></div>}
      <div className="messenger">
        <aside className="conversation-list"><span className="eyebrow">Inbox</span>{conversations.map((conversation) => {
          const participant = conversation.participants.find((entry) => entry._id !== user.id);
          return <button className={`conversation-row ${conversation._id === selected ? "active" : ""}`} key={conversation._id} onClick={() => setSelected(conversation._id)}><span className="avatar">{participant?.name?.slice(0, 1).toUpperCase()}</span><span><b>{participant?.name || "Skillora member"}</b><small>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleDateString() : "New conversation"}</small></span></button>;
        })}{!conversations.length && !educatorId && <Empty title="Your inbox is clear">Visit an educator profile to start a conversation when they have enabled messaging.</Empty>}</aside>
        <section className="message-window">
          {active ? <><header className="message-header"><span className="avatar">{other?.name?.slice(0, 1).toUpperCase()}</span><div><b>{other?.name || "Conversation"}</b><small>Private conversation</small></div></header><div className="message-feed">{messages.map((message) => <div className={`message-bubble ${message.senderId?._id === user.id ? "mine" : ""}`} key={message._id}><p>{message.body}</p><small>{new Date(message.createdAt).toLocaleString()}</small></div>)}<div ref={bottom} /></div><form className="message-compose" onSubmit={send}><input name="body" required maxLength="5000" placeholder="Write a message…" /><button className="button button-small" disabled={busy}>Send <span>↗</span></button></form></> : <Empty title="Choose a conversation">Your messages stay private to the people in the conversation.</Empty>}
        </section>
      </div>
    </div>
  );
}
