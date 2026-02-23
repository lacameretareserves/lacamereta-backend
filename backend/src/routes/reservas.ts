import express from 'express';
import { createReserva, getAllReservas, updateReservaEstado, deleteReservas } from '../controllers/reservaController';

const router = express.Router();

router.post('/', createReserva);
router.get('/', getAllReservas);
router.post('/delete-multiple', deleteReservas);
router.patch('/:id/estado', updateReservaEstado);

export default router;