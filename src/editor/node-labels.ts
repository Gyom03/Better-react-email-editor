const LABELS: Record<string, string> = {
  body: 'Corps',
  paragraph: 'Texte',
  heading: 'Titre',
  image: 'Image',
  button: 'Bouton',
  horizontalRule: 'Séparateur',
  spacer: 'Espacement',
  socialLinks: 'Réseaux sociaux',
  htmlBlock: 'HTML',
  section: 'Section',
  twoColumns: 'Ligne · 2 colonnes',
  threeColumns: 'Ligne · 3 colonnes',
  fourColumns: 'Ligne · 4 colonnes',
  columnsColumn: 'Colonne',
  bulletList: 'Liste',
  orderedList: 'Liste numérotée',
  listItem: 'Élément de liste',
  blockquote: 'Citation',
  codeBlock: 'Code',
  table: 'Tableau',
  container: 'Email',
};

export function nodeLabel(type: string) {
  return LABELS[type] ?? type;
}
