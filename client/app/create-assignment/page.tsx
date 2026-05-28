'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAssignment } from '@/lib/api';
import { connectWebSocket } from '@/lib/websocket';
import { useAssignmentStore } from '@/store/assignmentStore';

const QUESTION_TYPES = ['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Fill in the blanks'];

export default function CreateAssignment() {
  const router = useRouter();
  const { setIsGenerating, setGenerationStatus } = useAssignmentStore();

  const [form, setForm] = useState({
    title: '',
    subject: '',
    dueDate: '',
    questionTypes: [] as string[],
    numberOfQuestions: '',
    totalMarks: '',
    additionalInstructions: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.dueDate) newErrors.dueDate = 'Due date is required';
    if (form.questionTypes.length === 0) newErrors.questionTypes = 'Select at least one question type';
    if (!form.numberOfQuestions) newErrors.numberOfQuestions = 'Number of questions is required';
    if (Number(form.numberOfQuestions) <= 0) newErrors.numberOfQuestions = 'Must be greater than 0';
    if (!form.totalMarks) newErrors.totalMarks = 'Total marks is required';
    if (Number(form.totalMarks) <= 0) newErrors.totalMarks = 'Must be greater than 0';
    return newErrors;
  };

  const toggleQuestionType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
    }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setStatusMessage('Creating assignment...');

    try {
      const response = await createAssignment({
        ...form,
        numberOfQuestions: Number(form.numberOfQuestions),
        totalMarks: Number(form.totalMarks),
      });

      const assignmentId = response.assignmentId;
      setIsGenerating(true);
      setStatusMessage('Connecting to AI...');

      // connect websocket to get real time updates
      const ws = connectWebSocket(assignmentId, (data) => {
        setGenerationStatus(data.status);
        setStatusMessage(data.message);

        if (data.status === 'completed') {
          setIsGenerating(false);
          ws.close();
          setTimeout(() => {
            router.push(`/output/${assignmentId}`);
          }, 1000);
        }

        if (data.status === 'failed') {
          setIsGenerating(false);
          setStatusMessage('Generation failed. Please try again.');
          ws.close();
        }
      });
    } catch (error) {
      console.error('Failed to create assignment:', error);
      setStatusMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
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
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Assignment</h1>
        <p className="text-gray-500 mb-8">Fill in the details to generate your question paper</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">

          {/* title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Quiz on Electricity"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Physics"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>

          {/* due date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
          </div>

          {/* question types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Types *
            </label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleQuestionType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${form.questionTypes.includes(type)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.questionTypes && <p className="text-red-500 text-xs mt-1">{errors.questionTypes}</p>}
          </div>

          {/* number of questions and marks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions *
              </label>
              <input
                type="number"
                value={form.numberOfQuestions}
                onChange={(e) => setForm({ ...form, numberOfQuestions: e.target.value })}
                placeholder="e.g. 10"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.numberOfQuestions && <p className="text-red-500 text-xs mt-1">{errors.numberOfQuestions}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks *
              </label>
              <input
                type="number"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                placeholder="e.g. 100"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.totalMarks && <p className="text-red-500 text-xs mt-1">{errors.totalMarks}</p>}
            </div>
          </div>

          {/* additional instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Instructions
            </label>
            <textarea
              value={form.additionalInstructions}
              onChange={(e) => setForm({ ...form, additionalInstructions: e.target.value })}
              placeholder="Any specific instructions for the AI..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* status message */}
          {statusMessage && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <p className="text-purple-700 text-sm">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Generate Question Paper'}
          </button>
        </div>
      </div>
    </div>
  );
}