import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

const MAX_LENGTH = 2000;

export default function ChatWindow({ conversationId, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get(`/messages/${conversationId}`);
      setMessages(res.data.messages || []);
      scrollToBottom();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadHistory();

    // Listen for real-time incoming messages.
    const socket = getSocket();
    socket.emit('conversation:join', conversationId);

    const onNewMessage = (msg) => {
      if (msg?.conversation_id !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    };
    socket.on('message:new', onNewMessage);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.emit('conversation:leave', conversationId);
    };
  }, [conversationId, loadHistory]);

  async function send(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) return;
    try {
      const res = await api.post(`/messages/${conversationId}`, { message_text: trimmed });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.message.id)) return prev;
        return [...prev, res.data.message];
      });
      setText('');
      scrollToBottom();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not send message.');
    }
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button onClick={onBack} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 sm:hidden" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <MessageSquare className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-slate-900">Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
        {loading && <p className="text-center text-sm text-slate-400">Loading messages…</p>}
        {!loading && error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            No messages yet — say hi 👋
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  mine
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.message_text}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                  {formatTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_LENGTH}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex items-center gap-1 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}