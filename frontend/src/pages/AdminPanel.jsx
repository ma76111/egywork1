import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('stats');

  const loadDeposits = () =>
    api.get('/finance/admin/withdrawals?type=deposit').catch(() => {})
      .then(() => api.get('/finance/admin/deposits').then(r => setDeposits(r.data)).catch(() => {}));

  useEffect(() => {
    api.get('/finance/admin/stats').then(r => setStats(r.data));
    api.get('/finance/admin/withdrawals').then(r => setWithdrawals(r.data));
    api.get('/finance/admin/deposits').then(r => setDeposits(r.data)).catch(() => {});
    api.get('/users/admin/users').then(r => setUsers(r.data));
  }, []);

  const handleWithdrawal = async (id, status) => {
    try {
      await api.patch(`/finance/admin/transactions/${id}`, { status });
      toast.success(status === 'completed' ? 'تم الموافقة' : 'تم الرفض');
      setWithdrawals(w => w.filter(x => x.id !== id));
    } catch { toast.error('خطأ'); }
  };

  const handleDeposit = async (id) => {
    try {
      await api.patch(`/finance/admin/deposits/${id}`);
      toast.success('تم تفعيل الإيداع');
      setDeposits(d => d.filter(x => x.id !== id));
    } catch { toast.error('خطأ'); }
  };

  const handleBalanceAdjust = async (userId, amount) => {
    try {
      await api.patch(`/users/admin/users/${userId}/balance`, { amount });
      toast.success('تم تعديل الرصيد');
      setUsers(u => u.map(x => x.id === userId ? { ...x, balance: parseFloat(x.balance) + parseFloat(amount) } : x));
    } catch { toast.error('خطأ'); }
  };

  const tabs = [
    { v: 'stats', l: 'الإحصائيات' },
    { v: 'withdrawals', l: `السحوبات (${withdrawals.length})` },
    { v: 'deposits', l: `الإيداعات (${deposits.length})` },
    { v: 'users', l: 'المستخدمون' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">🛡️ لوحة الأدمن</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`px-5 py-2 rounded-xl font-bold transition ${tab === t.v ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'المستخدمون', value: stats.users, emoji: '👥' },
            { label: 'المهام', value: stats.tasks, emoji: '📋' },
            { label: 'سحوبات معلقة', value: `${stats.pendingWithdrawals?.count} (${Number(stats.pendingWithdrawals?.total || 0).toFixed(0)} ج.م)`, emoji: '💸' },
            { label: 'إيداعات معلقة', value: stats.pendingDeposits?.count, emoji: '💰' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow p-5 text-center">
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="space-y-4">
          {withdrawals.length === 0 && <p className="text-center text-gray-400 py-10">لا توجد طلبات سحب معلقة</p>}
          {withdrawals.map(w => (
            <div key={w.id} className="bg-white rounded-2xl shadow p-5">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-black">{w.name} - {w.phone}</div>
                  <div className="text-sm text-gray-500">{w.method} → {w.reference}</div>
                  <div className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
                <div className="text-2xl font-black text-red-500">{Math.abs(w.amount).toFixed(2)} ج.م</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleWithdrawal(w.id, 'completed')} className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl hover:bg-green-600">تم الدفع ✓</button>
                <button onClick={() => handleWithdrawal(w.id, 'rejected')} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl hover:bg-red-600">رفض ✗</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'deposits' && (
        <div className="space-y-4">
          {deposits.length === 0 && <p className="text-center text-gray-400 py-10">لا توجد إيداعات معلقة</p>}
          {deposits.map(d => (
            <div key={d.id} className="bg-white rounded-2xl shadow p-5">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-black">{d.name} - {d.phone}</div>
                  <div className="text-sm text-gray-500">{d.method} | مرجع: {d.reference}</div>
                  <div className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('ar-EG')}</div>
                </div>
                <div className="text-2xl font-black text-green-600">+{Number(d.amount).toFixed(2)} ج.م</div>
              </div>
              <button onClick={() => handleDeposit(d.id)} className="w-full bg-green-500 text-white font-bold py-2 rounded-xl hover:bg-green-600">
                تفعيل الإيداع ✓
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['الاسم', 'الهاتف', 'الدور', 'الرصيد', 'المستوى', 'تاريخ التسجيل'].map(h => (
                  <th key={h} className="px-4 py-3 text-right font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-600' : u.role === 'advertiser' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {u.role === 'admin' ? 'أدمن' : u.role === 'advertiser' ? 'معلن' : 'عامل'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">{Number(u.balance).toFixed(2)} ج.م</td>
                  <td className="px-4 py-3">{u.level}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
