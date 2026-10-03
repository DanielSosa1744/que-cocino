import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomTabBar from './components/BottomTabBar'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// App pages
import HomePage from './pages/HomePage'
import VoicePage from './pages/voice/VoicePage'
import ConfirmIngredientsPage from './pages/voice/ConfirmIngredientsPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import InventoryPage from './pages/inventory/InventoryPage'
import VaciarNeveraPage from './pages/recipes/VaciarNeveraPage'
import RecipeDetailPage from './pages/recipes/RecipeDetailPage'
import ImpactPage from './pages/impact/ImpactPage'

function AppContent() {
  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] bg-white shadow-xl relative flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes - Flujo principal de 8 pasos */}
          {/* 1. Login (/login) */}
          {/* 2. Pantalla principal */}
          <Route path="/home" element={
            <ProtectedRoute><HomePage /></ProtectedRoute>
          } />

          {/* 3. Introducción por voz */}
          <Route path="/voice" element={
            <ProtectedRoute><VoicePage /></ProtectedRoute>
          } />

          {/* 4. Confirmación de ingredientes */}
          <Route path="/confirm-ingredients" element={
            <ProtectedRoute><ConfirmIngredientsPage /></ProtectedRoute>
          } />

          {/* 5. Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* 6. Modo Vaciar Nevera */}
          <Route path="/vaciar-nevera" element={
            <ProtectedRoute><VaciarNeveraPage /></ProtectedRoute>
          } />

          {/* 7. Receta recomendada / detalle */}
          <Route path="/recipe/:id" element={
            <ProtectedRoute><RecipeDetailPage /></ProtectedRoute>
          } />

          {/* 8. Impacto */}
          <Route path="/impact" element={
            <ProtectedRoute><ImpactPage /></ProtectedRoute>
          } />

          {/* Gestión completa de Inventario */}
          <Route path="/inventory" element={
            <ProtectedRoute><InventoryPage /></ProtectedRoute>
          } />

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      {/* Barra de navegación inferior móvil para pantallas autenticadas */}
      <BottomTabBar />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
