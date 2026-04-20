"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, X, Save, MapPin, History, RotateCcw, BarChart3, Settings, Download, Upload, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 한글 초성 검색 엔진 (고정)
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

// [로고] public/logo.png 사용 (고정)
const DeliveryScooterLogo = ({ className = "" }) => (
  <img src="/logo.png" alt="영종도 라이더 로고" className={`${className} object-contain`} />
);

// [낙관] (고정)
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
  const [activeTab, setActiveTab] = useState('Home'); // 초기 상태 Home (리스트 숨김)
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [stats, setStats] = useState({ visits: 0, logs: [] as any[] });
  const [formData, setFormData] = useState({ region: '운서', name: '', password: '', note: '' });
  const [ip, setIp] = useState('');

  const fetchData = async () => {
    const { data: b } = await supabase.from('buildings').select('*').order('updated_at', { ascending: false });
    if (b) setData(b);
    const { count } = await supabase.from('site_visits').select('*', { count: 'exact', head: true });
    setStats(prev => ({ ...prev, visits: count || 0 }));
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
        supabase.from('site_visits').insert([{ ip: resData.ip }]).then(() => sessionStorage.setItem('v', '1'));
      }
    });
  }, []);

  const handleAdminAuth = () => {
    const pw = prompt('관리자 비밀번호를 입력하세요.');
    if (pw === 'bb3145Fm!@') { 
      setIsAdmin(true);
      setAdminMode(true);
      fetchStats();
    } else {
      alert('접근 권한이 없습니다.');
    }
  };

  const exportToCSV = () => {
    const headers = ["지역,건물명,비밀번호,특이사항"];
    const rows = data.map(i => `${i.region},${i.name},${i.password},${i.note || ''}`);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `영종라이더_데이터_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importCSV = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const text = event.target.result;
      const rows = text.split("\n").slice(1);
      for (let row of rows) {
        const [region, name, password, note] = row.split(",");
        if (name && password) {
          await supabase.from('buildings').insert([{ region: region.trim(), name: name.trim(), password: password.trim(), note: note?.trim() || '', updated_at: new Date() }]);
        }
      }
      fetchData();
      alert('데이터 동기화 완료');
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.password) return alert('필수 항목을 입력하세요.');
    const logData = { building_id: editingItem?.id, old_name: editingItem?.name, old_password: editingItem?.password, old_note: editingItem?.note, ip };
    
    if (editingItem) {
      await supabase.from('building_logs').insert([logData]);
      await supabase.from('buildings').update({ ...formData, updated_at: new Date() }).eq('id', editingItem.id);
    } else {
      await supabase.from('buildings').insert([{ ...formData, updated_at: new Date() }]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  // 핵심 UI 로직: Home 상태(첫 접속)이면서 검색어가 없을 때만 리스트를 비움
  const isInitialState = activeTab === 'Home' && searchTerm === '';
  const filtered = isInitialState ? [] : data.filter(i => {
    const regionMatch = activeTab === '전체' || activeTab === 'Home' || i.region === activeTab;
    const lowerSearch = searchTerm.toLowerCase();
    const chosung = getChosung(i.name);
    return regionMatch && (i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm) || chosung.includes(lowerSearch));
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-40 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1000&auto=format')] bg-cover bg-center opacity-[0.04] grayscale pointer-events-none z-0"></div>

      {/* 헤더: 압축 레이아웃 고정 */}
      <div className="bg-[#0f172a]/95 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg shadow-2xl">
        <div className="p-3.5 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <DeliveryScooterLogo className="w-10 h-10 shrink-0 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
            <div className="flex items-baseline gap-1.5 min-w-0">
              <h1 className="text-base font-black text-white italic tracking-tighter shrink-0">영종도 <span className="text-yellow-400">배달 라이더</span></h1>
              <span className="text-slate-800 text-[10px] shrink-0">//</span>
              <span className="text-[9px] text-slate-500 font-bold tracking-tighter truncate font-mono">공동현관 출입 정보망</span>
            </div>
          </div>
          <button onClick={handleAdminAuth} className="text-[8px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1 shrink-0 shadow-inner active:scale-95 transition-all">
            <BarChart3 size={9} className="text-yellow-500"/> {stats.visits}
          </button>
        </div>

        {/* 검색창: 초성 안내 문구 절대 고정 */}
        {!adminMode && (
          <div className="px-5 pb-5 relative z-10">
            <div className="relative group flex flex-col justify-center">
              <Search className="absolute left-4 text-slate-800 group-focus-within:text-yellow-500 transition-colors z-20" size={18} />
              <input 
                type="text" 
                className="w-full p-4 pl-11 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none shadow-xl transition-all font-bold" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeTab === 'Home') setActiveTab('전체'); // 검색 시작 시 리스트 활성화
                }} 
              />
              {!searchTerm && (
                <span className="absolute left-11 text-[12px] text-slate-700 font-bold pointer-events-none opacity-50">건물명 초성 검색 가능 (예: ㄱㄹㄷㅂ)</span>
              )}
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
              {['전체', '운서', '하늘', '화장실'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all text-xs ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800/40 text-slate-600 border border-slate-700/30'}`}>{t}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리스트 구역 */}
      {!adminMode && (
        <div className="p-5 space-y-4 relative z-10 min-h-[50px]">
          {filtered.map(i => (
            <div key={i.id} className="bg-[#111827] p-5 rounded-[2.5rem] border border-slate-800/40 shadow-inner group transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-2">
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{i.region}</span>
                  <h2 className="text-xl font-bold mt-1 text-white tracking-tight break-keep">{i.name}</h2>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note }); setIsModalOpen(true);}} className="bg-slate-800/50 p-2.5 rounded-xl text-slate-600 hover:text-yellow-500 border border-slate-700/20 active:scale-90 transition-transform"><Edit2 size={16} /></button>
                  <button onClick={() => {navigator.clipboard.writeText(i.password); alert('복사됨');}} className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500 border border-yellow-500/20 shadow-lg active:scale-90 transition-all"><Copy size={18} /></button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/40 flex justify-between items-end gap-3">
                <span className="text-3xl font-mono font-black text-yellow-400 tracking-tighter drop-shadow-md">{i.password}</span>
                <p className="text-[11px] text-slate-500 max-w-[50%] text-right font-medium leading-tight opacity-80 break-keep">{i.note || '-'}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && searchTerm && (
            <div className="text-center py-20 text-slate-600 font-bold italic">검색 결과가 없습니다.</div>
          )}
        </div>
      )}

      {/* 관리자 모드 */}
      {adminMode && (
        <div className="p-5 space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2 uppercase tracking-tighter"><ShieldCheck /> Admin</h2>
            <button onClick={() => setAdminMode(false)} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-slate-400">Exit</button>
          </div>
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-300 flex items-center gap-2"><Download size={16}/> 엑셀(CSV) 관리</h3>
            <div className="flex gap-2">
              <button onClick={exportToCSV} className="flex-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 p-4 rounded-2xl font-black flex flex-col items-center gap-2 active:scale-95 transition-all"><Download size={24} /> 다운로드</button>
              <label className="flex-1 bg-green-600/20 text-green-400 border border-green-600/30 p-4 rounded-2xl font-black flex flex-col items-center gap-2 active:scale-95 transition-all cursor-pointer text-center">
                <Upload size={24} className="mx-auto" /> 업로드
                <input type="file" className="hidden" accept=".csv" onChange={importCSV} />
              </label>
            </div>
          </div>
          <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-[3rem] border border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-300 flex items-center gap-2"><History size={16}/> 장난방지 로그 & 롤백</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
              {stats.logs.map((log: any, idx) => (
                <div key={idx} className="bg-black/40 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="text-yellow-500 font-mono font-bold">{log.old_password} <span className="text-slate-600 font-normal">({log.ip})</span></p>
                    <p className="text-slate-500 text-[10px]">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={async () => {
                    if(confirm('이전 정보로 돌릴까요?')) {
                      await supabase.from('buildings').update({ name: log.old_name, password: log.old_password, note: log.old_note }).eq('id', log.building_id);
                      alert('복구 완료'); fetchData();
                    }
                  }} className="bg-red-600/20 text-red-400 p-2 rounded-xl border border-red-600/30 active:scale-90"><RotateCcw size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 푸터: 검색 전일 때 웅장하게 노출 */}
      <footer className={`flex flex-col items-center text-center px-6 transition-all duration-700 relative z-10 ${isInitialState ? 'mt-24 opacity-100' : 'mt-10 opacity-30 scale-95'}`}>
        <div className="w-full max-w-sm bg-[#1e293b]/60 backdrop-blur-md p-8 rounded-[3.5rem] border border-slate-800 shadow-2xl flex flex-col items-center gap-5">
          <AnRaMuBokSeal className="w-16 h-16 shadow-2xl shadow-red-900/40" />
          <div className="space-y-2">
            <p className="text-[11px] text-yellow-500 font-black tracking-[0.2em] uppercase mb-1">STAY ALERT, RIDE SAFE</p>
            <p className="text-[15px] text-white font-black leading-snug tracking-tight break-keep">오늘도 영종도의 모든 길 위에서<br /><span className="text-yellow-500 font-black">안라무복</span>하시길 기원합니다.</p>
          </div>
          <div className="w-12 h-px bg-slate-800 mx-auto opacity-50 my-1"></div>
          <div className="bg-[#070b14] px-5 py-2.5 rounded-2xl border border-slate-800 shadow-inner group transition-all">
            <p className="text-[12px] text-white font-bold tracking-tight">만든이 : <span className="text-yellow-400 font-black ml-1 uppercase">부업맨 HoJun</span></p>
          </div>
        </div>
      </footer>

      {/* 모달 및 플로팅 버튼 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-sm">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[3rem] p-8 border border-slate-800 shadow-3xl">
            <h3 className="text-2xl font-black text-yellow-400 mb-8 tracking-tighter uppercase">{editingItem ? 'Edit Info' : 'New Entry'}</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {['운서', '하늘', '화장실'].map(r => (
                  <button key={r} onClick={() => setFormData({...formData, region: r})} className={`py-3 rounded-2xl font-bold border transition-all ${formData.region === r ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'bg-slate-900/50 border-slate-800 text-slate-600 bg-slate-800/50'}`}>{r}</button>
                ))}
              </div>
              <input type="text" placeholder="건물 명칭" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none focus:border-yellow-500 font-bold placeholder:text-slate-800 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="현관 비밀번호" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-yellow-400 font-mono text-xl outline-none focus:border-yellow-500 placeholder:text-slate-800 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4.5 bg-[#070b14] rounded-2xl border border-slate-800 text-white outline-none h-24 placeholder:text-slate-800 shadow-inner" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <div className="flex gap-2.5 mt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-5 rounded-2xl font-bold text-white border border-slate-700/50">Cancel</button>
                <button onClick={handleSave} className="flex-[2] bg-yellow-500 text-black p-5 rounded-2xl font-black text-xl shadow-yellow-500/10">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!adminMode && (
        <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '' }); setIsModalOpen(true);}} className="fixed bottom-10 right-8 bg-yellow-500 text-black p-5 rounded-2xl shadow-2xl z-50 active:scale-90 transition-all animate-pulse">
          <Plus size={30} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
