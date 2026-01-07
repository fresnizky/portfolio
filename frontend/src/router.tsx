import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
])
