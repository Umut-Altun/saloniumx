import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Tip tanımlamaları
type QueryResult<T = any> = {
  data: T;
  error: PostgrestError | null;
};

// Temel veritabanı işlemleri için yardımcı fonksiyon
export async function query(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete' = 'select',
  params?: any
): Promise<QueryResult> {
  try {
    let result;

    switch (operation) {
      case 'select':
        result = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });
        break;

      case 'insert':
        result = await supabase
          .from(table)
          .insert([params])
          .select()
          .single();
        break;

      case 'update':
        if (!params?.id || !params?.values) {
          throw new Error('Update requires id and values');
        }
        result = await supabase
          .from(table)
          .update(params.values)
          .eq('id', params.id)
          .select()
          .single();
        break;

      case 'delete':
        if (typeof params !== 'number') {
          throw new Error('Delete requires an id');
        }
        result = await supabase
          .from(table)
          .delete()
          .eq('id', params)
          .select()
          .single();
        break;

      default:
        throw new Error(`Invalid operation: ${operation}`);
    }

    return {
      data: result.data,
      error: result.error
    };
  } catch (error) {
    console.error('Database operation error:', error);
    return {
      data: null,
      error: error as PostgrestError
    };
  }
}

// Veritabanı bağlantı kontrolü
export async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('customers').select('count').single();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Veritabanı başlatma
export async function initDatabase() {
  try {
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error('Veritabanına bağlanılamadı');
    }
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Örnek veri ekleme
export async function seedInitialData() {
  const services = [
    { name: 'Saç Kesimi', duration: 30, price: 100, description: 'Standart saç kesimi' },
    { name: 'Sakal Tıraşı', duration: 20, price: 50, description: 'Sakal şekillendirme' },
    { name: 'Saç Boyama', duration: 90, price: 300, description: 'Saç boyama işlemi' },
    { name: 'Fön', duration: 30, price: 80, description: 'Saç kurutma ve şekillendirme' }
  ];

  const products = [
    { name: 'Şampuan', category: 'Saç Bakım', price: 150, stock: 10, description: 'Profesyonel saç şampuanı' },
    { name: 'Saç Kremi', category: 'Saç Bakım', price: 120, stock: 8, description: 'Nemlendirici saç kremi' },
    { name: 'Sakal Yağı', category: 'Sakal Bakım', price: 90, stock: 15, description: 'Doğal sakal bakım yağı' },
    { name: 'Saç Köpüğü', category: 'Şekillendirici', price: 80, stock: 12, description: 'Hacim veren saç köpüğü' }
  ];

  try {
    const { data: existingServices } = await supabase.from('services').select('count');
    if (!existingServices?.length) {
      for (const service of services) {
        await query('services', 'insert', service);
      }
    }

    const { data: existingProducts } = await supabase.from('products').select('count');
    if (!existingProducts?.length) {
      for (const product of products) {
        await query('products', 'insert', product);
      }
    }

    return true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
    return false;
  }
}

export {
  initDatabase as ensureDatabaseConnection // Geriye dönük uyumluluk için
};