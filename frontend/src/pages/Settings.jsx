import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleName = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', { name: nameForm.name });
      setUser(u => ({ ...u, name: data.name }));
      toast.success('تم تحديث الاسم');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ');
    } finally { setLoading(false); }
  };

  const handlePass = async e => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm) return toast.error('كلمتا المرور غير متطابقتين');
    if (passForm.new_password.length < 6) return toast.error('كلمة المرور أقل من 6 أحرف');
    setLoading(true);
    try {
      await api.patch('/users/me/password', { current_password: passForm.current_password, new_password: passForm.new_password });
      toast.success('تم تغيير كلمة المرور');
      setPassForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'كلمة المرور الحالية غير صحيحة');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">الإعدادات</h1>

      {/* Profile info */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-xl font-black mb-4">معلومات الحساب</h2>
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">البريد الإلكتروني</span><span className="font-bold">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">رقم الموبايل</span><span className="font-bold">{user?.phone}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">نوع الحساب</span>
            <span className="font-bold">{user?.role === 'advertiser' ? '📢 معلن' : user?.role === 'admin' ? '🛡️ أدمن' : '👷 عامل'}</span>
          </div>
          <div className="flex justify-between"><span className="text-gray-500">كود الإحالة</span><span className="font-bold text-green-600">{user?.referral_code}</span></div>
        </div>

        <form onSubmit={handleName} className="flex gap-3">
          <input value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })} required
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-green-500 outline-none"
            placeholder="الاسم الجديد" />
          <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50">
            تحديث
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-black mb-4">تغيير كلمة المرور</h2>
        <form onSubmit={handlePass} className="space-y-3">
          {[
            { key: 'current_password', label: 'كلمة المرور الحالية' },
            { key: 'new_password', label: 'كلمة المرور الجديدة' },
            { key: 'confirm', label: 'تأكيد كلمة المرور الجديدة' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-bold mb-1">{f.label}</label>
              <input type="password" required value={passForm[f.key]} onChange={e => setPassForm({ ...passForm, [f.key]: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}
