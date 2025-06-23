import { useSidebar } from "../../context/SidebarContext";

const Footer = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <footer className="bg-white dark:bg-gray-900 dark:text-white overflow-hidden text-gray-800 py-4 w-full mt-4">
      <div
        className={`container mx-auto flex items-center justify-center ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        }`}>
        <p className="text-sm">
          Copyright &copy; 2025 - All rights reserved by CGV Telecom
        </p>
      </div>
    </footer>
  );
};

export default Footer;
