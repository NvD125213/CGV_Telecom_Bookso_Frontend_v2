import DropzoneComponent from "../../components/form/form-elements/DropZone";
import { uploadFile } from "../../services/phoneNumber";
import { copyToClipBoard } from "../../helper/copyToClipboard";
import { useState } from "react";
import { handleError } from "../../helper/handleError";
import Swal from "sweetalert2";

const UploadExcel = () => {
  const [errors, setErrors] = useState<
    { row: number; errors: string[] }[] | string
  >("");

  const upLoadFileExcel = async (file: File) => {
    // Reset errors khi bắt đầu upload file mới
    setErrors("");

    try {
      const res = await uploadFile(file);
      if (res.status === 200) {
        Swal.fire({
          title: `${res.message}`,
          html: `
            <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Danh sách số trùng lặp:
            </label>
            <textarea id="message" rows="4" class="block max-h-[200px] w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 px-[10px]">${
              res.update_error.length > 0
                ? res.update_error.join(", ")
                : "Không có giá trị trùng lặp"
            }</textarea>
          `,
          showDenyButton: true,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Sao chép",
          denyButtonText: "Bỏ qua",
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) {
            copyToClipBoard(res.update_error);
            Swal.fire("Đã sao chép!", "", "success");
          }
        });
      }
    } catch (error: any) {
      const parsedError = handleError(error?.response?.data?.detail);

      if (parsedError?.errors && Array.isArray(parsedError.errors)) {
        setErrors(parsedError.errors);
      } else if (typeof error?.response?.data?.detail === "string") {
        const rawDetail = error?.response?.data?.detail;

        // Kiểm tra có chứa JSON không
        const start = rawDetail.indexOf("{");
        const end = rawDetail.lastIndexOf("}") + 1;

        if (start !== -1 && end !== -1) {
          const jsonPart = rawDetail.substring(start, end).replace(/'/g, '"');

          try {
            const objErr = JSON.parse(jsonPart);

            if (
              objErr.message === "Add data failed. provider does not exist."
            ) {
              setErrors(
                "Xuất hiện nhà cung cấp không tồn tại! Hãy kiểm tra lại danh sách tên nhà cung cấp của bạn."
              );
            } else if (
              objErr.message === "Add data failed. Type number does not exist."
            ) {
              setErrors(
                "Xuất hiện loại số không tồn tại! Hãy kiểm tra lại danh sách loại số của bạn."
              );
            } else {
              setErrors(
                "Đã xảy ra lỗi không xác định (mã lỗi không nằm trong danh sách xử lý)."
              );
            }
          } catch (e: any) {
            setErrors(e.response.data.detail);
          }
        } else {
          setErrors("Thiếu một số cột trong file Excel.");
        }
      } else {
        setErrors("Đã xảy ra lỗi không xác định.");
      }
    }
  };

  return (
    <>
      {}
      <DropzoneComponent onSubmit={upLoadFileExcel} />
      {Array.isArray(errors) ? (
        <div className="mt-4 p-4 border border-red-500 bg-red-50 rounded-md">
          <ul className="list-disc list-inside space-y-2">
            {errors.map((errorItem, index) => (
              <li key={index}>
                <span className="font-semibold text-red-700">
                  Dòng {errorItem.row}:
                </span>
                <ul className="ml-4 list-none">
                  {errorItem.errors.map((err, idx) => (
                    <li key={idx} className="text-red-500">
                      {err}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        errors && (
          <div className="mt-4 p-4 border border-red-500 bg-red-50 rounded-md text-red-500">
            {errors}
          </div>
        )
      )}
    </>
  );
};

export default UploadExcel;
