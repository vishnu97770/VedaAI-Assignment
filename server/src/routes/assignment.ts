import { Router, Request, Response } from 'express';
import Assignment, { IAssignment } from '../models/assignment';
import { addAssignmentJob } from '../queues/assignmentQueue';

const router = Router();

// create a new assignment and add to queue
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      title,
      subject,
      dueDate,
      questionTypes,
      numberOfQuestions,
      totalMarks,
      additionalInstructions,
    } = req.body;

    // basic validation
    if (!title || !subject || !dueDate || !questionTypes || !numberOfQuestions || !totalMarks) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    if (numberOfQuestions <= 0 || totalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions and marks must be greater than 0',
      });
    }

    // save assignment to mongodb first
    const assignment = new Assignment({
      title,
      subject,
      dueDate,
      questionTypes,
      numberOfQuestions,
      totalMarks,
      additionalInstructions,
      status: 'pending',
    }) as IAssignment & { _id: any };

    await assignment.save();

    // add job to bullmq queue
    await addAssignmentJob(assignment._id.toString(), {
      title,
      subject,
      dueDate,
      questionTypes,
      numberOfQuestions,
      totalMarks,
      additionalInstructions,
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignmentId: assignment._id,
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

// get all assignments
router.get('/all', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-sections');

    return res.status(200).json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

// get single assignment with generated questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    return res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

export default router;