import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { TrackedExternalLink } from '@/components/tracked-external-link';
import { siteConfig } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <BrandLogo className="brand-logo brand-logo--footer" />
          <p className="footer-title">H Soares Corretora de Seguros LTDA</p>
          <p>CNPJ: 11.194.245.0001-13</p>
          <p>30 anos no mercado de seguros.</p>
          <p className="footer-brand-copy">
            Corretora com atendimento consultivo, leitura clara de cobertura e apoio para contratar com mais segurança.
          </p>
          <TrackedExternalLink
            className="btn btn-whatsapp footer-cta"
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            eventType="whatsapp_click"
            payload={{ placement: 'footer' }}
          >
            Falar no WhatsApp
          </TrackedExternalLink>
        </div>
        <div>
          <p className="footer-title">Contato</p>
          <p>WhatsApp: (11) 9 7206-4288</p>
          <p>E-mail: contato@hsoaresseguros.com.br</p>
        </div>
        <div>
          <p className="footer-title">Atendimento</p>
          <p>Orientação para comparar produtos, coberturas e próximos passos.</p>
          <p>Direcionamento para contratação oficial com seguradoras e parceiros autorizados.</p>
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
          <p>
            <Link href="/login">Acesso administrativo</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
