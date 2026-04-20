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

// 진짜 배달 스쿠터 아이콘 (뒤에 배달통 강조)
const RealScooterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="48" r="6" stroke="currentColor" strokeWidth="4"/>
    <circle cx="48" cy="48" r="6" stroke="currentColor" strokeWidth="4"/>
    <path d="M10 42C10 32 16 26 26 26H42L50 42H10Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3"/>
    <path d="M48 42L52 24H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    {/* 배달통 강조 */}
    <rect x="8" y="10" width="24" height="20" rx="2" fill="#FBBF24" stroke="currentColor" strokeWidth="3"/>
    <path d="M8 20H32" stroke="currentColor" strokeWidth="2"/>
    <path d="M26 26L30 42" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Home'); // 첫 화면은 Home
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
    if (!confirm('이 정보로 복구할까요?')) return;
    await supabase.from('buildings').update({ name: log.old_name, password: log.old_password, note: log.old_note, updated_at: new Date() }).eq('id', log.building_id);
    setHistoryModal({ ...historyModal, open: false });
    fetchData();
  };

  const filtered = data.filter(i => {
    const regionMatch = activeTab === '전체' || i.region === activeTab;
    const lowerSearch = searchTerm.toLowerCase();
    const textMatch = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm);
    const chosungMatch = getChosung(i.name).includes(lowerSearch);
    return regionMatch && (textMatch || chosungMatch);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans pb-40">
      
      {/* 웰컴 화면 (Home) */}
      {activeTab === 'Home' && (
        <div className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
          {/* 흐릿한 배경 이미지 */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1000&auto=format')] bg-cover bg-center opacity-10 grayscale"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-[#070b14]"></div>
          
          <div className="relative z-10 text-center">
            <RealScooterIcon className="w-24 h-24 text-yellow-500 mx-auto mb-6 drop-shadow-2xl" />
            <h1 className="text-4xl font-black tracking-tighter mb-2">영종도 라이더</h1>
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Entry System</p>
            
            <div className="mt-12 flex gap-4 justify-center">
              <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Today</p>
                <p className="text-xl font-black text-yellow-500">{stats.visits}</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Data</p>
                <p className="text-xl font-black text-blue-400">{data.length}</p>
              </div>
            </div>

            <button onClick={() => setActiveTab('전체')} className="mt-12 bg-yellow-500 text-black px-10 py-5 rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all">정보 확인하기</button>
          </div>

          <div className="absolute bottom-10 text-center opacity-30">
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase mb-1">Drive Safe, Return Home</p>
            <p className="text-[11px] text-slate-600">만든이 : 부업맨 HoJun</p>
          </div>
        </div>
      )}

      {/* 메인 리스트 화면 */}
      {activeTab !== 'Home' && (
        <>
          <div className="bg-[#0f172a]/95 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg p-6">
            <div className="flex items-center justify-between mb-6" onClick={() => setActiveTab('Home')}>
              <div className="flex items-center gap-3">
                <RealScooterIcon className="w-10 h-10 text-yellow-500" />
                <h1 className="text-xl font-black tracking-tighter uppercase">Rider Portal</h1>
              </div>
              <div className="text-[10px] font-bold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-2">
                <BarChart3 size={12}/> {stats.visits} VISITS
              </div>
            </div>

            <div className="relative mb-6">
              <input type="text" placeholder="초성만 입력하세요 (예: ㄱㄹㄷㅂ)" className="w-full p-5 pl-14 bg-[#1e293b] rounded-2xl border border-slate-700/50 text-white outline-none focus:border-yellow-500 shadow-xl" onChange={(e) => setSearchTerm(e.target.value)} />
              <Search className="absolute left-5 top-5 text-slate-600" size={22} />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['전체', '운서', '하늘', '화장실'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800/60 text-slate-500'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {filtered.map(i => (
              <div key={i.id} className="bg-[#111827] p-6 rounded-[2.5rem] border border-slate-800/50 shadow-inner group">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{i.region}</span>
                    <h2 className="text-xl font-bold mt-1 text-white leading-snug">{i.name}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => showHistory(i.id)} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-blue-400"><History size={18} /></button>
                    <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-yellow-500"><Edit2 size={18} /></button>
                    <button onClick={() => {navigator.clipboard.writeText(i.password); alert('복사완료');}} className="bg-yellow-500/10 p-2.5 rounded-xl text-yellow-500"><Copy size={20} /></button>
                  </div>
                </div>
                <div className="mt-5 flex justify-between items-end border-t border-slate-800/40 pt-5">
                  <span className="text-4xl font-mono font-black text-yellow-400 tracking-tighter">{i.password}</span>
                  <p className="text-[11px] text-slate-500 max-w-[50%] text-right leading-tight font-medium">{i.note || '-'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 세련된 하단 푸터 */}
          <footer className="mt-10 pb-32 text-center border-t border-slate-900/30 pt-10 px-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 mb-3">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">Drive safe, return home</p>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">오늘도 영종도의 모든 길 위에서 안전하시길 기원합니다.</p>
            <p className="text-[11px] text-slate-700 mt-3 font-light">만든이 : <span className="text-slate-500 font-bold ml-1">부업맨 HoJun</span></p>
          </footer>
        </>
      )}

      {/* 히스토리 모달 */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-700/50">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-blue-400 flex items-center gap-2"><History size={20}/> 수정 이력</h3>
              <button onClick={() => setHistoryModal({ ...historyModal, open: false })} className="text-slate-500"><X /></button>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
              {historyModal.logs.length === 0 && <p className="text-center text-slate-600 py-10 text-sm italic">기록된 이력이 없습니다.</p>}
              {historyModal.logs.map((log, idx) => (
                <div key={idx} className="bg-[#070b14] p-5 rounded-3xl border border-slate-800 flex justify-between items-center group">
                  <div className="flex-1">
                    <p className="text-[9px] text-slate-600 mb-1">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="text-yellow-500 font-mono font-bold text-xl">{log.old_password}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{log.old_name}</p>
                  </div>
                  <button onClick={() => rollback(log)} className="bg-blue-500/10 text-blue-400 p-3 rounded-2xl active:scale-90 transition-all"><RotateCcw size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 등록 버튼 */}
      <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '' }); setIsModalOpen(true);}} className="fixed bottom-10 right-8 bg-yellow-500 text-black p-5 rounded-2xl shadow-2xl z-50 active:scale-90 transition-transform"><Plus size={32} strokeWidth={3} /></button>

      {/* 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-800">
            <h3 className="text-2xl font-black text-yellow-400 mb-8">{editingItem ? '수정하기' : '새 건물 등록'}</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {['운서', '하늘', '화장실'].map(r => (
                  <button key={r} onClick={() => setFormData({...formData, region: r})} className={`py-3 rounded-2xl font-bold border transition-all ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{r}</button>
                ))}
              </div>
              <input type="text" placeholder="건물 명칭" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none focus:border-yellow-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="출입 비밀번호" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-yellow-400 font-mono text-xl outline-none focus:border-yellow-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none h-28" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <button onClick={handleSave} className="w-full bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl shadow-xl mt-4">데이터 저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
