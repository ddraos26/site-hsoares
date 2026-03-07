'use client';

import { useEffect, useState } from 'react';

function formatLastSeen(value) {
  if (!value) return 'Sem atividade recente';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(value));
  } catch {
    return 'Sem atividade recente';
  }
}

export function AdminPresenceCard() {
  const [data, setData] = useState({
    onlineUsers: 0,
    activeWindowMinutes: 3,
    lastSeenAt: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/admin/presence', { cache: 'no-store' });
        if (!response.ok) return;

        const payload = await response.json();
        if (!active) return;

        setData({
          onlineUsers: payload.onlineUsers || 0,
          activeWindowMinutes: payload.activeWindowMinutes || 3,
          lastSeenAt: payload.lastSeenAt || null
        });
        setLoading(false);
      } catch {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = window.setInterval(load, 20000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <article className="admin-presence-card">
      <div className="admin-presence-head">
        <span className="admin-presence-pulse" aria-hidden="true" />
        <p>Online agora</p>
      </div>
      <strong>{loading ? '...' : data.onlineUsers}</strong>
      <span>Sessões ativas nos últimos {data.activeWindowMinutes} min.</span>
      <small>Última atividade: {loading ? 'carregando...' : formatLastSeen(data.lastSeenAt)}</small>
    </article>
  );
}
