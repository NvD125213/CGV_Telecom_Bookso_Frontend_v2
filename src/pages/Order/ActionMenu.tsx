import React from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { CheckCircleOutline, RotateLeftRounded } from "@mui/icons-material";

interface ActionMenuProps {
  item: any;
  role?: number;
  status?: any;
  onEdit?: (item: any) => void;
  onDetail?: (item: any) => void;
  onDelete?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onRenew?: (item: any) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  item,
  role,
  status,
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
        {onEdit && role == 1 && (
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
        )}

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
        {onConfirm && item.is_payment == false && (
          <MenuItem
            onClick={() => {
              handleClose();
              onConfirm(item);
            }}>
            <ListItemIcon>
              <CheckCircleOutline fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText primary="Xác nhận" />
          </MenuItem>
        )}
        {onRenew && (
          <MenuItem
            onClick={() => {
              handleClose();
              onRenew(item);
            }}>
            <ListItemIcon>
              <RotateLeftRounded fontSize="small" color="inherit" />
            </ListItemIcon>
            <ListItemText primary="Gia hạn" />
          </MenuItem>
        )}
        {onDelete &&
          status != 1 &&
          status != 0 && ( // Đã sửa || thành &&
            <MenuItem
              onClick={() => {
                handleClose();
                onDelete(item);
              }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Xóa" />
            </MenuItem>
          )}
      </Menu>
    </div>
  );
};

export default ActionMenu;
