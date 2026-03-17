import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success('أهلاً بك!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-black text-center text-green-700 mb-6">تسجيل الدخول</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">البريد الإلكتروني</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="example@email.com" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">كلمة المرور</label>
            <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-500">مش عندك حساب؟ <Link to="/register" className="text-green-600 font-bold">سجل الآن</Link></p>
      </div>
    </div>
  );
}
