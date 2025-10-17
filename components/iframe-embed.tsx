"use client";

export function IframeEmbed({ html }: { html?: string }) {
  if (!html) return null;
  // Peligro controlado: viene de oEmbed confiable (YouTube/SC/Mixcloud). Mantener así.
  return <div className="w-full overflow-hidden rounded-xl" dangerouslySetInnerHTML={{ __html: html }} />;
}
