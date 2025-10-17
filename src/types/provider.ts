export interface IProvider {
  id: string;
  name: string;
  active?: string;
  description: string | null;
  phone_number_limit_alert: number;
  is_public: boolean | string;
  users?:
    | string
    | {
        rule: string[];
      };
}
