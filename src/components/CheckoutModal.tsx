'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, Upload, ArrowLeft, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';

interface CheckoutModalProps {
  product: any;
  user: any;
  onClose: () => void;
}

export default function CheckoutModal({ product, user, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState(1);
  
  // Step 1 Form
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  
  // Step 2 Form
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  // Step 3 Form
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Payment Methods and User Info
  useEffect(() => {
    if (user) {
      setCustomerName(user.full_name || '');
      setCustomerWhatsapp(user.whatsapp || '');
    }

    const fetchPaymentMethods = async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setPaymentMethods(data);
        setSelectedMethod(data[0]);
      }
    };

    fetchPaymentMethods();
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const uploadScreenshot = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmitOrder = async () => {
    if (!screenshotFile) {
      setErrorMsg('يرجى إرفاق إثبات الدفع (سكرين شوت).');
      return;
    }
    if (!senderNumber) {
      setErrorMsg('يرجى كتابة الرقم الذي قمت بالتحويل منه.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Upload Screenshot
      setUploading(true);
      const url = await uploadScreenshot(screenshotFile);
      setScreenshotUrl(url);
      setUploading(false);

      // 2. Submit to API Route
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          customerName,
          customerWhatsapp,
          paymentMethod: selectedMethod.name,
          screenshotUrl: url,
          senderNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'حدث خطأ أثناء تقديم الطلب.');
      }

      setStep(4); // Success step
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '20px' }}>شراء: {product.title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {step < 4 && (
          <div className="steps-indicator">
            <div className={`step-node ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              1. البيانات
            </div>
            <div className={`step-node ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              2. الدفع
            </div>
            <div className={`step-node ${step === 3 ? 'active' : ''}`}>
              3. التأكيد
            </div>
          </div>
        )}

        <div className="modal-body">
          {errorMsg && (
            <div style={{ border: 'var(--border-thick)', backgroundColor: '#ffe2e5', color: '#f1416c', padding: '12px', marginBottom: '16px', fontWeight: 'bold' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1: CONTACT DETAILS */}
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">الاسم بالكامل</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">رقم الواتساب</label>
                <input
                  type="text"
                  className="form-control"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  placeholder="مثال: 01012345678"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!customerName || !customerWhatsapp) {
                      setErrorMsg('يرجى ملء جميع الحقول المطلوبة');
                    } else {
                      setErrorMsg('');
                      setStep(2);
                    }
                  }}
                >
                  <span>التالي</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div>
              <label className="form-label" style={{ marginBottom: '12px' }}>اختر وسيلة الدفع المناسبة لك:</label>
              
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method-item ${selectedMethod?.id === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method)}
                >
                  <span style={{ fontWeight: 'bold' }}>{method.name}</span>
                  {selectedMethod?.id === method.id && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓ مُحدد</span>}
                </div>
              ))}

              {selectedMethod && (
                <div style={{ marginTop: '20px' }}>
                  <label className="form-label">بيانات التحويل الخاصة بالوسيلة:</label>
                  <div className="payment-details-box">
                    <span className="copy-text">{selectedMethod.details}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleCopy(selectedMethod.details)}
                      style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
                      <span>{copied ? 'تم النسخ!' : 'نسخ الرقم'}</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    قم بتحويل المبلغ المطلوب (<b>{product.price} ج.م</b>) إلى الحساب أعلاه، ثم اضغط على زر التالي لتأكيد التحويل وإرفاق الإيصال.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowRight size={16} />
                  <span>السابق</span>
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                  disabled={!selectedMethod}
                >
                  <span>التالي</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SCREENSHOT & SENDER NUMBER */}
          {step === 3 && (
            <div>
              <div className="form-group">
                <label className="form-label">إرفاق إثبات الدفع (سكرين شوت التحويل) *</label>
                <div className="file-upload-area">
                  <Upload size={32} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                  <p style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {screenshotFile ? screenshotFile.name : 'اضغط هنا أو اسحب الصورة لإرفاق الإيصال'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PNG, JPG, WEBP حتى 5 ميجابايت</p>
                  <input
                    type="file"
                    className="file-upload-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                {screenshotFile && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: 'green', fontWeight: 'bold' }}>تم تحميل ملف الإثبات</p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">الرقم الذي قمت بالتحويل منه *</label>
                <input
                  type="text"
                  className="form-control"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="مثال: 01012345678 أو اسم الحساب المحول منه"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                >
                  <ArrowRight size={16} />
                  <span>السابق</span>
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  <span>{submitting ? 'جاري إرسال الطلب...' : 'إرسال الطلب وإتمام العملية'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '72px', color: 'green', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>تم إرسال طلبك بنجاح!</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                طلبك الآن قيد المراجعة من قبل الإدارة وسوف يصلك إشعار بالقبول أو الرفض قريباً.
                عند اكتمال الطلب بنجاح، سيتم إرسال حسابك الجديد أو تفاصيل الخدمة إلى <b>صندوق الوارد</b> الخاص بك في حسابك.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <a href="/dashboard" className="btn btn-primary">
                  <span>صندوق الطلبات والوارد</span>
                </a>
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  <span>إغلاق</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
