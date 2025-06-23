import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  memo,
} from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Select,
  MenuItem,
  Skeleton,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  setSelectedIds as setSelectedIdsAction,
  resetSelectedIds,
} from "../store/selectedPhoneSlice";

// Lazy load components
const CardMobile = lazy(() => import("../components/common/CardMobile"));
const PageBreadcrumb = lazy(
  () => import("../components/common/PageBreadCrumb")
);

// Interface cho format label-value
export interface LabelValueItem {
  label: string;
  value: string | number;
  hidden?: boolean;
  hideLabel?: boolean;
  hideValue?: boolean;
}

// Interface để tương thích với CardMobile's ActionButton
export interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick: (id: string) => void;
  color?: "primary" | "secondary" | "info" | "success" | "error" | "warning";
}

interface MobileListProps {
  pageTitle?: string;
  data: LabelValueItem[][];
  actions?: ActionButton[];
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
  useTailwindStyling?: boolean;
  fieldClassNames?: { [key: string]: string };
  labelClassNames?: { [key: string]: string };
  valueClassNames?: { [key: string]: string };
  valueSxProps?: { [key: string]: React.CSSProperties | object };
  hideCheckbox?: boolean;
  hidePagination?: boolean;
  showAllData?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  scrollToTop?: boolean;
  scrollBehavior?: "smooth" | "auto";
  scrollOffset?: number;
  onCheck?: (
    selectedIds: (string | number)[],
    selectedRows: LabelValueItem[][]
  ) => void;
  selectedIds?: (string | number)[];
  setSelectedIds?: React.Dispatch<React.SetStateAction<number[]>>;
  disabled?: boolean;
  disabledReset?: boolean;
  cardClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  actionButtonClassName?: string;
}

// Loading skeleton component
const CardSkeleton = memo(() => (
  <Box sx={{ mb: 2 }}>
    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
  </Box>
));

// Memoized card item component for better performance
const MemoizedCardItem = memo<{
  item: LabelValueItem[];
  index: number;
  isSelected: boolean;
  onSelectionChange: (selected: boolean, index: number) => void;
  actions: any[];
  hideCheckbox: boolean;
  useTailwindStyling: boolean;
  fieldClassNames: { [key: string]: string };
  labelClassNames: { [key: string]: string };
  valueClassNames: { [key: string]: string };
  valueSxProps: { [key: string]: React.CSSProperties | object };
  cardClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  actionButtonClassName?: string;
}>(
  ({
    item,
    index,
    isSelected,
    onSelectionChange,
    actions,
    hideCheckbox,
    useTailwindStyling,
    fieldClassNames,
    labelClassNames,
    valueClassNames,
    valueSxProps,
    cardClassName,
    contentClassName,
    actionsClassName,
    actionButtonClassName,
  }) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }} // Reduced delay for better performance
    >
      <Suspense fallback={<CardSkeleton />}>
        <CardMobile
          selectable={!hideCheckbox}
          selected={isSelected}
          showDefaultActions={true}
          actions={actions}
          data={item}
          onSelectionChange={(selected) => onSelectionChange(selected, index)}
          useTailwindStyling={useTailwindStyling}
          fieldClassNames={fieldClassNames}
          labelClassNames={labelClassNames}
          valueClassNames={valueClassNames}
          valueSxProps={valueSxProps}
          cardClassName={cardClassName}
          contentClassName={contentClassName}
          actionsClassName={actionsClassName}
          actionButtonClassName={actionButtonClassName}
        />
      </Suspense>
    </motion.div>
  )
);

