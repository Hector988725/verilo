// Fire-and-forget analytics ping — never awaited by callers, never blocks a
// visitor's tap on Call/WhatsApp, and silently no-ops on failure.
export function trackEvent(listingId, eventType) {
  if (!listingId) return;
  try {
    fetch('/api/listing/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, event_type: eventType }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}
}
