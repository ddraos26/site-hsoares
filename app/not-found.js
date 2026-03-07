import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="section">
      <div className="container">
        <h1>Página não encontrada</h1>
        <p>O conteúdo solicitado não está disponível.</p>
        <Link href="/" className="btn btn-primary">
          Voltar para Home
        </Link>
      </div>
    </main>
  );
}
