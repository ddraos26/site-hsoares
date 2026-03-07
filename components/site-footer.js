import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-title">H Soares Corretora de Seguros LTDA</p>
          <p>CNPJ: 11.194.245.0001-13</p>
          <p>30 anos no mercado de seguros.</p>
        </div>
        <div>
          <p className="footer-title">Contato</p>
          <p>WhatsApp: (11) 9 7206-4288</p>
          <p>E-mail: contato@hsoaresseguros.com.br</p>
        </div>
        <div>
          <p className="footer-title">Atendimento</p>
          <p>Consultoria comercial com foco em fechamento.</p>
          <p>Direcionamento para contratação oficial com seguradoras parceiras.</p>
        </div>
        <div>
          <p className="footer-title">Links institucionais</p>
          <p>
            <Link href="/institucional">Institucional</Link>
          </p>
          <p>
            <Link href="/contato">Contato</Link>
          </p>
          <p>
            <Link href="/seguradoras">Seguradoras</Link>
          </p>
          <p>
            <Link href="/politica-de-privacidade">Política de Privacidade</Link>
          </p>
          <p>
            <Link href="/termos-de-uso">Termos de Uso</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
