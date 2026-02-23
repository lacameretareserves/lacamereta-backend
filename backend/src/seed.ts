import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Insertar tipos de sesión
  const tiposSesion = [
    { nombre: 'navidad', descripcion: 'Sesión fotográfica de Navidad', duracion: 60, precio: 150 },
    { nombre: 'familia', descripcion: 'Sesión fotográfica familiar', duracion: 90, precio: 200 },
    { nombre: 'embarazo', descripcion: 'Sesión fotográfica de embarazo', duracion: 60, precio: 180 },
    { nombre: 'pareja', descripcion: 'Sesión fotográfica de pareja', duracion: 60, precio: 150 },
    { nombre: 'producto', descripcion: 'Fotografía de producto', duracion: 120, precio: 250 }
  ];

  for (const tipo of tiposSesion) {
    await prisma.tipoSesion.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo
    });
    console.log(`✅ Tipo de sesión creado: ${tipo.nombre}`);
  }

  // Crear usuario admin por defecto
  const adminEmail = 'admin@lacamereta.com';
  const adminPassword = 'admin123'; // Cambiar en producción
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      nombre: 'Administrador'
    }
  });

  console.log('✅ Usuario admin creado:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña en producción');

  console.log('✅ Seed completado correctamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });