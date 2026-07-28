import {Nav} from '@/components/layout/Nav'
import {ProtectedRoute} from '@/components/ui/ProtectedRoute'

/** Applies the wallet gate to every app-interior route. */
export default function AppLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <ProtectedRoute><Nav /><main id="main-content">{children}</main></ProtectedRoute>
}

