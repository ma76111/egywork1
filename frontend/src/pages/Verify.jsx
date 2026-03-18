import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, Mail, Phone } from 'lucide-react';

export default function Verify() {
  const [status, setStatus] = useState({ email_verified: 0, phone_verified: 0 });
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [sending, setSending] = useState({ email: false, phone: false });
  const [confirming, setConfirming] = useState({ email: false, phone: false });
  const [sent, setSent] = useState({ email: false, phone: false });
  const [countdown, setCountdown] = useState({ email: 0, phone: 0 });

  useEffect(() => {
    api.get('/verify/status').then(r => setStatus(r.data));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => ({
        email: c.email > 0 ? c.email - 1 : 0,
        phone: c.phone > 0 ? c.phone - 1 : 0,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendCode = async (type) => {
    setSending(s => ({ ...s, [type]: true }));
    try {
      await api.post(`/verify/send-${type}`);
      toast.success(type === 'email' ? 'تم إرسال الكود على بريدك' : 'تم إرسال الكود على موبايلك');
      setSent(s => ({ ...s, [type]: true }));
      setCountdown(c => ({ ...c, [type]: 120 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ في الإرسال');
    } finally { setSending(s => ({ ...s, [type]: false })); }
  };

  const confirmCode = async (type) => {
    const code = type === 'email' ? emailCode : phoneCode;
    if (code.length !== 6) return toast.error('الكود 6 أرقام');
    setConfirming(c => ({ ...c, [type]: true }));
    try {
      await api.post('/verify/confirm', { code, type });
      toast.success(type === 'email' ? 'تم تأكيد البريد ✓' : 'تم تأكيد الهاتف ✓');
      setStatus(s => ({ ...s, [`${type}_verified`]: 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'كود غير صحيح');
    } finally { setConfirming(c => ({ ...c, [type]: false })); }
  };

  const VerifyCard = ({ type, icon, title, subtitle, verified, code, setCode }) => (
    <div className={`bg-white rounded-2xl shadow p-6 border-2 ${verified ? 'border-green-400' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${verified ? 'bg-green-100' : 'bg-gray-100'}`}>{icon}</div>
          <div>
            <div className="font-black">{title}</div>
            <div className="text-sm text-gray-400">{subtitle}</div>
          </div>
        </div>
        {verified
          ? <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle size={18}/>مؤكد</span>
          : <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full">غير مؤكد</span>
        }
      </div>

      {!verified && (
        <div className="space-y-3">
          <button onClick={() => sendCode(type)} disabled={sending[type] || countdown[type] > 0}
            className="w-full border-2 border-green-500 text-green-600 font-bold py-2 rounded-xl hover:bg-green-50 disabled:opacity-50 transition">
            {sending[type] ? 'جاري الإرسال...' : countdown[type] > 0 ? `إعادة الإرسال بعد ${countdown[type]}ث` : 'إرسال كود التأكيد'}
          </button>
          {sent[type] && (
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-center text-2xl font-black tracking-widest focus:border-green-500 outline-none"
                placeholder="000000" maxLength={6} />
              <button onClick={() => confirmCode(type)} disabled={confirming[type] || code.length !== 6}
                className="bg-green-600 text-white font-bold px-5 rounded-xl hover:bg-green-700 disabled:opacity-50">
                {confirming[type] ? '...' : 'تأكيد'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-2">تأكيد الحساب</h1>
      <p className="text-gray-500 mb-6">أكد بريدك ورقم هاتفك لرفع حد السحب وزيادة الثقة</p>

      <div className="space-y-4">
        <VerifyCard
          type="email"
          icon={<Mail size={22} className={status.email_verified ? 'text-green-600' : 'text-gray-500'} />}
          title="البريد الإلكتروني"
          subtitle="تأكيد عبر كود يُرسل للبريد"
          verified={status.email_verified}
          code={emailCode}
          setCode={setEmailCode}
        />
        <VerifyCard
          type="phone"
          icon={<Phone size={22} className={status.phone_verified ? 'text-green-600' : 'text-gray-500'} />}
          title="رقم الموبايل"
          subtitle="تأكيد عبر SMS"
          verified={status.phone_verified}
          code={phoneCode}
          setCode={setPhoneCode}
        />
      </div>

      {status.email_verified && status.phone_verified && (
        <div className="mt-6 bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="font-black text-green-700">حسابك مؤكد بالكامل!</div>
          <div className="text-sm text-green-600">يمكنك الآن الاستفادة من جميع مميزات الموقع</div>
        </div>
      )}
    </div>
  );
}
