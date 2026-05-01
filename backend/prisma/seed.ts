import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Crear tipos de sesión
  const tiposSesion = [
    { nombre: 'navidad', descripcion: 'Sesión fotográfica de Navidad', duracion: 60, precio: 150 },
    { nombre: 'familia', descripcion: 'Sesión fotográfica familiar', duracion: 90, precio: 200 },
    { nombre: 'embarazo', descripcion: 'Sesión fotográfica de embarazo', duracion: 60, precio: 180 },
    { nombre: 'pareja', descripcion: 'Sesión fotográfica de pareja', duracion: 60, precio: 150 },
    { nombre: 'producto', descripcion: 'Fotografía de producto', duracion: 120, precio: 250 },
  ];

  for (const tipo of tiposSesion) {
    const existing = await prisma.tipoSesion.findUnique({ where: { nombre: tipo.nombre } });
    if (!existing) {
      await prisma.tipoSesion.create({ data: tipo });
      console.log(`✅ Tipo de sesión creado: ${tipo.nombre}`);
    } else {
      console.log(`⏭️  Tipo de sesión ya existe: ${tipo.nombre}`);
    }
  }

  // Crear usuario admin
  const adminEmail = 'lacamereta@gmail.com';
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Samba@123', 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: passwordHash,
        nombre: 'Administrador',
        rol: 'admin',
      },
    });
    console.log(`✅ Usuario admin creado:`);
    console.log(`   Email: ${adminEmail}`);
  } else {
    console.log(`⏭️  Usuario admin ja existeix: ${adminEmail}`);
  }

  console.log('🎉 Seed completat!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });