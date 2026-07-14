import { create } from "zustand";
import type { VerificationDraft, DocumentRecord } from "../api/verificationClient";

interface VerificationStoreState {
  submissionId: string | null;
  dealId: string | null;
  currentStep: number;
  draft: VerificationDraft | null;
  isLoading: boolean;
  setSubmissionId: (id: string, dealId: string) => void;
  setDraft: (draft: VerificationDraft) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  upsertDocument: (document: DocumentRecord) => void;
  removeDocument: (documentId: string) => void;
  reset: () => void;
}

export const useVerificationStore = create<VerificationStoreState>((set) => ({
  submissionId: null,
  dealId: null,
  currentStep: 1,
  draft: null,
  isLoading: true,

  setSubmissionId: (id, dealId) => set({ submissionId: id, dealId }),
  setDraft: (draft) => set({ draft, currentStep: draft.currentStep }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ isLoading: loading }),

  upsertDocument: (document) =>
    set((state) => {
      if (!state.draft) return state;
      const existing = state.draft.documents.filter((doc) => doc.id !== document.id);
      return { draft: { ...state.draft, documents: [...existing, document] } };
    }),

  removeDocument: (documentId) =>
    set((state) => {
      if (!state.draft) return state;
      return {
        draft: {
          ...state.draft,
          documents: state.draft.documents.filter((doc) => doc.id !== documentId),
        },
      };
    }),

  reset: () => set({ submissionId: null, dealId: null, currentStep: 1, draft: null, isLoading: true }),
}));
