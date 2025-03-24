import ComponentCard from "../../common/ComponentCard";
import { useDropzone, FileRejection } from "react-dropzone";
import { useState } from "react";

interface DropzoneComponentProps {
  onSubmit: (file: File) => void;
}

const DropzoneComponent: React.FC<DropzoneComponentProps> = ({
  onSubmit,
}: {
  onSubmit: (file: File) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Kiểm tra nếu tải lên nhiều file
    if (acceptedFiles.length > 1) {
      setError("Chỉ được chọn 1 file duy nhất");
      return;
    }

    if (fileRejections.length > 0) {
      const invalidType = fileRejections.some((rejection) =>
        rejection.errors.some((err) => err.code === "file-invalid-type")
      );
      if (invalidType) {
        setError("Chỉ chấp nhận các tệp .xls và .xlsx");
      }
      return;
    }

    // Kiểm tra định dạng file
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    const selectedFile = acceptedFiles[0];
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Định dạng file không hợp lệ");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (file) {
      onSubmit(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], // .xlsx
      "application/vnd.ms-excel": [], // .xls
    },
    maxFiles: 1, // Chỉ cho phép chọn 1 file
  });

  return (
    <ComponentCard title="Tải lên file Excel">
      <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
        <form
          {...getRootProps()}
          className={`dropzone rounded-xl border-dashed border-gray-300 p-7 lg:p-10 ${
            isDragActive
              ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
              : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
          }`}
          id="demo-upload">
          <input {...getInputProps()} />
          <div className="dz-message flex flex-col items-center m-0!">
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
            </div>
            <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
              {isDragActive ? "Thả tập tin ở đây" : "Kéo & Thả Tập Tin Vào Đây"}
            </h4>
            <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
              Kéo và thả file Excel của bạn vào đây hoặc duyệt
            </span>
            <span className="font-medium underline text-theme-sm text-brand-500">
              Browse File
            </span>
          </div>
        </form>
        {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      </div>

      {file && (
        <div className="mt-4 p-2 border-b flex justify-between items-center">
          <span>{file.name}</span>
          <button
            onClick={handleRemoveFile}
            className="text-red-500 hover:text-red-700">
            Xóa
          </button>
        </div>
      )}

      {file && (
        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Submit
        </button>
      )}
    </ComponentCard>
  );
};

export default DropzoneComponent;
