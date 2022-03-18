const { makeSearchSafeString, normalizeString } = require("./string");

test("Makes string search-safe", () => {
  expect(makeSearchSafeString("Hello, world! 123")).toBe("hllwrld123");
});

test("Normalizes string", () => {
  expect(normalizeString("   This is a very – “tricky“ ’string’")).toBe(
    "This is a very - \"tricky\" 'string'"
  );
});
