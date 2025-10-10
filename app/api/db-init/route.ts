import { type NextRequest, NextResponse } from "next/server"
import { ensureDatabaseConnection, migrateDatabase, seedInitialData } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    const connected = await ensureDatabaseConnection()
    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          message: "Veritabanına bağlanılamadı",
        },
        { status: 500 }
      )
    }

    // Run migrations if needed
    const migrated = await migrateDatabase()
    if (!migrated) {
      return NextResponse.json(
        {
          success: false,
          message: "Veritabanı şeması güncellenemedi",
        },
        { status: 500 }
      )
    }

    // Seed initial data if tables are empty
    const seeded = await seedInitialData()

    return NextResponse.json({
      success: true,
      message: "Veritabanı başarıyla başlatıldı ve örnek veriler yüklendi",
      seeded,
    })
  } catch (error) {
    console.error("Veritabanı başlatma hatası:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Veritabanı başlatılırken beklenmeyen bir hata oluştu",
      },
      { status: 500 }
    )
  }
}

