import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Wallet, ListTodo, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/my-tasks').then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const totalSpent = tasks.reduce((s, t) => s + (t.reward * t.filled_slots), 0);
  const activeTasks = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.filled_slots >= t.total_slots).length;

  const pauseTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await api.patch(`/tasks/${id}/status`, { status: newStatus });
    setTasks(t => t.map(x => x.id === id ? { ...x, status: newStatus } : x));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">لوحة المعلن</h1>
        <Link to="/post-task" className="flex items-center gap-2 bg-green-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700 transition">
          <PlusCircle size={18} /> نشر مهمة جديدة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Wallet className="text-green-600" size={26} />, label: 'رصيدك', value: `${user?.balance?.toFixed(2)} ج.م`, bg: 'bg-green-50' },
          { icon: <ListTodo className="text-blue-500" size={26} />, label: 'إجمالي المهام', value: tasks.length, bg: 'bg-blue-50' },
          { icon: <CheckCircle className="text-purple-500" size={26} />, label: 'مهام نشطة', value: activeTasks, bg: 'bg-purple-50' },
          { icon: <Wallet className="text-orange-500" size={26} />, label: 'إجمالي الإنفاق', value: `${totalSpent.toFixed(2)} ج.م`, bg: 'bg-orange-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-4 flex items-center gap-3`}>
            {c.icon}
            <div>
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-xl font-black">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* شحن الرصيد */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-5 mb-8 flex items-center justify-between">
        <div>
          <div className="font-black text-lg">رصيدك: {user?.balance?.toFixed(2)} ج.م</div>
          <div className="text-green-100 text-sm">اشحن رصيدك لنشر مهام جديدة</div>
        </div>
        <Link to="/finance" className="bg-white text-green-700 font-bold px-5 py-2 rounded-xl hover:bg-green-50 transition">
          شحن الرصيد
        </Link>
      </div>

      {/* قائمة المهام */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-black mb-4">مهامي المنشورة</h2>
        {loading && <div className="text-center py-8 text-gray-400">جاري التحميل...</div>}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p>لم تنشر أي مهام بعد</p>
            <Link to="/post-task" className="inline-block mt-4 bg-green-600 text-white font-bold px-6 py-2 rounded-xl">انشر أول مهمة</Link>
          </div>
        )}
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="border-2 border-gray-100 rounded-xl p-4 hover:border-green-200 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-black">{task.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{task.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    task.status === 'active' ? 'bg-green-100 text-green-600' :
                    task.status === 'paused' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {task.status === 'active' ? '🟢 نشطة' : task.status === 'paused' ? '⏸ موقوفة' : '✅ مكتملة'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((task.filled_slots / task.total_slots) * 100, 100)}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-600">{task.filled_slots}/{task.total_slots}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  المكافأة: <span className="font-bold text-green-600">{task.reward} ج.م</span> للمنفذ
                </div>
                <div className="flex gap-2">
                  <Link to={`/tasks/${task.id}`} className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg hover:bg-blue-100">
                    مراجعة التقديمات
                  </Link>
                  {task.status !== 'completed' && task.filled_slots < task.total_slots && (
                    <button onClick={() => pauseTask(task.id, task.status)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg ${task.status === 'active' ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {task.status === 'active' ? '⏸ إيقاف' : '▶ تشغيل'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
