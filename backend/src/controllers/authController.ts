import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_super_secreto_cambiar_en_produccion_camereta_2024';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

// Login de administrador
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario admin
    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        nombre: admin.nombre 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login exitoso',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre
      }
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

// Verificar token (para rutas protegidas)
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Verificar que el admin aún existe
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.id }
    });

    if (!admin) {
      return res.status(401).json({
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      valid: true,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre
      }
    });

  } catch (error: any) {
    console.error('Error al verificar token:', error);
    res.status(401).json({
      message: 'Token inválido o expirado'
    });
  }
};