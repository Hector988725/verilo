// Wraps the OpenNext worker and adds Cloudflare Cron Triggers
// (replaces vercel.json crons). Times are UTC.
//   0 2 * * *   -> /api/cron/expire-listings
//   30 2 * * *  -> /api/cron/expiry-reminders
import openNext from "./.open-next/worker.js";

const CRON_PATHS = {
  "0 2 * * *": "/api/cron/expire-listings",
  "30 2 * * *": "/api/cron/expiry-reminders",
};

export default {
  fetch: openNext.fetch,
  async scheduled(event, env, ctx) {
    const path = CRON_PATHS[event.cron];
    if (!path) return;
    const base = env.NEXT_PUBLIC_SITE_URL || "https://verilo.example.com";
    const req = new Request(base + path, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const res = await openNext.fetch(req, env, ctx);
    console.log("[cron]", path, res.status);
  },
};
