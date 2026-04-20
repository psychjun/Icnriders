"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Copy, Plus, Edit2, X, Save, MapPin, Navigation } from 'lucide-react';

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

// 배달 박스가 달린 리얼한 스쿠터 아이콘
const DeliveryScooterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 바퀴 */}
    <circle cx="18" cy="46" r="6" stroke="currentColor" strokeWidth="4"/>
    <circle cx="50" cy="46" r="6" stroke="currentColor" strokeWidth="4"/>
    {/* 스쿠터 바디 */}
    <path d="M12 40C12 30 18 24 28 24H44L52 40H12Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M50 40L54 22H58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    {/* 배달 박스 (포인트) */}
    <rect x="14" y="12" width="22" height="18" rx="3" fill="#FBBF24" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M14 21H36" stroke="currentColor" strokeWidth="1.5"/>
    {/* 발판 및 연결부 */}
    <path d="M28 24L32 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
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
    const textMatch = i.name.toLowerCase().includes(lowerSearch) || i.password.includes(searchTerm);
    const chosungMatch = getChosung(i.name).includes(lowerSearch);
    return regionMatch && (textMatch || chosungMatch);
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans tracking-tight pb-32">
      {/* 담백한 영종도 전용 헤더 */}
      <div className="bg-[#0f172a] border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-lg bg-[#0f172a]/95">
        <div className="p-6 flex items-center gap-4 relative z-10">
          <DeliveryScooterIcon className="w-14 h-14 text-yellow-500" />
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white leading-none tracking-tighter">
              영종도 <span className="text-yellow-400">배달 라이더</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
              공동현관 출입 정보망
            </p>
          </div>
        </div>

        {/* 검색 및 탭 */}
        <div className="px-5 pb-5 relative z-10">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="건물명 초성 검색 (예: ㄱㄹㄷㅂ)" 
              className="w-full p-4.5 pl-14 bg-[#1e293b] rounded-2xl border border-slate-700/50 focus:border-yellow-500/60 text-lg focus:outline-none placeholder:text-slate-600 shadow-xl transition-all" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <Search className="absolute left-5 top-4.5 text-slate-600 group-focus-within:text-yellow-500 transition-colors" size={22} />
          </div>
          
          <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
            {['전체', '운서', '하늘', '상가', '화장실'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-sm ${activeTab === t ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>
                <MapPin size={14} className={activeTab === t ? 'text-black/60' : 'text-slate-600'} />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 정보 리스트 */}
      <div className="p-5 space-y-4">
        {filtered.map(i => (
          <div key={i.id} className="bg-[#111827] p-5 rounded-[2rem] border border-slate-800/40 shadow-inner active:bg-[#1a2233] transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-[9px] bg-slate-800/80 px-2 py-0.5 rounded-md font-bold text-slate-400 border border-slate-700/50 uppercase">{i.region}</span>
                <h2 className="text-xl font-bold mt-1.5 text-white tracking-tight">{i.name}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {setEditingItem(i); setFormData({ region: i.region, name: i.name, password: i.password, note: i.note }); setIsModalOpen(true);}} className="bg-slate-800/50 p-3 rounded-xl text-slate-500 border border-slate-700/30 active:scale-90 transition-all"><Edit2 size={16} /></button>
                <button onClick={() => {navigator.clipboard.writeText(i.password); alert('비밀번호 복사 완료!');}} className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500 border border-yellow-500/20 active:scale-90 transition-all"><Copy size={16} /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/40 flex justify-between items-end">
              <span className="text-3xl font-mono font-black text-yellow-400">{i.password}</span>
              <p className="text-xs text-slate-500 max-w-[50%] text-right font-medium leading-relaxed">{i.note || '-'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 겸손하고 깔끔한 푸터 */}
      <footer className="mt-10 pb-20 text-center border-t border-slate-900/30 pt-10 px-10">
        <p className="text-[12px] text-slate-500 font-bold tracking-tight">
          오늘도 안전 운전 하세요.
        </p>
        <p className="text-[11px] text-slate-700 mt-2 font-light italic">
          만든이 : <span className="text-slate-500 font-bold not-italic ml-1">부업맨 HoJun</span>
        </p>
      </footer>

      {/* 추가 버튼 (스크롤 시에도 잘 보이도록 하단 고정) */}
      <button onClick={() => {setEditingItem(null); setFormData({ region: '운서', name: '', password: '', note: '' }); setIsModalOpen(true);}} className="fixed bottom-8 right-8 bg-yellow-500 text-black p-4.5 rounded-2xl shadow-2xl shadow-yellow-500/40 z-50 active:scale-90 transition-all"><Plus size={28} strokeWidth={3} /></button>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700/40">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-yellow-400">{editingItem ? '정보 수정' : '신규 등록'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-800 p-2.5 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">배달 구역</label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {['운서', '하늘', '상가', '화장실'].map(r => (
                    <button key={r} onClick={() => setFormData({...formData, region: r})} className={`py-2.5 rounded-xl font-bold text-xs transition-all ${formData.region === r ? 'bg-yellow-500 text-black' : 'bg-slate-800/50 text-slate-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="건물 명칭" className="w-full p-4 bg-[#070b14] rounded-xl border border-slate-700/40 text-white outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="현관 비밀번호" className="w-full p-4 bg-[#070b14] rounded-xl border border-slate-700/40 text-yellow-400 font-mono text-xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <textarea placeholder="특이사항" className="w-full p-4 bg-[#070b14] rounded-xl border border-slate-700/40 text-white outline-none h-24 text-sm" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <button onClick={handleSave} className="w-full bg-yellow-500 text-black p-4.5 rounded-xl font-black text-lg flex items-center justify-center gap-2 mt-4"><Save size={20}/> {editingItem ? '저장' : '등록'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
