import { supabase } from './supabase';
import { query } from './db';

// Rapor verilerini getir
export async function getReportData() {
  try {
    // Satışlar
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        ),
        sale_items (
          id,
          item_type,
          item_id,
          name,
          quantity,
          price
        )
      `)
      .order('date', { ascending: false });

    if (salesError) throw salesError;

    // Randevular
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        ),
        services (
          id,
          name,
          price
        )
      `)
      .order('date', { ascending: false });

    if (appointmentsError) throw appointmentsError;

    // Müşteriler
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) throw customersError;

    // Hizmetler
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');

    if (servicesError) throw servicesError;

    // Ürünler
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) throw productsError;

    // Rapor verilerini hazırla
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Bu ayki satışlar
    const thisMonthSales = sales?.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    }) || [];

    // Bu ayki randevular
    const thisMonthAppointments = appointments?.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
    }) || [];

    // Toplam gelir
    const totalRevenue = sales?.reduce((total, sale) => total + (sale.total || 0), 0) || 0;

    // Bu ayki gelir
    const thisMonthRevenue = thisMonthSales.reduce((total, sale) => total + (sale.total || 0), 0);

    // Tamamlanan randevular
    const completedAppointments = appointments?.filter(appointment => appointment.status === 'tamamlandı') || [];

    // Ödeme yöntemleri dağılımı
    const paymentMethods = {
      card: sales?.filter(sale => sale.payment_method === 'card').length || 0,
      cash: sales?.filter(sale => sale.payment_method === 'cash').length || 0
    };

    // En çok satan hizmetler
    interface SaleItem {
      item_id: number;
      item_type: string;
      name?: string;
      quantity?: number;
      price?: number;
    }

    interface ServiceStat {
      id: number;
      name: string;
      count: number;
      revenue: number;
    }

    const serviceItems = sales?.flatMap(sale => 
      (sale.sale_items as SaleItem[] | undefined)?.filter((item: SaleItem) => item.item_type === 'service') || []
    ) || [];
    
    const serviceStats: Record<number, ServiceStat> = {};
    serviceItems.forEach((item: SaleItem) => {
      if (!serviceStats[item.item_id]) {
        serviceStats[item.item_id] = {
          id: item.item_id,
          name: item.name || 'Bilinmeyen Hizmet',
          count: 0,
          revenue: 0
        };
      }
      serviceStats[item.item_id].count += item.quantity || 1;
      serviceStats[item.item_id].revenue += (item.price || 0) * (item.quantity || 1);
    });
    
    const topServices = Object.values(serviceStats)
      .sort((a: ServiceStat, b: ServiceStat) => b.revenue - a.revenue)
      .slice(0, 10);
      
    // En çok satan ürünler
    const productItems = sales?.flatMap(sale => 
      (sale.sale_items as SaleItem[] | undefined)?.filter((item: SaleItem) => item.item_type === 'product') || []
    ) || [];
    
    const productStats: Record<number, ServiceStat> = {};
    productItems.forEach((item: SaleItem) => {
      if (!productStats[item.item_id]) {
        productStats[item.item_id] = {
          id: item.item_id,
          name: item.name || 'Bilinmeyen Ürün',
          count: 0,
          revenue: 0
        };
      }
      productStats[item.item_id].count += item.quantity || 1;
      productStats[item.item_id].revenue += (item.price || 0) * (item.quantity || 1);
    });
    
    const topProducts = Object.values(productStats)
      .sort((a: ServiceStat, b: ServiceStat) => b.revenue - a.revenue)
      .slice(0, 10);

    // Günlük gelir dağılımı
    const dailyRevenue: Record<string, number> = {};
    sales?.forEach(sale => {
      const date = sale.date.split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += sale.total || 0;
    });

    // Saatlik randevu dağılımı
    const hourlyAppointments: Record<string, number> = {};
    appointments?.forEach(appointment => {
      const hour = appointment.time.split(':')[0];
      if (!hourlyAppointments[hour]) {
        hourlyAppointments[hour] = 0;
      }
      hourlyAppointments[hour] += 1;
    });
    
    // Rapor verilerini döndür
    return {
      sales,
      appointments,
      customers,
      services,
      products,
      paymentMethods,
      topServices,
      topProducts,
      dailyRevenue,
      hourlyAppointments,
      stats: {
        totalRevenue,
        thisMonthRevenue,
        totalCustomers: customers?.length || 0,
        totalAppointments: appointments?.length || 0,
        completedAppointments: completedAppointments.length,
        thisMonthAppointments: thisMonthAppointments.length,
        thisMonthSales: thisMonthSales.length
      }
    };
  } catch (error) {
    console.error('Rapor verileri alınırken bir hata oluştu:', error);
    throw error;
  }
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  notes: string;
  customer_id: number;
  service_id: number;
  payment_status?: string;
  payment_method?: string;
  customer_name?: string;
  service_name?: string;
  duration?: number;
  customers?: {
    id: number;
    name: string;
    phone: string;
  };
  services?: {
    id: number;
    name: string;
    duration: number;
    price: number;
  };
}

