import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Session route' });
});

export default router;
