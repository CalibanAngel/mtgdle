# Cadre Omnath : assets visuels

Le cadre reprend la référence Omnath fournie dans la conversation. Il s’agit d’une recréation générée à partir de cette référence, pas d’un détourage pixel par pixel de la photo. Aucun texte, symbole de mana ou illustration de la carte ne figure dans le calque final.

- Calque transparent : [omnath-frame.png](../packages/front/public/assets/omnath-frame.png).
- Texture de papier doré : [omnath-paper.png](../packages/front/public/assets/omnath-paper.png).

Créés avec l’outil ImageGen le 29 octobre 2026. La référence source est `codex-clipboard-a0c7c37d-78c5-4c91-97c8-3e0734a34d11.png` (Omnath), fournie par l’utilisateur. Les fichiers générés sont copiés dans `packages/front/public/assets/` et servis localement, sans appel de génération au chargement de l’application.

## Prompts

Création du calque à partir de la référence :

> Isolate and recreate only the outer gold Omnath card rim. Remove artwork, all text, mana symbols, logos and the black outside border. Fine mottled matte gold printed-paper texture. Rounded rectangular rim, roughly uniform 5% of width, suitable for CSS nine-slice scaling. The center and outside must be truly transparent. No internal bars, no illustration, no text.

Retouche finale du calque :

> Keep exactly the same geometry, texture and alpha transparency. Remove every red, green and orange fringe from the edges. All edges should be clean gold, dark brown or transparency. No artwork or text. Preserve the transparent center and outside.

Texture de papier :

> Seamless square muted pale ochre gold printed cardstock texture inspired by Omnath. Fine fibrous grain, cloudy tiny flecks, matte desaturated straw gold around #cbb26c. Flat scan, uniform seamless texture. No frames, text, metallic sheen, glitter, scratches or stains.

## Application

`classic.css` applique le calque via un pseudo-élément et `border-image`, sans remplissage central, avec `pointer-events: none`. La texture se répète sur le fond doré et les barres de nom, type et compteur. La bordure extérieure reste blanche en thème clair et noire en thème sombre. Le panneau de recherche passe au-dessus de l’historique pour que ses suggestions restent accessibles.

Playwright vérifie le chargement des deux fichiers, l’alpha nul du pixel central du calque et les deux variantes de thème, sur ordinateur et mobile. Les captures du scénario Omnath sont produites dans `test-results/`.
