import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomTabBar from './components/BottomTabBar'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// App pages
import HomePage from './pages/HomePage'
import VoicePage from './pages/voice/VoicePage'
import ConfirmIngredientsPage from './pages/voice/ConfirmIngredientsPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import InventoryPage from './pages/inventory/InventoryPage'
import VaciarNeveraPage from './pages/recipes/VaciarNeveraPage'
import RecipeDetailPage from './pages/recipes/RecipeDetailPage'
import ImpactPage from './pages/impact/ImpactPage'

export default function App() {
  return (
    <AuthProvider>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative pb-16">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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

        {/* Barra de navegación inferior móvil para pantallas autenticadas */}
        <BottomTabBar />
      </div>
    </AuthProvider>
  )
}
