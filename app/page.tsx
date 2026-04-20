"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, X, Save, MapPin, History, RotateCcw, BarChart3, Download, Upload, Calendar as CalendarIcon, ShieldCheck, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// [잠금] 초성 검색 엔진
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

// [잠금] 로고 컴포넌트
const DeliveryScooterLogo = ({ className = "" }) => (
  <img src="/logo.png" alt="로고" className={`${className} object-contain`} />
);

// [잠금] 안라무복 낙관
const AnRaMuBokSeal = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12,10 Q8,8 10,14 L8,86 Q8,92 14,90 L86,92 Q92,92 90,86 L92,14 Q92,8 86,10 Z" fill="#cc0000" />
    <text x="50" y="45" textAnchor="middle" fill="white" fontSize="28" fontWeight="900" style={{fontFamily: 'serif'}}>안라</text>
    <text x="50" y="82" textAnchor="middle" fill="white" fontSize="28" fontWeight="900" style={{fontFamily: 'serif'}}>무복</text>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Home'); 
  const [adminMode, setAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [stats, setStats] = useState({ visits: 0, logs: [] as any[], visitLogs: [] as any[] });
  const [formData, setFormData] = useState({ region: '운서', name: '', password: '', note: '', address: '', b_type: '아파트' });
  const [ip, setIp] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    const { data: b } = await supabase.from('buildings').select('*').order('id', { ascending: true });
    if (b) setData(b);
    const { count } = await supabase.from('site_visits').select('*', { count: 'exact', head: true });
    setStats(prev => ({ ...prev, visits: count || 0 }));
  };

  const fetchStats = async () => {
    const { data: logs } = await supabase.from('building_logs').select('*').order('created_at', { ascending: false });
    const { data: visits } = await supabase.from('site_visits').select('*').order('created_at', { ascending: false });
    setStats(prev => ({ ...prev, logs: logs || [], visitLogs: visits || [] }));
  };

  useEffect(() => {
    fetchData();
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(resData => {
      setIp(resData.ip);
      if (!sessionStorage.getItem('v')) {
        supabase.from('site_visits').insert([{ ip: resData.ip }]).then(() => sessionStorage.setItem('v', '1'));
      }
    });
  }, []);

  const handleAdminAuth = () => {
    const pw = prompt('관리자 비밀번호를 입력하세요.');
    if (pw === 'bb3145Fm!@') { 
      setAdminMode(true);
      fetchStats();
    } else {
      alert('접근 권한이 없습니다.');
    }
  };

  const openNaverMap = (address: string) => {
    if (!address) return;
    const encoded = encodeURIComponent(address);
    const url = `https://map.naver.com/v5/search/${encoded}`;
    window.open(url, '_blank');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.password) return alert('내용을 입력하세요.');
    const logData = { 
      building_id: editingItem?.id, 
      old_name: editingItem?.name, 
      old_password: editingItem?.password, 
      old_note: editingItem?.note,
      old_address: editingItem?.address,
      old_b_type: editingItem?.b_type,
      ip 
    };
    
    if (editingItem) {
      await supabase.from('building_logs').insert([logData]);
      await supabase.from('buildings').update({ ...formData, updated_at: new Date() }).eq('id', editingItem.id);
    } else {
      await supabase.from('buildings').insert([{ ...formData, updated_at: new Date() }]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const isInitialState = activeTab === 'Home' && searchTerm === '';
  let filtered = isInitialState ? [] : data.filter(i => {
    const regionMatch = (activeTab === '전체' || activeTab === '최근변경' || activeTab === 'Home') || i.region === activeTab;
    const lowerSearch = searchTerm.toLowerCase();
    return regionMatch && (i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm) || getChosung(i.name).includes(lowerSearch));
  });

  if (activeTab === '최근변경') {
    filtered = [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-40 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1000&auto=format')] bg-cover bg-center opacity-[0.04] grayscale pointer-events-none z-0"></div>

      {/* 헤더 */}
      <div className="bg-[#0f172a]/95 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg shadow-2xl">
        <div className="p-3.5 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <DeliveryScooterLogo className="w-10 h-10 shrink-0" />
            <div className="flex items-baseline gap-1.5 min-w-0">
              <h1 className="text-base font-black text-white italic tracking-tighter shrink-0">영종도 <span className="text-yellow-400">배달 라이더</span></h1>
              <span className="text-slate-800 text-[10px] shrink-0">//</span>
              <span className="text-[9px] text-slate-500 font-bold tracking-tighter truncate font-mono uppercase">Access Point Info</span>
            </div>
          </div>
          <button onClick={handleAdminAuth} className="text-[8px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1 shrink-0 shadow-inner">
            <BarChart3 size={9} className="text-yellow-500"/> {stats.visits}
          </button>
        </div>

        {!adminMode && (
          <div className="px-5 pb-5 relative z-10">
            <div className="relative group flex flex-col justify-center">
              <Search className="absolute left-4 text-slate-800 group-focus-within:text-yellow-500 transition-colors z-20" size={18} />
              <input 
                type="text" 
                className="w-full p-4 pl-11 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none shadow-xl transition-all font-bold" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (activeTab === 'Home') setActiveTab('전체'); }} 
              />
              {!searchTerm && <span className="absolute left-11 text-[12px] text-slate-700 font-bold pointer-events-none opacity-50 text-sm">건물명 초성 검색 가능 (예: ㄱㄹㄷㅂ)</span>}
            </div>
            <div className="flex gap-1.5 mt-4 overflow-x-auto no-scrollbar pb-1">
              {['운서', '하늘', '화장실', '최근변경', '전체'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800/40 text-slate-500 border border-slate-700/30'}`}>{t}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리스트 구역 */}
      {!adminMode && (
        <div className="p-5 space-y-4 relative z-10">
          {filtered.map(i => (
            <div key={i.id} className="bg-[#111827] p-5 rounded-[2.5rem] border border-slate-800/40 shadow-inner group transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{i.region}</span>
                    <span className="text-[8px] bg-yellow-500/10 px-2 py-0.5 rounded font-bold text-yellow-500 uppercase">{i.b_type || '아파트'}</span>
                  </div>
                  <h2 className="text-xl font-bold mt-1 text-white tracking-tight break-keep">{i.name}</h2>
                  {i.address && (
                    <button onClick={() => openNaverMap(i.address)} className="flex items-center gap-1 mt-1 text-blue-400 text-[10px] font-bold hover:underline">
                      <MapPin size={10} /> {i.address} <ExternalLink size={10} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note, address: i.address || '', b_type: i.b_type || '아파트' }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-yellow-500 border border-slate-700/20 active:scale-90 transition-transform"><Edit2 size={16} /></button>
                  <button onClick={() => {navigator.clipboard.writeText(i.password); alert('비밀번호 복사됨');}} className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500 border border-yellow-500/20 shadow-lg active:scale-90 transition-all"><Copy size={18} /></button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/40 flex justify-between items-end gap-3 border-t border-slate-800/60">
                <span className="text-3xl font-mono font-black text-yellow-400 tracking-tighter drop-shadow-md">{i.password}</span>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500 font-medium leading-tight opacity-80 break-keep mb-1">{i.note || '-'}</p>
                  {activeTab === '최근변경' && <p className="text-[8px] text-slate-700 font-bold uppercase italic">{new Date(i.updated_at).toLocaleString('ko-KR', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 관리자 모드 */}
      {adminMode && (
        <div className="p-5 space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2 uppercase tracking-tighter"><ShieldCheck /> Admin Dashboard</h2>
            <button onClick={() => setAdminMode(false)} className="text-xs bg-red-600/10 text-red-500 px-3 py-1.5 rounded-lg font-bold border border-red-900/30">Exit</button>
          </div>

          {/* 캘린더 */}
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm"><CalendarIcon size={16}/> Traffic Calendar</h3>
              <div className="flex items-center gap-4 bg-black/40 px-3 py-1 rounded-xl border border-slate-800">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft size={16}/></button>
                <span className="text-xs font-black text-yellow-400">{currentDate.getFullYear()}. {currentDate.getMonth() + 1}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-600 mb-2 uppercase">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())}).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dailyVisits = stats.visitLogs?.filter((v: any) => v.created_at.startsWith(dateStr)).length || 0;
                return (
                  <div key={day} className={`aspect-square rounded-lg border border-slate-800 flex flex-col items-center justify-center transition-all ${dailyVisits > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-900/30 opacity-40'}`}>
                    <span className="text-[10px] font-bold text-slate-500">{day}</span>
                    {dailyVisits > 0 && <span className="text-[8px] font-black text-yellow-500">{dailyVisits}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 항목별 롤백 로그 */}
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm"><History size={16}/> Item-Specific Rollback Log</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
              {stats.logs.map((log: any, idx: number) => (
                <div key={idx} className="bg-black/40 p-4 rounded-2xl border border-slate-800 space-y-2 border-l-4 border-l-red-600/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">{new Date(log.created_at).toLocaleString()} • IP: {log.ip}</p>
                      <p className="text-sm font-black text-white">{log.old_name} <span className="text-slate-600 font-normal">데이터 복구 시점</span></p>
                    </div>
                    <button onClick={async () => {
                      if(confirm(`[${log.old_name}] 이 시점의 모든 항목(주소, 타입 포함)으로 복구할까요?`)) {
                        await supabase.from('buildings').update({ 
                          name: log.old_name, password: log.old_password, note: log.old_note, 
                          address: log.old_address, b_type: log.old_b_type 
                        }).eq('id', log.building_id);
                        alert('롤백 성공'); fetchData(); fetchStats();
                      }
                    }} className="bg-red-600 text-white p-2 rounded-xl active:scale-90 shadow-lg shadow-red-900/20"><RotateCcw size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                    <div className="bg-slate-900/50 p-2 rounded-lg text-yellow-600">PW: <span className="line-through">{log.old_password}</span></div>
                    <div className="bg-slate-900/50 p-2 rounded-lg text-blue-400 uppercase">{log.old_b_type || '아파트'}</div>
                    <div className="bg-slate-900/50 p-2 rounded-lg text-slate-400 col-span-2 truncate">{log.old_address || '주소 없음'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className={`flex flex-col items-center text-center px-6 transition-all duration-700 relative z-10 ${isInitialState ? 'mt-24 opacity-100' : 'mt-10 opacity-30 scale-95'}`}>
        <div className="w-full max-w-sm bg-[#1e293b]/60 backdrop-blur-md p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl flex flex-col items-center gap-5">
          <AnRaMuBokSeal className="w-16 h-16 shadow-2xl shadow-red-900/40" />
          <div className="space-y-2">
            <p className="text-[11px] text-yellow-500 font-black tracking-[0.2em] uppercase mb-1">STAY ALERT, RIDE SAFE</p>
            <p className="text-[15px] text-white font-black leading-snug tracking-tight break-keep">오늘도 영종도의 모든 길 위에서<br /><span className="text-yellow-400 font-black">안라무복</span>하시길 기원합니다.</p>
          </div>
          <div className="w-12 h-px bg-slate-800 mx-auto opacity-50 my-1"></div>
          <div className="bg-[#070b14] px-5 py-2.5 rounded-2xl border border-slate-800 shadow-inner group transition-all">
            <p className="text-[12px] text-white font-bold tracking-tight">만든이 : <span className="text-yellow-400 font-black ml-1 uppercase group-hover:text-white">부업맨 HoJun</span></p>
          </div>
        </div>
      </footer>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-sm">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-800 shadow-3xl break-keep">
            <h3 className="text-2xl font-black text-yellow-400 mb-8 tracking-tighter uppercase">{editingItem ? 'Edit Info' : 'New Entry'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['운서', '하늘', '화장실'].map(r => (
                  <button key={r} onClick={() => setFormData({...formData, region: r})} className={`py-2 rounded-xl font-bold border transition-all ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{r}</button>
                ))}
              </div>
              <div className="flex gap-2">
                {['아파트', '오피스텔', '빌라'].map(t => (
                  <button key={t} onClick={() => setFormData({...formData, b_type: t})} className={`flex-1 py-2 rounded-xl font-bold border transition-all text-[11px] ${formData.b_type === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{t}</button>
                ))}
              </div>
              <input type="text" placeholder="건물 명칭" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none focus:border-yellow-500 font-bold placeholder:text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="현관 비밀번호" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-yellow-400 font-mono text-xl outline-none focus:border-yellow-500 placeholder:text-slate-800" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <input type="text" placeholder="네이버 연동 주소 (정확히 입력)" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-blue-400 text-xs outline-none focus:border-blue-500 placeholder:text-slate-800" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none h-20 placeholder:text-slate-800" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <div className="flex gap-2.5 mt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-5 rounded-2xl font-bold text-white border border-slate-700/50">Cancel</button>
                <button onClick={handleSave} className="flex-[2] bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl shadow-yellow-500/10">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!adminMode && (
        <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '', address: '', b_type: '아파트' }); setIsModalOpen(true);}} className="fixed bottom-10 right-8 bg-yellow-500 text-black p-5 rounded-2xl shadow-2xl z-50 active:scale-90 transition-all animate-pulse">
          <Plus size={30} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
