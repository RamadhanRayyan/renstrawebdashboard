-- Programs
CREATE TABLE public.renstra_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sasaran
CREATE TABLE public.renstra_sasaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.renstra_programs(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_renstra_sasaran_program ON public.renstra_sasaran(program_id);

-- Indikator
CREATE TABLE public.renstra_indikator (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sasaran_id UUID NOT NULL REFERENCES public.renstra_sasaran(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  satuan TEXT NOT NULL DEFAULT '',
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_renstra_indikator_sasaran ON public.renstra_indikator(sasaran_id);

-- Yearly values
CREATE TABLE public.renstra_yearly_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indikator_id UUID NOT NULL REFERENCES public.renstra_indikator(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL CHECK (tahun BETWEEN 2025 AND 2029),
  target NUMERIC NOT NULL DEFAULT 0,
  actual NUMERIC NOT NULL DEFAULT 0,
  budget NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(indikator_id, tahun)
);
CREATE INDEX idx_renstra_yearly_values_indikator ON public.renstra_yearly_values(indikator_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_renstra_programs_updated BEFORE UPDATE ON public.renstra_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_renstra_sasaran_updated BEFORE UPDATE ON public.renstra_sasaran
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_renstra_indikator_updated BEFORE UPDATE ON public.renstra_indikator
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_renstra_yearly_values_updated BEFORE UPDATE ON public.renstra_yearly_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.renstra_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_sasaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_indikator ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_yearly_values ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "renstra_programs_read" ON public.renstra_programs FOR SELECT USING (true);
CREATE POLICY "renstra_sasaran_read" ON public.renstra_sasaran FOR SELECT USING (true);
CREATE POLICY "renstra_indikator_read" ON public.renstra_indikator FOR SELECT USING (true);
CREATE POLICY "renstra_yearly_values_read" ON public.renstra_yearly_values FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "renstra_programs_write" ON public.renstra_programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "renstra_sasaran_write" ON public.renstra_sasaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "renstra_indikator_write" ON public.renstra_indikator FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "renstra_yearly_values_write" ON public.renstra_yearly_values FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- For demo: also allow anon writes so dashboard works without login
CREATE POLICY "renstra_programs_anon_write" ON public.renstra_programs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "renstra_sasaran_anon_write" ON public.renstra_sasaran FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "renstra_indikator_anon_write" ON public.renstra_indikator FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "renstra_yearly_values_anon_write" ON public.renstra_yearly_values FOR ALL TO anon USING (true) WITH CHECK (true);