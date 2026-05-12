import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import Close from "@mui/icons-material/Close";

export type UploadInvalidRowDetail = {
  row: number;
  phone: string;
  errors: string[];
};

type ModalDetailFileProps = {
  open: boolean;
  onClose: () => void;
  rows: UploadInvalidRowDetail[];
};

export default function ModalDetailFile({
  open,
  onClose,
  rows,
}: ModalDetailFileProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="modal-detail-file-invalid-title">
      <DialogTitle
        id="modal-detail-file-invalid-title"
        component="div"
        className="flex items-center justify-between gap-2 border-b border-red-200 pr-2 pb-2 pt-3 dark:border-red-900/40">
        <div>
          <p className="text-base font-semibold text-red-800 dark:text-red-200">
            Invalid data — các dòng cần chỉnh sửa
          </p>
          <p className="mt-0.5 text-xs text-red-700/90 dark:text-red-300/90">
            {rows.length} dòng trong file không hợp lệ.
          </p>
        </div>
        <IconButton
          aria-label="Đóng"
          onClick={onClose}
          size="small"
          className="text-gray-600 dark:text-gray-300">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers className="bg-red-50/50 dark:bg-red-950/10">
        <div className="max-h-[min(60vh,420px)] overflow-auto rounded-lg border border-red-200 dark:border-red-900/40">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-[1] bg-red-100/95 dark:bg-red-950/90">
              <tr className="text-red-900 dark:text-red-200">
                <th className="whitespace-nowrap px-2 py-2 font-medium">
                  Dòng (Excel)
                </th>
                <th className="whitespace-nowrap px-2 py-2 font-medium">
                  Số điện thoại
                </th>
                <th className="px-2 py-2 font-medium">Chi tiết lỗi</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 dark:text-gray-200">
              {rows.map((item, idx) => (
                <tr
                  key={`${item.row}-${item.phone}-${idx}`}
                  className="border-t border-red-100 dark:border-red-900/30">
                  <td className="align-top px-2 py-2 font-mono font-medium">
                    {item.row}
                  </td>
                  <td className="align-top px-2 py-2 font-mono">
                    {item.phone || "—"}
                  </td>
                  <td className="align-top px-2 py-2">
                    {item.errors.length > 0 ? (
                      <ul className="list-inside list-disc space-y-0.5">
                        {item.errors.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
