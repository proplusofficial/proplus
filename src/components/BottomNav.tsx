import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ShoppingBag, PlusCircle, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddOrderClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onAddOrderClick }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'add-order', label: 'Add Order', icon: PlusCircle, isAction: true },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 pb-safe shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onAddOrderClick}
                className="relative -top-5 flex flex-col items-center justify-center cursor-pointer group"
                aria-label="Add New Order"
              >
                <div className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 transition-all duration-200 group-hover:scale-105 active:scale-95">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 mt-1 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3 cursor-pointer group"
            >
              <div className="relative p-1">
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors duration-200 ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300'
                }`} />
              </div>
              <span className={`text-[10px] font-medium mt-1 transition-colors duration-200 ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                  : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
