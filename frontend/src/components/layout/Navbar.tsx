import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth }      from '../../context/AuthContext';
import { useTheme }     from '../../context/ThemeContext';
import clsx from 'clsx';

interface NavbarProps { onMenuClick: () => void; }

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, user }                        = useAuth();
  const { theme, toggleTheme }                  = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 flex items-center px-4 gap-3 shrink-0">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* User + Logout */}
      <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
        <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-400">{user?.name || user?.email}</span>
        <button onClick={logout} className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
