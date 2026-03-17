import { useEffect, useState } from 'react';
import api from '../api';

const statusMap = {
  pending: { label: 'قيد المراجعة', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'مقبول ✓', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'مرفوض ✗', cls: 'bg-red-100 text-red-700' },
};

export default function MySubmissions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/my-submissions').then(r => setSubs(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">مهامي المقدمة</h1>
      {subs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p>لم تقدم أي مهام بعد</p>
        </div>
      )}
      <div className="space-y-4">
        {subs.map(sub => (
          <div key={sub.id} className="bg-white rounded-2xl shadow p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-lg">{sub.title}</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusMap[sub.status]?.cls}`}>
                {statusMap[sub.status]?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>الفئة: {sub.category}</span>
              <span className="font-bold text-green-600">{sub.reward} ج.م</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(sub.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
