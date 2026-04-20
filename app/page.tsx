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

// [로고 1] 더 직관적인 배달 스쿠터 아이콘 (리어 박스 시각화)
const DeliveryScooterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="18" cy="48" r="5" stroke="currentColor" strokeWidth="4"/>
    <circle cx="50" cy="48" r="5" stroke="currentColor" strokeWidth="4"/>
    <path d="M12 42L18 24H42L52 42H12Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3"/>
    <rect x="6" y="14" width="22" height="16" rx="2" fill="#FBBF24" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M42 24L46 14H58" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M22 24L26 42" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

// [로고 2] 보내주신 사진의 '안라무복' 도장(낙관) 스타일 재현
const AnRaMuBokSeal = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12,10 Q8,8 10,14 L8,86 Q8,92 14,90 L86,92 Q92,92 90,86 L92,14 Q92,8 86,10 Z" fill="#cc0000" />
    <text x="30" y="45" fill="white" fontSize="28" fontWeight="900" style={{fontFamily: 'serif'}}>안</text>
    <text x="70" y="45" fill="white" fontSize="28" fontWeight="900" style={{fontFamily: 'serif'}}>라</text>
    <text x="30" y="82" fill="white" fontSize="28" fontWeight="900" style={{fontFamily: 'serif'}}>무</text>
    <text x="70" y="82" fill="white" fontSize="28" fontWeight="900" style={{fontFamily: 'serif'}}>복</text>
  </svg>
);

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Home'); // 초기 상태를 Home으로 설정
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
    if (!formData.name || !formData.password) return alert('내용을 입력하세요!');
    if (editingItem) {
      await supabase.from('building_logs').insert([{
        building_id: editingItem.id, old_
