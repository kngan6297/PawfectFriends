import express from 'express';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Activity router working' });
});

export const activityRouter = router;
export default router;
