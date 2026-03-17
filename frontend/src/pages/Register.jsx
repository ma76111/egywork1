import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: params.get('role') || 'worker',
    referral_code: params.get('ref') || ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      toast.success('تم إنشاء حسابك بنجاح!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-black text-center text-green-700 mb-6">إنشاء حساب جديد</h1>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          {[{v:'worker',l:'👷 عامل - اكسب من المهام'},{v:'advertiser',l:'📢 معلن - انشر مهامك'}].map(r => (
            <button key={r.v} type="button" onClick={() => setForm({...form, role: r.v})}
              className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition ${form.role === r.v ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
              {r.l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'الاسم الكامل', type: 'text', placeholder: 'محمد أحمد' },
            { key: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'example@email.com' },
            { key: 'phone', label: 'رقم الموبايل', type: 'tel', placeholder: '01xxxxxxxxx' },
            { key: 'password', label: 'كلمة المرور', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-bold mb-1">{f.label}</label>
              <input type={f.type} required value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-bold mb-1">كود الإحالة (اختياري)</label>
            <input type="text" value={form.referral_code} onChange={e => setForm({...form, referral_code: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="XXXXXXXX" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
            {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-500">عندك حساب؟ <Link to="/login" className="text-green-600 font-bold">سجل دخولك</Link></p>
      </div>
    </div>
  );
}
