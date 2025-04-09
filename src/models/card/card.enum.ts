export enum Rarity {
  RARE = 'rare',
  UNCOMMON = 'uncommon',
  COMMON = 'common',
  MYTHIC = 'mythic',
  BONUS = 'bonus',
}

export enum BorderColor {
  BLACK = 'black',
  WHITE = 'white',
  BORDERLESS = 'borderless',
  YELLOW = 'yellow',
  SILVER = 'silver',
  GOLD = 'gold',
}

export enum GameName {
  PAPER = 'paper',
  ARENA = 'arena',
  MTGO = 'mtgo',
}

export enum Legality {
  Legal = 'legal',
  NotLegal = 'not_legal',
  Restricted = 'restricted',
  Banned = 'banned',
}

export enum Color {
  WHITE = 'W',
  BLUE = 'U',
  BLACK = 'B',
  RED = 'R',
  GREEN = 'G',
  /** Colorless is not a color, but sometimes this API uses it as one. */
  COLORLESS = 'C',
}
