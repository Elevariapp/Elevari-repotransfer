import {
  emailBilingual,
  emailButton,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
} from './layout.js';

export function mediaRejected({
  hostName,
  propertyName,
  mediaType,
  reason,
  dashboardUrl,
}: {
  hostName?: string | null;
  propertyName: string;
  mediaType: 'image' | 'video';
  reason?: string | null;
  dashboardUrl: string;
}): string {
  const typeLabel = mediaType === 'video' ? 'video' : 'foto';
  const typeLabelEn = mediaType === 'video' ? 'video' : 'photo';

  const esReason = reason ? ' Motivo: ' + reason + '.' : '';
  const enReason = reason ? ' Reason: ' + reason + '.' : '';

  const esBody = 'Tu ' + typeLabel + ' de "' + propertyName + '" no pasó la revisión de moderación y no se publicará.' + esReason;
  const enBody = 'Your ' + typeLabelEn + ' for "' + propertyName + '" did not pass moderation review and will not be published.' + enReason;

  const esFollowUp = 'Puedes subir una nueva foto o video que cumpla con nuestras reglas de contenido.';
  const enFollowUp = 'You can upload a new photo or video that complies with our content rules.';

  const content = '\n    ' + emailHeading('Tu contenido fue rechazado / Your content was rejected') + '\n    ' + emailGreeting(hostName) + '\n    ' + emailBilingual(esBody, enBody) + '\n    ' + emailBilingual(esFollowUp, enFollowUp) + '\n    ' + emailButton({ href: dashboardUrl, label: 'Ir a mi panel / Go to my dashboard' }) + '\n    ' + emailHelpLine() + '\n  ';

  const stay = propertyName.length > 34 ? propertyName.slice(0, 33) + '\u2026' : propertyName;
  return emailLayout({
    content,
    previewText: 'Contenido rechazado para ' + stay + ' · Content rejected for ' + stay,
  });
}
