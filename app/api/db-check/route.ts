import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Supabase bağlantısını kontrol et
    const { data, error } = await supabase.from('customers').select('count')
    
    if (error) {
      throw error
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase veritabanı bağlantısı başarılı",
      database: "Supabase (Cloud)",
    })
  } catch (error) {
    console.error("Supabase veritabanı kontrol hatası:", error)
    return NextResponse.json(
      {
        connected: false,
        message: error instanceof Error ? error.message : "Veritabanı kontrolü sırasında beklenmeyen bir hata oluştu",
      },
      { status: 500 }
    )
  }
}

