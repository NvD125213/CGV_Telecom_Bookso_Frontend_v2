export interface OutboundRouteItem {
  brandname_id: number | null;
  provider: string | null;
  quantity: number | null;
}

export interface RouteEntry {
  id: string;
  provider: string;
  brandname_id: string;
  quantity: string;
}

export interface MetaEntry {
  key: string;
  value: string;
}

export type OutboundDidValue =
  | OutboundRouteItem[]
  | Record<string, number>;

const toNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isNaN(num) ? null : num;
};

const toProviderOrNull = (val: unknown): string | null => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str ? str : null;
};

export function normalizeOutboundDidByRoute(
  data: unknown,
): OutboundRouteItem[] {
  if (Array.isArray(data)) {
    return data.map((item: Record<string, unknown>) => ({
      brandname_id: toNumberOrNull(item.brandname_id),
      provider:
        toProviderOrNull(item.provider) ??
        toProviderOrNull(item.provider_id),
      quantity: toNumberOrNull(item.quantity),
    }));
  }

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, number>).map(
      ([provider, quantity]) => ({
        brandname_id: null,
        provider,
        quantity: toNumberOrNull(quantity),
      }),
    );
  }

  return [];
}

export interface OutboundDidFormProps {
  value: OutboundDidValue;
  meta: Record<string, string>;
  onChange: (value: OutboundRouteItem[]) => void;
  onMetaChange: (meta: Record<string, string>) => void;
  hide?: "meta" | "outbound";
}
