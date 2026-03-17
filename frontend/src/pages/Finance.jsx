import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const METHODS = [
  { value: 'fawry', label: '💳 فوري', desc: 'ادفع في أي فرع فوري' },
  { value: 'vodafone_cash', label: '📱 فودافون كاش', desc: 'تحويل فوري لمحفظتك' },
  { value: 'instapay', label: '🏦 إنستاباي', desc: 'تحويل بنكي سريع' },
  { value: 'bank', label: '🏛️ تحويل بنكي', desc: 'تحويل لحسابك البنكي' },
];

export default function Finance() {
  const { user } = useAuth();
  const [tab, setTab] = useState('withdraw');
  const [form, setForm] = useState({ amount: '', method: 'vodafone_cash', account_number: '' });
  const [depositForm, setDepositForm] = useState({ amount: '', method: 'fawry', reference: '' });
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/finance/withdraw', form);
      toast.success('تم تقديم طلب السحب بنجاح!');
      setForm({ amount: '', method: 'vodafone_cash', account_number: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ');
    } finally { setLoading(false); }
  };

  const handleDeposit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/finance/deposit', depositForm);
      toast.success('تم تسجيل طلب الإيداع! سيتم التفعيل بعد التحقق');
      setDepositForm({ amount: '', method: 'fawry', reference: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ');
    } finally { setLoading(false); }
  };

  const minWithdraw = user?.level >= 5 ? 20 : user?.level >= 3 ? 50 : 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">المالية</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-6 mb-6">
        <div className="text-green-100 mb-1">رصيدك الحالي</div>
        <div className="text-4xl font-black">{user?.balance?.toFixed(2)} ج.م</div>
        <div className="text-green-200 text-sm mt-2">الحد الأدنى للسحب: {minWithdraw} ج.م (المستوى {user?.level})</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{v:'withdraw',l:'سحب'},{v:'deposit',l:'إيداع'}].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`flex-1 py-3 rounded-xl font-bold transition ${tab === t.v ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'withdraw' && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-black mb-4">طلب سحب</h2>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">طريقة الاستلام</label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setForm({...form, method: m.value})}
                    className={`p-3 rounded-xl border-2 text-right transition ${form.method === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="font-bold text-sm">{m.label}</div>
                    <div className="text-xs text-gray-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">رقم المحفظة / الحساب</label>
              <input required value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">المبلغ (ج.م)</label>
              <input type="number" required min={minWithdraw} max={user?.balance} value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                placeholder={`الحد الأدنى ${minWithdraw} ج.م`} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'جاري الإرسال...' : 'تقديم طلب السحب'}
            </button>
          </form>
        </div>
      )}

      {tab === 'deposit' && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-black mb-2">إيداع رصيد</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-700">
            ⚠️ حول المبلغ على الرقم: <span className="font-black">01000000000</span> ثم أدخل رقم العملية هنا
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">طريقة الدفع</label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setDepositForm({...depositForm, method: m.value})}
                    className={`p-3 rounded-xl border-2 text-right transition ${depositForm.method === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="font-bold text-sm">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">المبلغ (ج.م)</label>
              <input type="number" required min="10" value={depositForm.amount}
                onChange={e => setDepositForm({...depositForm, amount: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="الحد الأدنى 10 ج.م" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">رقم العملية / المرجع</label>
              <input required value={depositForm.reference} onChange={e => setDepositForm({...depositForm, reference: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none" placeholder="رقم العملية من التطبيق" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'جاري الإرسال...' : 'تقديم طلب الإيداع'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
