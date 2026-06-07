# Polices du site — Service Time

Fichiers servis depuis `/fonts/` (dossier `apps/web/public/fonts/`).

| Fichier | Usage |
|---------|--------|
| `JannaLT-Regular.ttf` | Police principale arabe (corps de texte) |
| `Tajawal-Regular.ttf` | Fallback arabe |
| `DINNextLTArabic-Regular.ttf` | Titres / UI arabe (classe `.font-din-ar`) |

Déclaration CSS : `apps/web/app/globals.css` (`@font-face`).

**Poppins** (Google Fonts) reste utilisée pour l’anglais et la classe `.font-poppins`.

## Ajouter une variante

1. Copier le `.ttf` ou `.woff2` dans ce dossier.
2. Ajouter un bloc `@font-face` dans `globals.css`.
3. Mettre à jour la pile `font-family` si besoin.
