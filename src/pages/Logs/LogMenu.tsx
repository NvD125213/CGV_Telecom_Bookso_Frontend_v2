import React from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface ActionMenuProps {
  item: any;
  onDetail?: (item: any) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ item, onDetail }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="flex items-center justify-start mx-4">
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          backgroundColor: "#f1f5f9",
          "&:hover": { backgroundColor: "#e2e8f0" },
        }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}>
        <MenuItem
          onClick={() => {
            handleClose();
            onDetail?.(item);
          }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Chi tiết" />
        </MenuItem>
      </Menu>
    </div>
  );
};

export default ActionMenu;
