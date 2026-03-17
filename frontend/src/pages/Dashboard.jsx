import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Wallet, Star, Users, TrendingUp, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    api.get('/finance/balance').then(r => setBalance(r.data));
    api.post('/users/update-level').then(r => {
      if (r.data.level !== user?.level) setUser(u => ({...u, level: r.data.level}));
    });
  }, []);

  const copyRef = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referral_code}`);
    toast.success('تم نسخ رابط الإحالة!');
  };

  const levelNames = { 1: 'مبتدئ', 2: 'نشيط', 3: 'محترف', 4: 'خبير', 5: 'نجم' };
  const levelColors = { 1: 'bg-gray-100 text-gray-600', 2: 'bg-blue-100 text-blue-600', 3: 'bg-purple-100 text-purple-600', 4: 'bg-orange-100 text-orange-600', 5: 'bg-yellow-100 text-yellow-600' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">أهلاً، {user?.name} 👋</h1>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${levelColors[user?.level || 1]}`}>
            ⭐ المستوى {user?.level}: {levelNames[user?.level || 1]}
          </span>
        </div>
        <Link to="/tasks" className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition">
          ابدأ الكسب الآن
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Wallet className="text-green-600" size={28}/>, label: 'رصيدك', value: `${balance?.balance?.toFixed(2) || '0.00'} ج.م`, bg: 'bg-green-50' },
          { icon: <Star className="text-yellow-500" size={28}/>, label: 'نقاطك', value: balance?.points || 0, bg: 'bg-yellow-50' },
          { icon: <Users className="text-blue-500" size={28}/>, label: 'إحالاتك', value: user?.referrals_count || 0, bg: 'bg-blue-50' },
          { icon: <TrendingUp className="text-purple-500" size={28}/>, label: 'مستواك', value: `${user?.level || 1} / 5`, bg: 'bg-purple-50' },
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

      {/* Referral */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-black mb-2">🎁 برنامج الإحالة</h2>
        <p className="text-green-100 mb-4">ادعو أصحابك واكسب 5% من كل مهمة بيعملوها</p>
        <div className="flex gap-2">
          <input readOnly value={`${window.location.origin}/register?ref=${user?.referral_code}`}
            className="flex-1 bg-green-700 text-white rounded-xl px-4 py-2 text-sm outline-none" />
          <button onClick={copyRef} className="bg-white text-green-700 font-bold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-green-50">
            <Copy size={16}/> نسخ
          </button>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-black mb-4">آخر المعاملات</h2>
        {balance?.transactions?.length === 0 && <p className="text-gray-400 text-center py-4">لا توجد معاملات بعد</p>}
        <div className="space-y-3">
          {balance?.transactions?.slice(0, 10).map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <div className="font-bold text-sm">{tx.note}</div>
                <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
              <div className={`font-black text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount?.toFixed(2)} ج.م
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
