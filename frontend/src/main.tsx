import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { AppLoaderDismiss } from "./components/Common/AppLoaderDismiss"
import { ThemeProvider } from "./components/theme-provider"
import { NtestercLoadingHost, Toaster } from "./components/ui/feedback"
import "./i18n"
import "./styles/index.css"
import { setupHttpClient } from "./lib/http"
import { appLoader } from "./lib/loading"
import { routeTree } from "./routeTree.gen"
import { getAppSettings, initAppSettings } from "./store"

setupHttpClient()
initAppSettings()

const queryClient = new QueryClient()
const initialTheme = getAppSettings().themeMode

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme={initialTheme} storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AppLoaderDismiss />
        <RouterProvider router={router} />
        <NtestercLoadingHost />
        <Toaster richColors closeButton position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

appLoader.bind(router)
