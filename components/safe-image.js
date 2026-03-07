'use client';

export function SafeImage({ src, alt, className, fallbackSrc = '/assets/hero-abstract.svg', ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        if (event.currentTarget.src.endsWith(fallbackSrc)) {
          return;
        }
        event.currentTarget.src = fallbackSrc;
      }}
      {...props}
    />
  );
}
