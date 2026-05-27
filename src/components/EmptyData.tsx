interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] dark:bg-gray-800 dark:border-gray-700 w-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8">
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto dark:bg-gray-800 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 9h.01M15 9h.01M9.172 16.172a4 4 0 015.656 0M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title || "Không có dữ liệu"}
        </h2>

        {/* Description */}
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          {description ||
            "Hiện tại chưa có dữ liệu nào để hiển thị. Hãy thử thêm mới hoặc kiểm tra lại bộ lọc tìm kiếm."}
        </p>
      </div>
    </div>
  );
}
