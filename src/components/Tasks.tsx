import { UserProfile } from '../types';
import { MOCK_TASKS } from '../constants';
import GlassCard from './GlassCard';
import { ListTodo, CheckCircle2, Clock } from 'lucide-react';

interface TasksProps {
  profile: UserProfile | null;
}

export default function Tasks({ profile }: TasksProps) {
  if (!profile) return null;

  return (
    <div className="p-6 space-y-8 pb-24 safe-top">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10 object-contain" alt="FEAR" referrerPolicy="no-referrer" />
          <div>
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Daily Checklist</h2>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tighter italic">Your Tasks</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Recommended</span>
          </div>
          <span className="text-xs font-bold text-gray-400">3/5 Complete</span>
        </div>

        <div className="space-y-4">
          {MOCK_TASKS.slice(0, 5).map((task, i) => (
            <GlassCard key={task.id} className="flex items-start gap-4">
              <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${
                i < 3 ? "bg-blue-500 border-blue-500 text-white" : "border-gray-200"
              }`}>
                {i < 3 && <CheckCircle2 size={14} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{task.fearType}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{task.difficulty}</span>
                </div>
                <p className={`text-sm leading-relaxed ${i < 3 ? "text-gray-400 line-through" : "text-gray-700"}`}>
                  {task.description}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard className="bg-gray-900 text-white border-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <ListTodo size={20} />
          </div>
          <div>
            <h3 className="font-bold">Unknown Mode</h3>
            <p className="text-[10px] text-gray-400">Target fear of uncertainty</p>
          </div>
        </div>
        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
          Accept a random task without knowing the fear type or difficulty. High risk, high reward.
        </p>
        <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm active:scale-95 transition-transform">
          Generate Random Task
        </button>
      </GlassCard>
    </div>
  );
}
