import { useEffect, useState } from 'react';
import api from '../services/api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/conversations')
      .then((res) => setConversations(res.data.conversations || []))
      .catch((err) => setError(err?.response?.data?.error || 'Messages are coming in the M3 milestone.'));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">Messages</h1>

      {error && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}

      {!error && conversations.length === 0 && (
        <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
          No conversations yet. Find a listing and start chatting!
        </p>
      )}

      {conversations.map((c) => (
        <div key={c.id} className="card mb-2 p-4">
          <p className="font-semibold text-slate-800">{c.listing_title}</p>
          <p className="text-sm text-slate-500">with @{c.other_party}</p>
        </div>
      ))}
    </div>
  );
}