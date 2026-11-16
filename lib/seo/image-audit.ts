export type ImageAuditResult = {
  iat1AltDuplicados: boolean;
  iat2AltAusentes: boolean;
  iat3AltGenericos: boolean;
  iat4SinDimensiones: boolean;
  iat5SinOptimizacion: boolean;
  iat6PesoExcesivo: boolean;
  iat7RiesgoCLS: boolean;
  passed: boolean;
};

const GENERIC_ALTS = new Set(['foto', 'image', 'img', 'propiedad', 'glamping', 'foto de', 'imagen de']);

export function auditImage({
  alt,
  width,
  height,
  src,
  priority = false,
  loading,
}: {
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  src?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}): ImageAuditResult {
  const altTrim = (alt || '').trim();
  const altDuplicado = false; // requires cross-image check
  const altAusente = !altTrim || altTrim.length === 0;
  const altGenerico = altTrim.length > 0 && GENERIC_ALTS.has(altTrim.toLowerCase());
  const sinDimensiones = !width || !height;
  const sinOptimizacion = !src?.startsWith('/_next/image') && !src?.startsWith('https://');
  const pesoExcesivo = false; // requires file size check
  const riesgoCLS = sinDimensiones || (priority && loading === 'lazy');

  const passed = !altAusente && !altGenerico && !sinDimensiones && !riesgoCLS;

  return {
    iat1AltDuplicados: altDuplicado,
    iat2AltAusentes: altAusente,
    iat3AltGenericos: altGenerico,
    iat4SinDimensiones: sinDimensiones,
    iat5SinOptimizacion: sinOptimizacion,
    iat6PesoExcesivo: pesoExcesivo,
    iat7RiesgoCLS: riesgoCLS,
    passed,
  };
}

export function auditImages(images: Array<{ alt?: string; width?: number; height?: number; src?: string; priority?: boolean; loading?: 'lazy' | 'eager' }>) {
  const alts = images.map(i => (i.alt || '').trim().toLowerCase());
  const duplicates = alts.filter((a, i) => alts.indexOf(a) !== i && a.length > 0);
  const hasDuplicates = duplicates.length > 0;

  return images.map(img => {
    const result = auditImage(img);
    return { ...result, iat1AltDuplicados: hasDuplicates || result.iat1AltDuplicados };
  });
}
