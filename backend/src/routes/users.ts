import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Users route' });
});

router.post('/reset', (req, res) => {
    res.json({ message: 'Users reset' });
});

export default router;
