export function SafeImage({ src, alt, className, loading = 'lazy', decoding = 'async', ...props }) {
  return <img src={src} alt={alt} className={className} loading={loading} decoding={decoding} {...props} />;
}
