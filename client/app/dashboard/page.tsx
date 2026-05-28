'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { getAllAssignment, getAllAssignments } from '@/lib/api';

export default function Dashboard() {
    const router = useRouter();
    const { assignments, setAssignments, setIsLoading, isLoading } = useAssignmentStore();

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setIsLoading(true);
        try {
            const data = await getAllAssignments();
            setAssignments(data.assignments);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed' : return 'bg-green-100 text-green-700';
            case 'processing': return 'bg-yellow-100 text-yellow-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    return(
        <div className="min-h-screen bg-gray-50">
            {/*HEADER */}
             <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">VedaAI</span>
          </div>
          <button
            onClick={() => router.push('/create-assignment')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            + Create Assignment
          </button>
        </div>
      </div>

      {/* main content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assignments</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          // empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No assignments yet</h3>
            <p className="text-gray-500 mb-6">Create your first AI generated question paper</p>
            <button
              onClick={() => router.push('/create-assignment')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Create Assignment
            </button>
          </div>
        ) : (
          // assignments grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                onClick={() => {
                  if (assignment.status === 'completed') {
                    router.push(`/output/${assignment._id}`);
                  }
                }}
                className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm 
                  ${assignment.status === 'completed' ? 'cursor-pointer hover:shadow-md hover:border-purple-300' : ''} 
                  transition-all`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {assignment.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 shrink-0 ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mb-3">{assignment.subject}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{assignment.numberOfQuestions} questions</span>
                  <span>{assignment.totalMarks} marks</span>
                  <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
}