import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      productId,
      customerName,
      customerWhatsapp,
      paymentMethod,
      screenshotUrl,
      senderNumber,
    } = body;

    // Validate inputs
    if (!userId || !productId || !customerName || !customerWhatsapp || !paymentMethod || !screenshotUrl || !senderNumber) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    // 1. Fetch Product Details for Telegram message
    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .select('title, price')
      .eq('id', productId)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    }

    // 2. Insert Order into database using supabaseAdmin (bypassing RLS checks safely on server)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        product_id: productId,
        customer_name: customerName,
        customer_whatsapp: customerWhatsapp,
        payment_method: paymentMethod,
        screenshot_url: screenshotUrl,
        sender_number: senderNumber,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Database Error:', orderError);
      return NextResponse.json({ error: 'حدث خطأ أثناء حفظ الطلب في قاعدة البيانات' }, { status: 500 });
    }

    // 3. Send Notification to Telegram Admin
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (telegramToken && adminChatId) {
      const whatsappLink = `https://wa.me/${customerWhatsapp.replace(/[^0-9]/g, '')}`;
      const captionText = `
🛍️ <b>طلب جديد في متجر ماستر!</b>

📦 <b>المنتج:</b> ${product.title}
💰 <b>السعر:</b> ${product.price} ج.م
👤 <b>العميل:</b> ${customerName}
📞 <b>واتساب:</b> <a href="${whatsappLink}">${customerWhatsapp}</a>
💳 <b>وسيلة الدفع:</b> ${paymentMethod}
📱 <b>رقم التحويل:</b> <code>${senderNumber}</code>
🆔 <b>رقم الطلب:</b> <code>${order.id}</code>

🔗 <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/project/_/editor/table/orders">رابط لوحة التحكم</a>
`;

      try {
        const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendPhoto`;
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            photo: screenshotUrl,
            caption: captionText,
            parse_mode: 'HTML',
          }),
        });

        const telegramRes = await response.json();
        if (!telegramRes.ok) {
          console.error('Telegram notification error:', telegramRes);
        }
      } catch (tgErr) {
        console.error('Failed to contact Telegram Bot:', tgErr);
      }
    } else {
      console.warn('Telegram Bot Credentials missing from environment');
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err: any) {
    console.error('Order API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
