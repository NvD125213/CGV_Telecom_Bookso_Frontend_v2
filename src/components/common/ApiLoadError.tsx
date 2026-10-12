type ApiLoadErrorProps = {
  message?: string;
  className?: string;
};

export default function ApiLoadError({
  message = "Đang có lỗi xảy ra",
  className = "",
}: ApiLoadErrorProps) {
  return (
    <div
      className={`flex min-h-[120px] w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30 ${className}`}>
      <p className="text-center text-sm font-medium text-red-600 dark:text-red-300">
        {message}
      </p>
    </div>
  );
}
