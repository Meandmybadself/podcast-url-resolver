import { decode } from "html-entities";

// Airline-rules string normalization for fuzzy string matching.
// - removes all non-alphanumeric characters
// - converts to lowercase
// - removes all vowels

export const makeSearchSafeString = (string: string): string =>
  string.toLowerCase().replace(/[\W|aeiou]+/g, "");

// This should be used to account for inconsistencies in how platforms represent titles.
export const normalizeString = (string: string): string =>
  decode(
    string
      .replaceAll("–", "-") // Em dash
      .replaceAll("“", '"') // Smart quotes
      .replaceAll("‘", "'")
      .replaceAll("”", '"')
      .replaceAll("’", "'")
      .trim()
  );
