import {
  emailBilingual,
  emailButton,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
} from './layout.js';

export function mediaApproved({
  hostName,
  propertyName,
  mediaType,
  mediaUrl,
  dashboardUrl,
}: {
  hostName?: string | null;
  propertyName: string;
  mediaType: 'image' | 'video';
  mediaUrl?: string;
  dashboardUrl: string;
}): string {
  const typeLabel = mediaType === 'video' ? 'video' : 'foto';
  const typeLabelEn = mediaType === 'video' ? 'video' : 'photo';

  const esBody = 'Tu ' + typeLabel + ' de "' + propertyName + '" ha sido revisada y aprobada. Ya está visible públicamente en tu anuncio.';
  const enBody = 'Your ' + typeLabelEn + ' for "' + propertyName + '" has been reviewed and approved. It is now publicly visible on your listing.';

  const content = '\n    ' + emailHeading('Tu contenido fue aprobado / Your content was approved') + '\n    ' + emailGreeting(hostName) + '\n    ' + emailBilingual(esBody, enBody) + '\n    ' + emailButton({ href: dashboardUrl, label: 'Ir a mi panel / Go to my dashboard' }) + '\n    ' + emailHelpLine() + '\n  ';

  const stay = propertyName.length > 34 ? propertyName.slice(0, 33) + '…' : propertyName;
  return emailLayout({
    content,
    previewText: 'Contenido aprobado para ' + stay + ' · Content approved for ' + stay,
  });
}