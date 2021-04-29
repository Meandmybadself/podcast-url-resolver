export const makeSearchSafeString = (string: string): string =>
  string.toLowerCase().replace(/[\W|aeiou]+/g, "");

export const normalizeText = (string: string): string =>
  string
    .replace("–", "-") // Em dash
    .replace("“", '"') // Smart quotes
    .replace("‘", "'")
    .replace("”", '"')
    .replace("’", "'")
    .trim()
    .substr(0, 30);
