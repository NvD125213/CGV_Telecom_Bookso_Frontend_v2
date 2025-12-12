// TrueFocus.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import RotatingText, { RotatingTextRef } from "./RotatingText";

interface TrueFocusProps {
  words: (string | string[])[];
  manualMode?: boolean; // nếu true, không auto chuyển index
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number; // seconds
  pauseBetweenAnimations?: number; // seconds
  rotationIntervalForRotatingText?: number; // ms per RotatingText rotation
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
  words,
  manualMode = false,
  blurAmount = 5,
  borderColor = "#06b6d4",
  glowColor = "rgba(6, 182, 212, 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  rotationIntervalForRotatingText = 1500,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // refs to measure DOM nodes for focus box
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  // refs to rotating text instances (implements reset(), next(), jumpTo(), ...)
  const rotatingRefs = useRef<(RotatingTextRef | null)[]>([]);

  // Track previous index to only reset when actually changing focus
  const prevIndexRef = useRef<number>(0);

  // Calculate max width for each RotatingText to prevent layout shift
  // Use a hidden DOM element instead of canvas to properly measure text with accents
  const calculateMaxWidth = (texts: string[]): number => {
    // Keep font size in sync with on-screen clamp(24px, 2.5vw, 40px)
    const preferred =
      typeof window !== "undefined" ? window.innerWidth * 0.025 : 32;
    const fontSizePx = Math.min(40, Math.max(24, preferred));

    // Create a temporary hidden element to measure text width accurately
    const measureElement = document.createElement("span");
    measureElement.style.position = "absolute";
    measureElement.style.visibility = "hidden";
    measureElement.style.whiteSpace = "nowrap";
    measureElement.style.fontSize = `${fontSizePx}px`;
    measureElement.style.fontWeight = "700";
    measureElement.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    measureElement.style.pointerEvents = "none";
    document.body.appendChild(measureElement);

    let maxWidth = 0;
    texts.forEach((text) => {
      measureElement.textContent = text;
      const width = measureElement.offsetWidth;
      if (width > maxWidth) {
        maxWidth = width;
      }
    });

    // Clean up
    document.body.removeChild(measureElement);

    // Add some padding to prevent clipping
    return maxWidth + 20;
  };

  // Pre-calculate widths for all RotatingText items (reactive to resize)
  const [rotatingTextWidths, setRotatingTextWidths] = useState<number[]>([]);

  const recomputeRotatingWidths = React.useCallback(() => {
    const widths: number[] = [];
    words.forEach((item, index) => {
      if (Array.isArray(item)) {
        widths[index] = calculateMaxWidth(item);
      }
    });
    setRotatingTextWidths(widths);
  }, [words]);

  useEffect(() => {
    recomputeRotatingWidths();
  }, [recomputeRotatingWidths]);

