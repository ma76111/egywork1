import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, Mail, Send } from 'lucide-react';

export default function Verify() {
  const [status, setStatus] = useState({ email_verified: 0, phone_verified: 0, telegram_linked: false });
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [sending, setSending] = useState({ email: false, phone: false });
  const [confirming, setConfirming] = useState({ email: false, phone: false });
  const [sentEmail, setSentEmail] = useState(false);
  const [countdown, setCountdown] = useState({ email: 0, phone: 0 });
  const [telegramLink, setTelegramLink] = useState('');
  const [telegramSent, setTelegramSent] = useState(false);

  useEffect(() => {
    api.get('/verify/status').then(r => setStatus(r.data));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => ({ email: c.email > 0 ? c.email - 1 : 0, phone: c.phone > 0 ? c.phone - 1 : 0 }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendEmailCode = async () => {
    setSending(s => ({ ...s, email: true }));
    try {
      await api.post('/verify/send-email');
      toast.success('تم إرسال الكود على بريدك');
      setSentEmail(true);
      setCountdown(c => ({ ...c, email: 120 }));
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ'); }
    finally { setSending(s => ({ ...s, email: false })); }
  };

  const getTelegramLink = async () => {
    setSending(s => ({ ...s, phone: true }));
    try {
      const { data } = await api.get('/verify/telegram-link');
      setTelegramLink(data.botLink);
      setTelegramSent(true);
      setCountdown(c => ({ ...c, phone: 120 }));
      window.open(data.botLink, '_blank');
      toast.success('افتح البوت وابعتله /start');
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ'); }
    finally { setSending(s => ({ ...s, phone: false })); }
  };

  const confirmCode = async (type) => {
    const code = type === 'email' ? emailCode : phoneCode;
    if (code.length !== 6) return toast.error('الكود 6 أرقام');
    setConfirming(c => ({ ...c, [type]: true }));
    try {
      await api.post('/verify/confirm', { code, type });
      toast.success(type === 'email' ? 'تم تأكيد البريد ✓' : 'تم تأكيد الهاتف ✓');
      setStatus(s => ({ ...s, [`${type}_verified`]: 1 }));
    } catch (err) { toast.error(err.response?.data?.message || 'كود غير صحيح'); }
    finally { setConfirming(c => ({ ...c, [type]: false })); }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-2">تأكيد الحساب</h1>
      <p className="text-gray-500 mb-6">أكد بريدك ورقم هاتفك لرفع حد السحب وزيادة الثقة</p>

      <div className="space-y-4">

        {/* البريد الإلكتروني */}
        <div className={`bg-white rounded-2xl shadow p-6 border-2 ${status.email_verified ? 'border-green-400' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${status.email_verified ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Mail size={22} className={status.email_verified ? 'text-green-600' : 'text-gray-500'} />
              </div>
              <div>
                <div className="font-black">البريد الإلكتروني</div>
                <div className="text-sm text-gray-400">كود يُرسل على بريدك</div>
              </div>
            </div>
            {status.email_verified
              ? <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle size={18}/>مؤكد</span>
              : <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full">غير مؤكد</span>}
          </div>
          {!status.email_verified && (
            <div className="space-y-3">
              <button onClick={sendEmailCode} disabled={sending.email || countdown.email > 0}
                className="w-full border-2 border-green-500 text-green-600 font-bold py-2 rounded-xl hover:bg-green-50 disabled:opacity-50 transition">
                {sending.email ? 'جاري الإرسال...' : countdown.email > 0 ? `إعادة الإرسال بعد ${countdown.email}ث` : 'إرسال كود التأكيد'}
              </button>
              {sentEmail && (
                <div className="flex gap-2">
                  <input value={emailCode} onChange={e => setEmailCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-center text-2xl font-black tracking-widest focus:border-green-500 outline-none"
                    placeholder="000000" maxLength={6} />
                  <button onClick={() => confirmCode('email')} disabled={confirming.email || emailCode.length !== 6}
                    className="bg-green-600 text-white font-bold px-5 rounded-xl hover:bg-green-700 disabled:opacity-50">
                    {confirming.email ? '...' : 'تأكيد'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* رقم الهاتف عبر تيليجرام */}
        <div className={`bg-white rounded-2xl shadow p-6 border-2 ${status.phone_verified ? 'border-green-400' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${status.phone_verified ? 'bg-green-100' : 'bg-blue-50'}`}>
                <Send size={22} className={status.phone_verified ? 'text-green-600' : 'text-blue-500'} />
              </div>
              <div>
                <div className="font-black">رقم الهاتف</div>
                <div className="text-sm text-gray-400">تأكيد عبر بوت تيليجرام</div>
              </div>
            </div>
            {status.phone_verified
              ? <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle size={18}/>مؤكد</span>
              : <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full">غير مؤكد</span>}
          </div>
          {!status.phone_verified && (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                📱 هتفتح بوت تيليجرام، ابعتله <b>/start</b> وهيبعتلك الكود هنا
              </div>
              <button onClick={getTelegramLink} disabled={sending.phone || countdown.phone > 0}
                className="w-full bg-blue-500 text-white font-bold py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2">
                <Send size={16}/>
                {sending.phone ? 'جاري الفتح...' : countdown.phone > 0 ? `إعادة المحاولة بعد ${countdown.phone}ث` : 'فتح بوت تيليجرام'}
              </button>
              {telegramLink && (
                <a href={telegramLink} target="_blank" rel="noreferrer"
                  className="block text-center text-blue-500 text-sm underline">
                  اضغط هنا لو البوت ما فتحش تلقائياً
                </a>
              )}
              {telegramSent && (
                <div className="flex gap-2">
                  <input value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-center text-2xl font-black tracking-widest focus:border-green-500 outline-none"
                    placeholder="000000" maxLength={6} />
                  <button onClick={() => confirmCode('phone')} disabled={confirming.phone || phoneCode.length !== 6}
                    className="bg-green-600 text-white font-bold px-5 rounded-xl hover:bg-green-700 disabled:opacity-50">
                    {confirming.phone ? '...' : 'تأكيد'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
