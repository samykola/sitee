export type Filter = { id: string; name: string; css: string };

export const FILTERS: Filter[] = [
  { id: 'none',      name: 'Normal',   css: 'none' },
  { id: 'grayscale', name: 'B&W',      css: 'grayscale(1)' },
  { id: 'vintage',   name: 'Vintage',  css: 'sepia(0.55) contrast(1.05) saturate(0.9)' },
  { id: 'warm',      name: 'Warm',     css: 'sepia(0.25) saturate(1.35) brightness(1.05)' },
  { id: 'cool',      name: 'Cool',     css: 'hue-rotate(180deg) saturate(1.15)' },
  { id: 'vivid',     name: 'Vivid',    css: 'saturate(1.9) contrast(1.15)' },
  { id: 'bright',    name: 'Bright',   css: 'brightness(1.25) contrast(1.05)' },
  { id: 'noir',      name: 'Noir',     css: 'grayscale(1) contrast(1.45) brightness(0.9)' },
];

export function getFilterById(id: string): Filter {
  return FILTERS.find(f => f.id === id) ?? FILTERS[0];
}
