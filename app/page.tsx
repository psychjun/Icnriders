"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Navigation, ShieldCheck } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('전체');

  useEffect(() => {
    async function fetchData() {
      const { data: b } = await supabase.from('buildings').select('*').order('name');
      if (b) setData(b);
    }
    fetchData();
  }, []);

  const filtered = data.filter(i => 
    (activeTab === '전체' || i.region === activeTab) &&
    (i.name.includes(searchTerm) || i.password.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans tracking-tight">
      <div className="sticky top-0 bg-[#0f172a] pb-4 z-10 border-b border-slate-800 mb-4">
        <h1 className="text-2xl font-black text-yellow-400 mb-4 flex items-center gap-2 pt-2">
          <ShieldCheck size={28} fill="currentColor" className="text-yellow-500" /> ICNRIDERS
        </h1>
        <div className="relative">
          <input 
            type="text" 
            placeholder="건물명 또는 비밀번호 검색..." 
            className="w-full p-5 bg-[#1e293b] rounded-2xl border-2 border-yellow-500 text-xl focus:outline-none shadow-lg shadow-yellow-500/10"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-5 top-5 text-yellow-500" />
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
          {['전체', '운서', '하늘', '상가', '화장실'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`px-6 py-2.5 rounded-full font-bold transition-all ${activeTab === t ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(i => (
          <div key={i.id} className="bg-[#1e293b] p-5 rounded-[2rem] border border-slate-700/50 active:bg-slate-800 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-slate-700 px-2 py-1 rounded font-bold text-slate-400 uppercase tracking-wider">{i.region}</span>
                <h2 className="text-2xl font-black mt-1">{i.name}</h2>
              </div>
              <button 
                onClick={() => {navigator.clipboard.writeText(i.password); alert('비밀번호 복사 완료!');}} 
                className="bg-yellow-500/10 p-4 rounded-2xl text-yellow-500 active:scale-90 transition-transform"
              >
                <Copy size={24} />
              </button>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <span className="text-3xl font-mono font-black text-yellow-400 tracking-tighter">{i.password}</span>
              <p className="text-xs text-slate-400 font-medium max-w-[50%] text-right leading-snug">{i.note}</p>
            </div>
          </div>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500 font-bold">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
