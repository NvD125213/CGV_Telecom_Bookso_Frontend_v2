export interface RouteEntry {
  key: string;
  value: string | number;
}

export interface MetaEntry {
  key: string;
  value: string;
}

export interface OutboundDidFormProps {
  value: Record<string, number>;
  meta: Record<string, string>;
  onChange: (value: Record<string, number>) => void;
  onMetaChange: (meta: Record<string, string>) => void;
}
