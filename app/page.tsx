"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, X, Save, MapPin } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- 초성 검색을 위한 한글 처리 함수 ---
const getChosung = (str: string) => {
  const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) result += cho[Math.floor(code / 588)];
    else result += str.charAt(i);
  }
  return result;
};

const RiderIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12.8 44.8C15.6163 44.8 17.9 42.5163 17.9 39.7C17.9 36.8837 15.6163 34.6 12.8 34.6C9.98366 34.6 7.7 36.8837 7.7 39.7C7.7 42.5163 9.98366 44.8 12.8 44.8Z" stroke="currentColor" strokeWidth="3" strokeMiterlimit="10"/>
    <path d="M51.2 44.8C54.0163 44.8 56.3 42.5163 56.3 39.7C56.3 36.8837 54.0163 34.6 51.2 34.6C48.3837 34.6 46.1 36.8837 46.1 39.7C46.1 42.5163 48.3837 44.8 51.2 44.8Z" stroke="currentColor" strokeWidth="3" strokeMiterlimit="10"/>
    <path d="M20 18H5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M47 38.3H26.3L19 14.3C18.7 13.3 17.8 12.6 16.7 12.6H5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M45.6 28.3L17.7 30L21.7 16H46.7C47.7 16 48.5 16.7 48.7 17.6L51 28C51.2 29.1 50.4 30.1 49.3 30.3C49.1 30.3 48.8 30.3 48.6 30.3L45.6 28.3Z" fill="#FBBF24"/>
    <path d="M56.3 39.7H60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 50H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('전체');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ region: '운서', name: '', password: '', note: '' });

  const fetchData = async () => {
    const { data: b } = await supabase.from('buildings').select('*').order('updated_at', { ascending: false });
    if (b) setData(b);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.password) return alert('건물명과 비번은 필수입니다!');
    const saveData = { ...formData, updated_at: new Date() };
    if (editingItem) {
      await supabase.from('buildings').update(saveData).eq('id', editingItem.id);
    } else {
      await supabase.from('buildings').insert([saveData]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ region: '운서', name: '', password: '', note: '' });
    fetchData();
  };

  const filtered = data.filter(i => {
    const regionMatch = activeTab === '전체' || i.region === activeTab;
    const lowerSearch = searchTerm.toLowerCase();
    
    // 1. 일반 텍스트 포함 확인
    const textMatch = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm);
    
    // 2. 초성 일치 확인
    const chosungMatch = getChosung(i.name).includes(lowerSearch);
    
    return regionMatch && (textMatch || chosungMatch);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-28">
      <div className="bg-[#0f172a] border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg bg-[#0f172a]/95">
        <div className="p-5 flex items-center gap-4 relative z-10">
          <RiderIcon className="w-16 h-16 text-yellow-500 bg-[#1e293b] p-3 rounded-2xl shadow-inner border border-slate-700/50" />
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white leading-tight">영종도 <span className="text-yellow-400">배달 라이더</span></h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">ICNRIDERS // SECRET SHARE SYSTEM</p>
          </div>
        </div>
        <div className="p-5 pt-1 relative z-10">
          <div className="relative group">
            <input type="text" placeholder="초성만 쳐도 검색됩니다 (예: ㄱㄹㄷㅂ)" className="w-full p-5 pl-14 bg-[#1e293b] rounded-3xl border border-slate-700 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/20 text-lg focus:outline-none placeholder:text-slate-600 shadow-xl transition-all" onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-5 top-5 text-slate-600 group-focus-within:text-yellow-500" size={24} />
          </div>
          <div className="flex gap-2.5 mt-5 overflow-x-auto no-scrollbar">
            {['전체', '운서', '하늘', '상가', '화장실'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-sm ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800/80 text-slate-300'}`}><MapPin size={16} />{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {filtered.map(i => (
          <div key={i.id} className="bg-[#111827] p-6 rounded-[2.5rem] border border-slate-800/50 shadow-inner">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-3">
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-md font-bold text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">{i.region}</span>
                <h2 className="text-2xl font-bold mt-2 leading-snug text-white">{i.name}</h2>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note }); setIsModalOpen(true);}} className="bg-slate-800 p-3.5 rounded-2xl text-slate-400 active:scale-95 border border-slate-700/50 hover:text-yellow-400"><Edit2 size={18} /></button>
                <button onClick={() => {navigator.clipboard.writeText(i.password); alert('복사 완료!');}} className="bg-yellow-500/10 p-4 rounded-2xl text-yellow-400 active:scale-90 border border-yellow-500/20"><Copy size={24} /></button>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-between items-end gap-3">
              <span className="text-4xl font-mono font-black text-yellow-400 tracking-tighter">{i.password}</span>
              <p className="text-sm text-slate-400 max-w-[50%] text-right font-normal break-keep">{i.note || '-'}</p>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-16 pb-12 text-center border-t border-slate-900/50 pt-10 px-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800/40 bg-slate-900/20 mb-3">
          <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"></span>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Respect to all riders</p>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">영종도의 모든 길 위에서 안전하시길 기원합니다.</p>
        <p className="text-[11px] text-slate-600 mt-2 font-light">만든이 : <span className="text-slate-400 font-bold ml-1">부업맨 HoJun</span></p>
      </footer>

      <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '' }); setIsModalOpen(true);}} className="fixed bottom-7 right-7 bg-yellow-500 text-black p-5 rounded-3xl shadow-2xl z-50 animate-pulse hover:scale-105 transition-transform"><Plus size={32} strokeWidth={3} /></button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-9 border border-slate-700/50 shadow-3xl">
            <div className="flex justify-between items-center mb-7 pb-4 border-b border-slate-700/60">
              <h3 className="text-2xl font-black text-yellow-400 flex items-center gap-2.5"> {editingItem ? '정보 수정' : '새 건물 등록'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-800 p-3 rounded-2xl text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-2">지역 선택</label>
                <div className="flex gap-2.5 mt-1.5 overflow-x-auto no-scrollbar pb-1">
                  {['운서', '하늘', '상가', '화장실'].map(r => (
                    <button key={r} onClick={() => setFormData({...formData, region: r})} className={`flex-1 py-3 px-1 rounded-2xl font-bold border-2 transition-all ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-slate-700/50 text-slate-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="건물명" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-700/60 focus:border-yellow-500 text-white outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="비밀번호" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-700/60 focus:border-yellow-500 text-yellow-400 font-mono text-xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-700/60 focus:border-yellow-500 text-white outline-none h-28" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <button onClick={handleSave} className="w-full bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3"><Save size={22}/> {editingItem ? '수정 내용 저장' : '새로운 정보 등록'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
