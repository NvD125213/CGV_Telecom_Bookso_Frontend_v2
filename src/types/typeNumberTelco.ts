export interface ITypeNumberTelco {
  id: number;
  type_id: number;
  telco: string;
  created_at: string;
  type_name: string | null;
}

export interface ITypeNumberTelcoListParams {
  page: number;
  size: number;
  type_id?: number;
  type_name?: string;
  telco?: string;
  order_by?: string;
  order_dir?: "asc" | "desc" | string;
}

export interface ITypeNumberTelcoListMeta {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface ITypeNumberTelcoListResult {
  items: ITypeNumberTelco[];
  meta: ITypeNumberTelcoListMeta;
}

export interface ICreateTypeNumberTelco {
  type_id: number;
  telco: string;
}

export interface IUpdateTypeNumberTelco {
  type_id?: number | null;
  telco?: string | null;
}

export interface ICreateTypeNumberTelcosBulk {
  type_id: number;
  telcos: string[];
}

export interface IReplaceTelcosForType {
  telcos: string[];
}

export interface IReplaceTelcosForTypeResult {
  type_id: number;
  type_name: string | null;
  telcos: string[];
}

export interface ITypeNumberTelcoByType {
  type_id: number;
  type_name: string | null;
  telcos: string[];
}

export interface ITypeNumberTelcoByTelco {
  telco: string;
  types: string[];
  type_ids: number[];
}

export interface ITypeNumberTelcoMap {
  by_type: ITypeNumberTelcoByType[];
  by_telco: ITypeNumberTelcoByTelco[];
}

const normalizeItem = (raw: Record<string, unknown>): ITypeNumberTelco => ({
  id: Number(raw.id ?? 0),
  type_id: Number(raw.type_id ?? 0),
  telco: String(raw.telco ?? ""),
  created_at: String(raw.created_at ?? ""),
  type_name:
    raw.type_name == null || raw.type_name === ""
      ? null
      : String(raw.type_name),
});

export const parseTypeNumberTelcoListResponse = (
  response: unknown,
): ITypeNumberTelcoListResult => {
  const root = (response ?? {}) as Record<string, unknown>;
  const payload =
    root.items != null || root.meta != null
      ? root
      : ((root.data as Record<string, unknown> | undefined) ?? root);

  const rawItems = payload.items ?? payload.records ?? [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) =>
    normalizeItem(item as Record<string, unknown>),
  );

  const meta = (payload.meta ?? {}) as Partial<ITypeNumberTelcoListMeta>;
  const size = meta.size ?? items.length ?? 50;
  const total = meta.total ?? items.length;
  const pages = meta.pages ?? Math.max(1, Math.ceil(total / Math.max(size, 1)));

  return {
    items,
    meta: {
      page: meta.page ?? 1,
      size,
      total,
      pages,
    },
  };
};

export const parseTypeNumberTelcoMapResponse = (
  response: unknown,
): ITypeNumberTelcoMap => {
  const root = (response ?? {}) as Record<string, unknown>;
  const payload =
    root.by_type != null || root.by_telco != null
      ? root
      : ((root.data as Record<string, unknown> | undefined) ?? root);

  const byTypeRaw = Array.isArray(payload.by_type) ? payload.by_type : [];
  const byTelcoRaw = Array.isArray(payload.by_telco) ? payload.by_telco : [];

  return {
    by_type: byTypeRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        type_id: Number(row.type_id ?? 0),
        type_name:
          row.type_name == null || row.type_name === ""
            ? null
            : String(row.type_name),
        telcos: Array.isArray(row.telcos) ? row.telcos.map(String) : [],
      };
    }),
    by_telco: byTelcoRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        telco: String(row.telco ?? ""),
        types: Array.isArray(row.types) ? row.types.map(String) : [],
        type_ids: Array.isArray(row.type_ids)
          ? row.type_ids.map((id) => Number(id))
          : [],
      };
    }),
  };
};
