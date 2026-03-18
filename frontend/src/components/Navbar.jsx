import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ListTodo, Wallet, PlusCircle, ShieldCheck, Settings, CheckCircle, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

  const links = user ? [
    { to: user.role === 'advertiser' ? '/advertiser' : '/dashboard', icon: <LayoutDashboard size={16}/>, label: 'لوحتي' },
    { to: '/tasks', icon: <ListTodo size={16}/>, label: 'المهام' },
    { to: '/finance', icon: <Wallet size={16}/>, label: 'المالية' },
    ...(user.role === 'advertiser' || user.role === 'admin' ? [{ to: '/post-task', icon: <PlusCircle size={16}/>, label: 'نشر مهمة' }] : []),
    ...(user.role === 'worker' ? [{ to: '/my-submissions', icon: <CheckCircle size={16}/>, label: 'مهامي' }] : []),
    { to: '/verify', icon: <CheckCircle size={16}/>, label: 'التحقق' },
    { to: '/settings', icon: <Settings size={16}/>, label: 'الإعدادات' },
    ...(user.role === 'admin' ? [{ to: '/admin', icon: <ShieldCheck size={16}/>, label: 'الأدمن', special: true }] : []),
  ] : [];

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-wide">🇪🇬 إيجي وورك</Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3 text-sm font-semibold">
          {user ? (
            <>
              {links.map(l => (
                <Link key={l.to} to={l.to} className={`flex items-center gap-1 hover:text-green-200 ${l.special ? 'text-yellow-300' : ''}`}>
                  {l.icon}{l.label}
                </Link>
              ))}
              <span className="bg-green-600 px-3 py-1 rounded-full text-sm">{user.balance?.toFixed(2)} ج.م</span>
              {!user.email_verified && (
                <Link to="/verify" className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">⚠️ أكد حسابك</Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-300"><LogOut size={16}/>خروج</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-green-200">دخول</Link>
              <Link to="/register" className="bg-white text-green-700 px-4 py-1 rounded-full hover:bg-green-100">سجل الآن</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-green-800 px-4 pb-4 space-y-2">
          {user ? (
            <>
              <div className="text-green-200 text-sm py-2 border-b border-green-700">
                {user.name} | {user.balance?.toFixed(2)} ج.م
              </div>
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 py-2 hover:text-green-200 ${l.special ? 'text-yellow-300' : ''}`}>
                  {l.icon}{l.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-red-300 w-full">
                <LogOut size={16}/>خروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2">دخول</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block py-2">سجل الآن</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
