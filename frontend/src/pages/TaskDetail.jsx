import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(undefined);
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    api.get(`/tasks/${id}`).then(r => setTask(r.data)).catch(() => setTask(null));
    if (user?.role === 'advertiser' || user?.role === 'admin') {
      api.get(`/tasks/${id}/submissions`).then(r => setSubmissions(r.data)).catch(() => {});
    }
  }, [id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!proof.trim()) return toast.error('أدخل إثبات الإتمام');
    setLoading(true);
    try {
      await api.post(`/tasks/${id}/submit`, { proof });
      toast.success('تم تقديم المهمة بنجاح! في انتظار المراجعة');
      navigate('/my-submissions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ');
    } finally { setLoading(false); }
  };

  const handleReview = async (subId, status) => {
    try {
      await api.patch(`/tasks/submissions/${subId}`, { status });
      toast.success(status === 'approved' ? 'تم القبول ودفع المكافأة' : 'تم الرفض');
      setSubmissions(s => s.map(x => x.id === subId ? {...x, status} : x));
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ');
    }
  };

  if (task === null) return <div className="text-center py-20 text-gray-400">المهمة غير موجودة</div>;
  if (!task) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{task.category}</span>
          <span className="text-3xl font-black text-green-600">{task.reward} ج.م</span>
        </div>
        <h1 className="text-2xl font-black mb-3">{task.title}</h1>
        <p className="text-gray-600 mb-4 leading-relaxed">{task.description}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
          <div>المعلن: <span className="font-bold">{task.advertiser_name}</span></div>
          <div>المنفذون: <span className="font-bold">{task.filled_slots}/{task.total_slots}</span></div>
          <div>نوع الإثبات: <span className="font-bold">{task.proof_type === 'screenshot' ? 'لقطة شاشة (رابط)' : task.proof_type === 'text' ? 'نص' : 'رابط'}</span></div>
        </div>
      </div>

      {/* Submit form - workers only */}
      {user?.role === 'worker' && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-black mb-4">تقديم إثبات الإتمام</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">
                {task.proof_type === 'screenshot' ? 'رابط لقطة الشاشة (imgbb.com أو غيره)' : 'الإثبات'}
              </label>
              <textarea value={proof} onChange={e => setProof(e.target.value)} rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 outline-none resize-none"
                placeholder={task.proof_type === 'screenshot' ? 'https://i.ibb.co/...' : 'اكتب الإثبات هنا'} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'جاري الإرسال...' : 'إرسال الإثبات'}
            </button>
          </form>
        </div>
      )}

      {/* Submissions review - advertiser */}
      {(user?.role === 'advertiser' || user?.role === 'admin') && submissions.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-black mb-4">التقديمات ({submissions.length})</h2>
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="border-2 border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{sub.worker_name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    sub.status === 'approved' ? 'bg-green-100 text-green-600' :
                    sub.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>{sub.status === 'approved' ? 'مقبول' : sub.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}</span>
                </div>
                <a href={sub.proof} target="_blank" rel="noreferrer" className="text-blue-500 text-sm underline break-all">{sub.proof}</a>
                {sub.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleReview(sub.id, 'approved')} className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl hover:bg-green-600">قبول ✓</button>
                    <button onClick={() => handleReview(sub.id, 'rejected')} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl hover:bg-red-600">رفض ✗</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
