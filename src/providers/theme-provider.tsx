import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark", // Force dark mode by default
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark", // Force dark mode
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Always return dark mode for enterprise dashboard
    return "dark"
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    // Force dark mode class and remove light mode
    root.classList.remove("light")
    root.classList.add("dark")
    
    // Set data attribute for additional styling control
    root.setAttribute("data-theme", "dark")
  }, [theme])

  const value = {
    theme: "dark" as Theme, // Always return dark
    setTheme: (theme: Theme) => {
      // Allow theme switching but persist dark mode in localStorage
      localStorage.setItem(storageKey, "dark")
      setTheme("dark")
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}