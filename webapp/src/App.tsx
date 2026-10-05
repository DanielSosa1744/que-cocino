import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomTabBar from './components/BottomTabBar'
import SwipeContainer from './components/SwipeContainer'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// App pages
import HomePage from './pages/HomePage'
import VoicePage from './pages/voice/VoicePage'
import ConfirmIngredientsPage from './pages/voice/ConfirmIngredientsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import VaciarNeveraPage from './pages/recipes/VaciarNeveraPage'
import RecipeDetailPage from './pages/recipes/RecipeDetailPage'
import ImpactPage from './pages/impact/ImpactPage'

function AppContent() {
  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-warm-canvas relative flex flex-col overflow-hidden text-stone-900">
      <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-1 sm:px-3 md:px-5">
        <SwipeContainer>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route path="/home" element={
              <ProtectedRoute><HomePage /></ProtectedRoute>
            } />

            <Route path="/voice" element={
              <ProtectedRoute><VoicePage /></ProtectedRoute>
            } />

            <Route path="/confirm-ingredients" element={
              <ProtectedRoute><ConfirmIngredientsPage /></ProtectedRoute>
            } />

            <Route path="/recetas" element={
              <ProtectedRoute><VaciarNeveraPage /></ProtectedRoute>
            } />

            <Route path="/vaciar-nevera" element={<Navigate to="/recetas" replace />} />
            <Route path="/dashboard" element={<Navigate to="/recetas" replace />} />

            <Route path="/recipe/:id" element={
              <ProtectedRoute><RecipeDetailPage /></ProtectedRoute>
            } />

            <Route path="/impact" element={
              <ProtectedRoute><ImpactPage /></ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute><InventoryPage /></ProtectedRoute>
            } />

            {/* Redirecciones por defecto */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </SwipeContainer>
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
