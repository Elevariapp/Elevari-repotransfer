import { guides } from '@/content/guides';

export type ContentAuditResult = {
  cat1ContenidoDuplicado: boolean;
  cat2ThinContent: boolean;
  cat3ContenidoHuerfano: boolean;
  cat4BrokenEditorialLinks: boolean;
  cat5MissingFAQ: boolean;
  cat6GuideStructureCompliance: boolean;
  cat7MetadataCompleteness: boolean;
  passed: boolean;
};

const MIN_WORDS = 150;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function auditGuide(guide: typeof guides[number]): ContentAuditResult {
  const titleWords = wordCount(guide.title);
  const heroWords = wordCount(guide.heroSummary);
  const introWords = wordCount(guide.sections.introduccion);
  const totalWords = titleWords + heroWords + introWords + guide.sections.queDebesSaber.join(' ').length + guide.sections.comoFunciona.join(' ').length;

  const cat2ThinContent = totalWords < MIN_WORDS;
  const cat5MissingFAQ = !guide.faq || guide.faq.length === 0;
  const cat7MetadataCompleteness = !guide.title || !guide.description || !guide.heroSummary || !guide.reviewedAt;
  const cat6GuideStructureCompliance = !!guide.sections.introduccion && !!guide.sections.queDebesSaber.length && !!guide.sections.comoFunciona.length;

  // Duplication check simplified
  const cat1ContenidoDuplicado = false;
  const cat3ContenidoHuerfano = guide.relatedCollections.length === 0 && guide.relatedProperties.length === 0;
  const cat4BrokenEditorialLinks = false; // requires link check

  const passed = !cat1ContenidoDuplicado && !cat2ThinContent && !cat3ContenidoHuerfano && !cat4BrokenEditorialLinks && !cat5MissingFAQ && cat6GuideStructureCompliance && !cat7MetadataCompleteness;

  return {
    cat1ContenidoDuplicado,
    cat2ThinContent,
    cat3ContenidoHuerfano,
    cat4BrokenEditorialLinks,
    cat5MissingFAQ,
    cat6GuideStructureCompliance,
    cat7MetadataCompleteness,
    passed,
  };
}

export function auditAllGuides() {
  return guides.map(g => ({ slug: g.slug, ...auditGuide(g) }));
}
