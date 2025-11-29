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
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";

import { useTheme } from "../../context/ThemeContext";

interface ActionMenuProps {
  item: any;
  role?: number;
  onEdit?: (item: any) => void;
  onDetail?: (item: any) => void;
  onDelete?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onRenew?: (item: any) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  item,
  role,
  onEdit,
  onDetail,
  onDelete,
  onConfirm,
  onRenew,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Ẩn onConfirm nếu role không phải là 1 (admin)
  const user = useSelector((state: RootState) => state.auth.user);
  const { theme } = useTheme();
  return (
    <div className="flex items-center justify-start mx-4">
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          backgroundColor: theme == "dark" ? "transparent" : "#f1f5f9",
          "&:hover": { backgroundColor: "#e2e8f0" },
        }}>
        <MoreVertIcon
          fontSize="small"
          sx={{
            color: theme == "dark" ? "white" : "black",
          }}
        />
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
        {/* {onEdit && role === 1 && (
          <MenuItem
            onClick={() => {
              handleClose();
              onEdit(item);
            }}>
            <ListItemIcon>
              <EditIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="Chỉnh sửa" />
          </MenuItem>
        )} */}

        {onDetail && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDetail(item);
            }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Chi tiết" />
          </MenuItem>
        )}

        {onDelete && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete(item.id);
            }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Xóa" />
          </MenuItem>
        )}
        {onRenew && (
          <MenuItem
            onClick={() => {
              handleClose();
              onRenew(item);
            }}>
            <ListItemIcon>
              <RotateLeftIcon fontSize="small" color="inherit" />
            </ListItemIcon>
            <ListItemText primary="Gia hạn" />
          </MenuItem>
        )}
        {onConfirm && (user.sub === "VANLTT" || user.sub === "HUYLQ") && (
          <MenuItem
            onClick={() => {
              handleClose();
              onConfirm(item);
            }}>
            <ListItemIcon>
              <CheckIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Xác nhận" />
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

export default ActionMenu;
