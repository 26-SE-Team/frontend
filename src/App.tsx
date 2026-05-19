import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { KakaoCallbackPage } from "./pages/KakaoCallbackPage";
import { HomePage } from "./pages/HomePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
