import { create } from "zustand";

interface SaveStateStore {
	isSaving: boolean;
	setSaving: (isSaving: boolean) => void;
}

export const useSaveState = create<SaveStateStore>((set) => ({
	isSaving: false,
	setSaving: (isSaving: boolean) => set({ isSaving }),
}));
