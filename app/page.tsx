"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, X, Save, MapPin, History, RotateCcw, BarChart3 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 초성 검색 엔진
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

// [로고 1] 배달 스쿠터 아이콘
const DeliveryScooterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="18" cy="48" r="5" stroke="currentColor" strokeWidth="4"/>
    <circle cx="50" cy="48" r="5" stroke="currentColor" strokeWidth="4"/>
    <path d="M12 42L18 24H42L52 42H12Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    <rect x="6" y="14" width="22" height="16" rx="2" fill="#FBBF24" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M42 24L46 14H58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 24L26 42" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

// [로고 2] 안라무복 낙관(도장) 커스텀 SVG
const AnRaMuBokSeal = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="90" height="90" rx="10" fill="#cc0000" />
    <text x="50" y="45" textAnchor="middle" fill="white" fontSize="32" fontWeight="900" fontFamily="sans-serif">안라</text>
    <text x="50" y="80" textAnchor="middle" fill="white" fontSize="32" fontWeight="900" fontFamily="sans-serif">무복</text>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Home'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState<{open: boolean, logs: any[]}>({open: false, logs: []});
  const [editingItem, setEditingItem] = useState<any>(null);
  const [stats, setStats] = useState({ visits: 0 });
  const [formData, setFormData] = useState({ region: '운서', name: '', password: '', note: '' });

  const fetchData = async () => {
    const { data: b } = await supabase.from('buildings').select('*').order('updated_at', { ascending: false });
    if (b) setData(b);
    const { count } = await supabase.from('site_visits').select('*', { count: 'exact', head: true });
    setStats({ visits: count || 0 });
  };

  useEffect(() => {
    fetchData();
    if (!sessionStorage.getItem('v')) {
      supabase.from('site_visits').insert([{}]).then(() => sessionStorage.setItem('v', '1'));
    }
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.password) return alert('빈칸을 채워주세요!');
    if (editingItem) {
      await supabase.from('building_logs').insert([{
        building_id: editingItem.id, old_name: editingItem.name, old_password: editingItem.password, old_note: editingItem.note
      }]);
      await supabase.from('buildings').update({ ...formData, updated_at: new Date() }).eq('id', editingItem.id);
    } else {
      await supabase.from('buildings').insert([{ ...formData, updated_at: new Date() }]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const showHistory = async (id: string) => {
    const { data: logs } = await supabase.from('building_logs').select('*').eq('building_id', id).order('created_at', { ascending: false });
    setHistoryModal({ open: true, logs: logs || [] });
  };

  const rollback = async (log: any) => {
    if (!confirm('복구할까요?')) return;
    await supabase.from('buildings').update({ name: log.old_name, password: log.old_password, note: log.old_note, updated_at: new Date() }).eq('id', log.building_id);
    setHistoryModal({ ...historyModal, open: false });
    fetchData();
  };

  // UI 로직: 첫 진입(Home)이면서 검색어가 없을 때만 리스트를 숨김
  const isInitialState = activeTab === 'Home' && searchTerm === '';
  const filtered = isInitialState ? [] : data.filter(i => {
    const regionMatch = activeTab === '전체' || activeTab === 'Home' || i.region === activeTab;
    const lowerSearch = searchTerm.toLowerCase();
    const textMatch = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm);
    const chosungMatch = getChosung(i.name).includes(lowerSearch);
    return regionMatch && (textMatch || chosungMatch);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-40 relative">
      
      {/* 배경: 흐릿한 오토바이 이미지 삽입 */}
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1000&auto=format')] bg-cover bg-center opacity-[0.05] grayscale pointer-events-none"></div>

      <div className="bg-[#0f172a]/95 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg shadow-2xl">
        <div className="p-5 flex items-center gap-4 relative z-10">
          <DeliveryScooterIcon className="w-14 h-14 text-yellow-500" />
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white italic tracking-tighter">영종도 <span className="text-yellow-400">배달 라이더</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">공동현관 출입 정보망</p>
          </div>
          <div className="text-[9px] font-bold text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 shadow-inner">
            <BarChart3 size={10} className="text-yellow-500"/> {stats.visits} 접속
          </div>
        </div>

        <div className="px-5 pb-5 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="건물명 초성 검색 (예: ㄱㄹㄷㅂ)" 
              className="w-full p-4.5 pl-14 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none placeholder:text-slate-800 shadow-xl transition-all font-bold" 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if(activeTab === 'Home') setActiveTab('전체');
              }} 
            />
            <Search className="absolute left-5 top-4.5 text-slate-800 group-focus-within:text-yellow-500" size={22} />
          </div>
          <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar">
            {['전체', '운서', '하늘', '화장실'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800/40 text-slate-600 border border-slate-700/30'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4 relative z-10 min-h-[50px]">
        {filtered.map(i => (
          <div key={i.id} className="bg-[#111827] p-5 rounded-[2.5rem] border border-slate-800/40 shadow-inner">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-2">
                <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{i.region}</span>
                <h2 className="text-xl font-bold mt-1 text-white tracking-tight">{i.name}</h2>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => showHistory(i.id)} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-blue-400"><History size={16} /></button>
                <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-yellow-500"><Edit2 size={16} /></button>
                <button onClick={() => {navigator.clipboard.writeText(i.password); alert('복사됨');}} className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500 border border-yellow-500/20 shadow-lg active:scale-90 transition-transform"><Copy size={18} /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/40 flex justify-between items-end">
              <span className="text-3xl font-mono font-black text-yellow-400 tracking-tighter">{i.password}</span>
              <p className="text-[11px] text-slate-500 max-w-[50%] text-right font-medium leading-tight">{i.note || '-'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 푸터: 검색 전일 때 상단 여백을 채우며 로고와 만든이 정보 노출 */}
      <footer className={`text-center px-10 transition-all duration-500 flex flex-col items-center ${isInitialState ? 'mt-24 opacity-100' : 'mt-12 opacity-40'}`}>
        <div className="flex items-center gap-4 bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/50 shadow-2xl backdrop-blur-sm">
          <AnRaMuBokSeal className="w-16 h-16 shadow-lg shadow-red-900/20" />
          <div className="text-left">
            <p className="text-[14px] text-white font-black tracking-tight mb-1">
              오늘도 영종도의 모든 길 위에서<br/>안라무복하시길 기원합니다.
            </p>
            <p className="text-[12px] text-slate-300 font-bold">
              만든이 : <span className="text-yellow-500 ml-1">부업맨 HoJun</span>
            </p>
          </div>
        </div>
      </footer>

      {/* 플로팅 버튼 */}
      <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '' }); setIsModalOpen(true);}} className="fixed bottom-10 right-8 bg-yellow-500 text-black p-5 rounded-2xl shadow-2xl z-50 active:scale-90 transition-all">
        <Plus size={30} strokeWidth={3} />
      </button>

      {/* 히스토리/모달 코드는 이전과 동일하게 유지 (지면상 생략, 기능은 포함됨) */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-sm">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-3xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-blue-400 flex items-center gap-2"><History size={18}/> 수정 이력</h3>
              <button onClick={() => setHistoryModal({ ...historyModal, open: false })} className="bg-slate-800 p-2 rounded-xl"><X size={18}/></button>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
              {historyModal.logs.map((log, idx) => (
                <div key={idx} className="bg-[#070b14] p-5 rounded-3xl border border-slate-800 flex justify-between items-center group">
                  <div className="flex-1">
                    <p className="text-[9px] text-slate-700 mb-1 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="text-yellow-500 font-mono font-bold text-xl">{log.old_password}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{log.old_name}</p>
                  </div>
                  <button onClick={() => rollback(log)} className="bg-blue-500/10 text-blue-400 p-3.5 rounded-2xl active:scale-90 border border-blue-500/10"><RotateCcw size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-800 shadow-3xl">
            <h3 className="text-2xl font-black text-yellow-400 mb-8">{editingItem ? '정보 수정' : '신규 정보 등록'}</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {['운서', '하늘', '화장실'].map(r => (
                  <button key={r} onClick={() => setFormData({...formData, region: r})} className={`py-3 rounded-2xl font-bold border transition-all text-sm ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{r}</button>
                ))}
              </div>
              <input type="text" placeholder="건물 명칭" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none focus:border-yellow-500 font-bold placeholder:text-slate-800 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="현관 비밀번호" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-yellow-400 font-mono text-xl outline-none focus:border-yellow-500 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none h-28 shadow-inner text-sm" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-5 rounded-2xl font-bold">취소</button>
                <button onClick={handleSave} className="flex-[2] bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl">저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
