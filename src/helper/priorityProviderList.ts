type ItemWithName = { name: string; [key: string]: any };
type PriorityItem = { name: string; order: number };

export function sortByPriority<T extends ItemWithName>(
  data: T[],
  priorityList: PriorityItem[]
): T[] {
  const orderMap = new Map(priorityList.map((item) => [item.name, item.order]));

  return data
    .map((item, index) => ({
      ...item,
      _sortOrder: orderMap.get(item.name) ?? Infinity,
      _originalIndex: index,
    }))
    .sort((a, b) => {
      if (a._sortOrder === b._sortOrder) {
        return a._originalIndex - b._originalIndex;
      }
      return a._sortOrder - b._sortOrder;
    })
    .map(({ _sortOrder, _originalIndex, ...item }) => item as T);
}
