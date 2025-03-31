// Default values shown
const Spinner = () => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300"
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
      }}>
      <div className="flex flex-col items-center">
        {/* Wave Loader */}
        <div className="flex space-x-1">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
        </div>
        <p className="mt-4 text-white text-lg">Đang tải, vui lòng đợi...</p>
      </div>
    </div>
  );
};

export default Spinner;
