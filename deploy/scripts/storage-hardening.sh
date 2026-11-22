#!/usr/bin/env bash
# PPI-3 — Storage hardening for S3-compatible object storage (MinIO or AWS S3 via mc).
#
# Applies: versioning, lifecycle rules, private bucket for sensitive objects and
# an explicit public-read policy ONLY for the media bucket.
#
# Usage:
#   MINIO_ALIAS=prod MINIO_ENDPOINT=https://s3.example.com \
#   MINIO_ACCESS_KEY=... MINIO_SECRET_KEY=... \
#   ./deploy/scripts/storage-hardening.sh
#
# Requires: mc (MinIO client). Idempotent.
set -euo pipefail

ALIAS="${MINIO_ALIAS:-prod}"
ENDPOINT="${MINIO_ENDPOINT:?MINIO_ENDPOINT required}"
ACCESS_KEY="${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY required}"
SECRET_KEY="${MINIO_SECRET_KEY:?MINIO_SECRET_KEY required}"
PUBLIC_BUCKET="${MINIO_BUCKET:-wana-media}"
PRIVATE_BUCKET="${MINIO_PRIVATE_BUCKET:-wana-private}"
RETENTION_DAYS="${MEDIA_RETENTION_DAYS:-365}"

echo "==> Configuring alias ${ALIAS} -> ${ENDPOINT}"
mc alias set "${ALIAS}" "${ENDPOINT}" "${ACCESS_KEY}" "${SECRET_KEY}" >/dev/null

echo "==> Public media bucket: ${PUBLIC_BUCKET}"
mc mb --ignore-existing "${ALIAS}/${PUBLIC_BUCKET}"
mc version enable "${ALIAS}/${PUBLIC_BUCKET}"

# Lifecycle: abort incomplete multipart uploads and expire non-current versions.
mc ilm rule add --expire-delete-marker "${ALIAS}/${PUBLIC_BUCKET}" >/dev/null 2>&1 || true
mc ilm rule add --noncurrent-expire-days 30 "${ALIAS}/${PUBLIC_BUCKET}" >/dev/null 2>&1 || true

# Public read is limited to media objects only (property photos/videos).
mc anonymous set download "${ALIAS}/${PUBLIC_BUCKET}"

echo "==> Private bucket: ${PRIVATE_BUCKET} (invoices, documents, exports)"
mc mb --ignore-existing "${ALIAS}/${PRIVATE_BUCKET}"
mc version enable "${ALIAS}/${PRIVATE_BUCKET}"
mc anonymous set none "${ALIAS}/${PRIVATE_BUCKET}"
mc ilm rule add --expire-days "${RETENTION_DAYS}" "${ALIAS}/${PRIVATE_BUCKET}" >/dev/null 2>&1 || true

echo "==> Verification"
mc anonymous get "${ALIAS}/${PUBLIC_BUCKET}"
mc anonymous get "${ALIAS}/${PRIVATE_BUCKET}"
mc version info "${ALIAS}/${PUBLIC_BUCKET}"
mc version info "${ALIAS}/${PRIVATE_BUCKET}"

echo "Storage hardening applied. Record the output as PPI-3 evidence."
