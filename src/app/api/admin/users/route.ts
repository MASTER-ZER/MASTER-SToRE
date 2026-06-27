import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    // 1. Verify that the requester is an admin
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'جلسة عمل غير صالحة' }, { status: 401 });
    }

    // Fetch the user's profile to confirm admin role
    const { data: profile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'غير مسموح لك بالدخول، هذا القسم للمسؤولين فقط' }, { status: 403 });
    }

    // 2. Fetch all users from Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    // 3. Fetch all profiles from public profiles
    const { data: profiles, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) {
      throw pError;
    }

    // Combine Auth user details (like email) with Profile details
    const combinedUsers = profiles.map(p => {
      const authUser = users.find(u => u.id === p.id);
      return {
        ...p,
        email: authUser?.email || 'بدون بريد',
        last_sign_in: authUser?.last_sign_in_at || null
      };
    });

    return NextResponse.json({ users: combinedUsers });
  } catch (err: any) {
    console.error('Admin users API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
