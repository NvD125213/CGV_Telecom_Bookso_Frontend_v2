import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { FaListAlt } from "react-icons/fa";
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

import { useSidebar } from "../context/SidebarContext";
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaCalendarCheck } from "react-icons/fa";
import { SiAmazonsimpleemailservice } from "react-icons/si";
import { RiBaseStationLine } from "react-icons/ri";
import { BsPhone } from "react-icons/bs";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import SidebarWidget from "./SidebarWidget";

// import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    icon?: React.ReactNode;
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Báo cáo thống kê", path: "/", pro: false }],
  },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Lịch",
  //   path: "/calendar",
  // },
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
        name: "Upload File",
        path: "/upload-file",
        pro: false,
        icon: <FaCloudUploadAlt />,
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

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const filteredNavItems = navItems
    .map((item) => {
      const newItem = { ...item };
      if (newItem.subItems) {
        newItem.subItems = newItem.subItems.filter(
          (subItem) =>
            !(
              user?.role !== 1 &&
              (subItem.path == "/upload-file" ||
                subItem.path == "/limit-booking")
            )
        );
      }
      return newItem;
    })
    .filter((item) => {
      return !(
        user?.role !== 1 &&
        (item.path === "/providers" ||
          item.path === "/type-numbers" ||
          item.path == "/time-online")
      );
    });

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? filteredNavItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

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
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}>
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}>
                      <span>{subItem.icon}</span>

                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}>
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}>
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
        className={`flex ${
          !isExpanded && !isHovered
            ? "lg:justify-center"
            : "justify-start pt-4 pb-4"
        }`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/Logo/Logo_company.png"
                alt="Logo"
                width={180}
                height={50}
              />
              <img
                className="hidden dark:block"
                src="/Logo/Logo_company.png"
                alt="Logo"
                width={180}
                height={50}
              />
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
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
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
