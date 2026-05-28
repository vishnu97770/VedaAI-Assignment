import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import Assignment from '../models/assignment';
import { notifyClient } from '../websocket/wsManager';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const getConnection = () => ({
  host: 'helpful-seahorse-137994.upstash.io',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  tls: {},
});


// this is where the actual AI magic happens
const generateQuestions = async (data: any) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert teacher creating a question paper.
    
    Subject: ${data.subject}
    Title: ${data.title}
    Total Questions: ${data.numberOfQuestions}
    Total Marks: ${data.totalMarks}
    Question Types: ${data.questionTypes.join(', ')}
    Additional Instructions: ${data.additionalInstructions || 'None'}
    
    Create a structured question paper with sections.
    You MUST respond with ONLY a valid JSON object, no extra text.
    
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
    - Difficulty must be exactly: easy, medium, or hard
    - Distribute questions evenly across sections
    - Make questions relevant to the subject
    - Total marks of all questions must equal ${data.totalMarks}
  `;


  const result = await model.generateContent(prompt);
  const response = result.response.text();

  
  // clean the response and parse it
  const cleaned = response
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
};


// worker listens to the queue and processes jobs
const worker = new Worker(
  'assignment-generation',
  async (job: Job) => {
    const { assignmentId, ...data } = job.data;

    try {
      console.log(`Processing job for assignment: ${assignmentId}`);


      // notify frontend - started
      notifyClient(assignmentId, {
        type: 'status',
        status: 'processing',
        message: 'Generating your question paper...',
      });


      // update status in db
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'processing',
      });


      // call gemini
      const generated = await generateQuestions(data);


      // save result to mongodb
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'completed',
        sections: generated.sections,
      });


      // notify frontend - done!
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