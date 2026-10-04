# Better Email Editor

Un éditeur d'emails en glisser-déposer inspiré d'[Unlayer](https://editor.unlayer.com), construit **dans votre app** (pas d'iframe) sur [`@react-email/editor`](https://www.npmjs.com/package/@react-email/editor) (Tiptap/ProseMirror + rendu React Email).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
```

## Ce qui est disponible

| Fonction | Détail |
| --- | --- |
| Palette **Contenu** | Mise en page (1 à 4 colonnes) et 12 contenus : titre, texte, bouton, image, séparateur, espacement, réseaux sociaux, menu, liste, citation, HTML, encadré. On les glisse dans l'email, ou un clic les ajoute à la fin. |
| Onglet **Blocs** | Lignes préfabriquées : en-tête, hero, produits, avantages, témoignage, pied de page. |
| Onglet **Corps** | Réglages globaux : fond, largeur et arrondi du contenu, couleurs par défaut (texte, titres, liens, boutons), texte d'aperçu. |
| Drag & drop | Ligne « Déposer ici » entre les blocs, zone dédiée pour les colonnes et sections vides. On peut déposer dans les sections et les colonnes, et déplacer un bloc existant : on le sélectionne, puis on tire sa poignée blanche ⠿ à gauche (une image peut aussi se glisser directement). |
| Sélection | Contour au survol avec l'étiquette du type. Le bloc sélectionné affiche sa poignée de déplacement à gauche et une barre d'outils à droite : remonter au parent, dupliquer, supprimer. `Échap` remonte au parent puis désélectionne. `Suppr` efface le bloc. |
| Calques | Panneau à gauche (bouton « Calques » pour l'afficher ou le masquer) : la structure de l'email en arbre, avec niveaux, icônes et aperçu du contenu. Un clic sélectionne le bloc et fait défiler le canvas jusqu'à lui. On peut glisser-déposer pour réordonner (avant / après) ou imbriquer (dans une section ou une colonne), y compris depuis la palette. Le survol est synchronisé avec le canvas, et le clavier marche (↑ ↓, ← → pour plier/déplier, Entrée). |
| Copier / coller | `Ctrl+C`, `Ctrl+X` et `Ctrl+V` marchent sur le texte et sur les blocs. Coller avec un bloc sélectionné insère **après** lui au lieu de le remplacer : copier puis coller le même bloc le duplique. Le contenu copié depuis l'éditeur est restitué à l'identique (styles, liens de bouton, nœuds custom). |
| Propriétés | Panneau contextuel par type de bloc (typographie, marges, fond, bordure, lien, répartition des colonnes, liste des réseaux, code HTML…) et fil d'Ariane de la hiérarchie. |
| Édition de texte | Directement dans le canvas, avec le menu flottant et les commandes `/` du package. |
| Aperçu et export | Aperçu bureau et mobile en iframe, HTML (copier ou télécharger), texte brut. |
| Persistance | Sauvegarde automatique en `localStorage`, import et export JSON, annuler / rétablir, canvas en largeur mobile. |

## Architecture

```
src/
  App.tsx                    EmailEditor + extensions + persistance
  editor/
    dnd.ts                   cœur du drag & drop (cible de dépôt, insertion, déplacement, unités de bloc)
    LayersPanel.tsx, layers.ts  panneau Calques : arbre du document, cibles de dépôt avant / après / dedans
    CanvasOverlay.tsx        calque au-dessus du canvas : survol, sélection, barre d'outils, indicateur de dépôt
    Sidebar.tsx              palette (Inspector.Document) + propriétés (Inspector.Node / Inspector.Text)
    custom-nodes.tsx         Espacement, Réseaux sociaux, HTML : nœuds EmailNode maison
    blocks.tsx               définitions JSON des tuiles et des blocs préfabriqués
    fields.tsx               contrôles de formulaire du panneau
    PreviewModal.tsx         composeReactEmail → aperçu / export
    TopBar.tsx, settings.tsx, node-labels.ts, style-utils.ts
scripts/                     scénarios Playwright (voir plus bas)
```

### Comment le drag & drop s'intègre à ProseMirror

- Le **modèle** est celui du package : `container` (l'email) → blocs. Les zones de dépôt sont `container`, `section` et `columnsColumn`. Les lignes `twoColumns`, `threeColumns` et `fourColumns` contiennent des colonnes.
- `findDropTarget()` descend depuis le conteneur jusqu'à la zone la plus profonde sous le pointeur, puis choisit l'interstice entre deux enfants. Le dépôt est validé par le schéma (`node.canReplace`), donc un bloc ne peut jamais atterrir à un endroit invalide.
- Les événements `dragover` et `drop` sont capturés sur le canvas (phase de capture) **avant** ProseMirror. Les drags de texte natifs restent gérés par ProseMirror.
- L'insertion et le déplacement sont de simples transactions : annuler / rétablir fonctionne sans code supplémentaire.

## Bilan de l'API `@react-email/editor`

**Ce qui est utilisé :**

- `EmailEditor` (`@react-email/editor`). Prop `extensions` pour remplacer la configuration de base, `onUploadImage` (active le nœud image), `ref.getJSON()`, et les `children` rendus dans le contexte de l'éditeur (topbar, sidebar, overlay).
- `StarterKit` (`/extensions`). Tous les nœuds email : colonnes, section, bouton, séparateur, tableaux… Configurable nœud par nœud (`dropcursor` est désactivé ici).
- `EmailTheming` et `extendTheme` (`/plugins`). Thème global stocké **dans le document** (nœud `globalContent`) : il est donc sauvegardé avec le JSON.
- `EmailNode.create` (`/core`). Chaque nœud custom déclare son rendu éditeur (`renderHTML` ou node view) **et** son rendu email (`renderToReactEmail`). L'export n'a besoin d'aucune glue.
- `composeReactEmail` (`/core`). Renvoie `{ html, text, unformattedHtml }`.
- `Inspector` (`/ui`). Utilisé en mode « headless » via des render props : `Inspector.Document` (rien de sélectionné), `Inspector.Node` (`getStyle`/`setStyle`/`getAttr`/`setAttr`), `Inspector.Text` (marques, alignement, couleur de lien), `Inspector.Breadcrumb`. Toute la plomberie sélection → styles inline vient du package ; seule l'UI est maison.
- `EditorFocusScope` (`/ui`). Garde l'éditeur « focus » pendant qu'on manipule la sidebar, la barre d'outils ou la poignée. La poignée est focusable et enregistrée comme scope : cliquer dessus ne désélectionne pas le bloc, et on évite un `preventDefault` au `mousedown`, qui annulerait le drag natif.
- Les icônes de `/ui`.
- Sélecteur de couleur : [react-colorful](https://github.com/omgovich/react-colorful) (MIT) dans une popover [Radix](https://www.radix-ui.com/) (MIT), avec saisie hex, couleurs du document, palette et pipette (si le navigateur la supporte).

**Limites rencontrées (et contournements) :**

- Le package n'a **pas de drag & drop de blocs** : c'est l'apport principal de ce projet.
- Le `parseHTML` du `Button` ne relit pas `data-href` ni l'alignement qu'il écrit lui-même : un bouton copié-collé perdait son lien. Corrigé par `EmailButton` (`Button.extend`) dans `editor/paste.ts`.
- Coller sur un bloc sélectionné le remplaçait. Un écouteur `paste` en capture ouvre un paragraphe après le bloc. Le contenu interne (`data-pm-slice`) est rejoué via `view.pasteHTML`, ce qui contourne le gestionnaire du package au profit du collage natif de ProseMirror.
- `Divider` filtre toute transaction qui insère du contenu quand un séparateur est sélectionné. On relâche donc la sélection avant un drop ou une duplication (`releaseNodeSelection`).
- Les menus flottants du package suivent la sélection même éditeur flouté, et ceux des boutons et images font doublon avec le panneau. Ils sont masqués en CSS dans ces cas.
- `TrailingNode` ajoute un paragraphe vide après chaque bloc non textuel. Il est replié visuellement tant que le curseur n'y entre pas (l'export le supprime déjà).
- Le contexte interne de l'Inspector (`useInspector`) n'est pas exporté. On s'appuie sur le fait que `Document`, `Node` et `Text` ne rendent que pour leur cible.

## Tests

Les scénarios dans `scripts/` pilotent l'app avec Playwright (Edge installé localement, `playwright-core`) : drop depuis la palette, dépôt dans une colonne vide, déplacement de blocs, glisser d'image entre colonnes, propriétés, undo, aperçu, export, persistance.

```bash
npx vite --port 5179 &
node scripts/e2e.mjs   # idem e2e2 … e2e5, check-padding — captures dans ./screenshots
```

## Pistes

- Upload d'images vers un vrai stockage (`onUploadImage` renvoie aujourd'hui une data-URL, à remplacer par S3, Cloudinary…).
- Icônes sociales en PNG hébergés : Gmail n'affiche pas les SVG.
- Media queries pour empiler les colonnes sur mobile dans l'HTML exporté.
- Nouveaux nœuds via `EmailNode.create` : vidéo (miniature + lien), compte à rebours, etc.
