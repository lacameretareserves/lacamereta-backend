import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { enviarEmailConfirmacion, enviarEmailCancelacion, enviarEmailNotificacionEstudio } from "./services/emailService";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ==========================================
// AUTH
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email i contrasenya requerits' });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Credencials invàlides' });
    }

    const bcrypt = require('bcryptjs');
    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({ message: 'Credencials invàlides' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin.id, email: admin.email, nombre: admin.nombre },
      process.env.JWT_SECRET || 'tu_super_secreto_cambiar_en_produccion_camereta_2024',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitós',
      token,
      admin: { id: admin.id, email: admin.email, nombre: admin.nombre }
    });
  } catch (e) {
    console.error("Error login:", e);
    res.status(500).json({ error: "Error al iniciar sessió" });
  }
});

app.get("/api/auth/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionat' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_super_secreto_cambiar_en_produccion_camereta_2024');

    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.id }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Usuari no trobat' });
    }

    res.json({
      valid: true,
      admin: { id: admin.id, email: admin.email, nombre: admin.nombre }
    });
  } catch (e) {
    res.status(401).json({ message: 'Token invàlid' });
  }
});

// ==========================================
// RESERVES
// ==========================================

app.get("/api/reservas", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: { cliente: true, tipoSesion: true },
      orderBy: { fechaHora: "asc" },
    });
    res.json(reservas);
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/reservas", async (req, res) => {
  try {
    const { nombre, email, telefono, tipoSesionId, fechaHora, comentarios } = req.body;

    if (!nombre || !email || !telefono || !tipoSesionId || !fechaHora) {
      return res.status(400).json({ message: 'Camps obligatoris incomplets' });
    }

    const tipoSesion = await prisma.tipoSesion.findUnique({
      where: { nombre: tipoSesionId }
    });

    if (!tipoSesion) {
      return res.status(400).json({ message: `Tipus de sessió "${tipoSesionId}" no trobat` });
    }

    const fechaReserva = new Date(fechaHora);
    
    const year = fechaReserva.getFullYear();
    const month = String(fechaReserva.getMonth() + 1).padStart(2, '0');
    const day = String(fechaReserva.getDate()).padStart(2, '0');
    const fechaSoloString = `${year}-${month}-${day}`;
    
    const hours = String(fechaReserva.getHours()).padStart(2, '0');
    const minutes = String(fechaReserva.getMinutes()).padStart(2, '0');
    const horaInicio = `${hours}:${minutes}`;

    console.log(`🔍 Buscant disponibilitat per: fecha=${fechaSoloString}, hora=${horaInicio}`);

    const todasFranjas = await prisma.disponibilidadHoraria.findMany({
      where: {
        fecha: {
          gte: new Date(`${fechaSoloString}T00:00:00.000Z`),
          lt: new Date(`${fechaSoloString}T23:59:59.999Z`)
        }
      }
    });

    console.log(`📊 Franges trobades per ${fechaSoloString}:`, todasFranjas.length);

    const franjaDisponible = todasFranjas.find(f => 
      f.horaInicio === horaInicio && 
      f.disponible === true && 
      f.reservaId === null
    );

    if (!franjaDisponible) {
      return res.status(400).json({ 
        message: 'Aquesta hora ja no està disponible. Si us plau, refresca la pàgina i selecciona una altra hora.' 
      });
    }

    let cliente = await prisma.cliente.findUnique({
      where: { email }
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { nombre, email, telefono }
      });
    }

    const reserva = await prisma.reserva.create({
      data: {
        clienteId: cliente.id,
        tipoSesionId: tipoSesion.id,
        fechaHora: fechaReserva,
        comentarios,
        estado: 'pendiente'
      },
      include: {
        cliente: true,
        tipoSesion: true
      }
    });

    await prisma.disponibilidadHoraria.update({
      where: { id: franjaDisponible.id },
      data: {
        disponible: false,
        reservaId: reserva.id
      }
    });

    console.log(`✅ Reserva creada i franja ${horaInicio} bloquejada automàticament`);

    try {
      await enviarEmailNotificacionEstudio(
        nombre,
        email,
        telefono,
        tipoSesion.nombre,
        fechaReserva,
        comentarios
      );
    } catch (emailError) {
      console.error('⚠️ Error enviant notificació a l\'estudi:', emailError);
    }

    res.status(201).json({
      message: 'Reserva creada exitosament',
      reserva
    });
  } catch (e) {
    console.error("Error crear reserva:", e);
    res.status(500).json({ error: "Error al crear reserva" });
  }
});

