import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { YEARS, type Program, type Year, emptyValues } from "@/lib/renstra-data";
import { toast } from "sonner";

const QK = ["renstra", "all"] as const;

/**
 * Optimized fetcher that uses a single nested query to get all data at once.
 * This is much faster than multiple parallel queries.
 */
async function fetchAll(): Promise<Program[]> {
  const { data, error } = await supabase
    .from("renstra_programs")
    .select(`
      id,
      nama,
      urutan,
      sasaran:renstra_sasaran(
        id,
        nama,
        urutan,
        indikator:renstra_indikator(
          id,
          nama,
          satuan,
          bagian,
          borang_aipt,
          kode,
          iku_ikt,
          baseline,
          penjelasan,
          pic,
          link,
          urutan,
          values:renstra_yearly_values(
            tahun,
            bulan,
            target,
            actual,
            budget
          )
        )
      )
    `)
    .order("urutan");

  if (error) {
    console.error("Fetch Error:", error);
    throw error;
  }

  // Transform nested Supabase data into our app's Program structure
  return (data || []).map((p: any) => ({
    id: p.id,
    nama: p.nama,
    sasaran: (p.sasaran || [])
      .sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0))
      .map((s: any) => ({
        id: s.id,
        nama: s.nama,
        indikator: (s.indikator || [])
          .sort((a: any, b: any) => (a.urutan || 0) - (b.urutan || 0))
          .map((ind: any) => {
            // Reconstruct the values object (target, actual, budget per year + monthly values)
            const values = emptyValues();
            (ind.values || []).forEach((v: any) => {
              const year = v.tahun as Year;
              if (YEARS.includes(year)) {
                if (v.bulan === 0 || v.bulan === null) {
                  values[year].target = Number(v.target) || 0;
                  values[year].actual = Number(v.actual) || 0;
                  values[year].budget = Number(v.budget) || 0;
                } else if (v.bulan >= 1 && v.bulan <= 12) {
                  values[year].months[v.bulan] = { actual: Number(v.actual) || 0 };
                }
              }
            });

            return {
              id: ind.id,
              nama: ind.nama,
              satuan: ind.satuan || "",
              bagian: ind.bagian || "",
              borang_aipt: ind.borang_aipt || "",
              kode: ind.kode || "",
              iku_ikt: ind.iku_ikt || "",
              baseline: Number(ind.baseline) || 0,
              penjelasan: ind.penjelasan || "",
              pic: ind.pic || "",
              link: ind.link || "",
              values,
            };
          }),
      })),
  }));
}

export const renstraQueryOptions = queryOptions({
  queryKey: QK,
  queryFn: fetchAll,
  staleTime: 5 * 60 * 1000, // 5 minutes cache
  gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
});

export function useRenstra() {
  const qc = useQueryClient();
  const {
    data: programs = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery(renstraQueryOptions);

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: QK }), [qc]);

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
    [qc, invalidate],
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
  
  const deleteProgramMut = useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from("renstra_programs")
        .delete()
        .eq("id", programId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Program dihapus");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  
  const addSasaranRowMut = useMutation({
    mutationFn: async (payload: any) => {
      const { programId, sasaranNama, indikatorNama, bagian, borang_aipt, kode, iku_ikt, baseline, satuan, penjelasan, pic, link, targetTahunan, selectedYear } = payload;
      
      const { data: sasaran, error: sErr } = await supabase
        .from("renstra_sasaran")
        .insert({ program_id: programId, nama: sasaranNama })
        .select()
        .single();
      if (sErr) throw sErr;

      const { data: ind, error: iErr } = await supabase
        .from("renstra_indikator")
        .insert({ 
          sasaran_id: sasaran.id, 
          nama: indikatorNama, 
          satuan: satuan || "",
          bagian: bagian || "",
          borang_aipt: borang_aipt || "",
          kode: kode || "",
          iku_ikt: iku_ikt || "",
          baseline: baseline || 0,
          penjelasan: penjelasan || "",
          pic: pic || "",
          link: link || ""
        })
        .select()
        .single();
      if (iErr) throw iErr;

      const rows = YEARS.map((y) => ({
        indikator_id: ind.id,
        tahun: y,
        target: y === selectedYear ? (targetTahunan || 0) : 0,
        actual: 0,
        budget: 0,
      }));
      const { error: vErr } = await supabase.from("renstra_yearly_values").insert(rows);
      if (vErr) throw vErr;
    },
    onSuccess: () => {
      toast.success("Sasaran dan Indikator berhasil ditambahkan");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSasaranMut = useMutation({
    mutationFn: async ({ id, nama }: { id: string; nama: string }) => {
      const { error } = await supabase.from("renstra_sasaran").update({ nama }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateIndikator = useCallback(async (id: string, updates: Partial<Program["sasaran"][number]["indikator"][number]>) => {
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
  }, [qc, invalidate]);

  const refetchRenstra = useCallback(() => {
    void refetch();
  }, [refetch]);

  return useMemo(() => ({
    programs,
    isLoading,
    isFetching,
    isError,
    error,
    refetchRenstra,
    updateValue,
    addProgram: (nama: string) => addProgramMut.mutate(nama),
    deleteProgram: (programId: string) => deleteProgramMut.mutate(programId),
    addSasaran: (programId: string, nama: string) => addSasaranMut.mutate({ programId, nama }),
    addSasaranRow: (payload: any) => addSasaranRowMut.mutate(payload),
    updateSasaran: (id: string, nama: string) => updateSasaranMut.mutate({ id, nama }),
    addIndikator: (_programId: string, sasaranId: string, nama: string, satuan: string) =>
      addIndikatorMut.mutate({ sasaranId, nama, satuan }),
    deleteIndikator: (_programId: string, _sasaranId: string, indikatorId: string) =>
      deleteIndikatorMut.mutate(indikatorId),
    updateIndikator,
    reset: invalidate,
  }), [
    programs,
    isLoading,
    isFetching,
    isError,
    error,
    refetchRenstra,
    updateValue,
    updateIndikator, 
    invalidate,
    addProgramMut,
    deleteProgramMut,
    addSasaranMut,
    addSasaranRowMut,
    updateSasaranMut,
    addIndikatorMut,
    deleteIndikatorMut
  ]);
}


