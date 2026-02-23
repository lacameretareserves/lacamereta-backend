import express from 'express';
import { loginAdmin, verifyToken } from '../controllers/authController';

const router = express.Router();

// Login
router.post('/login', loginAdmin);

// Verificar token
router.get('/verify', verifyToken);

export default router;