'use client';

import { useEffect } from 'react';

function openTargetFromHash() {
  if (typeof window === 'undefined') return;

  const targetId = window.location.hash.replace('#', '').trim();
  if (!targetId) return;

  const element = document.getElementById(targetId);
  if (!(element instanceof HTMLDetailsElement)) return;

  element.open = true;
  window.setTimeout(() => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 40);
}

export function InsurerHashOpen() {
  useEffect(() => {
    openTargetFromHash();
    window.addEventListener('hashchange', openTargetFromHash);

    return () => {
      window.removeEventListener('hashchange', openTargetFromHash);
    };
  }, []);

  return null;
}
