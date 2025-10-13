type ListFn<TParams, TItem> = (params: TParams & { page?: number; pageSize?: number }) => Promise<any>

export async function fetchAllPaginated<TParams extends Record<string, any>, TItem = any>(
  listFn: ListFn<TParams, TItem>,
  params: TParams,
  pageSize: number = 1000
): Promise<TItem[]> {
  let page = 1
  const all: TItem[] = []
 
  while (true) {
    const res = await listFn({ ...(params as any), page, pageSize })
    const data = (res as any).data ?? res
    const items: TItem[] = (data && 'items' in data) ? (data.items as TItem[]) : (Array.isArray(data) ? data as TItem[] : [])
    const total: number = (data && 'total' in data) ? (data.total as number) : items.length
    all.push(...items)
    if (all.length >= total || items.length === 0) break
    page += 1
  }
  return all
}


