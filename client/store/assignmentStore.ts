import { create } from 'zustand';
import { IAssignment } from '@/types/assignment';

interface AssignmentState {
  assignments: IAssignment[];
  currentAssignment: IAssignment | null;
  isLoading: boolean;
  isGenerating: boolean;
  generationStatus: string;
  setAssignments: (assignments: IAssignment[]) => void;
  setCurrentAssignment: (assignment: IAssignment | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setGenerationStatus: (status: string) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  isGenerating: false,
  generationStatus: '',
  setAssignments: (assignments) => set({ assignments }),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setGenerationStatus: (status) => set({ generationStatus: status }),
}));

