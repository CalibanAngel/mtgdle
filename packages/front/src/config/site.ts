export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'MTGdle',
  description: 'Guess Magic: The Gathering card.',
  navItems: [
    {
      label: 'Health',
      href: '/health',
    },
  ],
  navMenuItems: [],
  links: {
    github: 'https://github.com/CalibanAngel/mtgdle',
    scyrfall: 'https://scryfall.com',
  },
};
