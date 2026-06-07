-- 建立 OSCE 專家效度審查表資料表
CREATE TABLE IF NOT EXISTS public.osce_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expert_name TEXT NOT NULL,
    expert_background TEXT[] NOT NULL,
    expert_background_other TEXT,
    years_of_experience TEXT NOT NULL,
    overall_ratings JSONB NOT NULL,
    checklist_ratings JSONB NOT NULL
);

-- 啟用 Row Level Security (RLS)
ALTER TABLE public.osce_evaluations ENABLE ROW LEVEL SECURITY;

-- 建立所有人皆可寫入（專家提交評估）的安全性政策
CREATE POLICY "Allow public insert" 
ON public.osce_evaluations 
FOR INSERT 
WITH CHECK (true);

-- 建立所有人皆可讀取（即時儀表板統計）的安全性政策
CREATE POLICY "Allow public select" 
ON public.osce_evaluations 
FOR SELECT 
USING (true);
