import React, { useState } from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

interface FloatingActionPanelProps {
  children: React.ReactNode;
  position?: "left" | "right";
  triggerIcon?: React.ReactNode;
  panelWidth?: number;
}

export default function FloatingActionPanel({
  children,
  position = "right",
  triggerIcon,
}: FloatingActionPanelProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");
  const { theme } = useTheme();
  const isChildrenEmpty =
    children === null ||
    children === undefined ||
    (Array.isArray(children) && children.length === 0) ||
    typeof children === "boolean";

  if (isChildrenEmpty) return null;
  if (!isMobile) {
    return <>{children}</>;
  }

  const panelVariants: Variants = {
    closed: {
      width: 0,
      opacity: 0,
      x: position === "right" ? -20 : 20,
    },
    open: {
      width: "auto",
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return children == null ? null : (
    <Box
      sx={{
        position: "fixed",
        top: "50%",
        [position]: 0,
        transform: "translateY(-50%)",
        display: "flex",
        alignItems: "center",
        zIndex: 90,
      }}>
      {/* Floating Action Button */}
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{
          backgroundColor: theme == "dark" ? "#1d2939" : "#3B82F6",
          color: "white",
          borderRadius: position === "right" ? "8px 0 0 8px" : "0 8px 8px 0",
          width: 40,
          height: 40,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: theme == "dark" ? "#1d2939" : "#3B82F6",
            transform: "scale(1.05)",
          },
        }}>
        {triggerIcon || (open ? <CloseIcon /> : <MenuIcon />)}
      </IconButton>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              overflow: "hidden",
              maxWidth: "80vw",
            }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                backgroundColor: theme === "dark" ? "#1d2939" : "#ffffff",
                borderRadius: 2,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                whiteSpace: "nowrap",
                maxHeight: "100%",
              }}>
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
