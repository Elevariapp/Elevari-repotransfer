import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTO_DECISION_THRESHOLD,
  REVIEW_SLA_MS,
  combineIdentityModeration,
  decideVerdict,
  idNumberAppearsInText,
  mediaStatusFor,
  nameAppearsInText,
  reviewDeadline,
  type ModerationResult,
} from '../src/lib/ai-moderation.js';

const approved = (score = 0.95): ModerationResult => ({
  verdict: 'approved',
  score,
  labels: [],
  reason: 'safe_search_clean',
  provider: 'ai',
});

const review = (reason: string): ModerationResult => ({
  verdict: 'review',
  score: 0.2,
  labels: [],
  reason,
  provider: 'rules',
});

test('decideVerdict only trusts a confident provider answer', () => {
  assert.deepEqual(decideVerdict({ verdict: 'approved', score: 0.95 }), { verdict: 'approved', score: 0.95 });
  assert.equal(decideVerdict({ verdict: 'approved', score: AUTO_DECISION_THRESHOLD - 0.01 }).verdict, 'review');
  assert.equal(decideVerdict({ verdict: 'rejected', score: 0.99 }).verdict, 'rejected');
  // Unknown shapes must never auto-approve.
  assert.equal(decideVerdict({}).verdict, 'review');
  assert.equal(decideVerdict({ verdict: 'safe', score: 1 }).verdict, 'review');
  // Scores are clamped into 0..1.
  assert.equal(decideVerdict({ verdict: 'approved', score: 42 }).score, 1);
  assert.equal(decideVerdict({ verdict: 'approved', score: -5 }).score, 0);
});

test('a host is auto-verified only when both documents are confidently approved', () => {
  const both = combineIdentityModeration(approved(), approved());
  assert.equal(both.verdict, 'approved');
  assert.equal(both.documentsMatch, true);

  // One unreadable selfie keeps a human in the loop.
  const selfieUnreadable = combineIdentityModeration(approved(), review('no_face_detected'));
  assert.equal(selfieUnreadable.verdict, 'review');
  assert.equal(selfieUnreadable.documentsMatch, false);

  // Low confidence on either side is not enough.
  const lowScore = combineIdentityModeration(approved(0.5), approved());
  assert.equal(lowScore.verdict, 'review');

  // No provider configured: never auto-approve identity.
  const noProvider = combineIdentityModeration(review('ai_unconfigured'), review('ai_unconfigured'));
  assert.equal(noProvider.verdict, 'review');
  assert.equal(noProvider.reason, 'ai_unconfigured');
});

test('ID number and name must appear on the document text', () => {
  const ocr = 'REPUBLICA DE COLOMBIA CEDULA DE CIUDADANIA JUAN PEREZ 1.234.567.890';
  assert.equal(idNumberAppearsInText('1234567890', ocr), true);
  assert.equal(idNumberAppearsInText('9999999999', ocr), false);
  // Too short to be a real ID: never a positive match.
  assert.equal(idNumberAppearsInText('1234', ocr), false);

  assert.equal(nameAppearsInText('Juan Perez', ocr), true);
  assert.equal(nameAppearsInText('Maria Rodriguez', ocr), false);
});

test('media status mapping and the one-hour deadline', () => {
  assert.equal(mediaStatusFor('approved'), 'approved');
  assert.equal(mediaStatusFor('rejected'), 'rejected');
  assert.equal(mediaStatusFor('review'), 'pending');

  const now = new Date('2026-11-27T10:00:00.000Z');
  assert.equal(reviewDeadline(now).toISOString(), '2026-11-27T11:00:00.000Z');
  assert.equal(REVIEW_SLA_MS, 60 * 60 * 1000);
  // The product promise: nothing waits 48 hours.
  assert.ok(REVIEW_SLA_MS < 48 * 60 * 60 * 1000);
});
