'use client';

import { useEffect, useState } from 'react';

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem('hs_cookie_consent')) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="lgpd-banner">
      <p>
        Utilizamos cookies para métricas e melhoria de experiência. Ao continuar, você concorda com nossa política de
        privacidade.
      </p>
      <button
        onClick={() => {
          window.localStorage.setItem('hs_cookie_consent', 'ok');
          setVisible(false);
        }}
      >
        Aceitar
      </button>
    </div>
  );
}
