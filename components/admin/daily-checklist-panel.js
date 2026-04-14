'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

function openChecklistHref(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getChecklistCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openChecklistHref(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openChecklistHref(router, href, basePath);
      }
    }
  };
}

function ProgressBar({ percent = 0 }) {
  return (
    <div className="daily-checklist-progress">
      <div className="daily-checklist-progress-bar" style={{ width: `${Math.max(6, Number(percent || 0))}%` }} />
    </div>
  );
}

function ChecklistToggle({ item, busy, onToggle }) {
  return (
    <button
      type="button"
      className={`daily-checklist-toggle ${item.isDone ? 'is-done' : ''}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onToggle(item);
      }}
      disabled={busy}
      aria-pressed={item.isDone}
      aria-label={item.isDone ? `Desmarcar ${item.title}` : `Marcar ${item.title} como feito`}
    >
      <span />
    </button>
  );
}

function getChecklistOpenLabel(href) {
  return String(href || '').includes('guide=') ? 'Me guiar' : 'Abrir';
}

export function DailyChecklistSummary({
  apiBase = '/api/admin',
  basePath = '/admin',
  initialData = null,
  href = '/admin/checklist'
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/daily-checklist`;
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 45_000);
      setData(initialData);
      return undefined;
    }

    let active = true;
    fetchAdminJson(endpoint, { ttlMs: 30_000 })
      .then((payload) => {
        if (active && !payload?.error) {
          setData(payload);
        }
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [endpoint, initialData]);

  return (
    <article
      className={`admin-day-summary ${href ? 'admin-actionable-card' : ''}`}
      {...getChecklistCardProps(router, href, basePath)}
    >
      <div>
        <span>Checklist do dia</span>
        <strong>{data?.summary?.label || 'Montando sua rotina...'}</strong>
        <small>{data?.summary?.pending != null ? `${data.summary.pending} pendencias no dia` : 'Sem leitura de progresso'}</small>
      </div>
      <div className="admin-day-summary-side">
        <b>{data?.summary?.completed || 0}/{data?.summary?.total || 0}</b>
        <ProgressBar percent={data?.summary?.percent || 0} />
      </div>
    </article>
  );
}

export function DailyChecklistPanel({
  apiBase = '/api/admin',
  basePath = '/admin',
  initialData = null,
  compact = false,
  title = 'Checklist do dia',
  eyebrow = 'Rotina'
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/daily-checklist`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 45_000);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchAdminJson(endpoint, { ttlMs: 30_000 });
        if (payload?.error) throw new Error(payload.detail || payload.error);
        if (active) setData(payload);
      } catch (err) {
        if (active) setError(err.message || 'Falha ao carregar o checklist diario.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [endpoint, initialData]);

  async function handleToggle(item) {
    if (!data) return;

    const optimistic = {
      ...data,
      items: data.items.map((entry) =>
        entry.key === item.key
          ? {
              ...entry,
              isDone: !entry.isDone,
              doneAt: !entry.isDone ? new Date().toISOString() : null
            }
          : entry
      )
    };
    const completed = optimistic.items.filter((entry) => entry.isDone).length;
    optimistic.summary = {
      total: optimistic.items.length,
      completed,
      pending: optimistic.items.length - completed,
      percent: optimistic.items.length ? Number(((completed / optimistic.items.length) * 100).toFixed(1)) : 0,
      label:
        optimistic.items.length && completed === optimistic.items.length
          ? 'Dia fechado'
          : `${completed}/${optimistic.items.length} feitos hoje`
    };

    setData(optimistic);
    setBusyKey(item.key);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.date,
          itemKey: item.key,
          isDone: !item.isDone
        })
      });
      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error(payload?.detail || payload?.error || 'Falha ao atualizar checklist.');
      }
      setData(payload.snapshot);
      primeAdminJsonCache(endpoint, payload.snapshot, 15_000);
    } catch (err) {
      setError(err.message || 'Falha ao atualizar checklist.');
      setData(data);
    } finally {
      setBusyKey('');
    }
  }

  if (loading) {
    return <p className="dashboard-card-empty">Montando o checklist do dia...</p>;
  }

  if (error && !data) {
    return <p className="dashboard-error">{error}</p>;
  }

  if (!data) {
    return <p className="dashboard-card-empty">Sem checklist disponivel para hoje.</p>;
  }

  const visibleItems = compact ? data.items.slice(0, 4) : data.items;

  return (
    <section className={`daily-checklist-card ${compact ? 'daily-checklist-card--compact' : ''}`}>
      <div className="daily-checklist-head">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <div className="daily-checklist-score">
          <strong>{data.summary.completed}/{data.summary.total}</strong>
          <small>{data.summary.pending} pendentes</small>
        </div>
      </div>

      <p className="daily-checklist-summary">{data.summary.label}</p>
      <ProgressBar percent={data.summary.percent} />

      <div className="daily-checklist-list">
        {visibleItems.map((item) => (
          <div key={item.key} className={`daily-checklist-item ${item.isDone ? 'is-done' : ''}`}>
            <ChecklistToggle item={item} busy={busyKey === item.key} onToggle={handleToggle} />
            <div className="daily-checklist-copy">
              <small>{item.bucket}</small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            {item.href ? (
              <button
                type="button"
                className="daily-checklist-open"
                onClick={() => openChecklistHref(router, item.href, basePath)}
              >
                {getChecklistOpenLabel(item.href)}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="dashboard-error">{error}</p> : null}
    </section>
  );
}
