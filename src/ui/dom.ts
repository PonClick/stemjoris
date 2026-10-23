// Kleine DOM-hulpjes: de interface wordt één keer opgebouwd en daarna alleen bijgewerkt.

type AttrValue = string | number | boolean | undefined | null;
export type Attrs = Record<string, AttrValue>;

/** Maak een element met attributen en kinderen. `class` en `text` zijn speciale sleutels. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  if (children.length) node.append(...children);
  return node;
}

/** Element met vaste (vertrouwde, eigen) SVG/HTML-inhoud. Nooit gebruiken met gebruikersinvoer. */
export function fromMarkup<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs, markup: string): HTMLElementTagNameMap[K] {
  const node = el(tag, attrs);
  node.innerHTML = markup;
  return node;
}

/**
 * Tekstknoop die alleen de DOM aanraakt als de tekst echt verandert.
 * Handig voor waarden die elk frame opnieuw berekend worden.
 */
export class LiveText {
  private value: string;
  constructor(readonly node: HTMLElement, initial = '') {
    this.value = initial;
    node.textContent = initial;
  }
  set(text: string): void {
    if (text === this.value) return;
    this.value = text;
    this.node.textContent = text;
  }
}

/** Zet een data-attribuut alleen als het verandert. */
export function setData(node: HTMLElement, key: string, value: string): void {
  if (node.dataset[key] !== value) node.dataset[key] = value;
}

/** Zet of verwijder een class alleen als de stand verandert. */
export function toggleClass(node: Element, name: string, on: boolean): void {
  if (node.classList.contains(name) !== on) node.classList.toggle(name, on);
}
