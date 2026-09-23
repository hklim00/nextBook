import astro from '@astrojs/cloudflare/entrypoints/server';
import { runDailyDiscoverySync } from './features/discovery/dailySync';

export default {
  fetch: astro.fetch,
  async scheduled(controller, env, ctx) {
    const force = controller.cron === 'manual-force';
    ctx.waitUntil(runDailyDiscoverySync(env, new Date(), force));
  },
} satisfies ExportedHandler<Cloudflare.Env>;
