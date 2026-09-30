const PAGE_SIZE = 1000;
const IN_CHUNK_SIZE = 100;

type RangeResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

/**
 * Reads every row of a query. PostgREST silently caps a single response
 * (about 1000 rows), so we page with `.range()` until a short page comes back.
 * The query must have a stable `.order()`.
 */
export async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => RangeResult<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Runs `.in()` lookups in chunks so long id lists do not overflow the URL. */
export async function fetchInChunks<T>(
  ids: string[],
  fetchChunk: (chunk: string[]) => RangeResult<T>,
): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + IN_CHUNK_SIZE));
  }
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await fetchChunk(chunk);
      if (error) throw new Error(error.message);
      return data ?? [];
    }),
  );
  return results.flat();
}
