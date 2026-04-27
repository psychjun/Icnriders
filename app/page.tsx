"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, MapPin, History, RotateCcw, BarChart3, Calendar as CalendarIcon, ShieldCheck, ChevronLeft, ChevronRight, ExternalLink, Trash2, UserCheck, Bath, AlertTriangle, PenLine, Clock, TrendingUp, Users, FilePlus, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// [잠금] 초성 검색 엔진
const getChosung = (str: string) => {
  if (!str) return "";
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

const KoreanRestroomPictogram = ({ className = "", size = 20 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="currentColor">
    <rect x="49" y="10" width="2" height="80" rx="1" opacity="0.3" />
    <circle cx="28" cy="22" r="10"/><path d="M28 36H16c-3.3 0-6 2.7-6 6v22h8v24c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V64h4v24c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V64h8V42c0-3.3-2.7-6-6-6Z"/>
    <circle cx="72" cy="22" r="10"/><path d="M72 36H60c-3.3 0-6 2.7-6 6v18c0 1.7.7 3.2 1.8 4.3l8 8v16c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V72.3l8-8c1.1-1.1 1.8-2.6 1.8-4.3V42c0-3.3-2.7-6-6-6Z"/>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Home'); 
  const [adminMode, setAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [stats, setStats] = useState({ visits: 0, todayVisits: 0, logs: [] as any[], visitLogs: [] as any[] });
  const [ip, setIp] = useState('');
  const [showVisitorList, setShowVisitorList] = useState(false);

  const getKSTDateString = (date = new Date()) => {
    return new Date(date.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getKSTDateString());
  const [formData, setFormData] = useState({ region: '', name: '', password: '', note: '', address: '', b_type: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    const { data: b } = await supabase.from('buildings').select('*').order('updated_at', { ascending: false });
    if (b) setData(b);
    const todayStr = getKSTDateString();
    const { count: totalCount } = await supabase.from('site_visits').select('*', { count: 'exact', head: true });
    const { count: todayCount } = await supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('created_at', `${todayStr}T00:00:00Z`);
    setStats(prev => ({ ...prev, visits: totalCount || 0, todayVisits: todayCount || 0 }));
  };

  const fetchStats = async () => {
    const { data: logs } = await supabase.from('building_logs').select('*').order('created_at', { ascending: false });
    const { data: vLogs } = await supabase.from('site_visits').select('*').order('created_at', { ascending: false });
    setStats(prev => ({ ...prev, logs: logs || [], visitLogs: vLogs || [] }));
  };

  useEffect(() => {
    fetchData();
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(resData => {
      setIp(resData.ip);
      const visitKey = `v_${getKSTDateString()}`;
      if (!sessionStorage.getItem(visitKey)) {
        supabase.from('site_visits').insert([{ ip: resData.ip }]).then(() => {
          sessionStorage.setItem(visitKey, '1');
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
    const logEntry = { event_type: editingItem ? 'EDIT' : 'ADD', old_name: editingItem ? editingItem.name : formData.name, old_password: editingItem ? editingItem.password : formData.password, old_note: editingItem ? editingItem.note : formData.note, old_address: editingItem ? editingItem.address : formData.address, old_b_type: editingItem ? editingItem.b_type : formData.b_type, old_region: editingItem ? editingItem.region : formData.region, ip };
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
    const nameChosung = getChosung(i.name).toLowerCase();
    const noteChosung = getChosung(i.note || "").toLowerCase();
    const isToilet = i.region === '화장실';
    let match = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm) || nameChosung.includes(lowerSearch);
    if (isToilet) match = match || (i.note && i.note.toLowerCase().includes(lowerSearch)) || noteChosung.includes(lowerSearch);
    if (searchTerm !== '') return match;
    return (activeTab === '전체' || activeTab === '최근변경' || activeTab === 'Home') || i.region === activeTab;
  });

  if (activeTab === '최근변경') filtered = [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // [신규] 특정 날짜의 상세 데이터 계산 엔진
  const selectedDayDetail = useMemo(() => {
    if (!adminMode) return null;
    const dayLogs = stats.logs.filter(l => l.created_at.startsWith(selectedDate));
    const dayVisits = stats.visitLogs.filter(v => v.created_at.startsWith(selectedDate));
    
    // IP별 방문 횟수 집계
    const ipCounts = dayVisits.reduce((acc: any, curr) => {
      acc[curr.ip] = (acc[curr.ip] || 0) + 1;
      return acc;
    }, {});

    return {
      visitCount: dayVisits.length,
      addCount: dayLogs.filter(l => l.event_type === 'ADD').length,
      editCount: dayLogs.filter(l => l.event_type === 'EDIT' || l.event_type === 'DELETE').length,
      visitorDetails: Object.entries(ipCounts).sort((a:any, b:any) => b[1] - a[1])
    };
  }, [adminMode, selectedDate, stats.logs, stats.visitLogs]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-40 relative overflow-x-hidden text-sm">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1000&auto=format')] bg-cover bg-center opacity-[0.04] grayscale pointer-events-none z-0"></div>

      {/* 헤더 [잠금] */}
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

        {!adminMode && (
          <div className="px-5 pb-5 relative z-10">
            <div className="relative group flex flex-col justify-center">
              <Search className="absolute left-4 text-slate-800 group-focus-within:text-yellow-500 transition-colors z-20" size={18} />
              <input 
                type="text" 
                className="w-full p-4 pl-11 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none shadow-xl transition-all font-bold placeholder:text-slate-700" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (activeTab === 'Home') setActiveTab('전체'); }} 
                placeholder={searchTerm ? "" : "건물명 또는 화장실 상가명 초성 검색"}
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

      {/* 리스트 구역 [잠금] */}
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
                      {isToilet ? <KoreanRestroomPictogram size={22} className="text-cyan-400 shrink-0 mt-0.5" /> : null}
                      <h2 className={`text-xl font-black ${isToilet ? 'text-cyan-100' : 'text-white'} tracking-tighter break-keep leading-tight`}>{i.name}</h2>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => {setEditingItem(i); setFormData({ region: i.region || '', name: i.name, password: i.password, note: i.note || '', address: i.address || '', b_type: i.b_type || '' }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-yellow-500 border border-slate-800/50 active:scale-90 transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => {navigator.clipboard.writeText(i.password); alert('복사됨');}} className={`${isToilet ? 'bg-cyan-500 shadow-cyan-500/20' : 'bg-yellow-500 shadow-yellow-500/20'} p-2.5 rounded-xl text-black shadow-lg active:scale-90 transition-all`}><Copy size={18} /></button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`bg-black/40 border ${isToilet ? 'border-cyan-500/20' : 'border-slate-800/40'} p-4 rounded-3xl flex items-center justify-center`}>
                     <span className={`text-4xl font-mono font-black ${isToilet ? 'text-cyan-400' : 'text-yellow-400'} tracking-tighter drop-shadow-md`}>{i.password}</span>
                  </div>
                  {i.note && <p className="text-[12px] text-slate-400 font-medium px-1 break-keep leading-snug"><span className={`${isToilet ? 'text-cyan-600' : 'text-slate-600'} font-black mr-2 uppercase`}>Note:</span> {i.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 관리자 모드 [업그레이드: 인디케이터 기반 캘린더 & 정밀 분석 패널] */}
      {adminMode && (
        <div className="p-5 space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tighter flex items-center gap-2"><ShieldCheck /> Admin Dashboard</h2>
            <button onClick={() => setAdminMode(false)} className="text-xs bg-red-600/10 text-red-500 px-4 py-2 rounded-xl font-bold border border-red-900/30">Exit</button>
          </div>

          {/* [업그레이드] 인디케이터 기반 캘린더 */}
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm"><CalendarIcon size={16}/> Activity Map</h3>
              <div className="flex items-center gap-4 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}><ChevronLeft size={16}/></button>
                <span className="text-xs font-black text-yellow-400 font-mono">{currentDate.getFullYear()}. {currentDate.getMonth() + 1}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())}).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())}).map((_, i) => {
                const day = i + 1;
                const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEditLogs = stats.logs.filter(l => l.created_at.startsWith(dStr));
                const hasVisit = stats.visitLogs.some(v => v.created_at.startsWith(dStr));
                const isSelected = selectedDate === dStr;
                
                return (
                  <button key={day} onClick={() => setSelectedDate(dStr)} 
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all relative
                    ${isSelected ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110 z-10' 
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-400'}`}>
                    
                    <span className="text-[13px] font-black">{day}</span>
                    
                    {/* 방문자 인디케이터: 하단 파란색 바 */}
                    {hasVisit && (
                      <div className={`absolute bottom-1.5 w-5 h-0.5 rounded-full ${isSelected ? 'bg-black/40' : 'bg-blue-500/60'}`}></div>
                    )}
                    
                    {/* [돋보임] 입력/수정 인디케이터: 우상단 빨간색 글로우 점 */}
                    {dayEditLogs.length > 0 && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-4 px-2">
               <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase"><div className="w-2 h-0.5 bg-blue-500/60 rounded-full"></div> Visitors</div>
               <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase"><div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.6)]"></div> Data Activity</div>
            </div>
          </div>

          {/* [신규] 날짜별 정밀 분석 패널 */}
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white tracking-tighter flex items-center gap-2">
                <Clock size={18} className="text-yellow-500" /> {selectedDate} Report
              </h3>
              <div className="bg-black/40 px-3 py-1 rounded-xl border border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Date</div>
            </div>

            {/* 주요 지표 3종 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800/60 text-center">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Visits</p>
                <p className="text-xl font-black text-blue-400">{selectedDayDetail?.visitCount}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800/60 text-center">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">New Data</p>
                <p className="text-xl font-black text-green-500">{selectedDayDetail?.addCount}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800/60 text-center">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Modifications</p>
                <p className="text-xl font-black text-red-500">{selectedDayDetail?.editCount}</p>
              </div>
            </div>

            {/* [신규] 방문자 IP 리스트 (펼쳐보기) */}
            <div className="space-y-3">
              <button 
                onClick={() => setShowVisitorList(!showVisitorList)}
                className="w-full flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 hover:bg-slate-900/60 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-xs font-black text-slate-300">Detailed Visitor IP List</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg ml-1 font-bold">{selectedDayDetail?.visitorDetails.length} Users</span>
                </div>
                {showVisitorList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showVisitorList && (
                <div className="bg-black/20 rounded-3xl border border-slate-800/40 p-2 space-y-1 max-h-48 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-300">
                  {selectedDayDetail?.visitorDetails.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-600 font-bold italic">No visitor data available.</p>
                  ) : (
                    selectedDayDetail?.visitorDetails.map(([ip, count]: any, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-[11px] font-mono font-bold text-slate-300">{ip}</span>
                        </div>
                        <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg">{count} hits</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 활동 로그 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase mb-2">
                <History size={12} /> Action Logs
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                {stats.logs.filter(l => l.created_at.startsWith(selectedDate)).length === 0 ? (
                  <div className="text-center py-10 opacity-30 italic font-bold text-xs">No data activity logged for this date.</div>
                ) : (
                  stats.logs.filter(l => l.created_at.startsWith(selectedDate)).map((log, idx) => (
                    <div key={`l-${idx}`} className={`bg-black/40 p-4 rounded-3xl border border-slate-800 border-l-4 ${log.event_type === 'ADD' ? 'border-l-green-500' : log.event_type === 'DELETE' ? 'border-l-red-500' : 'border-l-blue-500'} space-y-3`}>
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="text-[10px] text-slate-500 font-bold mb-1 flex items-center gap-1"><Clock size={10} /> {new Date(log.created_at).toLocaleTimeString()} • {log.ip}</p>
                          <h4 className="font-black text-white truncate"><span className="text-[9px] px-1 bg-slate-800 rounded mr-1 uppercase">{log.event_type}</span>{log.old_name}</h4>
                        </div>
                        {log.event_type !== 'ADD' && (
                          <button onClick={async () => {
                            if(confirm(`정보를 완벽 복구할까요?\n(수정 전 데이터: ${log.old_password})`)) {
                              await supabase.from('buildings').upsert({ id: log.building_id, name: log.old_name.replace('[삭제됨] ', ''), password: log.old_password, note: log.old_note, address: log.old_address, b_type: log.old_b_type, region: log.old_region, updated_at: new Date() });
                              fetchData(); fetchStats(); alert("복구 완료!");
                            }
                          }} className="bg-red-600 text-white p-2.5 rounded-2xl active:scale-95 shadow-lg"><RotateCcw size={16}/></button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                  <button key={r} onClick={() => setFormData({...formData, region: formData.region === r ? '' : r})} className={`py-2 rounded-xl font-bold border transition-all text-[11px] ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'bg-slate-900/50 border-slate-800 text-slate-600'}`}>{r}</button>
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
          className="fixed bottom-10 right-6 bg-yellow-500/80 backdrop-blur-md text-black pl-5 pr-6 py-4 rounded-full shadow-[0_15px_35px_rgba(234,179,8,0.3)] z-[60] active:scale-90 transition-all flex items-center gap-2 group border-4 border-black/10 hover:bg-yellow-500 animate-pulse-slow overflow-hidden"
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
