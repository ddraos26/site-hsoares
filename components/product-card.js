import Link from 'next/link';
import { SafeImage } from '@/components/safe-image';

export function ProductCard({ product }) {
  return (
    <article className="product-card">
      <SafeImage
        className="product-card-image"
        src={product.heroImage}
        alt={product.name}
        loading="lazy"
      />
      <span className="pill">{product.category}</span>
      <h3>{product.name}</h3>
      <p>{product.shortDescription}</p>
      <Link href={`/produtos/${product.slug}`} className="link-btn">
        Ver detalhes e contratar
      </Link>
    </article>
  );
}
