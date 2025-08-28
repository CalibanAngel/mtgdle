import { Link } from '@heroui/link';
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/navbar';
import { link as linkStyles } from '@heroui/theme';
import clsx from 'clsx';

import { siteConfig } from '@/config/site';
import { ThemeSwitch } from '@/components/theme-switch';
import { GithubIcon, ScryfallIcon } from '@/components/icons';

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <i className="ms ms-watermark-mtg" />
            <p className="font-bold text-inherit">MTGdle</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: 'foreground' }),
                  'data-[active=true]:text-primary data-[active=true]:font-medium',
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
        </NavbarItem>

        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.scyrfall} title="Scryfall">
            <ScryfallIcon className="text-default-500" size={24} />
          </Link>
        </NavbarItem>

        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
