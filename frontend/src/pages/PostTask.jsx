import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['سوشيال ميديا', 'يوتيوب', 'تطبيقات', 'تسجيل مواقع', 'تعليقات', 'تيليجرام', 'زيارة مواقع', 'تقييمات'];

export default function PostTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'سوشيال ميديا',
    proof_type: 'screenshot', reward: '', total_slots: ''
  });
  const [loading, setLoading] = useState(false);

  const totalCost = (parseFloat(form.reward) || 0) * (parseInt(form.total_slots) || 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (totalCost > user.balance) {
      return toast.error(`رصيدك غير كافٍ. المطلوب: ${totalCost} ج.م`);
    }
    setLoading(true);
    try {
      await api.post('/tasks', form);
      toast.success('تم نشر المهمة بنجاح!');
      navigate('/tasks');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">نشر مهمة جديدة</h1>

      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between">
          <span className="font-bold">رصيدك الحالي:</span>
          <span className="font-black text-green-700">{user?.balance?.toFixed(2)} ج.م</span>
        </div>
        {totalCost > 0 && (
          <div className="flex justify-between mt-1">
            <span className="font-bold">التكلفة الإجمالية:</span>
            <span className={`font-black ${totalCost > user?.balance ? 'text-red-600' : 'text-gray-700'}`}>{totalCost.toFixed(2)} ج.م</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">عنوان المهمة</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
              placeholder="مثال: اشترك في قناة يوتيوب" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">وصف المهمة والتعليمات</label>
            <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none resize-none"
              placeholder="اشرح المهمة بالتفصيل وما المطلوب من العامل..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">الفئة</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">نوع الإثبات</label>
              <select value={form.proof_type} onChange={e => setForm({...form, proof_type: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none bg-white">
                <option value="screenshot">لقطة شاشة</option>
                <option value="link">رابط</option>
                <option value="text">نص</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">المكافأة لكل منفذ (ج.م)</label>
              <input type="number" required min="0.5" step="0.5" value={form.reward} onChange={e => setForm({...form, reward: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">عدد المنفذين</label>
              <input type="number" required min="1" value={form.total_slots} onChange={e => setForm({...form, total_slots: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="100" />
            </div>
          </div>
          <button type="submit" disabled={loading || totalCost > user?.balance}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
            {loading ? 'جاري النشر...' : `نشر المهمة (${totalCost.toFixed(2)} ج.م)`}
          </button>
        </form>
      </div>
    </div>
  );
}
