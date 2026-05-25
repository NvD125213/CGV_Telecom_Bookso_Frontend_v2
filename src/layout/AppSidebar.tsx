import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { FaListAlt } from "react-icons/fa";
import { CiDatabase } from "react-icons/ci";
import { FaRegFileExcel } from "react-icons/fa6";
import {
  // CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  TableIcon,
} from "../icons";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";
import { GrChannel } from "react-icons/gr";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
import { LuPackagePlus } from "react-icons/lu";
import { PiUserList } from "react-icons/pi";
import { useSidebar } from "../context/SidebarContext";
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaCalendarCheck } from "react-icons/fa";
import { SiAmazonsimpleemailservice } from "react-icons/si";
import { FaRegFileAlt } from "react-icons/fa";
import { RiBaseStationLine } from "react-icons/ri";
import { BsPhone } from "react-icons/bs";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import SidebarWidget from "./SidebarWidget";
import { CiBoxes } from "react-icons/ci";
import { MdOutlineStarBorder } from "react-icons/md";
import { IoIosAddCircleOutline } from "react-icons/io";
import { CiSettings } from "react-icons/ci";
import { CiShoppingTag } from "react-icons/ci";

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  pro?: boolean;
  new?: boolean;
  subItems?: NavItem[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Báo cáo thống kê", path: "/", pro: false }],
  },
  {
    icon: <SiAmazonsimpleemailservice width="1em" height="1em" />,
    name: "Nhà cung cấp",
    path: "/providers",
  },
  {
    icon: <BsPhone />,
    name: "Định dạng số",
    path: "/type-numbers",
  },
  {
    icon: <CiShoppingTag />,
    name: "Tên định danh",
    path: "/brand-names",
  },
  {
    name: "Kênh số",
    path: "/digital-channel",
    icon: <GrChannel />,
  },
  {
    name: "Lịch sử online",
    path: "/time-online",
    icon: <RiBaseStationLine />,
  },

  {
    name: "Gói cố định",
    icon: <CiBoxes />,
    subItems: [
      {
        name: "Gói phút gọi",
        path: "/plans",
        icon: <LuPackagePlus />,
      },
      {
        name: "Đơn đặt gói",
        path: "/subscriptions",
        icon: <PiUserList />,
      },
    ],
  },
  {
    name: "Gói đặt trước",
    icon: <MdOutlineStarBorder />,
    subItems: [
      {
        name: "Đặt số",
        path: "/order",
        icon: <IoIosAddCircleOutline />,
      },
      {
        name: "Cài đặt",
        path: "/setting-order",
        icon: <CiSettings />,
      },
    ],
  },
  {
    name: "Lịch sử gói",
    path: "/logs",
    icon: <CiDatabase />,
  },
  {
    name: "Số điện thoại",
    icon: <TableIcon />,
    subItems: [
      {
        name: "Đặt số",
        path: "/phone-numbers",
        pro: false,
        icon: <FaListAlt />,
      },
      {
        name: "Trạng thái số",
        path: "/phone-numbers-for-status",
        pro: false,
        icon: <FaCalendarCheck />,
      },
      {
        name: "Giới hạn đặt",
        path: "/limit-booking",
        pro: false,
        icon: <MdOutlineProductionQuantityLimits />,
      },
      {
        name: "Quản lý File",
        icon: <FaRegFileAlt />,
        pro: false,
        subItems: [
          {
            name: "Upload File",
            path: "/upload-file",
            pro: false,
            icon: <FaCloudUploadAlt />,
          },
          {
            name: "Danh sách File",
            path: "/check-file-upload",
            pro: false,
            icon: <FaRegFileExcel />,
          },
        ],
      },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    name: "Quản lý dịch vụ",
    path: "/service-management",
    icon: <MdOutlineMiscellaneousServices />,
  },
];

/** Tạm ẩn route khỏi sidebar — bỏ comment hoặc xóa path khi bật lại menu. */
const SIDEBAR_HIDDEN_PATHS = new Set<string>(["/upload-file"]);

function stripHiddenPathsFromNav(items: NavItem[]): NavItem[] {
  return items
    .filter((n) => !n.path || !SIDEBAR_HIDDEN_PATHS.has(n.path))
    .map((n) =>
      n.subItems?.length
        ? { ...n, subItems: stripHiddenPathsFromNav(n.subItems) }
        : n,
    );
}

