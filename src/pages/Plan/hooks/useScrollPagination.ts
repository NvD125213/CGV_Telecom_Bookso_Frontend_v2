import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollPaginationHook<T> {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scroll: (direction: "left" | "right") => void;
  setData: React.Dispatch<React.SetStateAction<T[] | null>>;
  data: T[] | null;
}

export const useScrollPagination = <T = any>(
  initialData: T[] = []
): ScrollPaginationHook<T> => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [data, setData] = useState<T[] | null>(initialData);

  // Kiểm tra khả năng scroll nhưng chỉ update khi có thay đổi thực sự
  const checkScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const newCanLeft = scrollLeft > 0;
      const newCanRight = scrollLeft < scrollWidth - clientWidth - 10;

      // Chỉ update nếu giá trị khác trước đó để tránh re-render thừa
      setCanScrollLeft((prev) => (prev !== newCanLeft ? newCanLeft : prev));
      setCanScrollRight((prev) => (prev !== newCanRight ? newCanRight : prev));
    }
  }, []);

  // Debounce (giảm tần suất gọi checkScrollButtons)
  useEffect(() => {
    const handleScroll = () => {
      window.requestAnimationFrame(checkScrollButtons);
    };

    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    checkScrollButtons(); // check 1 lần đầu
    scrollElement.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [checkScrollButtons]);

  // Hàm scroll mượt, không gây layout shift
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 350; // width 1 card
    const gap = 16; // khoảng cách giữa các card
    const scrollAmount = cardWidth + gap;

    scrollRef.current.scrollTo({
      left:
        scrollRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount),
      behavior: "smooth",
    });

    // check lại sau khi scroll xong 1 chút
    setTimeout(checkScrollButtons, 350);
  };

  // useScrollPagination.ts
  useEffect(() => {
    // Mỗi lần trang reload hoặc component mount -> về đầu
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, []);

  return { scrollRef, canScrollLeft, canScrollRight, scroll, data, setData };
};
