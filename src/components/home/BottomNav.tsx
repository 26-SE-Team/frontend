import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type NavItem = "home" | "browse" | "chat" | "mypage";

interface BottomNavProps {
  active?: NavItem;
}

const navItems: { id: NavItem; label: string; to: string; icon: ReactNode }[] =
  [
    {
      id: "home",
      label: "홈",
      to: "/home",
      icon: <HomeIcon />,
    },
    {
      id: "browse",
      label: "둘러보기",
      to: "/map",
      icon: <BrowseIcon />,
    },
    {
      id: "chat",
      label: "채팅",
      to: "/chat",
      icon: <ChatIcon />,
    },
    {
      id: "mypage",
      label: "마이페이지",
      to: "/mypage",
      icon: <MyPageIcon />,
    },
  ];

export function BottomNav({ active = "home" }: BottomNavProps) {
  return (
    <nav className="home-nav" aria-label="하단 메뉴">
      <div className="home-nav__items">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `home-nav__item${isActive || active === item.id ? " home-nav__item--active" : ""}`
            }
            end={item.id === "home"}
          >
            <span className="home-nav__icon">{item.icon}</span>
            <span className="home-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="home-nav__indicator" aria-hidden>
        <div className="home-nav__indicator-bar" />
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3L3 11h2v9h5v-6h4v6h5v-9h2L12 3z" />
    </svg>
  );
}

function BrowseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  );
}

function MyPageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
    </svg>
  );
}
