import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  enviarEmailConfirmacionCliente,
  enviarEmailNotificacionEstudio,
  enviarEmailCambioEstado,
  verificarConfiguracionEmail
} from '../services/emailService';

const prisma = new PrismaClient();

// Verificar configuración de email al iniciar (opcional)
let emailConfigOk = false;
verificarConfiguracionEmail().then((ok) => {
  emailConfigOk = ok;
  if (!ok) {
    console.log('⚠️  Emails desactivados - Configura EMAIL_USER y EMAIL_PASS en .env');
  }
});

// Crear una nueva reserva
export const createReserva = async (req: Request, res: Response) => {
  try {
    const { nombre, email, telefono, tipoSesionId, fechaHora, comentarios } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !tipoSesionId || !fechaHora) {
      return res.status(400).json({
        message: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // BUSCAR el tipo de sesión por NOMBRE (no por ID)
    const tipoSesion = await prisma.tipoSesion.findUnique({
      where: { nombre: tipoSesionId }
    });

    if (!tipoSesion) {
      return res.status(400).json({
        message: `Tipo de sesión "${tipoSesionId}" no encontrado`
      });
    }

    // Buscar o crear cliente
    let cliente = await prisma.cliente.findUnique({
      where: { email }
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { nombre, email, telefono }
      });
    }

    // Crear la reserva usando el ID real del tipo de sesión
    const reserva = await prisma.reserva.create({
      data: {
        clienteId: cliente.id,
        tipoSesionId: tipoSesion.id,
        fechaHora: new Date(fechaHora),
        comentarios,
        estado: 'pendiente'
      },
      include: {
        cliente: true,
        tipoSesion: true
      }
    });

    // Enviar emails (solo si está configurado)
    if (emailConfigOk) {
      try {
        // Email al cliente
        await enviarEmailConfirmacionCliente(
          email,
          nombre,
          tipoSesion.nombre,
          new Date(fechaHora)
        );

        // Email al estudio
        await enviarEmailNotificacionEstudio(
          nombre,
          email,
          telefono,
          tipoSesion.nombre,
          new Date(fechaHora),
          comentarios
        );

        console.log('✅ Emails enviados correctamente');
      } catch (emailError) {
        console.error('❌ Error al enviar emails:', emailError);
        // No fallar la reserva si el email falla
      }
    }

    res.status(201).json({
      message: 'Reserva creada exitosamente',
      reserva
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error al crear reserva:', err);
    res.status(500).json({
      message: 'Error al crear la reserva',
      error: err.message
    });
  }
};

// Obtener todas las reservas (para admin)
export const getAllReservas = async (req: Request, res: Response) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        cliente: true,
        tipoSesion: true
      },
      orderBy: {
        fechaHora: 'asc'
      }
    });

    res.json(reservas);
  } catch (error) {
    const err = error as Error;
    console.error('Error al obtener reservas:', err);
    res.status(500).json({
      message: 'Error al obtener las reservas',
      error: err.message
    });
  }
};

// Actualizar estado de una reserva
export const updateReservaEstado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada', 'eliminada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: 'Estado inválido. Debe ser: pendiente, confirmada, cancelada o completada'
      });
    }

    const reserva = await prisma.reserva.update({
      where: { id },
      data: { estado },
      include: {
        cliente: true,
        tipoSesion: true
      }
    });

    // Enviar email al cliente informando del cambio (solo si está configurado y no es "pendiente")
    if (emailConfigOk && estado !== 'pendiente' && reserva.cliente && reserva.tipoSesion) {
      try {
        await enviarEmailCambioEstado(
          reserva.cliente.email,
          reserva.cliente.nombre,
          estado,
          reserva.tipoSesion.nombre,
          reserva.fechaHora
        );
        console.log('✅ Email de cambio de estado enviado');
      } catch (emailError) {
        console.error('❌ Error al enviar email de cambio de estado:', emailError);
        // No fallar la actualización si el email falla
      }
    }

    res.json({
      message: 'Estado actualizado correctamente',
      reserva
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error al actualizar estado:', err);
    res.status(500).json({
      message: 'Error al actualizar el estado',
      error: err.message
    });
  }
};

// Eliminar múltiples reserves
export const deleteReservas = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: 'Has de proporcionar un array d\'IDs per eliminar'
      });
    }

    // Eliminar les reserves
    const result = await prisma.reserva.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    res.json({
      message: `${result.count} reserves eliminades correctament`,
      count: result.count
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error al eliminar reserves:', err);
    res.status(500).json({
      message: 'Error al eliminar les reserves',
      error: err.message
    });
  }
};