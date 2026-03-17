import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ListTodo, Wallet, PlusCircle, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-green-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-wide">🇪🇬 إيجي وورك</Link>
        <div className="flex items-center gap-4 text-sm font-semibold">
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-1 hover:text-green-200"><LayoutDashboard size={16}/>لوحتي</Link>
              <Link to="/tasks" className="flex items-center gap-1 hover:text-green-200"><ListTodo size={16}/>المهام</Link>
              <Link to="/finance" className="flex items-center gap-1 hover:text-green-200"><Wallet size={16}/>المالية</Link>
              {(user.role === 'advertiser' || user.role === 'admin') && (
                <Link to="/post-task" className="flex items-center gap-1 hover:text-green-200"><PlusCircle size={16}/>نشر مهمة</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-1 hover:text-yellow-300"><ShieldCheck size={16}/>الأدمن</Link>
              )}
              <span className="bg-green-600 px-3 py-1 rounded-full">{user.balance?.toFixed(2)} ج.م</span>
              <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-300"><LogOut size={16}/>خروج</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-green-200">دخول</Link>
              <Link to="/register" className="bg-white text-green-700 px-4 py-1 rounded-full hover:bg-green-100">سجل الآن</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
