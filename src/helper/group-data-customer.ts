import type { ICustomerListResult, IGroupedCustomer } from "../types/customer";

export const groupDataCustomer = (
  data: ICustomerListResult | { items?: any[] } | null | undefined,
): IGroupedCustomer[] => {
  const customers = data?.items ?? [];

  const groupedCustomers = customers.reduce((arr: IGroupedCustomer[], current: any) => {
    const {
      contract_id,
      contract_number,
      contract_type,
      no_charge,
      contract_note,
      ss_accounts = [],
      ...customerInfo
    } = current;

    // Thông tin hợp đồng
    const contract = {
      contract_id,
      contract_number,
      contract_type,
      no_charge,
      contract_note,
    };

    // Thêm display_account cho tài khoản SS
    const formatAccount = (account: any) => ({
      ...account,
      display_account: `${account.name ?? ""} * ${account.description ?? ""}`,
    });

    // Tìm khách hàng đã tồn tại
    const existing = arr.find(
      (item: any) => item.customer_id === current.customer_id,
    );

    if (existing) {
      // Gộp hợp đồng, loại trùng theo contract_id
      const contractExists = existing.contracts.some(
        (item: any) => item.contract_id === contract_id,
      );

      if (!contractExists) {
        existing.contracts.push(contract);
      }

      // Gộp ss_accounts, loại trùng theo account_id
      const accountIds = new Set(
        existing.ss_accounts.map((item: any) => item.account_id),
      );

      for (const account of ss_accounts) {
        if (!accountIds.has(account.account_id)) {
          const formattedAccount = formatAccount(account);

          existing.ss_accounts.push(formattedAccount);
          accountIds.add(account.account_id);
        }
      }
    } else {
      // Khách hàng mới: loại tài khoản trùng theo account_id
      const uniqueAccounts = [
        ...new Map(
          ss_accounts.map((account: any) => {
            const formattedAccount = formatAccount(account);

            return [formattedAccount.account_id, formattedAccount];
          }),
        ).values(),
      ];

      arr.push({
        ...customerInfo,
        ss_accounts: uniqueAccounts,
        contracts: [contract],
      });
    }

    return arr;
  }, []);

  return groupedCustomers;
};
