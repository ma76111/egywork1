import { Link } from 'react-router-dom';
import { Coins, Megaphone, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 text-white py-20 px-4 text-center">
        <h1 className="text-5xl font-black mb-4">اكسب من الإنترنت بمهام بسيطة</h1>
        <p className="text-xl mb-8 text-green-100">اشترك في قنوات، اعمل لايك، سجل في مواقع واكسب فلوس حقيقية على محفظتك المصرية</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/register" className="bg-white text-green-700 font-bold px-8 py-3 rounded-full text-lg hover:bg-green-50 transition">ابدأ الكسب مجاناً</Link>
          <Link to="/register?role=advertiser" className="border-2 border-white text-white font-bold px-8 py-3 rounded-full text-lg hover:bg-green-600 transition">انشر مهامك</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-10 shadow">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center px-4">
          {[
            { label: 'مستخدم نشط', value: '10,000+', icon: '👥' },
            { label: 'مهمة منجزة', value: '500,000+', icon: '✅' },
            { label: 'جنيه تم صرفه', value: '2,000,000+', icon: '💰' },
            { label: 'معلن موثوق', value: '1,500+', icon: '📢' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-green-700">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-10 text-gray-800">إزاي بيشتغل؟</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Users size={40} className="text-green-600"/>, title: 'سجل مجاناً', desc: 'أنشئ حسابك في ثواني بدون أي رسوم' },
            { icon: <ListTodo size={40} className="text-green-600"/>, title: 'نفذ مهام', desc: 'اختار من مئات المهام المتاحة وابدأ الكسب فوراً' },
            { icon: <Coins size={40} className="text-green-600"/>, title: 'اسحب فلوسك', desc: 'اسحب أرباحك على فوري أو فودافون كاش أو إنستاباي' },
          ].map(s => (
            <div key={s.title} className="bg-white rounded-2xl p-6 shadow text-center hover:shadow-lg transition">
              <div className="flex justify-center mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-green-50 py-16 px-4">
        <h2 className="text-3xl font-black text-center mb-10 text-gray-800">أنواع المهام</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '📱', name: 'سوشيال ميديا' },
            { emoji: '▶️', name: 'يوتيوب' },
            { emoji: '📲', name: 'تطبيقات' },
            { emoji: '📝', name: 'تسجيل مواقع' },
            { emoji: '⭐', name: 'تقييمات' },
            { emoji: '💬', name: 'تعليقات' },
            { emoji: '🔗', name: 'زيارة مواقع' },
            { emoji: '📣', name: 'تيليجرام' },
          ].map(c => (
            <Link to="/tasks" key={c.name} className="bg-white rounded-xl p-4 text-center shadow hover:shadow-md hover:bg-green-100 transition">
              <div className="text-3xl mb-2">{c.emoji}</div>
              <div className="font-bold text-gray-700">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Payment methods */}
      <section className="py-16 px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black mb-4 text-gray-800">طرق الدفع المصرية</h2>
        <p className="text-gray-500 mb-8">اسحب فلوسك بأسرع الطرق المصرية</p>
        <div className="flex justify-center gap-6 flex-wrap text-lg font-bold">
          {['💳 فوري', '📱 فودافون كاش', '🏦 إنستاباي', '🏛️ تحويل بنكي'].map(m => (
            <span key={m} className="bg-white border-2 border-green-200 px-6 py-3 rounded-full shadow">{m}</span>
          ))}
        </div>
      </section>

      <footer className="bg-green-800 text-white text-center py-6 text-sm">
        <p>© 2026 إيجي وورك - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

// Fix missing import
function ListTodo({ size, className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9l3 3-3 3"/></svg>;
}
