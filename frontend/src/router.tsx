import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { PortfolioPage } from '@/features/portfolio'
import { HoldingsPage } from '@/features/holdings'
import { TransactionsPage } from '@/features/transactions'
import EvolutionPage from '@/features/evolution'
import { OnboardingPage } from '@/features/onboarding'
import { SettingsPage } from '@/features/settings'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { NotFound } from '@/components/common/NotFound'
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
        path: '/onboarding',
        element: <OnboardingPage />,
      },
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
          {
            path: '/portfolio',
            element: <PortfolioPage />,
          },
          {
            path: '/holdings',
            element: <HoldingsPage />,
          },
          {
            path: '/transactions',
            element: <TransactionsPage />,
          },
          {
            path: '/evolution',
            element: <EvolutionPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
