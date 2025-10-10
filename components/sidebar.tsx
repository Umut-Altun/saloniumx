"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Scissors, BarChart, DollarSign, Settings, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Ekran boyutu değişimini dinleyen efekt
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // İlk yükleme kontrolü
    checkScreenSize()
    
    // Resize event listener
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Sidebar açık/kapalı durumunu izleyen efekt
  useEffect(() => {
    // Ana içeriğin margin'ini güncelle
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      if (isOpen) {
        // Sidebar açık
        mainContent.classList.add('ml-72')
      } else {
        // Sidebar kapalı
        mainContent.classList.remove('ml-72')
      }
    }
  }, [isOpen])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const routes = [
    {
      name: "Gösterge Paneli",
      path: "/",
      icon: Calendar,
    },
    {
      name: "Randevular",
      path: "/appointments",
      icon: Calendar,
    },
    {
      name: "Müşteriler",
      path: "/customers",
      icon: Users,
    },
    {
      name: "Hizmetler",
      path: "/services",
      icon: Scissors,
    },
    {
      name: "Ürünler",
      path: "/products",
      icon: Package,
    },
    {
      name: "Satışlar",
      path: "/sales",
      icon: DollarSign,
    },
    {
      name: "Raporlar",
      path: "/reports",
      icon: BarChart,
    },
    {
      name: "Ayarlar",
      path: "/settings",
      icon: Settings,
    },
  ]

  // Sidebar açma/kapama butonu
  const toggleButton = (
    <Button
      variant="ghost"
      size="sm"
      className="fixed top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-primary hover:text-white p-2 transition-all duration-300 ease-in-out"
      onClick={toggleSidebar}
      style={{ 
        left: isOpen ? '270px' : '0px',
        transition: 'left 0.3s ease-in-out',
        borderRadius: isOpen ? '50% 0 0 50%' : '0 50% 50% 0',
        borderRight: isOpen ? 'none' : '1px solid #e5e7eb',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        borderLeft: isOpen ? '1px solid #e5e7eb' : 'none',
        boxShadow: isOpen ? '-2px 0 5px rgba(0,0,0,0.05)' : '2px 0 5px rgba(0,0,0,0.05)'
      }}
    >
      {isOpen ? 
        <ChevronLeft className="h-5 w-5" /> : 
        <ChevronRight className="h-5 w-5" />
      }
    </Button>
  )

  return (
    <>
      {toggleButton}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 shadow-sm h-full transition-transform duration-300 ease-in-out", 
          !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Scissors className="h-6 w-6" />
            <span>SaloniumPro</span>
          </Link>
        </div>
        <div className="px-4 py-4 h-[calc(100%-4rem)] overflow-y-auto">
          <nav className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                  pathname === route.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100 text-gray-700 hover:text-primary",
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <route.icon className="h-5 w-5" />
                {route.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

