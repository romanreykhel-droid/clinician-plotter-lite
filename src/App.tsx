import React, { useEffect, useRef, useState } from 'react';

// ----- Types -----
type Discipline = 'RN' | 'LVN' | 'PT' | 'OT' | 'ST' | 'HHA';
type Clinician = {
  id: string;
  name: string;
  discipline: Discipline;
  startTime: string;
  endTime: string;
  visitTask: string; // NEW: task type like "RN Wound Care"
};

// ----- Storage constants -----
const STORAGE_KEY = 'clinician-plotter-lite';
const STORAGE_VERSION = 1;

// ----- Seed data -----
const seedClinicians: Clinician[] = [
  { id: 'c1', name: 'Camille Pereyras', discipline: 'RN',  startTime: '08:00', endTime: '17:00', visitTask: 'RN Wound Care' },
  { id: 'c2', name: 'Nelson Melo',      discipline: 'LVN', startTime: '09:00', endTime: '17:00', visitTask: 'LVN Wound Care' },
];

export default function App() {
  const [clinicians, setClinicians] = useState<Clinician[]>(seedClinicians);

  // ---- Load from localStorage on first mount ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.version === STORAGE_VERSION && Array.isArray(parsed?.clinicians)) {
        setClinicians(parsed.clinicians);
      }
    } catch {
      // ignore bad data and keep seeds
    }
  }, []);

  // ---- Debounced save whenever clinicians change ----
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const payload = JSON.stringify({ version: STORAGE_VERSION, clinicians });
      localStorage.setItem(STORAGE_KEY, payload);
    }, 200);
    return () => window.clearTimeout(saveTimer.current);
  }, [clinicians]);

  // ---- Actions ----
  const addClinician = () => {
    const id = `c${clinicians.length + 1}`;
    setClinicians(c => [
      ...c,
      {
        id,
        name: `New Clinician ${clinicians.length + 1}`,
        discipline: 'RN',
        startTime: '08:00',
        endTime: '17:00',
        visitTask: 'RN Wound Care',
      },
    ]);
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setClinicians(seedClinicians);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ version: STORAGE_VERSION, clinicians }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinicians.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        if (Array.isArray(obj?.clinicians)) {
          setClinicians(obj.clinicians); // saving happens via effect
        } else {
          alert('Invalid JSON format.');
        }
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // ---- UI ----
  return (
    <div className="w-full min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Clinician Schedule — Lite</h1>

        <div className="flex gap-2 mb-4">
          <button className="px-3 py-2 rounded bg-black text-white" onClick={addClinician}>
            Add Clinician
          </button>
          <button className="px-3 py-2 rounded bg-gray-200" onClick={resetAll}>
            Reset
          </button>
          <button className="px-3 py-2 rounded bg-gray-200" onClick={exportJSON}>
            Export
          </button>
          <label className="px-3 py-2 rounded bg-gray-200 cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files && importJSON(e.target.files[0])}
            />
          </label>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <div className="overflow-x-auto">
            <table data-testid="clinicians-table" className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Name</th>
                  <th>Discipline</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Visit Task</th>
                </tr>
              </thead>
              <tbody>
                {clinicians.map((c, i) => (
                  <tr key={c.id} className="border-t">
                    <td>
                      <input
                        data-testid={`name-${c.id}`}
                        className="w-full"
                        value={c.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setClinicians((arr) => arr.map((x, ix) => (ix === i ? { ...x, name: v } : x)));
                        }}
                      />
                    </td>
                    <td>
                      <select
                        data-testid={`discipline-${c.id}`}
                        value={c.discipline}
                        onChange={(e) => {
                          const v = e.target.value as Clinician['discipline'];
                          setClinicians((arr) => arr.map((x, ix) => (ix === i ? { ...x, discipline: v } : x)));
                        }}
                      >
                        {['RN', 'LVN', 'PT', 'OT', 'ST', 'HHA'].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        data-testid={`start-${c.id}`}
                        className="w-20"
                        value={c.startTime}
                        onChange={(e) => {
                          const v = e.target.value;
                          setClinicians((arr) => arr.map((x, ix) => (ix === i ? { ...x, startTime: v } : x)));
                        }}
                      />
                    </td>
                    <td>
                      <input
                        data-testid={`end-${c.id}`}
                        className="w-20"
                        value={c.endTime}
                        onChange={(e) => {
                          const v = e.target.value;
                          setClinicians((arr) => arr.map((x, ix) => (ix === i ? { ...x, endTime: v } : x)));
                        }}
                      />
                    </td>
                    <td>
                      <select
                        data-testid={`visitTask-${c.id}`}
                        value={c.visitTask}
                        onChange={(e) => {
                          const v = e.target.value;
                          setClinicians((arr) => arr.map((x, ix) => (ix === i ? { ...x, visitTask: v } : x)));
                        }}
                      >
                        {[
                          'RN Wound Care',
                          'LVN Wound Care',
                          'PT Evaluation',
                          'OT Evaluation',
                          'ST Evaluation',
                          'Routine Visit',
                        ].map((task) => (
                          <option key={task} value={task}>
                            {task}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Data is saved locally in your browser (localStorage). No PHI is stored or sent anywhere.
        </p>
      </div>
    </div>
  );
}