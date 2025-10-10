import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { seedInitialData } from "@/lib/db"

export async function GET() {
  try {
    // Tüm tabloları temizle
    const tables = ['sale_items', 'sales', 'appointments', 'products', 'services', 'customers'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 0); // Tüm kayıtları sil
        
      if (error) throw error;
    }

    // Örnek verileri yükle
    const seeded = await seedInitialData()
    if (!seeded) {
      return NextResponse.json(
        {
          status: "error",
          message: "Örnek veriler yüklenemedi",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Veritabanı başarıyla sıfırlandı ve örnek veriler yüklendi",
    })
  } catch (error) {
    console.error("Veritabanı sıfırlama hatası:", error)
    const errorMessage = error instanceof Error ? error.message : "Veritabanı sıfırlanırken beklenmeyen bir hata oluştu"

    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
      },
      { status: 200 },
    )
  }
}

