import { useState, useEffect } from "react";
import { ChevronUpIcon } from "../../icons";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkScreenSize();
    window.addEventListener("scroll", toggleVisibility);
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed z-50 bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all duration-300 ${
        isMobile ? "left-4 bottom-4 w-12 h-12" : "right-4 bottom-4 w-12 h-12"
      }`}
      aria-label="Scroll to top">
      <ChevronUpIcon className="w-6 h-6" />
    </button>
  );
}
