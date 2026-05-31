import { BottomNav } from "../components/home/BottomNav";
import "./home.css";

interface PlaceholderPageProps {
  title: string;
  navActive: "home" | "browse" | "chat" | "mypage";
}

export function PlaceholderPage({ title, navActive }: PlaceholderPageProps) {
  return (
    <main className="home">
      <div className="home__frame">
        <div className="home__content" style={{ justifyContent: "center", alignItems: "center" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#6b7280" }}>
            {title} 기능은 준비 중입니다
          </p>
        </div>
        <BottomNav active={navActive} />
      </div>
    </main>
  );
}
