import DropzoneComponent from "../../components/form/form-elements/DropZone";
import { uploadFile, uploadFileV2 } from "../../services/phoneNumber";
import { copyToClipBoard } from "../../helper/copyToClipboard";
import { useState } from "react";
import { handleError } from "../../helper/handleError";
import Swal from "sweetalert2";

const UploadExcel = () => {
  const [errors, setErrors] = useState<
    { row: number; errors: string[] }[] | string
  >("");

  const upLoadFileExcel = async (file: File) => {
    setErrors(""); // reset errors khi bắt đầu upload file mới

    Swal.fire({
      title: "Lựa chọn upload",
      html: `
      <!-- Description -->
      <div style="background:#f0f8ff; border:1px solid #d0e6ff; padding:12px; border-radius:8px; margin-bottom:15px; text-align:left;">
        <p style="margin:0; font-size:14px; color:#333; line-height:1.6;">
          <b>Hướng dẫn:</b><br/>
          - Nếu file <span style="color:red; font-weight:600;" style="color:blue; font-weight:600;">có số đã được thanh lý và nhập lại</span> → chọn 
            <span style="color:green; font-weight:600;">Upload Release</span>.<br/>
          - Nếu file <span style="color:blue; font-weight:600;">không có số đã được thanh lý</span> → chọn 
            <span style="color:#6c5ce7; font-weight:600;">Upload All</span>.
        </p>
      </div>

      <!-- Button group -->
      <div style="display:flex; justify-content:center; gap:15px; margin-top:10px;">
        <button id="btnV1" 
          class="swal2-confirm swal2-styled" 
          style="flex:1; background:#6c5ce7; font-weight:600; border-radius:6px;">
          Upload All 
        </button>

        <button id="btnV2" 
          class="swal2-confirm swal2-styled" 
          style="flex:1; background:#27ae60; font-weight:600; border-radius:6px;">
          Upload Release
        </button>
      </div>
    `,
      showCancelButton: false, // hiển thị nút hủy
      cancelButtonColor: "#e74c3c",
      showCloseButton: true,
      showConfirmButton: false, // ẩn nút mặc định
      allowOutsideClick: false, // click ngoài không đóng
      didOpen: () => {
        document
          .getElementById("btnV1")
          ?.addEventListener("click", async () => {
            Swal.close();
            await handleUpload(file, "v1");
          });
        document
          .getElementById("btnV2")
          ?.addEventListener("click", async () => {
            Swal.close();
            await handleUpload(file, "v2");
          });
      },
    });
  };

  const handleUpload = async (file: File, type: "v1" | "v2") => {
    try {
      const res =
        type === "v1" ? await uploadFile(file) : await uploadFileV2(file);

      if (res.status === 200) {
        Swal.fire({
          title: `${res.message}`,
          html: `
          <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Danh sách số trùng lặp:
          </label>
          <textarea id="message" rows="4"
            class="block max-h-[200px] w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 px-[10px]">${
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
      console.log(type);
    } catch (error: any) {
      handleUploadError(error);
    }
  };

  const handleUploadError = (error: any) => {
    const parsedError = handleError(error?.response?.data?.detail);

    if (parsedError?.errors && Array.isArray(parsedError.errors)) {
      setErrors(parsedError.errors);
    } else if (typeof error?.response?.data?.detail === "string") {
      const rawDetail = error?.response?.data?.detail;
      const start = rawDetail.indexOf("{");
      const end = rawDetail.lastIndexOf("}") + 1;

      if (start !== -1 && end !== -1) {
        const jsonPart = rawDetail.substring(start, end).replace(/'/g, '"');
        try {
          const objErr = JSON.parse(jsonPart);

          if (objErr.message.includes("provider does not exist")) {
            setErrors(
              "Xuất hiện nhà cung cấp không tồn tại! Hãy kiểm tra lại danh sách tên nhà cung cấp của bạn."
            );
          } else if (objErr.message.includes("Type number does not exist")) {
            setErrors(
              "Xuất hiện loại số không tồn tại! Hãy kiểm tra lại danh sách loại số của bạn."
            );
          } else {
            setErrors(
              "Đã xảy ra lỗi không xác định (mã lỗi không nằm trong danh sách xử lý)."
            );
          }
        } catch (e: any) {
          setErrors(e.response?.data?.detail || "Lỗi parse JSON trong error.");
        }
      } else {
        setErrors("Thiếu một số cột trong file Excel.");
      }
    } else {
      setErrors("Đã xảy ra lỗi không xác định.");
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
