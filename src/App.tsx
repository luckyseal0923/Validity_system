import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ClipboardList, 
  BarChart3, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Users, 
  Activity,
  Award,
  BookOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  Lock,
  Unlock,
  ArrowLeft,
  Home,
  Settings
} from 'lucide-react';
import './App.css';

// TypeScript Interfaces
interface RatingItem {
  id: number;
  text: string;
}

interface UserRating {
  id: number;
  score: number;
  comment: string;
}

interface SurveyData {
  id?: string;
  created_at?: string;
  creator_name: string;
  employee_id: string;
  password?: string;
  title: string;
  overall_instructions: string;
  checklist_instructions: string;
  overall_questions: RatingItem[];
  checklist_questions: RatingItem[];
  expert_backgrounds: string[];
}

interface ExpertResponse {
  id?: string;
  created_at?: string;
  survey_id: string;
  expert_name: string;
  expert_background: string[];
  expert_background_other?: string;
  years_of_experience: string;
  overall_ratings: UserRating[];
  checklist_ratings: UserRating[];
}

// Verbatim default instructions from the Word document
const DEFAULT_OVERALL_INSTRUCTIONS = 
`親愛的專家，你好：
本表旨在進行本站 OSCE 教案之整體內容效度審查。請專家依據本站 OSCE 之評量目標、考生指引、臨床情境、標準化病人資料、考官指引、評分表與測驗時間安排，評估本考站整體設計是否能適切反映欲評量之核心能力。
本區塊主要審查考站整體設計之適切性，包含評量目標是否明確、是否能對應欲評量之核心能力、臨床情境是否符合實務、內容是否具有臨床重要性、難度是否符合受測者程度、考生指引與任務說明是否清楚、時間安排是否合理，以及整體是否建議納入正式 OSCE 評量。
本表採四分量表進行評分，1 分代表「非常不同意」、2 分代表「不同意」、3 分代表「同意」、4 分代表「非常同意」。其中 3 分與 4 分視為專家同意該審查項目具適切性，後續可作為內容效度分析與修正依據。若專家認為該項目需調整，請於「修改建議」欄位中具體說明，以利後續修訂考站內容。`;

const DEFAULT_CHECKLIST_INSTRUCTIONS = 
`親愛的專家，你好：
請專家依據本站 OSCE 之評量目標、考生指引、臨床情境與評分表內容，逐項審查下列 checklist 評分項目之適切性。題項適切性係指該題項是否能反映本考站欲評量之核心能力、是否具有臨床重要性、文字描述是否清楚，以及是否能於 OSCE 現場被考官觀察與評分。
本表採四分量表進行評分，1 分代表「非常不適切」、2 分代表「不適切」、3 分代表「適切」、4 分代表「非常適切」。其中 3 分與 4 分視為專家同意該題項具內容效度，後續可用於計算 I-CVI 與 S-CVI/Ave。若專家認為題項需調整，請於「修改建議」欄位中說明建議保留、修改、合併或刪除之原因。`;

// Verbatim default questions
const DEFAULT_OVERALL_QUESTIONS: RatingItem[] = [
  { id: 1, text: "本考站的評量目標是否明確？" },
  { id: 2, text: "本考站是否能對應欲評量的核心能力？" },
  { id: 3, text: "本考站情境是否符合臨床實務？" },
  { id: 4, text: "本考站內容是否具有臨床重要性？" },
  { id: 5, text: "本考站難度是否符合受測者程度？" },
  { id: 6, text: "考生指引與任務說明是否清楚？" },
  { id: 7, text: "本考站時間安排是否合理？" },
  { id: 8, text: "整體而言，是否建議本考站納入正式 OSCE 評量？" }
];

const DEFAULT_CHECKLIST_QUESTIONS: RatingItem[] = [
  { id: 1, text: "接觸病人前正確洗手並自我介紹" },
  { id: 2, text: "確認病人身分並解釋插管原因" },
  { id: 3, text: "自我保護：手套、口罩、護目鏡等防護" },
  { id: 4, text: "確認有無假牙或口腔內鬆動異物" },
  { id: 5, text: "正確備物並確認器材功能" },
  { id: 6, text: "正確使用 Ambu bagging 技巧，插管前充分給氧至少 88%" },
  { id: 7, text: "執行下顎上提法打開呼吸道" },
  { id: 8, text: "置入口鼻咽管以暢通呼吸道" },
  { id: 9, text: "給予或說明插管前驅藥物 LOAD" },
  { id: 10, text: "挑選適合 RSI 藥物並正確施打或清楚下達醫囑" },
  { id: 11, text: "右手拿喉頭鏡且以牙齒為支點施力方向" },
  { id: 12, text: "平順置入氣管內管，移除通條，填充氣囊" },
  { id: 13, text: "回報氣管內管尺寸與放置深度" },
  { id: 14, text: "以五點聽診及波形二氧化碳等方式確認位置" },
  { id: 15, text: "固定氣管內管並接上呼吸器或 Ambu bag 持續通氣" },
  { id: 16, text: "病危患者應請社工協助勸募器官捐贈。" }
];

const EXPERT_BACKGROUNDS = [
  "臨床專家",
  "OSCE考官",
  "醫學教育專家",
  "專科護理師教師"
];

