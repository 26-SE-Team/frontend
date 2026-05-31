import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { KakaoCallbackPage } from "./pages/KakaoCallbackPage";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { ChatPage } from "./pages/ChatPage";
import { MyPage } from "./pages/MyPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { PropertyRegisterPage } from "./pages/PropertyRegisterPage";
import { ViewerPage } from "./pages/ViewerPage";
import { StoredPage } from "./pages/StoredPage";
import { CertificationPage } from "./pages/CertificationPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/browse" element={<Navigate to="/map" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/stored" element={<StoredPage />} />
        <Route
          path="/certification"
          element={
            <RoleProtectedRoute mode="broker">
              <CertificationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <RoleProtectedRoute mode="broker" requireCertifiedBroker>
              <MyListingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/listing/new"
          element={
            <RoleProtectedRoute mode="broker" requireCertifiedBroker>
              <PropertyRegisterPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/listing/:listingId" element={<ListingDetailPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
