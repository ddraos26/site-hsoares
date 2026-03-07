'use client';

import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/admin');

  useEffect(() => {
    const url = new URL(window.location.href);
    const redirect = url.searchParams.get('redirect');
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas');
      }

      window.location.assign(redirectTo);
    } catch {
      setFeedback('Não foi possível autenticar. Verifique e-mail e senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <BrandLogo className="brand-logo brand-logo--auth" />
        </div>
        <p className="eyebrow login-eyebrow">Acesso interno</p>
        <h1>Painel H Soares</h1>
        <p>Acesso restrito para acompanhar leads, operação e presença online no site.</p>

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button disabled={loading} type="submit" className="btn btn-primary">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {feedback && <p className="error-text">{feedback}</p>}
      </form>
    </main>
  );
}
