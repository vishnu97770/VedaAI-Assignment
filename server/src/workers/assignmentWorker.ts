import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import Groq from 'groq-sdk';
import Assignment from '../models/assignment';
import { notifyClient } from '../websocket/wsManager';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const generateQuestions = async (data: any) => {
  const prompt = `
    You are an expert teacher creating a question paper.
    Subject: ${data.subject}
    Title: ${data.title}
    Total Questions: ${data.numberOfQuestions}
    Total Marks: ${data.totalMarks}
    Question Types: ${data.questionTypes.join(', ')}
    Additional Instructions: ${data.additionalInstructions || 'None'}
    
    Create a structured question paper with sections.
    Respond with ONLY valid JSON, no extra text, no markdown.
    
    Format:
    {
      "sections": [
        {
          "title": "Section A",
          "instruction": "Attempt all questions",
          "questions": [
            {
              "questionText": "Question here",
              "difficulty": "easy",
              "marks": 2
            }
          ]
        }
      ]
    }
    
    Rules:
    - difficulty must be exactly: easy, medium, or hard
    - Make questions relevant to the subject
    - Total marks must equal ${data.totalMarks}
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content || '';
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
};

const getConnection = () => ({
  host: 'helpful-seahorse-137994.upstash.io',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  tls: {},
});

const worker = new Worker(
  'assignment-generation',
  async (job: Job) => {
    const { assignmentId, ...data } = job.data;

    try {
      console.log(`Processing job for assignment: ${assignmentId}`);

      notifyClient(assignmentId, {
        type: 'status',
        status: 'processing',
        message: 'Generating your question paper...',
      });

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'processing',
      });

      const generated = await generateQuestions(data);

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        sections: generated.sections,
      });

      notifyClient(assignmentId, {
        type: 'status',
        status: 'completed',
        message: 'Question paper ready!',
        assignmentId,
      });

      console.log(`Assignment ${assignmentId} completed successfully`);
    } catch (error) {
      console.error(`Job failed for assignment ${assignmentId}:`, error);

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
      });

      notifyClient(assignmentId, {
        type: 'status',
        status: 'failed',
        message: 'Generation failed. Please try again.',
      });

      throw error;
    }
  },
  { connection: getConnection() }
);

worker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export default worker;