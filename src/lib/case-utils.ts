/**
 * Snake_case ↔ camelCase key transformers for Supabase ↔ App mapping.
 */

const snakeToCamelKey = (key: string): string =>
  key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const camelToSnakeKey = (key: string): string =>
  key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

type AnyRecord = Record<string, unknown>;

export const snakeToCamel = <T>(obj: AnyRecord): T => {
  const result: AnyRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamelKey(key)] = value;
  }
  return result as unknown as T;
};

export const camelToSnake = (obj: AnyRecord): AnyRecord => {
  const result: AnyRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnakeKey(key)] = value;
  }
  return result;
};

export const snakeToCamelArray = <T>(arr: AnyRecord[]): T[] =>
  arr.map((item) => snakeToCamel<T>(item));
