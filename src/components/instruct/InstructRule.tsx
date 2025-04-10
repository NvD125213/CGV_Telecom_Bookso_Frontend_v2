import Swal from "sweetalert2";
import { FaQuestionCircle } from "react-icons/fa";

const SearchHelp = () => {
  const handleGuideClick = () => {
    Swal.fire({
      title: "📱 Hướng dẫn tìm kiếm số điện thoại",
      html: `
        <div style="text-align: left; font-size: 15px; line-height: 1.6;">
          <p>Bạn có thể dùng <code>*</code> để đại diện cho chuỗi số bất kỳ:</p>
          <ul style="padding-left: 1rem; margin-top: 0.5rem;">
            <li>🔹 <code><b>*79</b></code> → chứa số <b>79 ở cuối</b>.</li>
            <li>🔹 <code><b>0909*</b></code> → chứa số <b>0909 ở đầu</b>.</li>
            <li>🔹 <code><b>999</b></code> → chứa <b>999 ở bất kỳ vị trí nào</b>.</li>
            <li>🔹 <code><b>0909*99</b></code> → <b>bắt đầu bằng 0909</b> và <b>kết thúc bằng 99</b>.</li>
          </ul>
          <hr style="margin: 1rem 0;" />
          <p>✨ Ký tự <code>*</code> có thể thay thế cho mọi dãy số không xác định. Hãy kết hợp linh hoạt để có kết quả tìm kiếm chính xác.</p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Đã hiểu 👍",
      width: 600,
      customClass: {
        popup: "rounded-xl shadow-md",
        confirmButton:
          "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
      },
    });
  };

  return (
    <button
      onClick={handleGuideClick}
      className="ml-2 text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
      type="button">
      <FaQuestionCircle className="text-base" />
      Hướng dẫn tìm kiếm
    </button>
  );
};

export default SearchHelp;
