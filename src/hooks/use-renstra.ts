import { useEffect, useState, useCallback } from "react";
import { INITIAL_PROGRAMS, type Program, type Year, emptyValues } from "@/lib/renstra-data";

const STORAGE_KEY = "renstra-data-v1";

export function useRenstra() {
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrograms(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  }, [programs, hydrated]);

  const updateValue = useCallback(
    (
      programId: string,
      sasaranId: string,
      indikatorId: string,
      year: Year,
      field: "target" | "actual" | "budget",
      value: number,
    ) => {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id !== programId
            ? p
            : {
                ...p,
                sasaran: p.sasaran.map((s) =>
                  s.id !== sasaranId
                    ? s
                    : {
                        ...s,
                        indikator: s.indikator.map((i) =>
                          i.id !== indikatorId
                            ? i
                            : {
                                ...i,
                                values: {
                                  ...i.values,
                                  [year]: { ...i.values[year], [field]: value },
                                },
                              },
                        ),
                      },
                ),
              },
        ),
      );
    },
    [],
  );

  const addProgram = useCallback((nama: string) => {
    setPrograms((prev) => [...prev, { id: `P${Date.now()}`, nama, sasaran: [] }]);
  }, []);

  const addSasaran = useCallback((programId: string, nama: string) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id !== programId
          ? p
          : { ...p, sasaran: [...p.sasaran, { id: `S${Date.now()}`, nama, indikator: [] }] },
      ),
    );
  }, []);

  const addIndikator = useCallback(
    (programId: string, sasaranId: string, nama: string, satuan: string) => {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id !== programId
            ? p
            : {
                ...p,
                sasaran: p.sasaran.map((s) =>
                  s.id !== sasaranId
                    ? s
                    : {
                        ...s,
                        indikator: [
                          ...s.indikator,
                          { id: `I${Date.now()}`, nama, satuan, values: emptyValues() },
                        ],
                      },
                ),
              },
        ),
      );
    },
    [],
  );

  const deleteIndikator = useCallback(
    (programId: string, sasaranId: string, indikatorId: string) => {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id !== programId
            ? p
            : {
                ...p,
                sasaran: p.sasaran.map((s) =>
                  s.id !== sasaranId
                    ? s
                    : { ...s, indikator: s.indikator.filter((i) => i.id !== indikatorId) },
                ),
              },
        ),
      );
    },
    [],
  );

  const reset = useCallback(() => setPrograms(INITIAL_PROGRAMS), []);

  return {
    programs,
    updateValue,
    addProgram,
    addSasaran,
    addIndikator,
    deleteIndikator,
    reset,
  };
}
