"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import NewAppointmentDialog from "@/components/new-appointment-dialog"
import AppointmentList from "@/components/appointment-list"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import type { Appointment } from "@/lib/actions"

// Loading skeleton for appointments
function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { toast } = useToast()

  // Function to fetch all appointments
  const fetchAllAppointments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/appointments?t=${timestamp}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch appointments: ${response.status} ${errorData.message || ""}`)
      }

      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      setError(err instanceof Error ? err.message : String(err))
      toast({
        title: "Veri yükleme hatası",
        description: err instanceof Error ? err.message : "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to fetch appointments for a specific date
  const fetchAppointmentsByDate = async (date: Date) => {
    setIsLoading(true)
    setError(null)
    try {
      const dateString = format(date, "yyyy-MM-dd")
      const timestamp = Date.now()
      const response = await fetch(`/api/appointments?date=${dateString}&t=${timestamp}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch appointments: ${response.status} ${errorData.message || ""}`)
      }

      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      console.error("Error fetching appointments by date:", err)
      setError(err instanceof Error ? err.message : String(err))
      toast({
        title: "Veri yükleme hatası",
        description: err instanceof Error ? err.message : "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch of appointments for current date
  useEffect(() => {
    if (selectedDate) {
      fetchAppointmentsByDate(selectedDate)
    }
  }, [])

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      fetchAppointmentsByDate(date)
    } else {
      fetchAllAppointments()
    }
  }

  // Filter appointments based on search query
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.service_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAppointmentAdded = () => {
    // Fetch appointments again when a new appointment is added
    if (selectedDate) {
      fetchAppointmentsByDate(selectedDate)
    } else {
      fetchAllAppointments()
    }

    // Add a small delay to ensure the database has updated
    setTimeout(() => {
      if (selectedDate) {
        fetchAppointmentsByDate(selectedDate)
      } else {
        fetchAllAppointments()
      }
    }, 500)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Randevular</h1>
          <p className="text-muted-foreground mt-1">Müşterileriniz için randevuları yönetin ve planlayın</p>
        </div>
        <NewAppointmentDialog
          onSuccess={handleAppointmentAdded}
          initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Takvim</CardTitle>
              <CardDescription>Randevuları görüntülemek için bir tarih seçin</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobil uyumlu tarih seçici */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDateSelect(new Date(selectedDate ? new Date(selectedDate).setDate(selectedDate.getDate() - 1) : Date.now()))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Bugün"}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDateSelect(new Date(selectedDate ? new Date(selectedDate).setDate(selectedDate.getDate() + 1) : Date.now()))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Hızlı tarih seçimi butonları */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <Button 
                    variant={selectedDate && format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleDateSelect(new Date())}
                    className="w-full"
                  >
                    Bugün
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDateSelect(new Date(new Date().setDate(new Date().getDate() + 1)))}
                    className="w-full"
                  >
                    Yarın
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDateSelect(new Date(new Date().setDate(new Date().getDate() + 2)))}
                    className="w-full"
                  >
                    2 Gün Sonra
                  </Button>
                </div>
              </div>
              
              {/* Standart takvim (isteğe bağlı gösterilebilir) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-primary mb-2">Takvimden Seç</summary>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                  locale={tr}
                />
              </details>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <CardTitle>Randevular</CardTitle>
                <CardDescription>
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Bugün"}
                </CardDescription>
              </div>
              <div className="sm:ml-auto w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Randevularda ara..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-gray-100 w-full overflow-x-auto flex-nowrap">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white flex-1">
                    Tümü
                  </TabsTrigger>
                  <TabsTrigger
                    value="confirmed"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white flex-1"
                  >
                    Onaylanan
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white flex-1"
                  >
                    Bekleyen
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  {isLoading ? (
                    <AppointmentsSkeleton />
                  ) : error ? (
                    <div className="p-8 text-center bg-red-50 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4 text-red-800">Veri Yükleme Hatası</h2>
                      <p className="text-red-700">{error}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => (selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments())}
                      >
                        Tekrar Dene
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                      <AppointmentList
                        appointments={filteredAppointments}
                        onAppointmentChange={() =>
                          selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments()
                        }
                      />
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="confirmed">
                  {isLoading ? (
                    <AppointmentsSkeleton />
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                      <AppointmentList
                        appointments={filteredAppointments.filter((a) => a.status === "onaylandı")}
                        onAppointmentChange={() =>
                          selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments()
                        }
                      />
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="pending">
                  {isLoading ? (
                    <AppointmentsSkeleton />
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                      <AppointmentList
                        appointments={filteredAppointments.filter((a) => a.status === "beklemede")}
                        onAppointmentChange={() =>
                          selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments()
                        }
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => (selectedDate ? fetchAppointmentsByDate(selectedDate) : fetchAllAppointments())}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Yükleniyor..." : "Randevuları Yenile"}
              </Button>
              <NewAppointmentDialog
                onSuccess={handleAppointmentAdded}
                initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
              >
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Randevu
                </Button>
              </NewAppointmentDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

