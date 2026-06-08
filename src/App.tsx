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
  User, 
  Users, 
  Activity,
  Award,
  BookOpen
} from 'lucide-react';
import './App.css';

// Define TS Interfaces
interface RatingItem {
  id: number;
  text: string;
}

interface UserRating {
  id: number;
  score: number;
  comment: string;
}

interface EvaluationSubmission {
  id: string;
  created_at: string;
  expert_name: string;
  expert_background: string[];
  expert_background_other?: string;
  years_of_experience: string;
  overall_ratings: UserRating[];
  checklist_ratings: UserRating[];
}

// Question Data Source
const OVERALL_QUESTIONS: RatingItem[] = [
  { id: 1, text: "本考站的評量目標是否明確？" },
  { id: 2, text: "本考站是否能對應欲評量的核心能力？" },
  { id: 3, text: "本考站情境是否符合臨床實務？" },
  { id: 4, text: "本考站內容是否具有臨床重要性？" },
  { id: 5, text: "本考站難度是否符合受測者程度？" },
  { id: 6, text: "考生指引與任務說明是否清楚？" },
  { id: 7, text: "本考站時間安排是否合理？" },
  { id: 8, text: "整體而言，是否建議本考站納入正式 OSCE 評量？" }
];

const CHECKLIST_QUESTIONS: RatingItem[] = [
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
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');

  // Form State
  const [expertName, setExpertName] = useState('');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [backgroundOther, setBackgroundOther] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  
  // Ratings: mapped by question ID
  const [overallScores, setOverallScores] = useState<Record<number, number>>({});
  const [overallComments, setOverallComments] = useState<Record<number, string>>({});
  const [checklistScores, setChecklistScores] = useState<Record<number, number>>({});
  const [checklistComments, setChecklistComments] = useState<Record<number, string>>({});
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dashboard State
  const [submissions, setSubmissions] = useState<EvaluationSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Fetch submissions from Supabase
  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    setDashboardError(null);
    try {
      const { data, error } = await supabase
        .from('osce_evaluations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions((data || []) as EvaluationSubmission[]);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setDashboardError(err.message || '無法取得評量數據，請檢查資料表配置。');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Form handlers
  const handleBackgroundChange = (bg: string) => {
    if (selectedBackgrounds.includes(bg)) {
      setSelectedBackgrounds(selectedBackgrounds.filter(item => item !== bg));
    } else {
      setSelectedBackgrounds([...selectedBackgrounds, bg]);
    }
  };

  const handleFormReset = () => {
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

  const validateForm = (): boolean => {
    if (!expertName.trim()) {
      setValidationError('請輸入專家姓名');
      return false;
    }
    if (selectedBackgrounds.length === 0 && !backgroundOther.trim()) {
      setValidationError('請至少選擇或填寫一項專家背景');
      return false;
    }
    if (!experienceYears.trim()) {
      setValidationError('請輸入臨床/教學年資');
      return false;
    }
    
    // Check if all overall questions have score
    for (const q of OVERALL_QUESTIONS) {
      if (!overallScores[q.id]) {
        setValidationError(`請完成「第一部分：整體教案內容效度審查」第 ${q.id} 題的給分`);
        return false;
      }
    }
    
    // Check if all checklist questions have score
    for (const q of CHECKLIST_QUESTIONS) {
      if (!checklistScores[q.id]) {
        setValidationError(`請完成「第二部分：Checklist 評分項目內容效度審查」第 ${q.id} 題的給分`);
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Format JSON array structure
    const formattedOverallRatings = OVERALL_QUESTIONS.map(q => ({
      id: q.id,
      score: overallScores[q.id],
      comment: overallComments[q.id] || ''
    }));

    const formattedChecklistRatings = CHECKLIST_QUESTIONS.map(q => ({
      id: q.id,
      score: checklistScores[q.id],
      comment: checklistComments[q.id] || ''
    }));

    try {
      const { error } = await supabase.from('osce_evaluations').insert({
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
      console.error('Error submitting evaluation:', err);
      setValidationError(err.message || '資料寫入 Supabase 失敗，請確認您的連線資訊與 Table Schema。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to calculate statistics
  const computeStats = () => {
    const total = submissions.length;
    if (total === 0) return null;

    // Helper for a section
    const calculateSectionStats = (
      questions: RatingItem[],
      ratingKey: 'overall_ratings' | 'checklist_ratings'
    ) => {
      const itemsStats = questions.map(q => {
        // Collect all scores for this item
        const scores = submissions.map(sub => {
          const rating = sub[ratingKey]?.find(r => r.id === q.id);
          return rating ? rating.score : 0;
        });

        // Compute score distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
        scores.forEach(s => {
          if (s >= 1 && s <= 4) {
            distribution[s as 1 | 2 | 3 | 4]++;
          }
        });

        // Compute I-CVI: proportion of 3 and 4
        const agreedCount = scores.filter(s => s === 3 || s === 4).length;
        const iCvi = agreedCount / total;

        // Collect comments
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

      // S-CVI/Ave is average of I-CVIs
      const sumICvi = itemsStats.reduce((acc, item) => acc + item.iCvi, 0);
      const sCviAve = sumICvi / questions.length;

      return {
        itemsStats,
        sCviAve
      };
    };

    const overallStats = calculateSectionStats(OVERALL_QUESTIONS, 'overall_ratings');
    const checklistStats = calculateSectionStats(CHECKLIST_QUESTIONS, 'checklist_ratings');

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
    return '極佳建議修改/刪除';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-title-wrapper">
          <Activity className="app-title-icon" size={36} />
          <h1>OSCE 專家內容效度評估系統</h1>
        </div>
        <p className="app-subtitle">即時量表效度分析與專家修改建議彙整 (I-CVI, S-CVI/Ave)</p>
      </header>

      {/* Tabs */}
      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
          id="tab-expert-form"
        >
          <ClipboardList size={18} />
          填寫評量表
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          id="tab-analytics-dashboard"
        >
          <BarChart3 size={18} />
          查看數據分析
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'form' ? (
          submitSuccess ? (
            <div className="glass-card success-card">
              <div className="success-icon-wrapper">
                <CheckCircle2 size={48} />
              </div>
              <h2>感謝您的評估！</h2>
              <p>您的專家審查回覆已成功寫入系統資料庫，本平台將即時更新 CVI 分析結果以供修訂參考。</p>
              <button className="primary-btn" onClick={handleFormReset}>
                填寫下一份評量
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card" id="expert-survey-form">
              {/* Expert Profile Section */}
              <div className="section-title-container">
                <User className="section-icon" size={22} />
                <h2 className="section-title">專家基本資料</h2>
              </div>
              
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
                    {EXPERT_BACKGROUNDS.map((bg) => (
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

              {/* Part 1: Overall Design Review */}
              <div className="survey-section">
                <div className="section-title-container">
                  <BookOpen className="section-icon" size={22} />
                  <h2 className="section-title">一、OSCE 整體教案內容效度審查</h2>
                </div>
                
                <div className="section-intro-card">
                  {"親愛的專家，你好：\n本表旨在進行本站 OSCE 教案之整體內容效度審查。請專家依據本站 OSCE 之評量目標、考生指引、臨床情境、標準化病人資料、考官指引、評分表與測驗時間安排，評估本考站整體設計是否能適切反映欲評量之核心能力。\n本區塊主要審查考站整體設計之適切性，包含評量目標是否明確、是否能對應欲評量之核心能力、臨床情境是否符合實務、內容是否具有臨床重要性、難度是否符合受測者程度、考生指引與任務說明是否清楚、時間安排是否合理，以及整體是否建議納入正式 OSCE 評量。\n本表採四分量表進行評分，1 分代表「非常不同意」、2 分代表「不同意」、3 分代表「同意」、4 分代表「非常同意」。其中 3 分與 4 分視為專家同意該審查項目具適切性，後續可作為內容效度分析與修正依據。若專家認為該項目需調整，請於「修改建議」欄位中具體說明，以利後續修訂考站內容。"}
                </div>

                <div className="questions-list">
                  {OVERALL_QUESTIONS.map((q) => (
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

              {/* Part 2: Checklist Items Review */}
              <div className="survey-section">
                <div className="section-title-container">
                  <Award className="section-icon" size={22} />
                  <h2 className="section-title">二、OSCE Checklist 評分項目內容效度審查</h2>
                </div>

                <div className="section-intro-card">
                  {"親愛的專家，你好：\n請專家依據本站 OSCE 之評量目標、考生指引、臨床情境與評分表內容，逐項審查下列 checklist 評分項目之適切性。題項適切性係指該題項是否能反映本考站欲評量之核心能力、是否具有臨床重要性、文字描述是否清楚，以及是否能於 OSCE 現場被考官觀察與評分。\n本表採四分量表進行評分，1 分代表「非常不適切」、2 分代表「不適切」、3 分代表「適切」、4 分代表「非常適切」。其中 3 分與 4 分視為專家同意該題項具內容效度，後續可用於計算 I-CVI 與 S-CVI/Ave。若專家認為題項需調整，請於「修改建議」欄位中說明建議保留、修改、合併或刪除之原因。"}
                </div>

                <div className="questions-list">
                  {CHECKLIST_QUESTIONS.map((q) => (
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
                  id="submit-evaluation-btn"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="spinner" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                      </svg>
                      送出審查中...
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
        ) : (
          /* Dashboard Tab */
          <div className="glass-card">
            {isLoadingSubmissions ? (
              <div className="loading-dashboard">
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
                <p>正在從 Supabase 即時計算效度統計指標...</p>
              </div>
            ) : dashboardError ? (
              <div className="empty-dashboard">
                <AlertCircle size={48} className="cvi-text-fail" />
                <h2>載入資料失敗</h2>
                <p>{dashboardError}</p>
                <button className="primary-btn" onClick={fetchSubmissions}>
                  重試連線
                </button>
              </div>
            ) : !stats || stats.total === 0 ? (
              <div className="empty-dashboard">
                <Users size={48} className="cvi-text-warn" />
                <h2>尚無專家評估數據</h2>
                <p>資料庫目前為空。請先使用「填寫評量表」分頁輸入專家評估資料，系統將即時計算出 I-CVI 與 S-CVI 統計數值。</p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {/* Stats row Overview */}
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon-container blue">
                      <Users size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">專家審查總人數 (N)</span>
                      <span className="stat-value">{stats.total} 位</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-container purple">
                      <BookOpen size={24} />
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
                      <Award size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Checklist S-CVI / Ave</span>
                      <span className={`stat-value ${stats.checklist.sCviAve >= 0.90 ? 'cvi-text-pass' : 'cvi-text-warn'}`}>
                        {stats.checklist.sCviAve.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 1 Analysis */}
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

                {/* Section 2 Analysis */}
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

              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 OSCE Validity Assessment System. 版權所有。 資料庫串接自 Supabase。</p>
      </footer>
    </div>
  );
}

export default App;
