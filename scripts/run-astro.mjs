// Keep Astro's user-level telemetry store out of this portable archive workspace.
process.env.ASTRO_TELEMETRY_DISABLED = '1';
await import('../node_modules/astro/bin/astro.mjs');
