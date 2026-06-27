'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to home
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isLogin) {
      // Login flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.' : error.message);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      // Signup flow
      if (!fullName || !whatsapp) {
        setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            whatsapp: whatsapp,
            role: 'customer'
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        setSuccessMsg('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
        setIsLogin(true);
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto 0 auto' }}>
      <div className="card">
        <div className="card-header" style={{ backgroundColor: 'var(--accent-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
        </div>
        
        <div className="card-body">
          {errorMsg && (
            <div style={{ border: 'var(--border-thick)', backgroundColor: '#ffe2e5', color: '#f1416c', padding: '12px', marginBottom: '16px', fontWeight: 'bold' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div style={{ border: 'var(--border-thick)', backgroundColor: '#e2fbd7', color: '#174208', padding: '12px', marginBottom: '16px', fontWeight: 'bold' }}>
              ✅ {successMsg}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">الاسم بالكامل *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: أحمد محمد"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">رقم الواتساب *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: 01012345678"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني *</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">كلمة المرور *</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '12px' }}>
              {loading ? 'جاري التحميل...' : isLogin ? 'تسجيل دخول' : 'إنشاء حساب'}
            </button>
          </form>
        </div>
        
        <div className="card-footer" style={{ textAlign: 'center', fontSize: '14px' }}>
          {isLogin ? (
            <p>
              ليس لديك حساب؟{' '}
              <button 
                onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
              >
                سجل حساب جديد الآن
              </button>
            </p>
          ) : (
            <p>
              لديك حساب بالفعل؟{' '}
              <button 
                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
              >
                سجل دخولك
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
