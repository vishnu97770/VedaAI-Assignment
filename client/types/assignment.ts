export interface IQuestion {
    questionText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
}

export interface ISection {
    title: string;
    instruction: string;
    questions: IQuestion[];
}

export interface IAssignment {
    _id: string;
    title: string;
    subject: string;
    dueDate: string;
    questionTypes: string[];
    numberOfQuestions: number;
    totalMarks: number;
    additionalInstructions: string;
    status: 'pending' | 'processing' | 'completed' | 'failed'
    sections: ISection[];
    createdAt: string;
}

export interface IAssignmentForm {
    title: string;
    sucject: string;
    dueDate: string;
    questionTypes: string[];
    numberOfQuestions: number;
    totalMarks: number;
    additionalInstructions: string;
}