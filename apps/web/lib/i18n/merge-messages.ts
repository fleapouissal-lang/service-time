type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeMessages<T extends PlainObject>(
  base: T,
  override: Partial<T> | PlainObject,
): T {
  const result = { ...base };

  for (const key of Object.keys(override)) {
    const overrideValue = (override as PlainObject)[key];
    const baseValue = (base as PlainObject)[key];

    if (overrideValue === undefined) {
      continue;
    }

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      (result as PlainObject)[key] = mergeMessages(
        baseValue,
        overrideValue,
      );
      continue;
    }

    if (Array.isArray(overrideValue) && overrideValue.length > 0) {
      (result as PlainObject)[key] = overrideValue;
      continue;
    }

    if (!Array.isArray(overrideValue)) {
      (result as PlainObject)[key] = overrideValue;
    }
  }

  return result;
}
