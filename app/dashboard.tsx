'use client';

import React, { useMemo } from 'react';
import { Users, CheckCircle, Star, Clock, Home, SlidersHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/lib/AppContext';
import AppLayout from '@/components/AppLayout';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });

export default function DashboardPage() {
  const { participants, submissions, companies } = useAppContext();

  const metrics = useMemo(() => {
    const totalParts = participants.length;
    const completedCount = submissions.filter(s => s.status === 'Completed').length;
    const completionRate = submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0;
    const scores = submissions.filter(s => s.status === 'Completed' && s.score !== null).map(s => s.score as number);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0.0";
    const pendingTasks = submissions.filter(s => s.status !== 'Completed').length;
    return { totalParts, completionRate, avgScore, pendingTasks };
  }, [participants, submissions]);

  const trendData = [
    { name: 'Week 1', rate: 45 }, { name: 'Week 2', rate: 52 }, { name: 'Week 3', rate: 58 }, { name: 'Week 4', rate: 65 },
    { name: 'Week 5', rate: 68 }, { name: 'Week 6', rate: 70 }, { name: 'Week 7', rate: 71 }, { name: 'Week 8', rate: 72 }
  ];

  const distData = [
    { score: '60-70', count: 18 }, { score: '70-80', count: 52 }, { score: '80-90', count: 95 }, { score: '90-100', count: 63 }
  ];

  return (
    <AppLayout currentPage="dashboard" title="Dashboard">
      <div className="space-y-8 duration-300 animate-in fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Participants', value: metrics.totalParts, icon: <Users className="h-6 w-6 text-[#3b82f6]" />, sub: 'Unified active directory', subColor: '#10b981' },
            { label: 'Completion Rate', value: `${metrics.completionRate}%`, icon: <CheckCircle className="h-6 w-6 text-[#3b82f6]" />, sub: 'Transacted completion sync', subColor: '#10b981' },
            { label: 'Average Score', value: metrics.avgScore, icon: <Star className="h-6 w-6 text-[#3b82f6]" />, sub: 'Graded metrics array', subColor: '#10b981' },
            { label: 'Pending Tasks', value: metrics.pendingTasks, icon: <Clock className="h-6 w-6 text-[#3b82f6]" />, sub: 'Actions awaiting review', subColor: '#ef4444' }
          ].map(m => (
            <div key={m.label} className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4"><h3 className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wider">{m.label}</h3>{m.icon}</div>
              <p className="text-3xl font-bold text-[#3b82f6] mb-2">{m.value}</p>
              <p className="text-xs flex items-center gap-1" style={{ color: m.subColor }}><SlidersHorizontal className="h-3 w-3" /> {m.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6">
            <h3 className="text-base font-bold text-[#f1f5f9] mb-6 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Completion Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" vertical={false} />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} />
                  <YAxis stroke="#cbd5e1" fontSize={12} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6">
            <h3 className="text-base font-bold text-[#f1f5f9] mb-6 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Score Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" vertical={false} />
                  <XAxis dataKey="score" stroke="#cbd5e1" fontSize={12} />
                  <YAxis stroke="#cbd5e1" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
