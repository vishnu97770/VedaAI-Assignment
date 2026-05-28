'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAssignment } from '@/lib/api';
import { IAssignment } from '@/types/assignment';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-700 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'hard': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function OutputPage({ params }: any) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      fetchAssignment(resolved.id);
    };
    resolveParams();
  }, []);

  const fetchAssignment = async (id: string) => {
    try {
      const data = await getAssignment(id);
      setAssignment(data.assignment);
    } catch (err) {
      setError('Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error || 'Assignment not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VedaAI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              🖨️ Print
            </button>
            <button
              onClick={() => router.push('/create-assignment')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              + New Assignment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="bg-purple-600 px-8 py-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-1">{assignment.title}</h1>
            <p className="text-purple-200 text-sm">Subject: {assignment.subject}</p>
            <p className="text-purple-200 text-sm">
              Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>

          <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Student Name</label>
                <div className="border-b-2 border-gray-400 pb-1 min-h-[24px]"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Roll Number</label>
                <div className="border-b-2 border-gray-400 pb-1 min-h-[24px]"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Section</label>
                <div className="border-b-2 border-gray-400 pb-1 min-h-[24px]"></div>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 border-b border-gray-200 flex items-center gap-6 text-sm">
            <span className="text-gray-600">
              Total Questions: <strong>{assignment.numberOfQuestions}</strong>
            </span>
            <span className="text-gray-600">
              Total Marks: <strong>{assignment.totalMarks}</strong>
            </span>
            <span className="text-gray-600">
              Sections: <strong>{assignment.sections.length}</strong>
            </span>
          </div>

          <div className="px-8 py-6 space-y-8">
            {assignment.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {String.fromCharCode(65 + sectionIndex)}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{section.title}</h2>
                    <p className="text-xs text-gray-500">{section.instruction}</p>
                  </div>
                </div>

                <div className="space-y-4 ml-11">
                  {section.questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <span className="text-sm font-bold text-gray-500 shrink-0 mt-0.5">
                        {qIndex + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-relaxed mb-2">
                          {question.questionText}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">
                            {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">Generated by VedaAI • All the best!</p>
          </div>
        </div>
      </div>
    </div>
  );
}