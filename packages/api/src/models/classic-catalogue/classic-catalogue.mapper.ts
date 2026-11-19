import type { ClassicCard } from './classic-card';

interface AbilityText {
  oracle_text?: string;
  keywords?: string[];
}
interface Artwork {
  promo?: boolean;
  full_art?: boolean;
  border_color?: string;
  frame_effects?: string[];
  rarity: string;
  image_uris?: { small?: string; normal?: string; art_crop?: string };
}
interface ReferencePrinting extends AbilityText {
  name: string;
  type_line: string;
  set_name: string;
  released_at: string;
  color_identity?: string[];
  cmc?: number;
}
const activatedKeywords = new Set([
  'Equip',
  'Cycling',
  'Landcycling',
  'Basic landcycling',
  'Typecycling',
  'Transmute',
  'Transfigure',
  'Unearth',
  'Level up',
  'Outlast',
  'Ninjutsu',
  'Commander ninjutsu',
  'Reinforce',
  'Scavenge',
  'Embalm',
  'Eternalize',
  'Encore',
  'Crew',
  'Saddle',
  'Craft',
  'Fortify',
  'Reconfigure',
  'Boast',
  'Adapt',
]);

export function hasActivated(card: AbilityText): boolean {
  let text = card.oracle_text || '';
  let previous: string;
  do {
    previous = text;
    text = text.replace(/\([^()]*\)/g, '');
  } while (text !== previous);
  text = text.replace(/[“"][^”"]*[”"]/g, '');
  return (
    /(?:^|\n)[^\n:]+:/.test(text) ||
    (card.keywords || []).some((keyword) => activatedKeywords.has(keyword))
  );
}

export function standard(card: Partial<Artwork>): boolean {
  return (
    !card.promo &&
    !card.full_art &&
    !['borderless', 'silver', 'gold'].includes(card.border_color || '') &&
    !(card.frame_effects || []).some((effect) =>
      ['showcase', 'extendedart', 'inverted'].includes(effect),
    )
  );
}

export function toClassicCard(
  id: string,
  first: ReferencePrinting,
  art: Artwork,
): ClassicCard {
  return {
    id,
    name: first.name,
    image: art.image_uris?.small || null,
    previewImage: art.image_uris?.normal || null,
    artCrop: art.image_uris?.art_crop || null,
    oracleText: first.oracle_text || '',
    identity: first.color_identity || [],
    mana: first.cmc ?? 0,
    types: first.type_line
      .split(' — ')[0]
      .split(' ')
      .filter(
        (type) =>
          !['Basic', 'Legendary', 'Snow', 'World', 'Ongoing'].includes(type),
      ),
    edition: first.set_name,
    rarity: art.rarity,
    released: first.released_at,
    keywords: first.keywords || [],
    activated: hasActivated(first),
  };
}
