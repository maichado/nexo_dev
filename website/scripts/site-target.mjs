export function siteTarget(value = process.env.NEXO_SITE_TARGET) {
  if (value === undefined || value === '' || value === 'github') {
    return { name: 'github', site: 'https://maichado.github.io', base: '/nexo', outDir: './dist' };
  }
  if (value === 'cloudflare') {
    return { name: 'cloudflare', site: 'https://nexo.dev', base: '/', outDir: './dist-cloudflare' };
  }
  throw new Error(`Unknown NEXO_SITE_TARGET: ${value}`);
}
