import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { questions } from '../data/questions';

type Answers = Record<string, string[]>;

interface AssessmentValue {
  answers: Answers;
  total: number;
  answeredCount: number;
  isComplete: boolean;
  select: (questionId: string, optionId: string, multi: boolean, max?: number) => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentValue | null>(null);

export function AssessmentProvider({ children }: {children: React.ReactNode;}) {
  const [answers, setAnswers] = useState<Answers>({});

  const select = useCallback((questionId: string, optionId: string, multi: boolean, max?: number) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (!multi) return { ...prev, [questionId]: [optionId] };
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
      }
      if (max && current.length >= max) return prev;
      return { ...prev, [questionId]: [...current, optionId] };
    });
  }, []);

  const reset = useCallback(() => setAnswers({}), []);

  const value = useMemo<AssessmentValue>(() => {
    const answeredCount = questions.filter((q) => (answers[q.id] ?? []).length > 0).length;
    return {
      answers,
      total: questions.length,
      answeredCount,
      isComplete: answeredCount === questions.length,
      select,
      reset
    };
  }, [answers, select, reset]);

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used inside AssessmentProvider');
  return ctx;
}