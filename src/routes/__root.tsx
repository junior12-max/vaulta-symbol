import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { Toaster } from '@/components/ui/sonner'
import { SplashScreen } from '@/components/SplashScreen'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  const router = useRouter()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (
        event !== 'SIGNED_IN' &&
        event !== 'SIGNED_OUT' &&
        event !== 'USER_UPDATED'
      ) {
        return
      }

      router.invalidate()

      if (event !== 'SIGNED_OUT') {
        queryClient.invalidateQueries()
      }
    })

    return () => data.subscription.unsubscribe()
  }, [router, queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <SplashScreen />
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
  }
    
