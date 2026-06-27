'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, User, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link href="/" className="logo">
          <span>ماستر</span> MASTER STORE
        </Link>
        <nav className="nav-links">
          {loading ? (
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>جاري التحميل...</span>
          ) : session ? (
            <>
              {profile?.role === 'admin' && (
                <Link href="/admin" className="btn btn-sm btn-primary">
                  <LayoutDashboard size={16} />
                  <span>لوحة التحكم</span>
                </Link>
              )}
              <Link href="/dashboard" className="btn btn-sm btn-outline">
                <User size={16} />
                <span>حسابي</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-sm btn-danger">
                <LogOut size={16} />
                <span>خروج</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-sm btn-primary">
              <User size={16} />
              <span>دخول / تسجيل</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
