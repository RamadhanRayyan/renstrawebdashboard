import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { YEARS, type Program, type Year, emptyValues } from "@/lib/renstra-data";
import { toast } from "sonner";

const QK = ["renstra", "all"] as const;

async function fetchAll(): Promise<Program[]> {
  const [progRes, sasRes, indRes, valRes] = await Promise.all([
    supabase.from("renstra_programs").select("*").order("urutan").order("created_at"),
    supabase.from("renstra_sasaran").select("*").order("urutan").order("created_at"),
    supabase.from("renstra_indikator").select("*").order("urutan").order("created_at"),
    supabase.from("renstra_yearly_values").select("*"),
  ]);

  if (progRes.error) throw progRes.error;
  if (sasRes.error) throw sasRes.error;
  if (indRes.error) throw indRes.error;
  if (valRes.error) throw valRes.error;

  const valuesByInd = new Map<string, ReturnType<typeof emptyValues>>();
  for (const v of valRes.data ?? []) {
    let map = valuesByInd.get(v.indikator_id);
    if (!map) {
      map = emptyValues();
      valuesByInd.set(v.indikator_id, map);
    }
    if (YEARS.includes(v.tahun as Year)) {
      const yearData = map[v.tahun as Year];
      if (v.bulan === 0) {
        yearData.target = Number(v.target) || 0;
        yearData.actual = Number(v.actual) || 0;
        yearData.budget = Number(v.budget) || 0;
      } else {
        yearData.months[v.bulan] = { actual: Number(v.actual) || 0 };
      }
    }
  }

  const indBySasaran = new Map<string, Program["sasaran"][number]["indikator"]>();
  for (const i of indRes.data ?? []) {
    const arr = indBySasaran.get(i.sasaran_id) ?? [];
    arr.push({
      id: i.id,
      nama: i.nama,
      satuan: i.satuan ?? "",
      bagian: i.bagian ?? "",
      borang_aipt: i.borang_aipt ?? "",
      kode: i.kode ?? "",
      iku_ikt: i.iku_ikt ?? "",
      baseline: Number(i.baseline) || 0,
      penjelasan: i.penjelasan ?? "",
      pic: i.pic ?? "",
      values: valuesByInd.get(i.id) ?? emptyValues(),
    });
    indBySasaran.set(i.sasaran_id, arr);
  }

  const sasByProgram = new Map<string, Program["sasaran"]>();
  for (const s of sasRes.data ?? []) {
    const arr = sasByProgram.get(s.program_id) ?? [];
    arr.push({
      id: s.id,
      nama: s.nama,
      indikator: indBySasaran.get(s.id) ?? [],
    });
    sasByProgram.set(s.program_id, arr);
  }

  return (progRes.data ?? []).map((p) => ({
    id: p.id,
    nama: p.nama,
    sasaran: sasByProgram.get(p.id) ?? [],
  }));
}

export function useRenstra() {
  const qc = useQueryClient();
  const { data: programs = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn: fetchAll,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: QK });

  const updateValue = useCallback(
    async (
      indikatorId: string,
      year: Year,
      field: "target" | "actual" | "budget",
      value: number,
      month: number = 0,
    ) => {
      // Optimistic update
      qc.setQueryData<Program[]>(QK, (prev) =>
        (prev ?? []).map((p) => ({
          ...p,
          sasaran: p.sasaran.map((s) => ({
            ...s,
            indikator: s.indikator.map((i) =>
              i.id !== indikatorId
                ? i
                : {
                    ...i,
                    values: {
                      ...i.values,
                      [year]:
                        month === 0
                          ? { ...i.values[year], [field]: value }
                          : {
                              ...i.values[year],
                              months: {
                                ...i.values[year].months,
                                [month]: { actual: value },
                              },
                            },
                    },
                  },
            ),
          })),
        })),
      );

      const { error } = await supabase.from("renstra_yearly_values").upsert(
        {
          indikator_id: indikatorId,
          tahun: year,
          bulan: month,
          [field]: value,
        } as never,
        { onConflict: "indikator_id,tahun,bulan" },
      );

      if (error) {
        toast.error("Gagal menyimpan: " + error.message);
        invalidate();
      }
    },
    [qc],
  );

  const addProgramMut = useMutation({
    mutationFn: async (nama: string) => {
      const { error } = await supabase.from("renstra_programs").insert({ nama });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Program ditambahkan");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSasaranMut = useMutation({
    mutationFn: async ({ programId, nama }: { programId: string; nama: string }) => {
      const { error } = await supabase
        .from("renstra_sasaran")
        .insert({ program_id: programId, nama });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sasaran ditambahkan");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addIndikatorMut = useMutation({
    mutationFn: async ({
      sasaranId,
      nama,
      satuan,
    }: {
      sasaranId: string;
      nama: string;
      satuan: string;
    }) => {
      const { data: ind, error } = await supabase
        .from("renstra_indikator")
        .insert({ sasaran_id: sasaranId, nama, satuan })
        .select()
        .single();
      if (error) throw error;
      // Seed empty yearly rows
      const rows = YEARS.map((y) => ({
        indikator_id: ind.id,
        tahun: y,
        target: 0,
        actual: 0,
        budget: 0,
      }));
      const { error: vErr } = await supabase.from("renstra_yearly_values").insert(rows);
      if (vErr) throw vErr;
    },
    onSuccess: () => {
      toast.success("Indikator ditambahkan");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteIndikatorMut = useMutation({
    mutationFn: async (indikatorId: string) => {
      const { error } = await supabase
        .from("renstra_indikator")
        .delete()
        .eq("id", indikatorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Indikator dihapus");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    programs,
    isLoading,
    updateValue,
    addProgram: (nama: string) => addProgramMut.mutate(nama),
    addSasaran: (programId: string, nama: string) =>
      addSasaranMut.mutate({ programId, nama }),
    addIndikator: (_programId: string, sasaranId: string, nama: string, satuan: string) =>
      addIndikatorMut.mutate({ sasaranId, nama, satuan }),
    deleteIndikator: (_programId: string, _sasaranId: string, indikatorId: string) =>
      deleteIndikatorMut.mutate(indikatorId),
    updateIndikator: async (id: string, updates: Partial<Program["sasaran"][number]["indikator"][number]>) => {
      // Optimistic update
      qc.setQueryData<Program[]>(QK, (prev) =>
        (prev ?? []).map((p) => ({
          ...p,
          sasaran: p.sasaran.map((s) => ({
            ...s,
            indikator: s.indikator.map((i) => (i.id !== id ? i : { ...i, ...updates })),
          })),
        })),
      );

      const { error } = await supabase.from("renstra_indikator").update(updates as never).eq("id", id);
      if (error) {
        toast.error("Gagal update indikator: " + error.message);
        invalidate();
      }
    },
    reset: () => invalidate(),
  };
}