app.patch("/api/reservas/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ["pendiente", "confirmada", "cancelada", "completada", "eliminada"];
    
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ message: "Estat invàlid" });
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: { cliente: true, tipoSesion: true }
    });

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no trobada" });
    }

    if (estado === 'cancelada' || estado === 'eliminada') {
      const franjasActualizadas = await prisma.disponibilidadHoraria.updateMany({
        where: { reservaId: id },
        data: {
          disponible: true,
          reservaId: null
        }
      });
      
      if (franjasActualizadas.count > 0) {
        console.log(`🔓 ${franjasActualizadas.count} franja(es) alliberada(es) per reserva ${id}`);
      }

      if (estado === 'cancelada' && reserva.cliente && reserva.tipoSesion) {
        try {
          await enviarEmailCancelacion(
            reserva.cliente.email,
            reserva.cliente.nombre,
            reserva.tipoSesion.nombre,
            reserva.fechaHora
          );
        } catch (emailError) {
          console.error('⚠️ Error enviant email de cancel·lació:', emailError);
        }
      }
    }

    if (estado === 'confirmada' && reserva.estado !== 'confirmada') {
      const fechaReserva = new Date(reserva.fechaHora);
      const year = fechaReserva.getFullYear();
      const month = String(fechaReserva.getMonth() + 1).padStart(2, '0');
      const day = String(fechaReserva.getDate()).padStart(2, '0');
      const fechaSoloString = `${year}-${month}-${day}`;
      const hours = String(fechaReserva.getHours()).padStart(2, '0');
      const minutes = String(fechaReserva.getMinutes()).padStart(2, '0');
      const horaInicio = `${hours}:${minutes}`;
      
      const todasFranjas = await prisma.disponibilidadHoraria.findMany({
        where: {
          fecha: {
            gte: new Date(`${fechaSoloString}T00:00:00.000Z`),
            lt: new Date(`${fechaSoloString}T23:59:59.999Z`)
          }
        }
      });

      let disponibilidad = todasFranjas.find(f => f.horaInicio === horaInicio);

      if (!disponibilidad) {
        const duracionMinutos = reserva.tipoSesion.duracion;
        const horaFinDate = new Date(reserva.fechaHora);
        horaFinDate.setMinutes(horaFinDate.getMinutes() + duracionMinutos);
        const horaFinH = String(horaFinDate.getHours()).padStart(2, '0');
        const horaFinM = String(horaFinDate.getMinutes()).padStart(2, '0');
        const horaFin = `${horaFinH}:${horaFinM}`;

        disponibilidad = await prisma.disponibilidadHoraria.create({
          data: {
            fecha: new Date(`${fechaSoloString}T00:00:00.000Z`),
            horaInicio,
            horaFin,
            disponible: false,
            reservaId: id
          }
        });
      } else {
        await prisma.disponibilidadHoraria.update({
          where: { id: disponibilidad.id },
          data: {
            disponible: false,
            reservaId: id
          }
        });
      }

      if (reserva.cliente && reserva.tipoSesion) {
        try {
          await enviarEmailConfirmacion(
            reserva.cliente.email,
            reserva.cliente.nombre,
            reserva.tipoSesion.nombre,
            reserva.fechaHora,
            reserva.comentarios || undefined
          );
          console.log(`📧 Email de confirmació enviat a ${reserva.cliente.email}`);
        } catch (emailError) {
          console.error('⚠️ Error enviant email de confirmació:', emailError);
        }
      }
    }

    const updatedReserva = await prisma.reserva.update({
      where: { id },
      data: { estado },
      include: { cliente: true, tipoSesion: true }
    });
    
    res.json({ message: "Estado actualizado", reserva: updatedReserva });
  } catch (e) {
    console.error("Error PATCH:", e);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// ==========================================
// DISPONIBILITAT HORÀRIA
// ==========================================

app.get("/api/disponibilidad/:fecha", async (req, res) => {
  try {
    const { fecha } = req.params;
    const disponibilidad = await prisma.disponibilidadHoraria.findMany({
      where: {
        fecha: new Date(fecha)
      },
      include: {
        reserva: {
          include: {
            cliente: true,
            tipoSesion: true
          }
        }
      },
      orderBy: { horaInicio: 'asc' }
    });
    res.json(disponibilidad);
  } catch (e) {
    console.error("Error GET disponibilidad:", e);
    res.status(500).json({ error: "Error" });
  }
});

app.post("/api/disponibilidad", async (req, res) => {
  try {
    const { fecha, horarios } = req.body;
    
    if (!fecha || !horarios || !Array.isArray(horarios)) {
      return res.status(400).json({ message: "Falten dades" });
    }

    const created = await Promise.all(
      horarios.map(h => 
        prisma.disponibilidadHoraria.create({
          data: {
            fecha: new Date(fecha),
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            disponible: true
          }
        })
      )
    );

    res.json({ message: `${created.length} franges creades`, disponibilidad: created });
  } catch (e) {
    console.error("Error POST disponibilidad:", e);
    res.status(500).json({ error: "Error al crear disponibilitat" });
  }
});

app.delete("/api/disponibilidad/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const disp = await prisma.disponibilidadHoraria.findUnique({
      where: { id }
    });

    if (disp?.reservaId) {
      return res.status(400).json({ message: "No pots eliminar una franja amb reserva" });
    }

    await prisma.disponibilidadHoraria.delete({
      where: { id }
    });

    res.json({ message: "Franja eliminada" });
  } catch (e) {
    console.error("Error DELETE disponibilidad:", e);
    res.status(500).json({ error: "Error" });
  }
});

app.patch("/api/disponibilidad/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    const disp = await prisma.disponibilidadHoraria.findUnique({
      where: { id }
    });

    if (!disp) {
      return res.status(404).json({ message: "Franja no trobada" });
    }

    const updated = await prisma.disponibilidadHoraria.update({
      where: { id },
      data: { disponible: !disp.disponible }
    });

    res.json({ message: "Estat actualitzat", disponibilidad: updated });
  } catch (e) {
    console.error("Error PATCH toggle:", e);
    res.status(500).json({ error: "Error" });
  }
});

// ==========================================
// ALTRES
// ==========================================

app.get("/api/tipos-sesion", async (req, res) => {
  try {
    const tipos = await prisma.tipoSesion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(tipos);
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR en port ${PORT}`);
  console.log("✅ Sistema de reserves amb bloqueig automàtic activat");
  console.log("📧 Sistema d'emails configurat");
});

setInterval(() => {}, 100000);