'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingBag, Package, CreditCard, Users, Check, X, 
  ExternalLink, Edit, Trash2, Plus, Sparkles, RefreshCw, Eye
} from 'lucide-react';

type Tab = 'orders' | 'products' | 'payments' | 'users';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Modal / Form States
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [deliveryOrder, setDeliveryOrder] = useState<any | null>(null);
  const [deliveryContent, setDeliveryContent] = useState('');
  const [rejectOrder, setRejectOrder] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Product Forms
  const [productForm, setProductForm] = useState({ id: '', title: '', description: '', price: '', image_url: '' });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Payment Forms
  const [paymentForm, setPaymentForm] = useState({ id: '', name: '', details: '' });
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalRevenue: 0 });

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        setIsAdmin(false);
        router.push('/');
      } else {
        setIsAdmin(true);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      router.push('/');
    }
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, products(title, price), profiles(full_name, whatsapp)')
        .order('created_at', { ascending: false });

      if (ordersData) {
        setOrders(ordersData);
        // Calculate Stats
        const pending = ordersData.filter(o => o.status === 'pending').length;
        const totalRev = ordersData
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + Number(o.products?.price || 0), 0);
        setStats({ totalOrders: ordersData.length, pendingOrders: pending, totalRevenue: totalRev });
      }

      // 2. Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (productsData) setProducts(productsData);

      // 3. Fetch Payment Methods
      const { data: paymentsData } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });
      if (paymentsData) setPayments(paymentsData);

      // 4. Fetch Users (API)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const usersData = await res.json();
        if (usersData.users) setUsersList(usersData.users);
      }

    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    } finally {
      setLoading(false);
    }
  };

  // ORDER ACTIONS
  const handleApproveOrder = async () => {
    if (!deliveryOrder || !deliveryContent) return;
    
    try {
      // 1. Update order status
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'completed', admin_notes: deliveryContent })
        .eq('id', deliveryOrder.id);

      if (orderErr) throw orderErr;

      // 2. Insert into customer inbox
      const { error: inboxErr } = await supabase
        .from('inbox_messages')
        .insert({
          user_id: deliveryOrder.user_id,
          order_id: deliveryOrder.id,
          title: `🎉 تم تسليم طلبك: ${deliveryOrder.products?.title || 'الخدمة الرقمية'}`,
          message_content: deliveryContent,
          is_read: false
        });

      if (inboxErr) throw inboxErr;

      setDeliveryOrder(null);
      setDeliveryContent('');
      fetchDashboardData();
    } catch (err) {
      alert('حدث خطأ أثناء إتمام الطلب');
      console.error(err);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectOrder || !rejectReason) return;

    try {
      // 1. Update order status
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'rejected', admin_notes: rejectReason })
        .eq('id', rejectOrder.id);

      if (orderErr) throw orderErr;

      // 2. Insert into customer inbox
      const { error: inboxErr } = await supabase
        .from('inbox_messages')
        .insert({
          user_id: rejectOrder.user_id,
          order_id: rejectOrder.id,
          title: `⚠️ تم رفض طلبك: ${rejectOrder.products?.title || 'الخدمة الرقمية'}`,
          message_content: `نعتذر منك، لقد تم رفض طلبك للسبب التالي:\n${rejectReason}\nيرجى التواصل معنا عبر الواتساب للمساعدة أو إعادة الطلب ببيانات صحيحة.`,
          is_read: false
        });

      if (inboxErr) throw inboxErr;

      setRejectOrder(null);
      setRejectReason('');
      fetchDashboardData();
    } catch (err) {
      alert('حدث خطأ أثناء رفض الطلب');
      console.error(err);
    }
  };

  // PRODUCT CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(productForm.price);
    if (isNaN(priceNum)) return;

    try {
      if (isEditingProduct) {
        // Edit
        const { error } = await supabase
          .from('products')
          .update({
            title: productForm.title,
            description: productForm.description,
            price: priceNum,
            image_url: productForm.image_url || null
          })
          .eq('id', productForm.id);

        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase
          .from('products')
          .insert({
            title: productForm.title,
            description: productForm.description,
            price: priceNum,
            image_url: productForm.image_url || null
          });

        if (error) throw error;
      }

      setShowProductModal(false);
      setIsEditingProduct(false);
      setProductForm({ id: '', title: '', description: '', price: '', image_url: '' });
      fetchDashboardData();
    } catch (err) {
      alert('خطأ في العملية على المنتج');
      console.error(err);
    }
  };

  const handleEditProductClick = (product: any) => {
    setProductForm({
      id: product.id,
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || ''
    });
    setIsEditingProduct(true);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchDashboardData();
    } catch (err) {
      alert('حدث خطأ أثناء حذف المنتج');
      console.error(err);
    }
  };

  // PAYMENT CRUD
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingPayment) {
        // Edit
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name: paymentForm.name,
            details: paymentForm.details
          })
          .eq('id', paymentForm.id);

        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase
          .from('payment_methods')
          .insert({
            name: paymentForm.name,
            details: paymentForm.details
          });

        if (error) throw error;
      }

      setShowPaymentModal(false);
      setIsEditingPayment(false);
      setPaymentForm({ id: '', name: '', details: '' });
      fetchDashboardData();
    } catch (err) {
      alert('خطأ في تعديل طريقة الدفع');
      console.error(err);
    }
  };

  const handleEditPaymentClick = (pay: any) => {
    setPaymentForm({
      id: pay.id,
      name: pay.name,
      details: pay.details
    });
    setIsEditingPayment(true);
    setShowPaymentModal(true);
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف وسيلة الدفع هذه؟')) return;
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchDashboardData();
    } catch (err) {
      alert('حدث خطأ أثناء حذف وسيلة الدفع');
      console.error(err);
    }
  };

  if (isAdmin === null || loading) {
    return <div style={{ textAlign: 'center', padding: '100px 0', fontWeight: 'bold' }}>جاري تحميل لوحة التحكم كمسؤول...</div>;
  }

  if (isAdmin === false) {
    return null; // Will redirect
  }

  return (
    <div>
      {/* Top Banner */}
      <div style={{
        border: 'var(--border-thick)',
        boxShadow: 'var(--hard-shadow)',
        backgroundColor: 'var(--accent-color)',
        padding: '24px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>🛡️ لوحة تحكم المسؤول (Admin Dashboard)</h1>
          <p style={{ fontWeight: 'bold', marginTop: '4px' }}>أهلاً بك يا مدير! تحكم بالمنتجات، الطلبات، وطرق الدفع والعملاء.</p>
        </div>
        <button className="btn btn-outline" onClick={fetchDashboardData}>
          <RefreshCw size={16} />
          <span>تحديث لوحة التحكم</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">إجمالي الطلبات</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#ffe2e5' }}>
          <div className="stat-value" style={{ color: 'var(--error-color)' }}>{stats.pendingOrders}</div>
          <div className="stat-label">طلبات قيد المراجعة</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#e2fbd7' }}>
          <div className="stat-value" style={{ color: 'green' }}>{stats.totalRevenue} ج.م</div>
          <div className="stat-label">إجمالي المبيعات المقبولة</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{usersList.length}</div>
          <div className="stat-label">المستخدمين المسجلين</div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        {/* Sidebar Nav */}
        <div className="dashboard-sidebar">
          <button 
            className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ cursor: 'pointer', textAlign: 'right' }}
          >
            <ShoppingBag size={20} />
            <span>إدارة الطلبات</span>
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
            style={{ cursor: 'pointer', textAlign: 'right' }}
          >
            <Package size={20} />
            <span>إدارة المنتجات</span>
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
            style={{ cursor: 'pointer', textAlign: 'right' }}
          >
            <CreditCard size={20} />
            <span>طرق الدفع</span>
          </button>

          <button 
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ cursor: 'pointer', textAlign: 'right' }}
          >
            <Users size={20} />
            <span>قائمة المستخدمين</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="card">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <>
              <div className="card-header" style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>قائمة الطلبات الواردة</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {orders.length === 0 ? (
                  <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد أي طلبات حالياً.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ledger-table" style={{ border: 'none' }}>
                      <thead>
                        <tr>
                          <th>العميل</th>
                          <th>المنتج</th>
                          <th>طريقة الدفع</th>
                          <th>المحول منه</th>
                          <th>إثبات الدفع</th>
                          <th>الحالة</th>
                          <th>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <div><b>{order.profiles?.full_name}</b></div>
                              <div style={{ fontSize: '12px' }}>
                                <a 
                                  href={`https://wa.me/${order.customer_whatsapp.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: 'green', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {order.customer_whatsapp}
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </td>
                            <td>
                              <b>{order.products?.title}</b>
                              <div style={{ fontSize: '13px', color: 'var(--primary-color)' }}>{order.products?.price} ج.م</div>
                            </td>
                            <td>{order.payment_method}</td>
                            <td style={{ fontFamily: 'monospace' }}>{order.sender_number}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => setSelectedScreenshot(order.screenshot_url)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Eye size={12} />
                                <span>عرض الصورة</span>
                              </button>
                            </td>
                            <td>
                              {order.status === 'pending' && <span className="badge badge-pending">قيد المراجعة</span>}
                              {order.status === 'completed' && <span className="badge badge-completed">مكتمل</span>}
                              {order.status === 'rejected' && <span className="badge badge-rejected">مرفوض</span>}
                            </td>
                            <td>
                              {order.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setDeliveryOrder(order)}
                                  >
                                    <Check size={14} />
                                    <span>قبول وتسليم</span>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-danger"
                                    onClick={() => setRejectOrder(order)}
                                  >
                                    <X size={14} />
                                    <span>رفض</span>
                                  </button>
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'pre-line', maxWidth: '200px' }}>
                                  <b>الملاحظة:</b> {order.admin_notes || 'لا يوجد'}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <>
              <div className="card-header" style={{ backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>إدارة المنتجات الرقمية والخدمات</h3>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setProductForm({ id: '', title: '', description: '', price: '', image_url: '' });
                    setIsEditingProduct(false);
                    setShowProductModal(true);
                  }}
                  style={{ backgroundColor: 'var(--accent-color)', color: '#000' }}
                >
                  <Plus size={16} />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
              <div className="card-body">
                {products.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>لا توجد منتجات معروضة حالياً.</p>
                ) : (
                  <div className="products-grid" style={{ marginTop: 0 }}>
                    {products.map((prod) => (
                      <div key={prod.id} className="card product-card">
                        <div className="product-image-container" style={{ height: '140px' }}>
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.title} className="product-image" />
                          ) : (
                            <div className="product-placeholder" style={{ fontSize: '24px' }}>
                              {prod.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="product-info" style={{ padding: '16px' }}>
                          <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{prod.title}</h4>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', minHeight: '60px', overflow: 'hidden' }}>{prod.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary-color)' }}>{prod.price} ج.م</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => handleEditProductClick(prod)}
                                style={{ padding: '6px' }}
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteProduct(prod.id)}
                                style={{ padding: '6px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <>
              <div className="card-header" style={{ backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>إدارة وسائل الدفع بالموقع</h3>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setPaymentForm({ id: '', name: '', details: '' });
                    setIsEditingPayment(false);
                    setShowPaymentModal(true);
                  }}
                  style={{ backgroundColor: 'var(--accent-color)', color: '#000' }}
                >
                  <Plus size={16} />
                  <span>إضافة وسيلة جديدة</span>
                </button>
              </div>
              <div className="card-body">
                <div style={{ overflowX: 'auto' }}>
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>اسم وسيلة الدفع</th>
                        <th>تفاصيل الحساب / الرقم للنسخ</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay.id}>
                          <td style={{ fontWeight: 'bold' }}>{pay.name}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '16px' }}>{pay.details}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => handleEditPaymentClick(pay)}
                              >
                                <Edit size={14} />
                                <span>تعديل</span>
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeletePayment(pay.id)}
                              >
                                <Trash2 size={14} />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <>
              <div className="card-header" style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>دليل المستخدمين المسجلين</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ledger-table" style={{ border: 'none' }}>
                    <thead>
                      <tr>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>رقم الواتساب</th>
                        <th>صلاحية الحساب</th>
                        <th>تاريخ التسجيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((usr) => (
                        <tr key={usr.id}>
                          <td style={{ fontWeight: 'bold' }}>{usr.full_name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{usr.email}</td>
                          <td>
                            <a 
                              href={`https://wa.me/${usr.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'green', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                            >
                              {usr.whatsapp}
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: usr.role === 'admin' ? 'var(--accent-color)' : 'var(--bg-color)' }}>
                              {usr.role === 'admin' ? 'مسؤول (Admin)' : 'عميل'}
                            </span>
                          </td>
                          <td>
                            {new Date(usr.created_at).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SCREENSHOT FULL SCREEN MODAL */}
      {selectedScreenshot && (
        <div className="modal-overlay" onClick={() => setSelectedScreenshot(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#000', border: 'none' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: '#111', color: '#fff', borderBottom: '1px solid #333' }}>
              <h3 style={{ color: '#fff' }}>إيصال التحويل</h3>
              <button className="modal-close" style={{ color: '#000' }} onClick={() => setSelectedScreenshot(null)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
              <img 
                src={selectedScreenshot} 
                alt="Receipt screenshot" 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', border: '3px solid #fff' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ORDER ACCEPT & DELIVER MODAL */}
      {deliveryOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--accent-color)' }}>
              <h3 style={{ margin: 0 }}>قبول وتسليم الطلب</h3>
              <button className="modal-close" onClick={() => setDeliveryOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>
                طلب العميل: {deliveryOrder.profiles?.full_name} لشراء {deliveryOrder.products?.title}.
              </p>
              
              <div className="form-group">
                <label className="form-label">تفاصيل الحساب أو كود التفعيل (سيصل العميل في صندوق الوارد):</label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="اكتب بيانات الحساب هنا (مثل البريد، الباسورد، كود التفعيل، روابط التنزيل)..."
                  value={deliveryContent}
                  onChange={(e) => setDeliveryContent(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button className="btn btn-outline" onClick={() => setDeliveryOrder(null)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleApproveOrder} disabled={!deliveryContent}>
                  <Check size={16} />
                  <span>تأكيد القبول وتسليم المنتج</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER REJECT MODAL */}
      {rejectOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--error-color)', color: '#fff' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>رفض الطلب</h3>
              <button className="modal-close" onClick={() => setRejectOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>
                رفض طلب: {rejectOrder.profiles?.full_name} لشراء {rejectOrder.products?.title}.
              </p>
              
              <div className="form-group">
                <label className="form-label">سبب الرفض (سيصل العميل في صندوق الوارد):</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="مثال: لم نتوصل بقيمة التحويل، يرجى إعادة التحويل وإرفاق إيصال صحيح ورقم تحويل مطابق..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button className="btn btn-outline" onClick={() => setRejectOrder(null)}>إلغاء</button>
                <button className="btn btn-danger" onClick={handleRejectOrder} disabled={!rejectReason}>
                  <X size={16} />
                  <span>تأكيد رفض الطلب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT ADD/EDIT MODAL */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--accent-color)' }}>
              <h3 style={{ margin: 0 }}>{isEditingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">عنوان المنتج / الخدمة *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="مثال: حساب Gemini Advanced مفعل جاهز"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الوصف الكامل للخدمة *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="اكتب مواصفات الخدمة، المدة، الضمان بالتفصيل..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">سعر المنتج بالجنيه المصري (ج.م) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="مثال: 150"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رابط صورة المنتج (اختياري)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT METHOD ADD/EDIT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--accent-color)' }}>
              <h3 style={{ margin: 0 }}>{isEditingPayment ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">اسم وسيلة الدفع *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={paymentForm.name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                    placeholder="مثال: فودافون كاش أو انستا باي"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">تفاصيل الحساب أو الرقم لتحويل الأموال *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={paymentForm.details}
                    onChange={(e) => setPaymentForm({ ...paymentForm, details: e.target.value })}
                    placeholder="مثال: 01066000000 أو user@instapay"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
