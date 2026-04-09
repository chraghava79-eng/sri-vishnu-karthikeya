import { ReactNode, useState } from 'react';
import { LayoutDashboard, Users, Ticket, BarChart3, Settings, LogOut, ShieldAlert, Menu, X as CloseIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { logOut } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { APP_LOGO } from '../../constants';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'coupons', icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-8">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} className="w-10 h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900 leading-tight italic">
              FEAR <span className="text-blue-600">ADMIN</span>
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group",
                isActive 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-200" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-6 z-30 safe-top">
        <div className="flex items-center gap-2">
          <img src={APP_LOGO} className="w-8 h-8 object-cover rounded-lg" alt="FEAR" referrerPolicy="no-referrer" />
          <span className="font-black tracking-tighter italic text-gray-900">FEAR <span className="text-blue-600">ADMIN</span></span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-100 rounded-xl text-gray-600"
        >
          {isSidebarOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex-col z-20 safe-top safe-bottom">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl safe-top safe-bottom"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 safe-top safe-bottom pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