// Müşteri işlemleri
export async function createCustomer(data: any) {
  try {
    const { data: customer, error } = await query('customers', 'insert', data);
    if (error) throw error;
    return customer;
  } catch (error) {
    console.error('Müşteri oluşturulurken bir hata oluştu:', error);
    throw new Error('Müşteri oluşturulurken bir hata oluştu.');
  }
}

export async function getCustomers() {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return customers;
  } catch (error) {
    console.error('Müşteriler alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function getCustomerById(id: number) {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return customer;
  } catch (error) {
    console.error('Müşteri bilgileri alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function updateCustomer(id: number, values: any) {
  try {
    const { data: customer, error } = await query('customers', 'update', { id, values });
    if (error) throw error;
    return customer;
  } catch (error) {
    console.error('Müşteri güncellenirken bir hata oluştu:', error);
    throw error;
  }
}

export async function deleteCustomer(id: number) {
  try {
    const { data: customer, error } = await query('customers', 'delete', id);
    if (error) throw error;
    return customer;
  } catch (error) {
    console.error('Müşteri silinirken bir hata oluştu:', error);
    throw error;
  }
}

// Hizmet işlemleri
export async function getServices() {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    if (error) throw error;
    return services;
  } catch (error) {
    console.error('Hizmetler alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function getServiceById(id: number) {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return service;
  } catch (error) {
    console.error('Hizmet bilgileri alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function createService(data: any) {
  try {
    const { data: service, error } = await query('services', 'insert', data);
    if (error) throw error;
    return service;
  } catch (error) {
    console.error('Hizmet oluşturulurken bir hata oluştu:', error);
    throw error;
  }
}

export async function updateService(id: number, values: any) {
  try {
    const { data: service, error } = await query('services', 'update', { id, values });
    if (error) throw error;
    return service;
  } catch (error) {
    console.error('Hizmet güncellenirken bir hata oluştu:', error);
    throw error;
  }
}

export async function deleteService(id: number) {
  try {
    // Önce hizmetin kullanımda olup olmadığını kontrol et
    const { count, error: checkError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', id);

    if (checkError) throw checkError;

    if (count && count > 0) {
      throw new Error('Bu hizmet randevularda kullanıldığı için silinemez.');
    }

    const { data: service, error } = await query('services', 'delete', id);
    if (error) throw error;
    return service;
  } catch (error) {
    console.error('Hizmet silinirken bir hata oluştu:', error);
    throw error;
  }
}

// Ürün işlemleri
export async function getProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (error) throw error;
    return products;
  } catch (error) {
    console.error('Ürünler alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function getProductById(id: number) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return product;
  } catch (error) {
    console.error('Ürün bilgileri alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function createProduct(data: any) {
  try {
    const { data: product, error } = await query('products', 'insert', data);
    if (error) throw error;
    return product;
  } catch (error) {
    console.error('Ürün oluşturulurken bir hata oluştu:', error);
    throw error;
  }
}

export async function updateProduct(id: number, values: any) {
  try {
    const { data: product, error } = await query('products', 'update', { id, values });
    if (error) throw error;
    return product;
  } catch (error) {
    console.error('Ürün güncellenirken bir hata oluştu:', error);
    throw error;
  }
}

export async function deleteProduct(id: number) {
  try {
    // Önce ürünün satışlarda kullanılıp kullanılmadığını kontrol et
    const { count, error: checkError } = await supabase
      .from('sale_items')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', id)
      .eq('item_type', 'product');

    if (checkError) throw checkError;

    if (count && count > 0) {
      throw new Error('Bu ürün satışlarda kullanıldığı için silinemez.');
    }

    const { data: product, error } = await query('products', 'delete', id);
    if (error) throw error;
    return product;
  } catch (error) {
    console.error('Ürün silinirken bir hata oluştu:', error);
    throw error;
  }
}

// Randevu işlemleri
export async function getAppointments() {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        time,
        status,
        notes,
        customer_id,
        service_id,
        customers (
          id,
          name,
          phone
        ),
        services (
          id,
          name,
          duration,
          price
        )
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;

    // Randevu verilerini düzenle
    const formattedAppointments = appointments?.map((appointment: any) => ({
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      notes: appointment.notes,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      customer_name: appointment.customers?.name || '',
      customer_phone: appointment.customers?.phone || '',
      service_name: appointment.services?.name || '',
      duration: appointment.services?.duration || 0,
      price: appointment.services?.price || 0
    }));

    return formattedAppointments;
  } catch (error) {
    console.error('Randevular alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function getAppointmentById(id: number) {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        ),
        services (
          id,
          name,
          duration,
          price
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return appointment;
  } catch (error) {
    console.error('Randevu bilgileri alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function createAppointment(data: any) {
  try {
    const { data: appointment, error } = await query('appointments', 'insert', data);
    if (error) throw error;
    return appointment;
  } catch (error) {
    console.error('Randevu oluşturulurken bir hata oluştu:', error);
    throw error;
  }
}

export async function updateAppointment(id: number, values: any) {
  try {
    const { data: appointment, error } = await query('appointments', 'update', { id, values });
    if (error) throw error;
    return appointment;
  } catch (error) {
    console.error('Randevu güncellenirken bir hata oluştu:', error);
    throw error;
  }
}

export async function deleteAppointment(id: number) {
  try {
    const { data: appointment, error } = await query('appointments', 'delete', id);
    if (error) throw error;
    return appointment;
  } catch (error) {
    console.error('Randevu silinirken bir hata oluştu:', error);
    throw error;
  }
}

// Satış işlemleri
export async function getSales() {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        ),
        sale_items (
          id,
          item_type,
          item_id,
          quantity,
          price,
          products (
            id,
            name,
            price
          ),
          services (
            id,
            name,
            price
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Satışlar alınırken bir hata oluştu: ${error.message}`);
    }
    
    return sales || [];
  } catch (error) {
    console.error('Satışlar alınırken bir hata oluştu:', error);
    throw new Error(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu');
  }
}

export async function getSaleById(id: number) {
  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        ),
        sale_items (
          id,
          item_type,
          item_id,
          quantity,
          price,
          products (
            id,
            name,
            price
          ),
          services (
            id,
            name,
            price
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return sale;
  } catch (error) {
    console.error('Satış bilgileri alınırken bir hata oluştu:', error);
    throw error;
  }
}

export async function createSale(data: any) {
  try {
    const { data: sale, error } = await query('sales', 'insert', data);
    if (error) throw error;
    return sale;
  } catch (error) {
    console.error('Satış oluşturulurken bir hata oluştu:', error);
    throw error;
  }
}

export async function updateSale(id: number, values: any) {
  try {
    const { data: sale, error } = await query('sales', 'update', { id, values });
    if (error) throw error;
    return sale;
  } catch (error) {
    console.error('Satış güncellenirken bir hata oluştu:', error);
    throw error;
  }
}

export async function deleteSale(id: number) {
  try {
    // Önce satış kalemlerini sil
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (itemsError) throw itemsError;

    const { data: sale, error } = await query('sales', 'delete', id);
    if (error) throw error;
    return sale;
  } catch (error) {
    console.error('Satış silinirken bir hata oluştu:', error);
    throw error;
  }
}

// Satış kalemi işlemleri
export async function createSaleItem(data: any) {
  try {
    const { data: saleItem, error } = await query('sale_items', 'insert', data);
    if (error) throw error;
    return saleItem;
  } catch (error) {
    console.error('Satış kalemi oluşturulurken bir hata oluştu:', error);
    throw error;
  }
}

export async function updateSaleItem(id: number, values: any) {
  try {
    const { data: saleItem, error } = await query('sale_items', 'update', { id, values });
    if (error) throw error;
    return saleItem;
  } catch (error) {
    console.error('Satış kalemi güncellenirken bir hata oluştu:', error);
    throw error;
  }
}

export async function deleteSaleItem(id: number) {
  try {
    const { data: saleItem, error } = await query('sale_items', 'delete', id);
    if (error) throw error;
    return saleItem;
  } catch (error) {
    console.error('Satış kalemi silinirken bir hata oluştu:', error);
    throw error;
  }
}


// Dashboard istatistikleri
export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Dünün tarihini hesapla
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Bugünkü randevuları al
    const { data: todayAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', today.toISOString())
      .lt('date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (appointmentsError) throw appointmentsError;

    // Dünkü randevuları al
    const { data: yesterdayAppointments, error: yesterdayAppError } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', yesterday.toISOString())
      .lt('date', today.toISOString());

    if (yesterdayAppError) throw yesterdayAppError;

    // Bugünkü randevuların durumlarını hesapla
    const pendingAppointments = todayAppointments?.filter(app => app.status === 'beklemede').length || 0;
    const confirmedAppointments = todayAppointments?.filter(app => app.status === 'onaylandı').length || 0;

    // Toplam randevu sayısını al
    const { count: totalAppointments, error: totalAppError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (totalAppError) throw totalAppError;

    // Toplam müşteri sayısını al
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (customersError) throw customersError;

    // Bu haftaki yeni müşterileri al
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const { data: newCustomersData, error: newCustomersError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', weekStart.toISOString());

    if (newCustomersError) throw newCustomersError;

    // Bugünkü satışları al
    const { data: todaySales, error: todaySalesError } = await supabase
      .from('sales')
      .select('total')
      .gte('created_at', today.toISOString())
      .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (todaySalesError) throw todaySalesError;

    // Dünkü satışları al
    const { data: yesterdaySales, error: yesterdaySalesError } = await supabase
      .from('sales')
      .select('total')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (yesterdaySalesError) throw yesterdaySalesError;

    // Günlük geliri hesapla
    const dailyRevenue = todaySales?.reduce((total, sale) => total + (sale.total || 0), 0) || 0;
    const yesterdayRevenue = yesterdaySales?.reduce((total, sale) => total + (sale.total || 0), 0) || 0;

    // Randevu sayısı farkını hesapla
    const todayAppCount = todayAppointments?.length || 0;
    const yesterdayAppCount = yesterdayAppointments?.length || 0;
    const appointmentDiff = todayAppCount - yesterdayAppCount;

    // Gelir farkını hesapla
    const revenueDiff = dailyRevenue - yesterdayRevenue;
    const revenuePercentChange = yesterdayRevenue > 0 
      ? Math.round((revenueDiff / yesterdayRevenue) * 100) 
      : 0;

    return {
      todayAppointments: {
        count: todayAppCount,
        pending: pendingAppointments,
        confirmed: confirmedAppointments
      },
      totalAppointments: totalAppointments || 0,
      yesterdayAppointments: yesterdayAppCount,
      appointmentDiff,
      totalCustomers: totalCustomers || 0,
      newCustomers: newCustomersData?.length || 0,
      dailyRevenue,
      yesterdayRevenue,
      revenuePercentChange
    };
  } catch (error) {
    console.error('Dashboard istatistikleri alınırken bir hata oluştu:', error);
    throw error;
  }
}

// Belirli bir tarihteki randevuları getir
export async function getAppointmentsByDate(date: string) {
  try {
    // Tarih formatını düzgün şekilde işle
    const dateOnly = date.split('T')[0]; // Sadece YYYY-MM-DD kısmını al
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        time,
        status,
        notes,
        customer_id,
        service_id,
        customers (
          id,
          name,
          phone
        ),
        services (
          id,
          name,
          duration,
          price
        )
      `)
      .eq('date', dateOnly) // Tam olarak seçilen günün tarihini kullan
      .order('time', { ascending: true });

    if (error) throw error;

    // Randevu verilerini düzenle
    const formattedAppointments = appointments?.map((appointment: any) => ({
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      notes: appointment.notes,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      customer_name: appointment.customers?.name || '',
      customer_phone: appointment.customers?.phone || '',
      service_name: appointment.services?.name || '',
      duration: appointment.services?.duration || 0,
      price: appointment.services?.price || 0
    }));

    return formattedAppointments;
  } catch (error) {
    console.error('Randevular alınırken bir hata oluştu:', error);
    throw error;
  }
}

// Randevu ödeme işlemi
export async function processAppointmentPayment(appointmentId: number, paymentMethod: 'card' | 'cash') {
  try {
    // Randevu bilgilerini al
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        services (
          id,
          name,
          price
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError) {
      console.error('Randevu bilgileri alınırken hata:', appointmentError);
      throw new Error('Randevu bilgileri alınamadı');
    }
    
    if (!appointment) {
      throw new Error('Randevu bulunamadı');
    }

    // Randevu durumunu güncelle
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'tamamlandı' })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Randevu durumu güncellenirken hata:', updateError);
      throw new Error('Randevu durumu güncellenemedi');
    }

    // Satış kaydı oluştur
    const saleData = {
      customer_id: appointment.customer_id,
      total: appointment.services?.price || 0,
      payment_method: paymentMethod,
      date: new Date().toISOString().split('T')[0] // Bugünün tarihini YYYY-MM-DD formatında ekle
    };

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('Satış kaydı oluşturulurken hata:', JSON.stringify(saleError));
      throw new Error(`Satış kaydı oluşturulamadı: ${JSON.stringify(saleError)}`);
    }

    if (!sale) {
      console.error('Satış kaydı oluşturuldu fakat veri dönmedi');
      throw new Error('Satış kaydı oluşturuldu fakat veri dönmedi');
    }

    // Satış kalemi oluştur
    const saleItemData = {
      sale_id: sale.id,
      item_type: 'service',
      item_id: appointment.service_id,
      name: appointment.services?.name || 'Hizmet',
      quantity: 1,
      price: appointment.services?.price || 0
    };

    const { error: saleItemError } = await supabase
      .from('sale_items')
      .insert(saleItemData);

    if (saleItemError) {
      console.error('Satış kalemi oluşturulurken hata:', JSON.stringify(saleItemError));
      throw new Error(`Satış kalemi oluşturulamadı: ${JSON.stringify(saleItemError)}`);
    }

    return {
      success: true,
      message: 'Ödeme başarıyla alındı',
      sale_id: sale.id
    };
  } catch (error: any) {
    console.error('Ödeme işlemi sırasında bir hata oluştu:', error);
    return {
      success: false,
      message: error.message || 'Ödeme işlemi sırasında bir hata oluştu'
    };
  }
}

