import { SiteHeader } from '@/components/site-header';

export default function BlogLayout({ children }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
