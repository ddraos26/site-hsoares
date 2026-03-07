import { siteConfig } from '@/lib/site';

export function BrandLogo({ className = '', alt = siteConfig.name }) {
  return <img src={siteConfig.logo} alt={alt} className={className} />;
}