const TableMobile: React.FC<MobileListProps> = ({
  data,
  actions = [],
  itemsPerPageOptions = [10, 20, 50],
  defaultItemsPerPage = 10,
  useTailwindStyling = false,
  fieldClassNames = {},
  labelClassNames = {},
  valueClassNames = {},
  valueSxProps = {},
  hideCheckbox = false,
  hidePagination = false,
  showAllData = false,
  onSelectAll,
  totalPages: apiTotalPages,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  scrollToTop = true,
  scrollBehavior = "smooth",
  scrollOffset = 0,
  onCheck,
  selectedIds,
  disabled = false,
  disabledReset = false,
  cardClassName,
  contentClassName,
  actionsClassName,
  actionButtonClassName,
  pageTitle = "",
}) => {
  const { theme } = useTheme();
  const [itemsPerPage, setItemsPerPage] = useState<number>(defaultItemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const { selectedIds: reduxSelectedIds } = useSelector(
    (state: RootState) => state.selectedPhone
  );

  // Sử dụng selectedIds từ props hoặc Redux
  const currentSelectedIds = selectedIds || reduxSelectedIds;

  // Memoized helper function để lấy ID từ item
  const getItemId = useCallback((item: LabelValueItem[]): string => {
    return String(item[0].value);
  }, []);

  // Memoized scroll handler
  const scrollToTopHandler = useCallback(() => {
    if (!scrollToTop) return;

    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: scrollBehavior,
        block: "start",
      });
    } else {
      window.scrollTo({
        top: scrollOffset,
        behavior: scrollBehavior,
      });
    }
  }, [scrollToTop, scrollBehavior, scrollOffset]);

  // Scroll to top khi thay đổi trang
  useEffect(() => {
    scrollToTopHandler();
  }, [currentPage, scrollToTopHandler]);

  // Scroll to top khi thay đổi items per page
  useEffect(() => {
    scrollToTopHandler();
  }, [itemsPerPage, scrollToTopHandler]);

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    if (showAllData || (apiTotalPages && apiTotalPages > 0)) {
      return data;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage, showAllData, apiTotalPages]);

  // Memoized total pages calculation
  const totalPages = useMemo(() => {
    return showAllData
      ? 1
      : apiTotalPages || Math.ceil(data.length / itemsPerPage);
  }, [showAllData, apiTotalPages, data.length, itemsPerPage]);

  // Memoized selection handler
  const handleSelectionChange = useCallback(
    (selected: boolean, idx: number) => {
      if (disabled) return;

      const itemId = getItemId(paginatedData[idx] as LabelValueItem[]);
      let updatedSelection: (string | number)[];
      let updatedRows: LabelValueItem[][];

      if (currentSelectedIds.includes(itemId)) {
        updatedSelection = currentSelectedIds.filter(
          (selectedId) => selectedId !== itemId
        );
        updatedRows = paginatedData.filter((item) =>
          updatedSelection.includes(getItemId(item as LabelValueItem[]))
        );
      } else {
        updatedSelection = [...currentSelectedIds, itemId];
        updatedRows = paginatedData.filter((item) =>
          updatedSelection.includes(getItemId(item as LabelValueItem[]))
        );
      }

      dispatch(
        setSelectedIdsAction({ ids: updatedSelection, rows: updatedRows })
      );
      onCheck?.(updatedSelection, updatedRows);
    },
    [disabled, paginatedData, currentSelectedIds, getItemId, dispatch, onCheck]
  );

  // Memoized select all handler
  const selectAll = useCallback(() => {
    if (disabled) return;

    if (
      paginatedData.every((item) =>
        currentSelectedIds.includes(getItemId(item as LabelValueItem[]))
      )
    ) {
      dispatch(resetSelectedIds());
      onCheck?.([], []);
    } else {
      const allIds = paginatedData.map((item) =>
        getItemId(item as LabelValueItem[])
      );

      dispatch(setSelectedIdsAction({ ids: allIds, rows: paginatedData }));
      onCheck?.(allIds, paginatedData);
    }

    onSelectAll?.();
  }, [
    disabled,
    paginatedData,
    currentSelectedIds,
    getItemId,
    dispatch,
    onCheck,
    onSelectAll,
  ]);

  // Memoized reset handler
  const handleResetSelection = useCallback(() => {
    if (currentSelectedIds.length === 0) {
      console.log("No items selected, showing alert");
      alert("Không có số nào được chọn!");
      return;
    }
    dispatch(resetSelectedIds());
    onCheck?.([], []);
  }, [currentSelectedIds.length, dispatch, onCheck]);

  // Memoized wrapped actions
  const wrappedActions = useMemo(
    () =>
      actions.map((action) => ({
        ...action,
        onClick: (data: any) => {
          const itemId = getItemId(data as LabelValueItem[]);
          action.onClick(itemId);
        },
      })),
    [actions, getItemId]
  );

  // Memoized page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange?.(page);
    },
    [onPageChange]
  );

  // Memoized items per page change handler
  const handleItemsPerPageChange = useCallback(
    (newItemsPerPage: number) => {
      setItemsPerPage(newItemsPerPage);
      onItemsPerPageChange?.(newItemsPerPage);
      onPageChange?.(1);
    },
    [onItemsPerPageChange, onPageChange]
  );

  return (
    <Container
      ref={containerRef}
      maxWidth="lg"
      sx={{
        py: 4,
        pb: !hidePagination && !showAllData && totalPages > 1 ? 8 : 4,
      }}>
      <Suspense fallback={<Skeleton variant="text" width={200} height={40} />}>
        <PageBreadcrumb pageTitle={pageTitle} />
      </Suspense>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        {/* Reset Selection Button */}
        {!disabledReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <button
                onClick={handleResetSelection}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-800 bg-white text-black rounded-lg text-sm hover:bg-red-600 hover:text-white transition-colors shadow-md dark:bg-gray-800 dark:text-white"
                title="Reset selection">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset ({currentSelectedIds.length})
              </button>
            </Box>
          </motion.div>
        )}

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}>
            {!hideCheckbox && (
              <Typography variant="body2" color="primary">
                <div className="dark:text-white">
                  Đã chọn: {currentSelectedIds?.length || 0} mục
                </div>
              </Typography>
            )}

            {!hideCheckbox && paginatedData.length > 0 && (
              <button
                onClick={selectAll}
                disabled={disabled}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  disabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}>
                {paginatedData.every((item) =>
                  currentSelectedIds.includes(
                    getItemId(item as LabelValueItem[])
                  )
                )
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            )}
          </Box>
        </motion.div>

        {/* Cards List */}
        <AnimatePresence mode="wait">
          {paginatedData.length > 0 ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}>
              {paginatedData.map((item, index) => {
                const itemId = getItemId(item);
                const isSelected = currentSelectedIds.includes(itemId);

                return (
                  <MemoizedCardItem
                    key={`${itemId}-${index}`}
                    item={item}
                    index={index}
                    isSelected={isSelected}
                    onSelectionChange={handleSelectionChange}
                    actions={wrappedActions}
                    hideCheckbox={hideCheckbox}
                    useTailwindStyling={useTailwindStyling}
                    fieldClassNames={fieldClassNames}
                    labelClassNames={labelClassNames}
                    valueClassNames={valueClassNames}
                    valueSxProps={valueSxProps}
                    cardClassName={cardClassName}
                    contentClassName={contentClassName}
                    actionsClassName={actionsClassName}
                    actionButtonClassName={actionButtonClassName}
                  />
                );
              })}
            </motion.div>
          ) : (
            <Paper
              elevation={1}
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: "grey.50",
                background: theme == "dark" ? "#1f2937" : "#ffffff",
              }}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  color: theme == "dark" ? "#fff" : "inherit",
                }}
                gutterBottom>
                Không tìm thấy kết quả
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme == "dark" ? "#fff" : "inherit",
                }}
                color="text.secondary">
                Không có dữ liệu để hiển thị
              </Typography>
            </Paper>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!hidePagination && !showAllData && totalPages > 1 && (
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              p: 2,
              flexWrap: "wrap",
              bgcolor: theme == "dark" ? "#1f2937" : "#ffffff",
              borderTop: `1px solid ${
                theme === "dark" ? "#374151" : "#e5e7eb"
              }`,
              boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            }}>
            <Select
              value={currentPage}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              sx={{
                minWidth: 80,
                height: 40,
                color: theme === "dark" ? "#fff" : "inherit",
                "& .MuiInputBase-root": {
                  color: theme === "dark" ? "#fff" : "inherit",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme === "dark" ? "#fff" : "inherit",
                },
                "& .MuiSelect-icon": {
                  color: theme === "dark" ? "#fff" : "inherit",
                },
              }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <MenuItem
                  sx={{
                    "& .MuiInputBase-root": {
                      color: theme === "dark" ? "#fff" : "inherit",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme === "dark" ? "#fff" : "inherit",
                    },
                    "& .MuiSelect-icon": {
                      color: theme === "dark" ? "#fff" : "inherit",
                    },
                  }}
                  key={i + 1}
                  value={i + 1}>
                  Trang {i + 1}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              sx={{
                minWidth: 80,
                height: 40,
                color: theme === "dark" ? "#fff" : "inherit",
                "& .MuiInputBase-root": {
                  color: theme === "dark" ? "#fff" : "inherit",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme === "dark" ? "#fff" : "inherit",
                },
                "& .MuiSelect-icon": {
                  color: theme === "dark" ? "#fff" : "inherit",
                },
              }}>
              {itemsPerPageOptions.map((limit) => (
                <MenuItem key={limit} value={limit}>
                  {limit} / trang
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
      </motion.div>
    </Container>
  );
};

export default memo(TableMobile);