  const [focusRect, setFocusRect] = useState<FocusRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Auto-advance currentIndex unless manualMode
  // Calculate interval based on current item type
  useEffect(() => {
    if (manualMode) return;

    const calculateInterval = (index: number): number => {
      const item = words[index];
      if (Array.isArray(item)) {
        // For RotatingText: animationDuration + (number of items * rotationInterval)
        const rotationIntervalSeconds = rotationIntervalForRotatingText / 1000;
        return (
          (animationDuration + item.length * rotationIntervalSeconds) * 1000
        );
      } else {
        // For normal string: animationDuration + pauseBetweenAnimations
        return (animationDuration + pauseBetweenAnimations) * 1000;
      }
    };

    const timeoutId = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, calculateInterval(currentIndex));

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    manualMode,
    animationDuration,
    pauseBetweenAnimations,
    rotationIntervalForRotatingText,
    words,
    currentIndex,
  ]);

  const updateFocusRect = React.useCallback(() => {
    const el = itemRefs.current[currentIndex];
    if (!el || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    setFocusRect({
      x: rect.left - parentRect.left,
      y: rect.top - parentRect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [currentIndex]);

  // When currentIndex changes, update focus box to measure active element
  useEffect(() => {
    updateFocusRect();

    // Only reset rotating blocks when currentIndex actually changes (not on every render)
    // IMPORTANT: Do NOT include 'words' in dependency array to avoid unnecessary resets
    // We use words inside the effect but it's stable enough for our use case
    const prevIndex = prevIndexRef.current;
    if (prevIndex !== currentIndex) {
      // Only reset when focus actually changes between items
      words.forEach((w, idx) => {
        if (!Array.isArray(w)) return; // skip normal text

        const instance = rotatingRefs.current[idx];
        if (!instance) return;

        if (idx === currentIndex) {
          // focused rotating block -> ensure it will auto-run from first item
          instance.reset();
        } else if (idx === prevIndex) {
          // previously focused -> pause and reset to first
          instance.reset();
        }
      });
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, updateFocusRect, words]);

  // Recompute widths and focus rect on resize so font clamp + measurements stay in sync
  useEffect(() => {
    const handleResize = () => {
      recomputeRotatingWidths();
      updateFocusRect();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [recomputeRotatingWidths, updateFocusRect]);

  // Called by RotatingText when it reaches last sub-text (optional behavior to advance parent)
  // Note: This is disabled when using auto-advance mode because TrueFocus already calculates
  // the correct timing based on item.length * rotationInterval
  const handleSubTextLast = (parentIndex: number) => {
    // Only advance if in manual mode, otherwise let auto-advance handle it
    if (manualMode && parentIndex === currentIndex) {
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, rotationIntervalForRotatingText);
    }
  };

  // Mouse interactions: hovering a word should make it focused when manualMode=true
  // (and also useful for manual preview)
  const handleMouseEnter = (idx: number) => {
    if (!manualMode) return;
    setCurrentIndex(idx);
  };

  // Render
  return (
    <div
      ref={containerRef}
      className="relative flex gap-3 justify-center items-center flex-nowrap w-full"
      style={{ userSelect: "none" }}>
      {words.map((item, index) => {
        const isActive = index === currentIndex;

        // --- IMAGE (40%) ---
        if (typeof item === "string" && item.startsWith("https")) {
          return (
            <div
              key={index}
              className="basis-1/2 flex justify-center items-center"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onMouseEnter={() => handleMouseEnter(index)}>
              <img
                src={item}
                alt=""
                className="w-full object-contain cursor-pointer select-none"
                style={{
                  filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
                  transition: `filter ${animationDuration}s ease`,
                }}
              />
            </div>
          );
        }

        // --- TEXT (30%) ---
        if (typeof item === "string") {
          return (
            <div
              key={index}
              className="basis-1/2 flex justify-center items-center"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onMouseEnter={() => handleMouseEnter(index)}>
              <span
                className="text-[clamp(1.5rem,2.5vw,2.5rem)] font-bold cursor-pointer select-none leading-tight text-center w-full"
                style={{
                  filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
                  transition: `filter ${animationDuration}s ease`,
                }}>
                {item}
              </span>
            </div>
          );
        }

        // --- ROTATING TEXT (30%) ---
        if (Array.isArray(item)) {
          const maxWidth = rotatingTextWidths[index] || 0;

          return (
            <div
              key={index}
              className="basis-1/2 flex justify-center items-center"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              style={{
                filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
                transition: `filter ${animationDuration}s ease`,
                minWidth: maxWidth > 0 ? `${maxWidth}px` : "auto",
              }}>
              <RotatingText
                ref={(r) => {
                  rotatingRefs.current[index] = r;
                }}
                texts={item}
                auto={isActive}
                rotationInterval={rotationIntervalForRotatingText}
                loop={true}
                onNext={
                  manualMode
                    ? (subIndex) => {
                        if (subIndex === item.length - 1) {
                          handleSubTextLast(index);
                        }
                      }
                    : undefined
                }
                mainClassName="text-[clamp(1.5rem,2.5vw,2.5rem)] font-bold inline-flex justify-center items-center leading-tight text-center w-full"
              />
            </div>
          );
        }

        return null;
      })}

      {/* Focus rectangle */}
      <motion.div
        className="absolute top-0 left-0 pointer-events-none box-border"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: focusRect.width > 0 && focusRect.height > 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration }}
        style={
          {
            // CSS variables for styling corners/glow if you want
          } as React.CSSProperties
        }>
        {/* corner markers */}
        <span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] left-[-10px] border-r-0 border-b-0"
          style={{
            borderColor,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
        <span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] right-[-10px] border-l-0 border-b-0"
          style={{
            borderColor,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
        <span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] left-[-10px] border-r-0 border-t-0"
          style={{
            borderColor,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
        <span
          className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] right-[-10px] border-l-0 border-t-0"
          style={{
            borderColor,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
      </motion.div>
    </div>
  );
};

export default TrueFocus;
