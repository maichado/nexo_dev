import template from '../data/llms-full.txt?raw';
import { productVersion, productChannel } from '../data/product-facts';

export function GET() {
  const body = template
    .replaceAll('[[NEXO_VERSION]]', productVersion)
    .replaceAll('[[NEXO_CHANNEL]]', productChannel);
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
