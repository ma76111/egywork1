import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Search } from 'lucide-react';

const CATEGORIES = ['الكل', 'سوشيال ميديا', 'يوتيوب', 'تطبيقات', 'تسجيل مواقع', 'تعليقات', 'تيليجرام', 'زيارة مواقع', 'تقييمات'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState('الكل');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = category !== 'الكل' ? `?category=${encodeURIComponent(category)}` : '';
    api.get(`/tasks${params}`).then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, [category]);

  const filtered = tasks.filter(t => t.title.includes(search) || t.description.includes(search));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">المهام المتاحة</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-4 top-3.5 text-gray-400" size={20}/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl pr-12 pl-4 py-3 focus:border-green-500 outline-none"
          placeholder="ابحث عن مهمة..." />
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${category === c ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-green-400'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-10 text-gray-400">جاري التحميل...</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(task => (
          <Link to={`/tasks/${task.id}`} key={task.id}
            className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition border-2 border-transparent hover:border-green-200">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">{task.category}</span>
              <span className="text-2xl font-black text-green-600">{task.reward} ج.م</span>
            </div>
            <h3 className="font-black text-lg mb-1">{task.title}</h3>
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{task.description}</p>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>المعلن: {task.advertiser_name}</span>
              <span>{task.filled_slots}/{task.total_slots} منفذ</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(task.filled_slots / task.total_slots) * 100}%` }}/>
            </div>
          </Link>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>لا توجد مهام متاحة حالياً</p>
        </div>
      )}
    </div>
  );
}
