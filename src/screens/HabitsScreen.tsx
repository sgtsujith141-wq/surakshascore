import React, { useState } from 'react';
import { useScan } from '../context/ScanContext';
import { HABITS_QUESTION_BANK } from '../lib/collectors/habitsCollector';
import { Card } from '../components/ui/Card';
import { HabitSection } from '../types';
import { CheckCircle2 } from 'lucide-react';

export const HabitsScreen: React.FC = () => {
  const { habitsResponses, saveHabitResponse, runScan } = useScan();
  const [selectedSection, setSelectedSection] = useState<HabitSection | 'all'>('all');

  const responseMap = new Map<string, string[]>();
  for (const r of habitsResponses) {
    responseMap.set(r.questionId, r.selectedOptionIds);
  }

  const handleSelectOption = (questionId: string, optionId: string) => {
    saveHabitResponse({
      questionId,
      selectedOptionIds: [optionId],
      answeredAt: new Date().toISOString(),
    });
    // Trigger score re-computation
    runScan();
  };

  const sections: { id: HabitSection; label: string }[] = [
    { id: 'auth', label: '1. Authentication' },
    { id: 'password', label: '2. Passwords' },
    { id: 'recovery', label: '3. Recovery & Backup' },
    { id: 'phishing', label: '4. Phishing Scenarios' },
    { id: 'sharing', label: '5. Device Sharing' },
  ];

  const filteredQuestions =
    selectedSection === 'all'
      ? HABITS_QUESTION_BANK
      : HABITS_QUESTION_BANK.filter((q) => q.section === selectedSection);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-950 tracking-tight">Security Habits Assessment</h2>
        <p className="text-xs text-slate-500">
          Self-reported posture & phishing scenario micro-quizzes (§8) with 0.6 confidence weighting
        </p>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedSection('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
            selectedSection === 'all'
              ? 'bg-neutral-950 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Sections
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedSection(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSection === s.id
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          const selected = responseMap.get(q.id)?.[0];
          const isScenario = q.type === 'scenario_quiz';

          return (
            <Card key={q.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Section: {q.section}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-950">{q.title}</h3>
                  {q.subtitle && <p className="text-xs text-slate-500 mt-0.5">{q.subtitle}</p>}
                </div>

                {isScenario && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    Scenario Quiz
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {q.options.map((opt) => {
                  const isChecked = selected === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? opt.points >= 70
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 ring-1 ring-emerald-300'
                            : 'bg-rose-50/70 border-rose-300 text-rose-950 ring-1 ring-rose-300'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="leading-relaxed">{opt.label}</span>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isChecked && (
                          <span
                            className={`text-[11px] font-bold ${
                              opt.points >= 70 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {opt.points} pts
                          </span>
                        )}
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChecked
                              ? opt.points >= 70
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-rose-500 bg-rose-500 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <CheckCircle2 size={12} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scenario Explanation */}
              {isScenario && selected && q.explanation && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                  <strong>Security Analysis:</strong> {q.explanation}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