function App() {
  // Navigation Routing States
  const [view, setView] = useState<'portal' | 'create' | 'created' | 'survey' | 'dashboard' | 'loading'>('loading');
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);
  const [surveyStructure, setSurveyStructure] = useState<SurveyData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Portal States
  const [inputSurveyId, setInputSurveyId] = useState('');

  // Creator States
  const [creatorName, setCreatorName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [surveyPassword, setSurveyPassword] = useState('');
  const [surveyTitle, setSurveyTitle] = useState('第___站OSCE：專家內容效度審查表');
  const [overallInstructions, setOverallInstructions] = useState(DEFAULT_OVERALL_INSTRUCTIONS);
  const [checklistInstructions, setChecklistInstructions] = useState(DEFAULT_CHECKLIST_INSTRUCTIONS);
  const [overallQuestions, setOverallQuestions] = useState<RatingItem[]>(DEFAULT_OVERALL_QUESTIONS);
  const [checklistQuestions, setChecklistQuestions] = useState<RatingItem[]>(DEFAULT_CHECKLIST_QUESTIONS);
  const [isCreating, setIsCreating] = useState(false);

  // Copy success indicator
  const [copiedSurvey, setCopiedSurvey] = useState(false);
  const [copiedDashboard, setCopiedDashboard] = useState(false);

  // Expert Survey Form States
  const [expertName, setExpertName] = useState('');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [backgroundOther, setBackgroundOther] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [overallScores, setOverallScores] = useState<Record<number, number>>({});
  const [overallComments, setOverallComments] = useState<Record<number, string>>({});
  const [checklistScores, setChecklistScores] = useState<Record<number, number>>({});
  const [checklistComments, setChecklistComments] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dashboard Lock Screen States
  const [dashboardPassword, setDashboardPassword] = useState('');
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);

  // Dashboard Statistics States
  const [submissions, setSubmissions] = useState<ExpertResponse[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // 1. Initial routing based on URL Parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('survey_id');
    const viewMode = params.get('view');

    if (surveyId) {
      setCurrentSurveyId(surveyId);
      loadSurveyStructure(surveyId, viewMode === 'dashboard');
    } else {
      setView('portal');
    }
  }, []);

  // Fetch the survey structure from Supabase
  const loadSurveyStructure = async (id: string, isDashboardMode: boolean) => {
    setView('loading');
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('cvi_surveys')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        throw new Error('找不到指定的效度量表，請檢查網址中的識別碼是否正確。');
      }

      setSurveyStructure(data as SurveyData);
      
      if (isDashboardMode) {
        setView('dashboard');
      } else {
        setView('survey');
      }
    } catch (err: any) {
      console.error('Error loading survey:', err);
      setErrorMsg(err.message || '載入失敗。');
      setView('portal');
    }
  };

  // 2. Creator: Add / Delete Question Helpers
  const handleAddQuestion = (type: 'overall' | 'checklist') => {
    if (type === 'overall') {
      const newId = overallQuestions.length > 0 ? Math.max(...overallQuestions.map(q => q.id)) + 1 : 1;
      setOverallQuestions([...overallQuestions, { id: newId, text: '' }]);
    } else {
      const newId = checklistQuestions.length > 0 ? Math.max(...checklistQuestions.map(q => q.id)) + 1 : 1;
      setChecklistQuestions([...checklistQuestions, { id: newId, text: '' }]);
    }
  };

  const handleUpdateQuestion = (type: 'overall' | 'checklist', id: number, text: string) => {
    if (type === 'overall') {
      setOverallQuestions(overallQuestions.map(q => q.id === id ? { ...q, text } : q));
    } else {
      setChecklistQuestions(checklistQuestions.map(q => q.id === id ? { ...q, text } : q));
    }
  };

  const handleDeleteQuestion = (type: 'overall' | 'checklist', id: number) => {
    if (type === 'overall') {
      const filtered = overallQuestions.filter(q => q.id !== id);
      // Re-index to ensure continuous numeric order
      setOverallQuestions(filtered.map((q, idx) => ({ id: idx + 1, text: q.text })));
    } else {
      const filtered = checklistQuestions.filter(q => q.id !== id);
      setChecklistQuestions(filtered.map((q, idx) => ({ id: idx + 1, text: q.text })));
    }
  };

  // 3. Creator Submit (Create Survey)
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim()) {
      alert('請輸入起單負責人姓名');
      return;
    }
    if (!employeeId.trim()) {
      alert('請輸入起單負責人員工編號');
      return;
    }
    if (!surveyPassword.trim()) {
      alert('請設定儀表板解鎖密碼');
      return;
    }
    if (!surveyTitle.trim()) {
      alert('請輸入量表標題');
      return;
    }

    // Filter out empty questions
    const cleanOverall = overallQuestions.filter(q => q.text.trim() !== '');
    const cleanChecklist = checklistQuestions.filter(q => q.text.trim() !== '');

    if (cleanOverall.length === 0) {
      alert('請至少填寫一個「整體教案審查」題項');
      return;
    }
    if (cleanChecklist.length === 0) {
      alert('請至少填寫一個「Checklist 評分項目」題項');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.from('cvi_surveys').insert({
        creator_name: creatorName,
        employee_id: employeeId,
        password: surveyPassword,
        title: surveyTitle,
        overall_instructions: overallInstructions,
        checklist_instructions: checklistInstructions,
        overall_questions: cleanOverall,
        checklist_questions: cleanChecklist,
        expert_backgrounds: EXPERT_BACKGROUNDS
      }).select().single();

      if (error || !data) throw error;

      const newSurvey = data as SurveyData;
      setSurveyStructure(newSurvey);
      setCurrentSurveyId(newSurvey.id || null);
      setView('created');
      
      // Clear creator inputs
      setSurveyPassword(''); 
    } catch (err: any) {
      console.error('Error creating survey:', err);
      alert('量表建立失敗，請確認資料庫連線或 RLS 設定是否正常：' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Helper: Get shareable links
  const getSurveyUrl = () => {
    if (!currentSurveyId) return '';
    return `${window.location.origin}${window.location.pathname}?survey_id=${currentSurveyId}`;
  };

  const getDashboardUrl = () => {
    if (!currentSurveyId) return '';
    return `${window.location.origin}${window.location.pathname}?survey_id=${currentSurveyId}&view=dashboard`;
  };

  // Helper: Copy text to clipboard
  const handleCopyText = (text: string, type: 'survey' | 'dashboard') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'survey') {
        setCopiedSurvey(true);
        setTimeout(() => setCopiedSurvey(false), 2000);
      } else {
        setCopiedDashboard(true);
        setTimeout(() => setCopiedDashboard(false), 2000);
      }
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  // 4. Expert Survey Form Validation & Submit
  const handleBackgroundChange = (bg: string) => {
    if (selectedBackgrounds.includes(bg)) {
      setSelectedBackgrounds(selectedBackgrounds.filter(item => item !== bg));
    } else {
      setSelectedBackgrounds([...selectedBackgrounds, bg]);
    }
  };

  const validateSurveyForm = (): boolean => {
    if (!expertName.trim()) {
      const msg = '請輸入專家姓名';
      setValidationError(msg);
      alert(msg);
      return false;
    }
    if (selectedBackgrounds.length === 0 && !backgroundOther.trim()) {
      const msg = '請至少選擇或填寫一項專家背景';
      setValidationError(msg);
      alert(msg);
      return false;
    }
    if (!experienceYears.trim()) {
      const msg = '請輸入臨床/教學年資';
      setValidationError(msg);
      alert(msg);
      return false;
    }

    if (!surveyStructure) return false;
    
    // Check overall scores
    for (const q of surveyStructure.overall_questions) {
      if (!overallScores[q.id]) {
        const msg = `請完成「一、OSCE之整體教案內容效度審查」第 ${q.id} 題的給分`;
        setValidationError(msg);
        alert(msg);
        return false;
      }
    }
    
    // Check checklist scores
    for (const q of surveyStructure.checklist_questions) {
      if (!checklistScores[q.id]) {
        const msg = `請完成「二、OSCE Checklist 評分項目內容效度審查」第 ${q.id} 題的給分`;
        setValidationError(msg);
        alert(msg);
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSurveyForm() || !currentSurveyId || !surveyStructure) return;
    
    setIsSubmitting(true);
    
    const formattedOverallRatings = surveyStructure.overall_questions.map(q => ({
      id: q.id,
      score: overallScores[q.id],
      comment: overallComments[q.id] || ''
    }));

    const formattedChecklistRatings = surveyStructure.checklist_questions.map(q => ({
      id: q.id,
      score: checklistScores[q.id],
      comment: checklistComments[q.id] || ''
    }));

    try {
      const { error } = await supabase.from('cvi_responses').insert({
        survey_id: currentSurveyId,
        expert_name: expertName,
        expert_background: selectedBackgrounds,
        expert_background_other: backgroundOther || null,
        years_of_experience: experienceYears,
        overall_ratings: formattedOverallRatings,
        checklist_ratings: formattedChecklistRatings
      });

      if (error) throw error;
      
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setValidationError('評估表提交失敗，請檢查網路連線：' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSurveyForm = () => {
    setExpertName('');
    setSelectedBackgrounds([]);
    setBackgroundOther('');
    setExperienceYears('');
    setOverallScores({});
    setOverallComments({});
    setChecklistScores({});
    setChecklistComments({});
    setSubmitSuccess(false);
    setValidationError(null);
  };

  // 5. Dashboard Lockscreen Validation
  const handleUnlockDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyStructure) return;
    
    if (dashboardPassword === surveyStructure.password) {
      setIsDashboardUnlocked(true);
      fetchDashboardSubmissions();
    } else {
      alert('解鎖密碼錯誤！請重新輸入。');
      setDashboardPassword('');
    }
  };

  // Fetch expert responses
  const fetchDashboardSubmissions = async () => {
    if (!currentSurveyId) return;
    setIsLoadingSubmissions(true);
    setDashboardError(null);
    try {
      const { data, error } = await supabase
        .from('cvi_responses')
        .select('*')
        .eq('survey_id', currentSurveyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions((data || []) as ExpertResponse[]);
    } catch (err: any) {
      console.error('Error loading responses:', err);
      setDashboardError('無法取得評估數據：' + err.message);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // 6. CVI Math calculations
  const computeStats = () => {
    const total = submissions.length;
    if (total === 0 || !surveyStructure) return null;

    const calculateSectionStats = (
      questions: RatingItem[],
      ratingKey: 'overall_ratings' | 'checklist_ratings'
    ) => {
      const itemsStats = questions.map(q => {
        const scores = submissions.map(sub => {
          const rating = sub[ratingKey]?.find(r => r.id === q.id);
          return rating ? rating.score : 0;
        });

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
        scores.forEach(s => {
          if (s >= 1 && s <= 4) {
            distribution[s as 1 | 2 | 3 | 4]++;
          }
        });

        const agreedCount = scores.filter(s => s === 3 || s === 4).length;
        const iCvi = agreedCount / total;

        const comments = submissions
          .map(sub => {
            const rating = sub[ratingKey]?.find(r => r.id === q.id);
            return {
              expertName: sub.expert_name,
              score: rating ? rating.score : 0,
              text: rating ? rating.comment : ''
            };
          })
          .filter(c => c.text && c.text.trim() !== '');

        return {
          id: q.id,
          text: q.text,
          iCvi,
          distribution,
          comments
        };
      });

      const sumICvi = itemsStats.reduce((acc, item) => acc + item.iCvi, 0);
      const sCviAve = sumICvi / questions.length;

      return {
        itemsStats,
        sCviAve
      };
    };

    const overallStats = calculateSectionStats(surveyStructure.overall_questions, 'overall_ratings');
    const checklistStats = calculateSectionStats(surveyStructure.checklist_questions, 'checklist_ratings');

    return {
      total,
      overall: overallStats,
      checklist: checklistStats
    };
  };

  const stats = computeStats();

  const toggleComments = (key: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCviStatusClass = (cvi: number) => {
    if (cvi >= 0.78) return 'cvi-status-pass';
    if (cvi >= 0.70) return 'cvi-status-warn';
    return 'cvi-status-fail';
  };

  const getCviTextClass = (cvi: number) => {
    if (cvi >= 0.78) return 'cvi-text-pass';
    if (cvi >= 0.70) return 'cvi-text-warn';
    return 'cvi-text-fail';
  };

  const getCviBadgeClass = (cvi: number) => {
    if (cvi >= 0.78) return 'pass';
    if (cvi >= 0.70) return 'warn';
    return 'fail';
  };

  const getCviLabel = (cvi: number) => {
    if (cvi >= 0.78) return '效度良好';
    if (cvi >= 0.70) return '建議修改';
    return '建議修改/刪除';
  };

  // Navigation handlers
  const handleGoHome = () => {
    window.history.pushState({}, '', window.location.pathname);
    setCurrentSurveyId(null);
    setSurveyStructure(null);
    setView('portal');
  };

  const handleOpenDashboardLink = () => {
    if (!currentSurveyId) return;
    window.history.pushState({}, '', `${window.location.pathname}?survey_id=${currentSurveyId}&view=dashboard`);
    loadSurveyStructure(currentSurveyId, true);
  };

  // Render Screens
  if (view === 'loading') {
    return (
      <div className="app-container">
        <div className="glass-card loading-dashboard" style={{ marginTop: '5rem' }}>
          <svg className="spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
          </svg>
          <p>正在動態載入量表設定...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-title-wrapper" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
          <Activity className="app-title-icon" size={32} />
          <h1>OSCE 專家內容效度量表產生平台</h1>
        </div>
        <p className="app-subtitle">自訂 OSCE 量表、發送審查連結與即時 CVI 數據計算平台</p>
      </header>

      {/* Main Panel View Routing */}

      {/* 1. Portal Home View */}
      {view === 'portal' && (
        <div className="portal-home">
          {errorMsg && (
            <div className="validation-error-msg" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
          
          <h2>歡迎使用效度評估平台</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>請選擇您要進行的操作項目：</p>
          
          <div className="portal-grid">
            <div className="portal-card" onClick={() => setView('create')}>
              <div className="portal-card-icon">
                <Settings size={28} />
              </div>
              <h3>製作自訂效度量表</h3>
              <p>輸入負責人資料、量表名稱，並自訂或修改題項，一鍵產生專家線上填寫連結與分析後台。</p>
            </div>

            <div className="portal-card">
              <div className="portal-card-icon">
                <BarChart3 size={28} />
              </div>
              <h3>進入現有量表分析</h3>
              <p>如果您已建立量表，請輸入該量表的 UUID 識別碼以進入數據分析與解鎖後台。</p>
              
              <div className="form-group" style={{ width: '100%', marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="輸入量表 UUID"
                  value={inputSurveyId}
                  onChange={(e) => setInputSurveyId(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '0.85rem' }}
                />
                <button 
                  className="primary-btn" 
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.5rem', borderRadius: '6px' }}
                  onClick={() => {
                    if (inputSurveyId.trim()) {
                      window.history.pushState({}, '', `${window.location.pathname}?survey_id=${inputSurveyId.trim()}&view=dashboard`);
                      loadSurveyStructure(inputSurveyId.trim(), true);
                    } else {
                      alert('請先輸入量表 UUID');
                    }
                  }}
                >
                  進入後台
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Survey Creator View */}
      {view === 'create' && (
        <form onSubmit={handleCreateSurvey} className="glass-card">
          <div className="section-title-container">
            <ArrowLeft className="section-icon" style={{ cursor: 'pointer' }} onClick={() => setView('portal')} size={20} />
            <h2 className="section-title">起單負責人與量表設定</h2>
          </div>

          {/* Initiator Credentials */}
          <div className="expert-info-grid">
            <div className="form-group">
              <label className="form-label">負責人姓名<span className="required-star">*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="例如：張大明"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">員工編號<span className="required-star">*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="例如：H12345"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">儀表板自設解鎖密碼<span className="required-star">*</span></label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="請自訂解鎖密碼"
                value={surveyPassword}
                onChange={(e) => setSurveyPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">量表標題<span className="required-star">*</span></label>
            <input 
              type="text" 
              className="form-input" 
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              required
            />
          </div>

          {/* Part 1 Setup */}
          <div className="survey-section" style={{ marginTop: '2rem' }}>
            <div className="section-title-container">
              <BookOpen className="section-icon" size={20} />
              <h2 className="section-title">一、整體教案內容效度審查（設定）</h2>
            </div>
            
            <div className="form-group">
              <label className="form-label">審查說明文字</label>
              <textarea 
                className="comment-textarea" 
                value={overallInstructions}
                onChange={(e) => setOverallInstructions(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>

            <label className="form-label">題項列表</label>
            {overallQuestions.map((q, index) => (
              <div key={q.id} className="dynamic-item-row">
                <span className="question-number">{index + 1}</span>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder={`請輸入第 ${index + 1} 題的整體教案審查題目`}
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion('overall', q.id, e.target.value)}
                />
                <button 
                  type="button" 
                  className="delete-item-btn"
                  onClick={() => handleDeleteQuestion('overall', q.id)}
                  title="刪除此題"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="add-item-btn" 
              onClick={() => handleAddQuestion('overall')}
            >
              <Plus size={16} /> 新增整體審查題目
            </button>
          </div>

          {/* Part 2 Setup */}
          <div className="survey-section" style={{ marginTop: '2rem' }}>
            <div className="section-title-container">
              <Award className="section-icon" size={20} />
              <h2 className="section-title">二、Checklist 評分項目內容效度審查（設定）</h2>
            </div>
            
            <div className="form-group">
              <label className="form-label">審查說明文字</label>
              <textarea 
                className="comment-textarea" 
                value={checklistInstructions}
                onChange={(e) => setChecklistInstructions(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>

            <label className="form-label">Checklist 題項列表</label>
            {checklistQuestions.map((q, index) => (
              <div key={q.id} className="dynamic-item-row">
                <span className="question-number">{index + 1}</span>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder={`請輸入第 ${index + 1} 題的 Checklist 題目`}
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion('checklist', q.id, e.target.value)}
                />
                <button 
                  type="button" 
                  className="delete-item-btn"
                  onClick={() => handleDeleteQuestion('checklist', q.id)}
                  title="刪除此題"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="add-item-btn" 
              onClick={() => handleAddQuestion('checklist')}
            >
              <Plus size={16} /> 新增 Checklist 題目
            </button>
          </div>

          <div className="submit-container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button type="submit" className="primary-btn" disabled={isCreating}>
              {isCreating ? '量表產生中...' : '一鍵產生線上量表網址'}
            </button>
          </div>
        </form>
      )}

      {/* 3. Survey Created Success View */}
      {view === 'created' && (
        <div className="glass-card success-card">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={40} />
          </div>
          <h2>效度量表建立成功！</h2>
          <p>專屬線上評估網址已產生，您可以將「填寫連結」直接發送給專家進行效度審查。</p>

          <div className="links-container">
            {/* Survey Link */}
            <div className="link-box-card">
              <span className="link-box-title">
                <ClipboardList size={16} /> 1. 專家線上填寫連結 (分享給專家)
              </span>
              <div className="link-box-input-group">
                <div className="link-box-input">{getSurveyUrl()}</div>
                <button 
                  className={`copy-btn ${copiedSurvey ? 'copied' : ''}`}
                  onClick={() => handleCopyText(getSurveyUrl(), 'survey')}
                >
                  {copiedSurvey ? <Check size={16} /> : <Copy size={16} />}
                  {copiedSurvey ? '已複製' : '複製'}
                </button>
              </div>
            </div>

            {/* Dashboard Link */}
            <div className="link-box-card" style={{ background: '#f5f7fa', borderColor: '#dcdfe6' }}>
              <span className="link-box-title" style={{ color: 'var(--secondary)' }}>
                <BarChart3 size={16} /> 2. 效度分析儀表板連結 (負責人留存)
              </span>
              <div className="link-box-input-group">
                <div className="link-box-input">{getDashboardUrl()}</div>
                <button 
                  className={`copy-btn ${copiedDashboard ? 'copied' : ''}`}
                  onClick={() => handleCopyText(getDashboardUrl(), 'dashboard')}
                  style={{ background: 'var(--secondary)' }}
                >
                  {copiedDashboard ? <Check size={16} /> : <Copy size={16} />}
                  {copiedDashboard ? '已複製' : '複製'}
                </button>
              </div>
            </div>
            
            {/* Creator Credentials Recall */}
            <div className="creator-info-card">
              <div><span>起單人</span>: {creatorName} (員編: {employeeId})</div>
              <div><span>自設解鎖密碼</span>: (已加密儲存於資料庫。解鎖儀表板時需輸入此密碼，請務必牢記！)</div>
            </div>
          </div>

          <div className="submit-container" style={{ flexDirection: 'row', gap: '1rem', width: '100%', justifyContent: 'center' }}>
            <button className="primary-btn" onClick={handleGoHome} style={{ background: 'var(--secondary)' }}>
              <Home size={18} /> 返回首頁
            </button>
            <button className="primary-btn" onClick={handleOpenDashboardLink}>
              <Unlock size={18} /> 直接進入數據後台
            </button>
          </div>
        </div>
      )}

      {/* 4. Expert Survey Form View */}
      {view === 'survey' && surveyStructure && (
        submitSuccess ? (
          <div className="glass-card success-card">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={40} />
            </div>
            <h2>感謝您的評估！</h2>
            <p>您的專家審查回覆已成功寫入系統資料庫，本平台將即時更新 CVI 分析結果以供修訂參考。</p>
            <button className="primary-btn" onClick={handleResetSurveyForm}>
              填寫下一份評量
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitSurvey} className="glass-card">
            {/* Survey Title */}
            <div className="section-title-container">
              <ClipboardList className="section-icon" size={22} />
              <h2 className="section-title">{surveyStructure.title}</h2>
            </div>

            {/* Expert Profile */}
            <div className="expert-info-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="expert-name-input">專家姓名<span className="required-star">*</span></label>
                <input 
                  type="text" 
                  id="expert-name-input"
                  className="form-input"
                  placeholder="請輸入姓名"
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <span className="form-label">專家背景<span className="required-star">*</span></span>
                <div className="checkbox-group">
                  {surveyStructure.expert_backgrounds.map((bg) => (
                    <label key={bg} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        className="checkbox-input"
                        checked={selectedBackgrounds.includes(bg)}
                        onChange={() => handleBackgroundChange(bg)}
                      />
                      {bg}
                    </label>
                  ))}
                  <input 
                    type="text" 
                    className="form-input other-bg-input"
                    placeholder="其他背景說明（若有）"
                    value={backgroundOther}
                    onChange={(e) => setBackgroundOther(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="exp-years-input">臨床/教學年資<span className="required-star">*</span></label>
                <input 
                  type="text" 
                  id="exp-years-input"
                  className="form-input"
                  placeholder="例如：15年"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Part 1: Overall Survey */}
            <div className="survey-section">
              <div className="section-title-container">
                <BookOpen className="section-icon" size={20} />
                <h2 className="section-title">一、OSCE之整體教案內容效度審查</h2>
              </div>
              
              <div className="section-intro-card">
                {surveyStructure.overall_instructions}
              </div>

              <div className="questions-list">
                {surveyStructure.overall_questions.map((q) => (
                  <div key={q.id} className="question-card">
                    <div className="question-header">
                      <span className="question-number">{q.id}</span>
                      <p className="question-text">{q.text}<span className="required-star">*</span></p>
                    </div>

                    <div className="rating-container">
                      {[
                        { score: 1, label: '非常不同意' },
                        { score: 2, label: '不同意' },
                        { score: 3, label: '同意' },
                        { score: 4, label: '非常同意' }
                      ].map((opt) => (
                        <label key={opt.score} className="rating-option" data-score={opt.score}>
                          <input 
                            type="radio" 
                            name={`overall-${q.id}`}
                            className="rating-radio"
                            checked={overallScores[q.id] === opt.score}
                            onChange={() => setOverallScores({ ...overallScores, [q.id]: opt.score })}
                            required
                          />
                          <div className="rating-btn-face">
                            <span className="rating-btn-score">{opt.score}</span>
                            <span className="rating-btn-label">{opt.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="comment-input-wrapper">
                      <textarea 
                        className="comment-textarea"
                        placeholder="修改建議 (選填)..."
                        value={overallComments[q.id] || ''}
                        onChange={(e) => setOverallComments({ ...overallComments, [q.id]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 2: Checklist Survey */}
            <div className="survey-section">
              <div className="section-title-container">
                <Award className="section-icon" size={20} />
                <h2 className="section-title">二、OSCE Checklist 評分項目內容效度審查</h2>
              </div>

              <div className="section-intro-card">
                {surveyStructure.checklist_instructions}
              </div>

              <div className="questions-list">
                {surveyStructure.checklist_questions.map((q) => (
                  <div key={q.id} className="question-card">
                    <div className="question-header">
                      <span className="question-number">{q.id}</span>
                      <p className="question-text">{q.text}<span className="required-star">*</span></p>
                    </div>

                    <div className="rating-container">
                      {[
                        { score: 1, label: '非常不適切' },
                        { score: 2, label: '不適切' },
                        { score: 3, label: '適切' },
                        { score: 4, label: '非常適切' }
                      ].map((opt) => (
                        <label key={opt.score} className="rating-option" data-score={opt.score}>
                          <input 
                            type="radio" 
                            name={`checklist-${q.id}`}
                            className="rating-radio"
                            checked={checklistScores[q.id] === opt.score}
                            onChange={() => setChecklistScores({ ...checklistScores, [q.id]: opt.score })}
                            required
                          />
                          <div className="rating-btn-face">
                            <span className="rating-btn-score">{opt.score}</span>
                            <span className="rating-btn-label">{opt.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="comment-input-wrapper">
                      <textarea 
                        className="comment-textarea"
                        placeholder="修改建議 (選填)..."
                        value={checklistComments[q.id] || ''}
                        onChange={(e) => setChecklistComments({ ...checklistComments, [q.id]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit panel */}
            <div className="submit-container">
              {validationError && (
                <div className="validation-error-msg">
                  <AlertCircle size={18} />
                  <span>{validationError}</span>
                </div>
              )}
              
              <button 
                type="submit" 
                className="primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    提交專家評估表
                  </>
                )}
              </button>
            </div>
          </form>
        )
      )}

      {/* 5. Dashboard Lockscreen View */}
      {view === 'dashboard' && !isDashboardUnlocked && (
        <div className="glass-card lock-screen-container">
          <div className="lock-icon-wrapper">
            <Lock size={32} />
          </div>
          <h2>儀表板已鎖定</h2>
          <p>請輸入本量表在建立時起單負責人自設的解鎖密碼，以查看即時效度分析數據。</p>
          
          <form onSubmit={handleUnlockDashboard} className="lock-form">
            <div className="form-group">
              <input 
                type="password" 
                className="form-input" 
                placeholder="請輸入解鎖密碼"
                value={dashboardPassword}
                onChange={(e) => setDashboardPassword(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.1rem' }}
                required
              />
            </div>
            <button type="submit" className="primary-btn" style={{ width: '100%' }}>
              解鎖並進入儀表板
            </button>
            
            <button 
              type="button" 
              className="primary-btn" 
              onClick={handleGoHome} 
              style={{ width: '100%', background: 'var(--secondary)', marginTop: '0.25rem' }}
            >
              <Home size={18} /> 返回首頁
            </button>
          </form>
        </div>
      )}

      {/* 6. Dashboard Statistics Analytics View */}
      {view === 'dashboard' && isDashboardUnlocked && surveyStructure && (
        <div className="glass-card">
          {isLoadingSubmissions ? (
            <div className="loading-dashboard">
              <svg className="spinner" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
              <p>正在從 Supabase 即時計算 CVI 與分析結果...</p>
            </div>
          ) : dashboardError ? (
            <div className="empty-dashboard">
              <AlertCircle size={48} className="cvi-text-fail" />
              <h2>載入資料失敗</h2>
              <p>{dashboardError}</p>
              <button className="primary-btn" onClick={fetchDashboardSubmissions}>
                重試讀取
              </button>
            </div>
          ) : !stats || stats.total === 0 ? (
            <div className="empty-dashboard">
              <Users size={48} className="cvi-text-warn" />
              <h2>尚無專家評估數據</h2>
              <p>資料庫目前尚無任何專家提交記錄。請分享專家填寫連結：</p>
              <div className="link-box-card" style={{ width: '100%', maxWidth: '500px', margin: '0.5rem auto 1.5rem', background: '#fafafa' }}>
                <div className="link-box-input-group">
                  <div className="link-box-input">{getSurveyUrl()}</div>
                  <button 
                    className={`copy-btn ${copiedSurvey ? 'copied' : ''}`}
                    onClick={() => handleCopyText(getSurveyUrl(), 'survey')}
                  >
                    {copiedSurvey ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <button className="primary-btn" onClick={handleGoHome} style={{ background: 'var(--secondary)' }}>
                <Home size={18} /> 返回首頁
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {/* Stats Overview */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon-container blue">
                    <Users size={22} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">專家審查總人數 (N)</span>
                    <span className="stat-value">{stats.total} 位</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-container purple">
                    <BookOpen size={22} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">整體教案 S-CVI / Ave</span>
                    <span className={`stat-value ${stats.overall.sCviAve >= 0.90 ? 'cvi-text-pass' : 'cvi-text-warn'}`}>
                      {stats.overall.sCviAve.toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-container emerald">
                    <Award size={22} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Checklist S-CVI / Ave</span>
                    <span className={`stat-value ${stats.checklist.sCviAve >= 0.90 ? 'cvi-text-pass' : 'cvi-text-warn'}`}>
                      {stats.checklist.sCviAve.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Metadata Display */}
              <div className="creator-info-card" style={{ marginTop: '0px' }}>
                <div><span>量表名稱</span>: {surveyStructure.title}</div>
                <div><span>起單人</span>: {surveyStructure.creator_name} (員工編號: {surveyStructure.employee_id})</div>
              </div>

              {/* Part 1 Analysis */}
              <div className="dashboard-section">
                <div className="dashboard-section-header">
                  <h3>一、整體教案內容效度分析</h3>
                  <span className={`cvi-badge-big cvi-badge ${stats.overall.sCviAve >= 0.90 ? 'pass' : 'warn'}`}>
                    S-CVI: {stats.overall.sCviAve.toFixed(2)} ({stats.overall.sCviAve >= 0.90 ? '量表效度優良' : '建議修訂教案'})
                  </span>
                </div>

                <div className="dashboard-card-list">
                  {stats.overall.itemsStats.map((item) => {
                    const collapseKey = `overall-${item.id}`;
                    const isExpanded = !!expandedComments[collapseKey];
                    return (
                      <div key={item.id} className="dashboard-item-card">
                        <div className="dashboard-item-main">
                          <div className="dashboard-item-info">
                            <div className="dashboard-item-text">
                              {item.id}. {item.text}
                            </div>
                            <div className="cvi-progress-wrapper">
                              <div className="cvi-progress-bg">
                                <div 
                                  className={`cvi-progress-fill ${getCviStatusClass(item.iCvi)}`}
                                  style={{ width: `${item.iCvi * 100}%` }}
                                />
                              </div>
                              <span className={`cvi-value-label ${getCviTextClass(item.iCvi)}`}>
                                {(item.iCvi).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="dashboard-item-metrics">
                            <div className="score-pills">
                              <div className="score-pill active-high">3-4分: <span>{item.distribution[3] + item.distribution[4]}</span></div>
                              <div className="score-pill">1-2分: <span>{item.distribution[1] + item.distribution[2]}</span></div>
                            </div>
                            <span className={`cvi-badge ${getCviBadgeClass(item.iCvi)}`}>
                              {getCviLabel(item.iCvi)}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            className={`expand-comments-btn ${isExpanded ? 'active' : ''}`}
                            onClick={() => toggleComments(collapseKey)}
                          >
                            <MessageSquare size={14} />
                            {isExpanded ? '隱收意見' : `查看意見 (${item.comments.length})`}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="comments-collapse-container">
                            {item.comments.length === 0 ? (
                              <div className="no-comments-placeholder">此題目前無專家修改建議</div>
                            ) : (
                              <div className="comments-list">
                                {item.comments.map((comment, index) => (
                                  <div key={index} className={`comment-bubble rating-${comment.score}`}>
                                    <div className="comment-bubble-meta">
                                      <span>專家: {comment.expertName}</span>
                                      <span>給分: {comment.score} 分</span>
                                    </div>
                                    <div className="comment-bubble-text">{comment.text}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part 2 Analysis */}
              <div className="dashboard-section">
                <div className="dashboard-section-header">
                  <h3>二、OSCE Checklist 評分項目內容效度分析</h3>
                  <span className={`cvi-badge-big cvi-badge ${stats.checklist.sCviAve >= 0.90 ? 'pass' : 'warn'}`}>
                    S-CVI: {stats.checklist.sCviAve.toFixed(2)} ({stats.checklist.sCviAve >= 0.90 ? '評分表效度優良' : '建議修訂項目'})
                  </span>
                </div>

                <div className="dashboard-card-list">
                  {stats.checklist.itemsStats.map((item) => {
                    const collapseKey = `checklist-${item.id}`;
                    const isExpanded = !!expandedComments[collapseKey];
                    return (
                      <div key={item.id} className="dashboard-item-card">
                        <div className="dashboard-item-main">
                          <div className="dashboard-item-info">
                            <div className="dashboard-item-text">
                              {item.id}. {item.text}
                            </div>
                            <div className="cvi-progress-wrapper">
                              <div className="cvi-progress-bg">
                                <div 
                                  className={`cvi-progress-fill ${getCviStatusClass(item.iCvi)}`}
                                  style={{ width: `${item.iCvi * 100}%` }}
                                />
                              </div>
                              <span className={`cvi-value-label ${getCviTextClass(item.iCvi)}`}>
                                {(item.iCvi).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="dashboard-item-metrics">
                            <div className="score-pills">
                              <div className="score-pill active-high">3-4分: <span>{item.distribution[3] + item.distribution[4]}</span></div>
                              <div className="score-pill">1-2分: <span>{item.distribution[1] + item.distribution[2]}</span></div>
                            </div>
                            <span className={`cvi-badge ${getCviBadgeClass(item.iCvi)}`}>
                              {getCviLabel(item.iCvi)}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            className={`expand-comments-btn ${isExpanded ? 'active' : ''}`}
                            onClick={() => toggleComments(collapseKey)}
                          >
                            <MessageSquare size={14} />
                            {isExpanded ? '隱收意見' : `查看意見 (${item.comments.length})`}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="comments-collapse-container">
                            {item.comments.length === 0 ? (
                              <div className="no-comments-placeholder">此題目前無專家修改建議</div>
                            ) : (
                              <div className="comments-list">
                                {item.comments.map((comment, index) => (
                                  <div key={index} className={`comment-bubble rating-${comment.score}`}>
                                    <div className="comment-bubble-meta">
                                      <span>專家: {comment.expertName}</span>
                                      <span>給分: {comment.score} 分</span>
                                    </div>
                                    <div className="comment-bubble-text">{comment.text}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Portal back actions */}
              <div className="submit-container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', width: '100%', alignItems: 'center' }}>
                <button className="primary-btn" onClick={handleGoHome} style={{ background: 'var(--secondary)', maxWidth: '250px' }}>
                  <Home size={18} /> 返回首頁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 OSCE Validity Platform. 版權所有。 資料庫串接自 Supabase。</p>
      </footer>
    </div>
  );
}

export default App;
