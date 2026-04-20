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

// 실루엣이 확실한 배달 스쿠터 아이콘
const DeliveryScooterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="18" cy="48" r="5" stroke="currentColor" strokeWidth="4"/>
    <circle cx="50" cy="48" r="5" stroke="currentColor" strokeWidth="4"/>
    <path d="M12 42L18 22H42L52 42H12Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    <rect x="8" y="12" width="22" height="16" rx="2" fill="#FBBF24" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M42 22L46 12H58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 22L26 42" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('전체');
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

  // 핵심: 검색어가 없을 때는 리스트를 비워둠 (첫 화면 기동성 및 푸터 노출용)
  const filtered = searchTerm === '' ? [] : data.filter(i => {
    const regionMatch = activeTab === '전체' || i.region === activeTab;
    const lowerSearch = searchTerm.toLowerCase();
    const textMatch = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm);
    const chosungMatch = getChosung(i.name).includes(lowerSearch);
    return regionMatch && (textMatch || chosungMatch);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-32 overflow-x-hidden">
      
      {/* 헤더: 원래 문구로 복구 */}
      <div className="bg-[#0f172a] border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg bg-[#0f172a]/95 shadow-2xl">
        <div className="p-5 flex items-center gap-4 relative z-10">
          <DeliveryScooterIcon className="w-14 h-14 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white leading-tight tracking-tighter italic">
              영종도 <span className="text-yellow-400">배달 라이더</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
              공동현관 출입 정보망
            </p>
          </div>
          <div className="text-[9px] font-bold text-slate-500 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 shadow-inner">
            <BarChart3 size={10} className="text-yellow-500"/> {stats.visits} 접속
          </div>
        </div>

        {/* 검색창 및 탭 */}
        <div className="px-5 pb-5 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="건물명 초성 검색 (예: ㄱㄹㄷㅂ)" 
              className="w-full p-4.5 pl-14 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none placeholder:text-slate-700 shadow-xl transition-all font-bold" 
              onChange={(e) => setSearchTerm(e.target.value)} 
              autoFocus
            />
            <Search className="absolute left-5 top-4.5 text-slate-700 group-focus-within:text-yellow-500 transition-colors" size={22} />
          </div>
          
          <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
            {['전체', '운서', '하늘', '화장실'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-xs ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800/40 text-slate-500 border border-slate-700/30'}`}>
                <MapPin size={13} className={activeTab === t ? 'text-black/60' : 'text-slate-700'} />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 리스트 구역: 검색 전엔 비어있어 푸터가 바로 보임 */}
      <div className="p-5 space-y-4 min-h-[100px]">
        {filtered.map(i => (
          <div key={i.id} className="bg-[#111827] p-5 rounded-[2rem] border border-slate-800/40 shadow-inner active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-2">
                <span className="text-[9px] bg-slate-800/80 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-widest">{i.region}</span>
                <h2 className="text-xl font-bold mt-1 text-white leading-snug tracking-tight">{i.name}</h2>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => showHistory(i.id)} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 active:text-blue-400 border border-slate-700/20"><History size={16} /></button>
                <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 active:text-yellow-500 border border-slate-700/20"><Edit2 size={16} /></button>
                <button onClick={() => {navigator.clipboard.writeText(i.password); alert('비밀번호 복사됨');}} className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500 border border-yellow-500/20 active:scale-90 transition-all shadow-lg"><Copy size={18} /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/40 flex justify-between items-end">
              <span className="text-4xl font-mono font-black text-yellow-400 tracking-tighter drop-shadow-md">{i.password}</span>
              <p className="text-[11px] text-slate-500 max-w-[50%] text-right font-medium leading-tight opacity-80">{i.note || '-'}</p>
            </div>
          </div>
        ))}
        {searchTerm !== '' && filtered.length === 0 && (
          <p className="text-center py-10 text-slate-600 text-sm font-bold italic">검색 결과가 없습니다.</p>
        )}
      </div>

      {/* 푸터: 요청하신 문구와 이전의 세련된 디자인 복구 */}
      <footer className="mt-10 pb-28 text-center px-10 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 mb-3 shadow-inner">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_green]"></span>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            RIDE SAFE, GET HOME SAFE
          </p>
        </div>
        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
          오늘도 영종도의 모든 길 위에서 안라무복하시길 기원합니다.
        </p>
        <div className="mt-4 pt-4 border-t border-slate-900/50 max-w-[150px] mx-auto opacity-50">
          <p className="text-[11px] text-slate-700 font-light italic">
            만든이 : <span className="text-slate-500 font-bold not-italic ml-1">부업맨 HoJun</span>
          </p>
        </div>
      </footer>

      {/* 플로팅 버튼 */}
      <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '' }); setIsModalOpen(true);}} className="fixed bottom-8 right-8 bg-yellow-500 text-black p-4.5 rounded-2xl shadow-[0_10px_30px_rgba(234,179,8,0.4)] z-50 active:scale-90 transition-all">
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* 롤백 모달 */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-3xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-blue-400 flex items-center gap-2 tracking-tighter"><History size={18}/> 수정 이력</h3>
              <button onClick={() => setHistoryModal({ ...historyModal, open: false })} className="text-slate-600 bg-slate-800 p-2 rounded-xl"><X size={18}/></button>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
              {historyModal.logs.length === 0 && <p className="text-center text-slate-600 py-10 text-sm italic">기록된 이력이 없습니다.</p>}
              {historyModal.logs.map((log, idx) => (
                <div key={idx} className="bg-[#070b14] p-5 rounded-3xl border border-slate-800 flex justify-between items-center group shadow-inner">
                  <div className="flex-1">
                    <p className="text-[9px] text-slate-700 mb-1 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="text-yellow-500 font-mono font-bold text-xl tracking-tight">{log.old_password}</p>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">{log.old_name}</p>
                  </div>
                  <button onClick={() => rollback(log)} className="bg-blue-500/10 text-blue-400 p-3.5 rounded-2xl active:scale-90 transition-all border border-blue-500/10"><RotateCcw size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-800 shadow-3xl">
            <h3 className="text-2xl font-black text-yellow-400 mb-8 tracking-tighter">{editingItem ? '정보 수정' : '신규 정보 등록'}</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {['운서', '하늘', '화장실'].map(r => (
                  <button key={r} onClick={() => setFormData({...formData, region: r})} className={`py-3 rounded-2xl font-bold border transition-all text-sm ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{r}</button>
                ))}
              </div>
              <input type="text" placeholder="건물 명칭 (예: 글래드빌)" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none focus:border-yellow-500 font-bold placeholder:text-slate-800 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="현관 비밀번호 (예: #1234)" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-yellow-400 font-mono text-xl outline-none focus:border-yellow-500 placeholder:text-slate-800 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <textarea placeholder="특이사항 (경비 호출 방법 등)" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none h-28 placeholder:text-slate-800 shadow-inner text-sm" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-5 rounded-2xl font-bold active:scale-95 transition-all">취소</button>
                <button onClick={handleSave} className="flex-[2] bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
