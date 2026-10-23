import { describe, expect, it } from 'vitest';
import { PORTRAIT_FILES } from '../src/ui/brand';
import sw from '../public/sw.js?raw';

// Alle tekeningen als tekst, met het pad zoals de app het gebruikt (./cartoon/…).
const files = import.meta.glob<string>('../public/cartoon/*.svg', { query: '?raw', import: 'default', eager: true });
const svgs = new Map(Object.entries(files).map(([path, text]) => [path.replace('../public/', './'), text]));

describe('cartoontekeningen', () => {
  for (const [key, url] of Object.entries(PORTRAIT_FILES)) {
    it(`${key}: handgetekende SVG zonder scripts, bitmaps of externe verwijzingen`, () => {
      expect(url).toMatch(/^\.\/cartoon\/[\w-]+\.svg$/);
      const svg = svgs.get(url);
      expect(svg, url).toBeDefined();
      const text = svg as string;
      expect(new TextEncoder().encode(text).length).toBeLessThan(25 * 1024);
      expect(text).toMatch(/^<svg [^>]*viewBox="0 0 \d+ \d+"/);
      expect(text).not.toMatch(/<script|<image|<foreignObject|\son\w+=|data:|base64/i);
      // Alleen de SVG-namespace mag een URL zijn.
      expect(text.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/https?:|href=/i);
    });
  }

  it('verwijst nergens meer naar foto’s', () => {
    for (const url of Object.values(PORTRAIT_FILES)) expect(url).not.toMatch(/\.(?:jpe?g|png|webp)$/i);
  });

  it('staat in de precache van de service worker', () => {
    for (const url of Object.values(PORTRAIT_FILES)) expect(sw).toContain(`'${url}'`);
  });
});
