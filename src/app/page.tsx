'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CheckoutModal from '@/components/CheckoutModal';
import { ShoppingCart, LogIn, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  useEffect(() => {
    // 1. Get current session and user profile
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(profile);
      }
    };

    // 2. Fetch products
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    };

    getSession();
    fetchProducts();
  }, []);

  const handleBuyClick = (product: any) => {
    if (!user) {
      setShowAuthWarning(true);
    } else {
      setSelectedProduct(product);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        border: 'var(--border-thick)',
        boxShadow: 'var(--hard-shadow)',
        backgroundColor: 'var(--panel-bg)',
        padding: '40px 24px',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px' }}>
          🚀 متجر ماستر للخدمات الرقمية والحسابات الجاهزة!
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 24px auto', lineHeight: '1.8' }}>
          نوفر لك تفعيل فوري لحسابات Gemini Advanced، خدمات Google One، وحسابات بريميوم مفعلة مسبقاً بأعلى جودة وضمان متكامل.
          اختر خدمتك، حول وسيلتك المفضلة، وسلّم حسابك فورياً في صندوق الوارد!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Zap size={20} color="var(--primary-color)" />
            <span>تسليم سريع وتلقائي</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <ShieldCheck size={20} color="var(--secondary-color)" />
            <span>ضمان كامل 100%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Sparkles size={20} color="var(--accent-color)" />
            <span>أسعار لا تقبل المنافسة</span>
          </div>
        </div>
      </section>

      {/* Catalog Title */}
      <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>📦</span>
        <span>الخدمات المتاحة حالياً</span>
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>تصفح الخدمات والاشتراكات المتوفرة، واضغط على شراء للتحويل والتفعيل الفوري.</p>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', fontWeight: 'bold', fontSize: '18px' }}>
          جاري تحميل المنتجات والخدمات...
        </div>
      ) : products.length === 0 ? (
        <div style={{ border: 'var(--border-thick)', padding: '40px', textAlign: 'center', backgroundColor: 'var(--panel-bg)' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-muted)' }}>لا توجد منتجات معروضة حالياً. ترقبوا قريباً!</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="card product-card">
              <div className="product-image-container">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="product-image" />
                ) : (
                  <div className="product-placeholder">
                    {product.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-price-row">
                  <span className="product-price">{product.price} ج.م</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBuyClick(product)}
                  >
                    <ShoppingCart size={16} />
                    <span>شراء الآن</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auth Warning Modal */}
      {showAuthWarning && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--error-color)', color: '#fff' }}>
              <h3 style={{ margin: 0 }}>🚨 تنبيه: تسجيل الدخول مطلوب</h3>
              <button className="modal-close" onClick={() => setShowAuthWarning(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
                يجب أن تقوم بإنشاء حساب أو تسجيل الدخول أولاً لتتمكن من شراء الخدمات ومتابعة طلباتك واستلام حسابك في صندوق الوارد.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/login" className="btn btn-primary" onClick={() => setShowAuthWarning(false)}>
                  <LogIn size={18} />
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </Link>
                <button className="btn btn-outline" onClick={() => setShowAuthWarning(false)}>
                  <span>إلغاء</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedProduct && user && (
        <CheckoutModal
          product={selectedProduct}
          user={user}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
