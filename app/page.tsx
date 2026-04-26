"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, MapPin, History, RotateCcw, BarChart3, Calendar as CalendarIcon, ShieldCheck, ChevronLeft, ChevronRight, ExternalLink, Trash2, UserCheck, Bath, AlertTriangle, PenLine, Clock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

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

const DeliveryScooterLogo = ({ className = "" }) => (
  <img src="/logo.png" alt="로고" className={`${className} object-contain`} />
);
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
  const [stats, setStats] = useState({ visits: 0, todayVisits: 0, logs: [] as any[] });
  const [ip, setIp] = useState('');

  // 날짜 계산 (한국 시간 보정)
  const getKSTDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const kst = new Date(now.getTime() - offset + (9 * 3600000));
    return kst.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getKSTDate());
  const [formData, setFormData] = useState({ region: '', name: '', password: '', note: '', address: '', b_type: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    const { data: b } = await supabase.from('buildings').select('*').order('updated_at', { ascending: false });
    if (b) setData(b);
    
    // 방문자 수 통계
    const { count: total } = await supabase.from('site_visits').select('*', { count: 'exact', head: true });
    const { count: today } = await supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', getKSTDate());
    setStats(prev => ({ ...prev, visits: total || 0, todayVisits: today || 0 }));
  };

  const fetchStats = async () => {
    const { data: logs } = await supabase.from('building_logs').select('*').order('created_at', { ascending: false });
    setStats(prev => ({ ...prev, logs: logs || [] }));
  };

  useEffect(() => {
    fetchData();
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(resData => {
      setIp(resData.ip);
      if (!sessionStorage.getItem('v')) {
        supabase.from('site_visits').insert([{ ip: resData.ip }]).then(() => {
          sessionStorage.setItem('v', '1');
          fetchData();
        });
      }
    });
  }, []);

  const handleAdminAuth = () => {
    const pw = prompt('관리자 비밀번호를 입력하세요.');
    if (pw === 'bb3145Fm!@') { setAdminMode(true); fetchStats(); }
    else alert('접근 권한이 없습니다.');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.password) return alert('필수 내용을 입력하세요.');
    
    const logEntry = { 
      event_type: editingItem ? 'EDIT' : 'ADD',
      old_name: editingItem ? editingItem.name : formData.name, 
      old_password: editingItem ? editingItem.password : formData.password, 
      old_note: editingItem ? editingItem.note : formData.note, 
      old_address: editingItem ? editingItem.address : formData.address, 
      old_b_type: editingItem ? editingItem.b_type : formData.b_type, 
      old_region: editingItem ? editingItem.region : formData.region,
      ip 
    };

    if (editingItem) {
      logEntry['building_id'] = editingItem.id;
      await supabase.from('building_logs').insert([logEntry]);
      await supabase.from('buildings').update({ ...formData, updated_at: new Date() }).eq('id', editingItem.id);
    } else {
      const { data: inserted } = await supabase.from('buildings').insert([{ ...formData, updated_at: new Date() }]).select();
      if (inserted) {
        logEntry['building_id'] = inserted[0].id;
        await supabase.from('building_logs').insert([logEntry]);
      }
    }
    setIsModalOpen(false); fetchData(); if(adminMode) fetchStats();
    alert("저장되었습니다.");
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (confirm(`'${editingItem.name}' 데이터를 삭제하시겠습니까?`)) {
      const logEntry = { building_id: editingItem.id, old_name: `[삭제됨] ${editingItem.name}`, old_password: editingItem.password, old_note: editingItem.note, old_address: editingItem.address, old_b_type: editingItem.b_type, old_region: editingItem.region, event_type: 'DELETE', ip };
      await supabase.from('building_logs').insert([logEntry]);
      await supabase.from('buildings').delete().eq('id', editingItem.id);
      setIsModalOpen(false); fetchData(); if(adminMode) fetchStats();
    }
  };

  const isInitialState = activeTab === 'Home' && searchTerm === '';
  let filtered = isInitialState ? [] : data.filter(i => {
    const lowerSearch = searchTerm.toLowerCase();
    const chosung = getChosung(i.name);
    const searchMatch = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm) || chosung.includes(lowerSearch);
    if (searchTerm !== '') return searchMatch;
    return (activeTab === '전체' || activeTab === '최근변경' || activeTab === 'Home') || i.region === activeTab;
  });

  if (activeTab === '최근변경') filtered = [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-40 relative overflow-x-hidden text-sm">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1000&auto=format')] bg-cover bg-center opacity-[0.04] grayscale pointer-events-none z-0"></div>

      {/* 헤더 [잠금: 오늘 방문자 통계] */}
      <div className="bg-[#0f172a]/95 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg shadow-2xl">
        <div className="p-3.5 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <DeliveryScooterLogo className="w-10 h-10 shrink-0 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
            <div className="flex items-baseline gap-1.5 min-w-0">
              <h1 className="text-base font-black text-white italic tracking-tighter shrink-0">영종도 <span className="text-yellow-400">배달 라이더</span></h1>
              <span className="text-slate-800 text-[10px] shrink-0">//</span>
              <span className="text-[9px] text-slate-500 font-bold tracking-tighter truncate font-mono uppercase">Access Point Info</span>
            </div>
          </div>
          <button onClick={handleAdminAuth} className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-inner active:scale-95 transition-all">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[7px] text-slate-500 font-bold uppercase mb-0.5 tracking-tighter">Today</span>
              <span className="text-[11px] font-black text-yellow-500">{stats.todayVisits}</span>
            </div>
            <div className="w-px h-4 bg-slate-800 mx-0.5"></div>
            <div className="flex flex-col items-end leading-none">
              <span className="text-[7px] text-slate-500 font-bold uppercase mb-0.5 tracking-tighter">Total</span>
              <span className="text-[11px] font-black text-white">{stats.visits}</span>
            </div>
          </button>
        </div>

        {/* 검색창 [잠금] */}
        {!adminMode && (
          <div className="px-5 pb-5 relative z-10">
            <div className="relative group flex flex-col justify-center">
              <Search className="absolute left-4 text-slate-800 group-focus-within:text-yellow-500 transition-colors z-20" size={18} />
              <input 
                type="text" 
                className="w-full p-4 pl-11 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none shadow-xl transition-all font-bold placeholder:text-slate-700" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (activeTab === 'Home') setActiveTab('전체'); }} 
                placeholder={searchTerm ? "" : "건물명 초성 검색 가능 (예: ㄱㄹㄷㅂ)"}
              />
            </div>
            <div className="flex gap-1.5 mt-4 overflow-x-auto no-scrollbar pb-1">
              {['운서', '하늘', '운남', '화장실', '최근변경', '전체'].map(t => (
                <button key={t} onClick={() => setActiveTab(activeTab === t ? 'Home' : t)} className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800/40 text-slate-500 border border-slate-700/30'}`}>{t}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리스트 구역 [잠금: 시안성 디자인] */}
      {!adminMode && (
        <div className="p-5 space-y-5 relative z-10 min-h-[50px]">
          {filtered.map(i => {
            const isToilet = i.region === '화장실';
            return (
              <div key={i.id} className={`bg-[#111827]/90 p-5 rounded-[2.5rem] border ${isToilet ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-slate-800/60 shadow-2xl'} transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-[8px] ${isToilet ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-800 text-slate-500'} px-2 py-0.5 rounded-lg font-black uppercase tracking-widest`}>{i.region || '미분류'}</span>
                      {i.b_type && <span className={`text-[8px] bg-yellow-500/10 px-2 py-0.5 rounded-lg font-black text-yellow-500 uppercase border border-yellow-500/20`}>{i.b_type}</span>}
                    </div>
                    <div className="flex items-start gap-2">
                      {isToilet && <Bath size={18} className="text-cyan-400 shrink-0 mt-0.5" />}
                      <h2 className={`text-xl font-black ${isToilet ? 'text-cyan-100' : 'text-white'} tracking-tighter break-keep leading-tight`}>{i.name}</h2>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => {setEditingItem(i); setFormData({ region: i.region || '', name: i.name, password: i.password, note: i.note, address: i.address || '', b_type: i.b_type || '' }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-yellow-500 border border-slate-800/50 active:scale-90 transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => {navigator.clipboard.writeText(i.password); alert('복사됨');}} className={`${isToilet ? 'bg-cyan-500' : 'bg-yellow-500'} p-2.5 rounded-xl text-black shadow-lg active:scale-90 transition-all`}><Copy size={18} /></button>
                  </div>
                </div>
                <div className="bg-black/40 border border-slate-800/40 p-4 rounded-3xl flex items-center justify-center">
                   <span className={`text-4xl font-mono font-black ${isToilet ? 'text-cyan-400' : 'text-yellow-400'} tracking-tighter`}>{i.password}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 관리자 모드 [업그레이드: 실시간 로그 & 롤백] */}
      {adminMode && (
        <div className="p-5 space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tighter flex items-center gap-2"><ShieldCheck /> Admin</h2>
            <button onClick={() => setAdminMode(false)} className="text-xs bg-red-600/10 text-red-500 px-4 py-2 rounded-xl font-bold border border-red-900/30">Exit</button>
          </div>

          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm"><CalendarIcon size={16}/> Activity Calendar</h3>
              <div className="flex items-center gap-4 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft size={16}/></button>
                <span className="text-xs font-black text-yellow-400 font-mono">{currentDate.getFullYear()}. {currentDate.getMonth() + 1}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())}).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}).map((_, i) => {
                const day = i + 1;
                const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEdit = stats.logs.some(l => l.created_at.startsWith(dStr));
                const isSelected = selectedDate === dStr;
                return (
                  <button key={day} onClick={() => setSelectedDate(dStr)} className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg scale-110 z-10' : hasEdit ? 'bg-red-500/20 border-red-500/40 text-white' : 'bg-slate-900/30 border-slate-800 text-slate-600 opacity-40'}`}>
                    <span className="text-[11px] font-black">{day}</span>
                    {hasEdit && !isSelected && <div className="w-1 h-1 bg-red-500 rounded-full mt-0.5 animate-pulse"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm"><History size={16}/> Logs for {selectedDate}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar">
              {stats.logs.filter(l => l.created_at.startsWith(selectedDate)).length === 0 ? (
                <div className="text-center py-10 opacity-30 italic font-bold">No activity logged.</div>
              ) : (
                stats.logs.filter(l => l.created_at.startsWith(selectedDate)).map((log, idx) => (
                  <div key={`l-${idx}`} className={`bg-black/40 p-4 rounded-3xl border border-slate-800 border-l-4 ${log.event_type === 'ADD' ? 'border-l-green-500' : log.event_type === 'DELETE' ? 'border-l-red-500' : 'border-l-blue-500'} space-y-3`}>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="text-slate-500 font-bold mb-1 flex items-center gap-1"><Clock size={10} /> {new Date(log.created_at).toLocaleTimeString()} • {log.ip}</p>
                        <h4 className="font-black text-white truncate"><span className="text-[9px] px-1 bg-slate-800 rounded mr-1">{log.event_type}</span>{log.old_name}</h4>
                      </div>
                      {log.event_type !== 'ADD' && (
                        <button onClick={async () => {
                          if(confirm(`정보를 완벽 복구할까요?`)) {
                            await supabase.from('buildings').upsert({ id: log.building_id, name: log.old_name.replace('[삭제됨] ', ''), password: log.old_password, note: log.old_note, address: log.old_address, b_type: log.old_b_type, region: log.old_region, updated_at: new Date() });
                            fetchData(); fetchStats();
                          }
                        }} className="bg-red-600 text-white p-2 rounded-2xl active:scale-95 shadow-lg"><RotateCcw size={16}/></button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 푸터 [잠금] */}
      <footer className={`flex flex-col items-center text-center px-6 transition-all duration-700 relative z-10 ${isInitialState ? 'mt-24 opacity-100' : 'mt-10 opacity-30 scale-95'}`}>
        <div className="w-full max-w-sm bg-[#1e293b]/60 backdrop-blur-md p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl flex flex-col items-center gap-5">
          <AnRaMuBokSeal className="w-16 h-16 shadow-2xl shadow-red-900/40" />
          <div className="space-y-2">
            <p className="text-[11px] text-yellow-500 font-black tracking-[0.2em] uppercase mb-1">STAY ALERT, RIDE SAFE</p>
            <p className="text-[15px] text-white font-black leading-snug tracking-tight break-keep">오늘도 영종도의 모든 길 위에서<br /><span className="text-yellow-400 font-black">안라무복</span>하시길 기원합니다.</p>
          </div>
          <div className="bg-[#070b14] px-5 py-2.5 rounded-2xl border border-slate-800 shadow-inner group">
            <p className="text-[12px] text-white font-bold tracking-tight">만든이 : <span className="text-yellow-400 font-black ml-1 uppercase transition-colors">부업맨 HoJun</span></p>
          </div>
        </div>
      </footer>

      {/* 모달 [잠금] */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-sm">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-800 shadow-3xl break-keep relative">
            {editingItem && <button onClick={handleDelete} className="absolute top-8 right-8 text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all"><Trash2 size={22} /></button>}
            <h3 className="text-2xl font-black text-yellow-400 mb-8 tracking-tighter uppercase">{editingItem ? 'Edit Info' : 'New Entry'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {['운서', '하늘', '운남', '화장실'].map(r => (
                  <button key={r} onClick={() => setFormData({...formData, region: formData.region === r ? '' : r})} className={`py-2 rounded-xl font-bold border transition-all text-[11px] ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{r}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['아파트', '오피스텔', '빌라'].map(t => (
                  <button key={t} onClick={() => setFormData({...formData, b_type: formData.b_type === t ? '' : t})} className={`py-2 rounded-xl font-bold border transition-all text-[11px] ${formData.b_type === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{t}</button>
                ))}
              </div>
              <input type="text" placeholder="건물 명칭 (필수)" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none focus:border-yellow-500 font-bold placeholder:text-slate-800 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="현관 비밀번호 (필수)" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-yellow-400 font-mono text-xl outline-none focus:border-yellow-500 placeholder:text-slate-800 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <input type="text" placeholder="네이버 연동 주소" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-blue-400 text-xs outline-none focus:border-blue-500 placeholder:text-slate-800 shadow-inner" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none h-20 shadow-inner" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <div className="flex gap-2.5 mt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-5 rounded-2xl font-bold text-white border border-slate-700/50 active:scale-95 transition-all">취소</button>
                <button onClick={handleSave} className="flex-[2] bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl shadow-xl shadow-yellow-500/10 active:scale-95 transition-all">저장하기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [잠금] 플로팅 버튼 */}
      {!adminMode && (
        <button 
          onClick={() => {setEditingItem(null); setFormData({ region: '', name: '', password: '', note: '', address: '', b_type: '' }); setIsModalOpen(true);}} 
          className="fixed bottom-10 right-6 bg-yellow-500/80 backdrop-blur-md text-black pl-5 pr-6 py-4 rounded-full shadow-[0_15px_35px_rgba(234,179,8,0.3)] z-[60] active:scale-90 transition-all flex items-center gap-2 group border-4 border-black/10 animate-pulse-slow overflow-hidden"
        >
          <div className="bg-black text-yellow-500 p-1.5 rounded-lg animate-scribble">
            <PenLine size={18} strokeWidth={3} />
          </div>
          <span className="font-black text-[13px] uppercase tracking-tighter whitespace-nowrap">Add Info</span>
        </button>
      )}

      <style jsx global>{`
        @keyframes scribble {
          0%, 100% { transform: rotate(0deg) translate(0, 0); }
          25% { transform: rotate(-12deg) translate(-1px, -1px); }
          50% { transform: rotate(12deg) translate(1px, 1px); }
          75% { transform: rotate(-8deg) translate(-1px, 1px); }
        }
        .animate-scribble { animation: scribble 1.5s infinite ease-in-out; }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); box-shadow: 0 15px 35px rgba(234,179,8,0.4); }
          50% { transform: scale(1.03); box-shadow: 0 20px 45px rgba(234,179,8,0.6); }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
}
