export function StructuredData({ data }) {
  if (!data) {
    return null;
  }

  const payload = Array.isArray(data) ? data : [data];

  return payload.map((item, index) => (
    <script
      key={`structured-data-${index}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
    />
  ));
}