/** Thu/mở chiều cao theo nội dung (không cần đo scrollHeight), hoạt động ổn với submenu lồng nhau */
const SubmenuCollapse = ({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) => (
  <div
    className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
);

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const filteredNavItems = useMemo(
    () =>
      navItems
        .map((item) => {
          const newItem = { ...item };
          if (newItem.subItems) {
            const roleFiltered = newItem.subItems.filter((subItem) => {
              if (user?.role === 1) return true;
              if (subItem.name === "Quản lý File") return false;
              if (
                subItem.path === "/upload-file" ||
                subItem.path === "/limit-booking" ||
                subItem.path === "/setting-order"
              ) {
                return false;
              }
              return true;
            });
            newItem.subItems = stripHiddenPathsFromNav(roleFiltered);
          }
          return newItem;
        })
        .filter((item) => {
          return !(
            user?.role !== 1 &&
            (item.path === "/providers" ||
              item.path === "/type-numbers" ||
              item.path === "/brand-names" ||
              item.path == "/time-online" ||
              item.path == "/logs" ||
              item.path == "/setting-order")
          );
        }),
    [user?.role],
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [openNestedSubmenus, setOpenNestedSubmenus] = useState<
    Record<string, boolean>
  >({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  const hasActivePathInTree = useCallback(
    (item: NavItem): boolean => {
      if (item.path && isActive(item.path)) {
        return true;
      }
      return item.subItems?.some(hasActivePathInTree) ?? false;
    },
    [isActive],
  );

  useEffect(() => {
    let submenuMatched = false;
    const autoOpenedNestedSubmenus: Record<string, boolean> = {};
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? filteredNavItems : othersItems;
      items.forEach((nav, index) => {
        if (!nav.subItems) {
          return;
        }
        const topKey = `${menuType}-${index}`;
        const markActiveBranches = (subItems: NavItem[], parentKey: string) => {
          subItems.forEach((subItem, subIndex) => {
            const key = `${parentKey}-${subIndex}`;
            if (subItem.subItems && hasActivePathInTree(subItem)) {
              autoOpenedNestedSubmenus[key] = true;
              markActiveBranches(subItem.subItems, key);
            }
          });
        };
        if (hasActivePathInTree(nav)) {
          setOpenSubmenu({
            type: menuType as "main" | "others",
            index,
          });
          submenuMatched = true;
          markActiveBranches(nav.subItems, topKey);
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu((prev) => (prev === null ? prev : null));
    }
    setOpenNestedSubmenus((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(autoOpenedNestedSubmenus);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => prev[key] === autoOpenedNestedSubmenus[key])
      ) {
        return prev;
      }
      return autoOpenedNestedSubmenus;
    });
  }, [filteredNavItems, hasActivePathInTree, location.pathname]);

  const handleMenuClick = () => {
    // Đóng sidebar trên mobile khi click vào menu item
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const toggleNestedSubmenu = (key: string) => {
    setOpenNestedSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderNestedSubItems = (
    subItems: NavItem[],
    parentKey: string,
    level = 0,
  ) => (
    <ul className={`mt-2 space-y-1 ${level === 0 ? "ml-9" : "ml-6"}`}>
      {subItems.map((subItem, subIndex) => {
        const itemKey = `${parentKey}-${subIndex}`;
        const isSubmenuOpen = !!openNestedSubmenus[itemKey];
        const isItemActive = subItem.path ? isActive(subItem.path) : false;

        return (
          <li key={itemKey}>
            {subItem.subItems ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleNestedSubmenu(itemKey)}
                  className={`menu-dropdown-item w-full ${
                    hasActivePathInTree(subItem)
                      ? "menu-dropdown-item-active"
                      : "menu-dropdown-item-inactive"
                  }`}>
                  <span>{subItem.icon}</span>
                  {subItem.name}
                  <ChevronDownIcon
                    className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                      isSubmenuOpen ? "rotate-180 text-brand-500" : ""
                    }`}
                  />
                </button>
                <SubmenuCollapse isOpen={isSubmenuOpen}>
                  {renderNestedSubItems(subItem.subItems, itemKey, level + 1)}
                </SubmenuCollapse>
              </>
            ) : (
              subItem.path && (
                <Link
                  to={subItem.path}
                  onClick={handleMenuClick}
                  className={`menu-dropdown-item ${
                    isItemActive
                      ? "menu-dropdown-item-active"
                      : "menu-dropdown-item-inactive"
                  }`}>
                  <span>{subItem.icon}</span>
                  {subItem.name}
                  <span className="flex items-center gap-1 ml-auto">
                    {subItem.new && (
                      <span
                        className={`ml-auto ${
                          isItemActive
                            ? "menu-dropdown-badge-active"
                            : "menu-dropdown-badge-inactive"
                        } menu-dropdown-badge`}>
                        new
                      </span>
                    )}
                    {subItem.pro && (
                      <span
                        className={`ml-auto ${
                          isItemActive
                            ? "menu-dropdown-badge-active"
                            : "menu-dropdown-badge-inactive"
                        } menu-dropdown-badge`}>
                        pro
                      </span>
                    )}
                  </span>
                </Link>
              )
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}>
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                onClick={handleMenuClick}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}>
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <SubmenuCollapse
              isOpen={
                openSubmenu?.type === menuType && openSubmenu?.index === index
              }>
              {renderNestedSubItems(nav.subItems, `${menuType}-${index}`)}
            </SubmenuCollapse>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div
        className={`hidden lg:flex ${
          !isExpanded && !isHovered
            ? "lg:justify-center"
            : "justify-start pt-4 pb-4"
        }`}>
        <Link to="/" onClick={handleMenuClick}>
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div
                style={{
                  paddingLeft: "10px",
                }}>
                <img
                  className="dark:hidden"
                  src="/Logo/logocgv_light.png"
                  alt="Logo"
                  width={180}
                  height={50}
                />
              </div>

              <div
                style={{
                  paddingLeft: "10px",
                }}>
                <img
                  className="hidden dark:block"
                  src="/Logo/Logo_company.png"
                  alt="Logo"
                  width={180}
                  height={50}
                />
              </div>
            </>
          ) : (
            <img
              src="/Logo/Artboard_2.png"
              alt="Logo"
              width={180}
              height={180}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs mt-6 uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  "Cài đặt khác"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
