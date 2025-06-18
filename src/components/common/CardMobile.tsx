import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
} from "@mui/material";

interface InfoObject {
  [key: string]: string | number;
}

interface CardMobileProps {
  data: InfoObject;
}

const CardMobile: React.FC<CardMobileProps> = ({ data }) => {
  const theme = useTheme();
  const entries = Object.entries(data);

  const formatKey = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

  return (
    <Box sx={{ mb: 2 }}>
      <Card
        sx={{
          borderRadius: 3,
          background: `linear-gradient(135deg, ${
            theme.palette.background.paper
          } 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: "hidden",
          position: "relative",
          cursor: "default",
        }}>
        <CardContent sx={{ p: 2.5 }}>
          {entries.map(([key, value], index) => (
            <Box
              key={key}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr",
                alignItems: "center",
                py: 1.5,
                px: 2,
                mb: index === entries.length - 1 ? 0 : 1.5,
                borderRadius: 2.5,
                background: alpha(theme.palette.background.default, 0.4),
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                "&:hover": {
                  background: alpha(theme.palette.primary.main, 0.06),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontSize: "0.7rem",
                    opacity: 0.9,
                  }}>
                  {formatKey(key)}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: "0.95rem",
                    wordBreak: "break-word",
                  }}>
                  {value}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CardMobile;
