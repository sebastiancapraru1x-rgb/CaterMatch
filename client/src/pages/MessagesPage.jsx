import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import ChatWindow from '../components/ChatWindow';

export default function MessagesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeId = params.get('conv');
  const active = conversations.find((c) => c.id === activeId) || null;

  const load = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations || []);
      setError('');
      // Auto-select the first if none picked yet.
      if (!params.get('conv') && res.data.conversations?.length) {
        setParams({ conv: res.data.conversations[0].id }, { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [params, setParams]);

  useEffect(() => { load(); }, [load]);

  // Real-time: when a new message arrives for one of our conversations,
  // bump it to the top and update preview/unread.
  useEffect(() => {
    const socket = getSocket();
    const onNewMessage = (msg) => {
      if (!msg?.conversation_id) return;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === msg.conversation_id);
        if (!exists) { load(); return prev; }
        const mapped = prev.map((c) =>
          c.id === msg.conversation_id
            ? {
                ...c,
                last_message: msg.message_text,
                last_message_at: msg.created_at,
                unread_count:
                  msg.sender_id === user?.id ? c.unread_count : (c.unread_count || 0) + 1,
              }
            : c
        );
        return mapped.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
      });
    };
    socket.on('message:new', onNewMessage);
    return () => socket.off('message:new', onNewMessage);
  }, [load, user?.id]);

  useEffect(() => {
    if (activeId) getSocket().emit('conversation:join', activeId);
  }, [activeId]);

  if (loading) return <p className="p-8 text-center text-slate-500">Loading messages…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <BackButton className="mb-4" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
          <MessageSquare className="h-6 w-6 text-brand-600" /> Messages
        </h1>
        <button onClick={load} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && !conversations.length && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Inbox list */}
        <div className="flex flex-col gap-2">
          {!loading && conversations.length === 0 && (
            <p className="rounded-lg bg-sand-100 p-4 text-sm text-slate-600">
              No conversations yet. Find a listing and tap <b>Message</b> to start chatting!
            </p>
          )}

          {conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setParams({ conv: c.id })}
                className={`rounded-xl border p-3 text-left transition ${
                  isActive
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-sand-200 bg-sand-50 hover:border-sand-300 hover:bg-sand-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{c.listing_title}</p>
                  {c.unread_count > 0 && (
                    <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">@{c.other_party_name}</p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {c.last_message || 'No messages yet'}
                </p>
                <p className="mt-1 text-[10px] text-slate-300">
                  {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                </p>
              </button>
            );
          })}
        </div>

        {/* Chat window */}
        <div>
          {active ? (
            <ChatWindow
              key={active.id}
              conversationId={active.id}
              currentUserId={user?.id}
              onBack={() => setParams({}, { replace: true })}
            />
          ) : (
            <div className="flex h-[70vh] flex-col items-center justify-center rounded-xl border border-dashed border-sand-300 bg-sand-50 text-slate-400">
              <MessageSquare className="mb-3 h-12 w-12 opacity-40" />
              <p className="max-w-xs text-center text-sm">
                {conversations.length
                  ? 'Select a conversation to start chatting.'
                  : 'Your inbox is empty. Head to the marketplace and tap "Message" on a listing!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}