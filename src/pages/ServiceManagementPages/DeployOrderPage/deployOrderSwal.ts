import type {
  IDeploymentOrder,
  IDeploymentOrderItem,
} from "../../../types/deploymentOrder";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** HTML tóm tắt đơn + bảng số điện thoại cho SweetAlert confirm/reject. */
export const buildDeployOrderPhonesHtml = (
  order: Pick<
    IDeploymentOrder,
    | "customer_name"
    | "sale_username"
    | "name_ss_account"
    | "description_ss_account"
    | "name"
    | "description"
  >,
  items: IDeploymentOrderItem[] = [],
) => {
  const ssName = order.name_ss_account || order.name || "—";
  const ssDesc = order.description_ss_account || order.description || "—";
  const phoneRows = items.length
    ? items
        .map(
          (item) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left;font-family:ui-monospace,monospace;font-weight:600">${escapeHtml(
          item.phone_number || "—",
        )}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${escapeHtml(
          item.brandname_name || "—",
        )}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${escapeHtml(
          item.provider_name || "—",
        )}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${escapeHtml(
          item.type_name || "—",
        )}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">${escapeHtml(
          item.telco || "—",
        )}</td>
      </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" style="padding:12px;text-align:center;color:#888">Không có số trong đơn</td></tr>`;

  return `
    <div style="text-align:left">
      <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#444">
        Đơn <strong>${escapeHtml(order.customer_name || "—")}</strong>
        của sale <strong>${escapeHtml(order.sale_username || "—")}</strong>,
        Mã SS <strong>${escapeHtml(ssName)}</strong>,
        Chi tiết SS <strong>${escapeHtml(ssDesc)}</strong>
      </p>
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#333">
        Danh sách số (${items.length})
      </p>
      <div style="max-height:240px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f9fafb;position:sticky;top:0">
              <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb">Số điện thoại</th>
              <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb">Định danh</th>
              <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb">Nhà cung cấp</th>
              <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb">Loại số</th>
              <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb">Telco</th>
            </tr>
          </thead>
          <tbody>${phoneRows}</tbody>
        </table>
      </div>
    </div>
  `;
};
