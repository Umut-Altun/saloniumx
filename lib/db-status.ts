import { supabase } from './supabase';

export async function checkDatabaseStatus() {
  try {
    const { data, error } = await supabase.from('customers').select('count').single();
    if (error) throw error;
    return { connected: true, error: null };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Veritabanına bağlanılamadı'
    };
  }
}

export async function initializeDatabase() {
  try {
    // Supabase'de tablo oluşturma ve şema yönetimi dashboard üzerinden yapılır
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Veritabanı başlatılamadı'
    };
  }
}

export async function resetDatabase() {
  try {
    // Supabase'de verileri sıfırlama
    const tables = ['sale_items', 'sales', 'appointments', 'products', 'services', 'customers'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).delete();
      if (error) throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Veritabanı sıfırlanamadı'
    };
  }
}

