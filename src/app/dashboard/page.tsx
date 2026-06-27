'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MessageSquare, ShoppingBag, Calendar, CreditCard, ChevronDown, CheckSquare, RefreshCw } from 'lucide-react';

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'inbox'>('orders');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const router = useRouter();

  const fetchData = async (userId: string) => {
    try {
      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(profileData);

      // 2. Fetch orders (joined with product title)
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            title
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersData) setOrders(ordersData);

      // 3. Fetch inbox messages
      const { data: msgData, error: msgErr } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (msgData) setMessages(msgData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchData(session.user.id);
      }
    });
  }, [router]);

  const handleMarkAsRead = async (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', msg.id);

      if (!error) {
        // Update local state
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      }
    }
  };

  const handleRefresh = () => {
    if (user) {
      setLoading(true);
      fetchData(user.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">قيد الانتظار</span>;
      case 'completed':
        return <span className="badge badge-completed">اكتمل وتم التسليم</span>;
      case 'rejected':
        return <span className="badge badge-rejected">مرفوض</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', fontWeight: 'bold' }}>
        جاري تحميل بيانات حسابك...
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Top Header */}
      <div style={{
        border: 'var(--border-thick)',
        boxShadow: 'var(--hard-shadow)',
        backgroundColor: 'var(--panel-bg)',
        padding: '24px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0 }}>مرحباً بك، {profile?.full_name || 'العميل'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            رقم الواتساب المسجل: <b>{profile?.whatsapp}</b> | البريد: <b>{user?.email}</b>
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleRefresh}>
          <RefreshCw size={16} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Navigation Sidebar */}
        <div className="dashboard-sidebar">
          <button
            className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ cursor: 'pointer', width: '100%', textAlign: 'right' }}
          >
            <ShoppingBag size={20} />
            <span style={{ flexGrow: 1 }}>صندوق الطلبات</span>
            <span style={{
              background: '#0a0a0f',
              color: '#fff',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: '900'
            }}>{orders.length}</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
            style={{ cursor: 'pointer', width: '100%', textAlign: 'right' }}
          >
            <MessageSquare size={20} />
            <span style={{ flexGrow: 1 }}>صندوق الوارد (حساباتي المستلمة)</span>
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--primary-color)',
                color: '#fff',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '900'
              }}>{unreadCount} جديد</span>
            )}
          </button>
        </div>

        {/* Content Panel */}
        <div className="card" style={{ boxShadow: 'var(--hard-shadow)' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--accent-color)' }}>
            <h3 style={{ margin: 0, fontSize: '20px' }}>
              {activeTab === 'orders' ? 'قائمة الطلبات السابقة والحالية' : 'الرسائل الواردة وتفاصيل الحسابات'}
            </h3>
          </div>

          <div className="card-body">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <h4>لا يوجد لديك طلبات سابقة.</h4>
                  <p>تصفح الرئيسية واطلب خدمتك الرقمية الآن!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>رقم الطلب</th>
                        <th>الخدمة / المنتج</th>
                        <th>التاريخ</th>
                        <th>وسيلة الدفع</th>
                        <th>الرقم المحول منه</th>
                        <th>حالة الطلب</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>
                            {order.id.slice(0, 8)}...
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            {order.products?.title || 'منتج غير متوفر'}
                          </td>
                          <td>
                            {new Date(order.created_at).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </td>
                          <td>{order.payment_method}</td>
                          <td style={{ fontFamily: 'monospace' }}>{order.sender_number}</td>
                          <td>{getStatusBadge(order.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* INBOX TAB */}
            {activeTab === 'inbox' && (
              messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <h4>صندوق الوارد فارغ.</h4>
                  <p>عند مراجعة طلبك وقبوله، ستظهر تفاصيل حسابك أو البيانات المستلمة هنا فوراً.</p>
                </div>
              ) : (
                <div className="inbox-list">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`inbox-item ${!msg.is_read ? 'unread' : ''}`}
                      onClick={() => handleMarkAsRead(msg)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="inbox-header">
                        <h4 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!msg.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'inline-block' }}></span>}
                          {msg.title}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(msg.created_at).toLocaleDateString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      {selectedMessage?.id === msg.id ? (
                        <div style={{ marginTop: '16px', borderTop: 'var(--border-thick)', paddingTop: '16px' }}>
                          <pre className="inbox-content" style={{ fontFamily: 'Cairo, sans-serif', backgroundColor: '#f3f0f7', padding: '16px', border: 'var(--border-thick)' }}>
                            {msg.message_content}
                          </pre>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {msg.message_content.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
