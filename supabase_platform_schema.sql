-- ===================================================
-- OSCE 內容效度評估平台 - 資料庫 Schema (Platform Edition)
-- 請在 Supabase 控制台的 SQL Editor 中貼上並執行以下指令
-- ===================================================

-- 1. 建立量表主表 (cvi_surveys)
CREATE TABLE IF NOT EXISTS public.cvi_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    creator_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    password TEXT NOT NULL,
    title TEXT NOT NULL,
    overall_instructions TEXT NOT NULL,
    checklist_instructions TEXT NOT NULL,
    overall_questions JSONB NOT NULL,
    checklist_questions JSONB NOT NULL,
    expert_backgrounds TEXT[] NOT NULL DEFAULT ARRAY['臨床專家', 'OSCE考官', '醫學教育專家', '專科護理師教師']
);

-- 2. 建立專家回覆表 (cvi_responses)
CREATE TABLE IF NOT EXISTS public.cvi_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    survey_id UUID NOT NULL REFERENCES public.cvi_surveys(id) ON DELETE CASCADE,
    expert_name TEXT NOT NULL,
    expert_background TEXT[] NOT NULL,
    expert_background_other TEXT,
    years_of_experience TEXT NOT NULL,
    overall_ratings JSONB NOT NULL,
    checklist_ratings JSONB NOT NULL
);

-- 3. 啟用資料表 Row Level Security (RLS)
ALTER TABLE public.cvi_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvi_responses ENABLE ROW LEVEL SECURITY;

-- 4. 設定 cvi_surveys 安全政策 (RLS Policies)
-- 允許所有人建立新量表 (平台起單)
CREATE POLICY "Allow public insert for surveys" 
ON public.cvi_surveys 
FOR INSERT 
WITH CHECK (true);

-- 允許所有人讀取量表結構 (專家填寫或儀表板展示)
CREATE POLICY "Allow public select for surveys" 
ON public.cvi_surveys 
FOR SELECT 
USING (true);

-- 5. 設定 cvi_responses 安全政策 (RLS Policies)
-- 允許所有人新增專家評分 (專家提交)
CREATE POLICY "Allow public insert for responses" 
ON public.cvi_responses 
FOR INSERT 
WITH CHECK (true);

-- 允許所有人讀取專家評分 (儀表板 CVI 計算與意見彙整)
CREATE POLICY "Allow public select for responses" 
ON public.cvi_responses 
FOR SELECT 
USING (true);
