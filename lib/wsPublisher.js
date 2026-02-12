import logger from '@/lib/logger';

export async function publishWsEvent({
  channel,
  type,
  payload,
  userAccount,
}) {
  const baseUrl = process.env.WS_PUBLISH_BASE_URL;
  const secret = process.env.WS_PUBLISH_SECRET;

  if (!baseUrl || !secret) {
    return { ok: false, skipped: true, reason: 'missing_env' };
  }

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/notifications/publish`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publish-secret': secret,
      },
      body: JSON.stringify({
        channel,
        type,
        payload,
        userAccount,
      }),
    });

    if (!res.ok) {
      let details;
      try {
        details = await res.text();
      } catch {
        details = '';
      }

      logger.error('WS publish failed:', res.status, details);
      return { ok: false, skipped: false, status: res.status };
    }

    return { ok: true };
  } catch (err) {
    logger.error('WS publish error:', err?.message || String(err));
    return { ok: false, skipped: false };
  }
}

export async function publishWsNotification({
  channel,
  notification,
  userAccount,
}) {
  return publishWsEvent({
    channel,
    type: 'notification',
    payload: notification,
    userAccount,
  });
}
