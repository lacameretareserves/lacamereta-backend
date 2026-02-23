import nodemailer from 'nodemailer';

// Configurar el transporter de nodemailer per Webempresa
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.lacamereta.com',
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true', // true per port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar configuració
export const verificarConfiguracionEmail = async () => {
  try {
    await transporter.verify();
    console.log('✅ Servidor de email configurat correctament');
    return true;
  } catch (error) {
    console.error('❌ Error en configuració de email:', error);
    return false;
  }
};

// Formatjar data en català
const formatearFecha = (fecha: Date): string => {
  return new Date(fecha).toLocaleString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Email de confirmació al client quan l'Alba confirma la reserva
export const enviarEmailConfirmacion = async (
  destinatario: string,
  nombreCliente: string,
  tipoSesion: string,
  fecha: Date,
  comentarios?: string
) => {
  const fechaFormateada = formatearFecha(fecha);

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"La Camereta" <info@lacamereta.com>',
    to: destinatario,
    subject: `✅ Reserva confirmada - La Camereta (${fechaFormateada})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Georgia', serif;
            line-height: 1.8;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #6ECFBD 0%, #5FB4AA 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-family: 'Georgia', serif;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 35px;
          }
          .saludo {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .mensaje {
            font-size: 16px;
            color: #555;
          }
          .details-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 5px solid #6ECFBD;
          }
          .details-box h3 {
            margin: 0 0 15px;
            color: #5FB4AA;
            font-size: 18px;
          }
          .detail-item {
            margin: 12px 0;
            font-size: 15px;
          }
          .detail-item strong {
            color: #333;
          }
          .firma {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .firma p {
            margin: 5px 0;
          }
          .firma .nombre {
            font-size: 18px;
            font-weight: bold;
            color: #5FB4AA;
          }
          .footer {
            background-color: #333;
            color: white;
            padding: 25px;
            text-align: center;
            font-size: 14px;
          }
          .footer a {
            color: #6ECFBD;
            text-decoration: none;
          }
          .emoji {
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 La Camereta</h1>
            <p>Estudi Fotogràfic de Barcelona</p>
          </div>
          
          <div class="content">
            <p class="saludo">Hola <strong>${nombreCliente}</strong>! 👋</p>
            
            <p class="mensaje">
              Sóc l'Alba de <strong>La Camereta</strong> i t'escric per confirmar-te que ja tens la teva sessió fotogràfica reservada! 🎉
            </p>
            
            <div class="details-box">
              <h3>📋 Detalls de la teva reserva:</h3>
              <p class="detail-item"><span class="emoji">📅</span> <strong>Data i hora:</strong> ${fechaFormateada}</p>
              <p class="detail-item"><span class="emoji">📸</span> <strong>Tipus de sessió:</strong> ${tipoSesion}</p>
              ${comentarios ? `<p class="detail-item"><span class="emoji">💬</span> <strong>Notes:</strong> ${comentarios}</p>` : ''}
            </div>
            
            <p class="mensaje">
              Si necessites canviar l'hora o tens qualsevol dubte, no dubtis en escriure'm o trucar-me. Estic aquí per ajudar-te!
            </p>
            
            <p class="mensaje">Ens veiem aviat! 😊</p>
            
            <div class="firma">
              <p>Una abraçada,</p>
              <p class="nombre">Alba</p>
              <p><em>La Camereta - Estudi Fotogràfic</em></p>
            </div>
          </div>
          
          <div class="footer">
            <p>📍 Barcelona | 📧 <a href="mailto:info@lacamereta.com">info@lacamereta.com</a></p>
            <p>© ${new Date().getFullYear()} La Camereta - Tots els drets reservats</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola ${nombreCliente}!

Sóc l'Alba de La Camereta i t'escric per confirmar-te que ja tens la teva sessió fotogràfica reservada!

📋 Detalls de la teva reserva:
📅 Data i hora: ${fechaFormateada}
📸 Tipus de sessió: ${tipoSesion}
${comentarios ? `💬 Notes: ${comentarios}` : ''}

Si necessites canviar l'hora o tens qualsevol dubte, no dubtis en escriure'm o trucar-me.

Ens veiem aviat!

Una abraçada,
Alba
La Camereta - Estudi Fotogràfic

---
📍 Barcelona | 📧 info@lacamereta.com
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmació enviat a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email de confirmació:', error);
    return false;
  }
};

// Email de notificació a l'estudi quan hi ha nova reserva
export const enviarEmailNotificacionEstudio = async (
  nombreCliente: string,
  email: string,
  telefono: string,
  tipoSesion: string,
  fecha: Date,
  comentarios?: string
) => {
  const fechaFormateada = formatearFecha(fecha);

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Sistema de Reserves" <info@lacamereta.com>',
    to: process.env.EMAIL_USER,
    subject: `🔔 Nova reserva: ${nombreCliente} - ${tipoSesion}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6ECFBD; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 25px; border: 1px solid #ddd; }
          .info-row { padding: 12px; border-bottom: 1px solid #eee; background: white; margin: 5px 0; border-radius: 5px; }
          .label { font-weight: bold; color: #5FB4AA; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Nova Reserva!</h1>
          </div>
          
          <div class="content">
            <h2>Detalls del client:</h2>
            
            <div class="info-row">
              <span class="label">👤 Nom:</span> ${nombreCliente}
            </div>
            <div class="info-row">
              <span class="label">📧 Email:</span> ${email}
            </div>
            <div class="info-row">
              <span class="label">📱 Telèfon:</span> ${telefono}
            </div>
            <div class="info-row">
              <span class="label">📸 Tipus de sessió:</span> ${tipoSesion}
            </div>
            <div class="info-row">
              <span class="label">📅 Data i hora:</span> ${fechaFormateada}
            </div>
            ${comentarios ? `
            <div class="info-row">
              <span class="label">💬 Comentaris:</span> ${comentarios}
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de notificació enviat a l\'estudi');
    return true;
  } catch (error) {
    console.error('❌ Error al enviar notificació a l\'estudi:', error);
    return false;
  }
};

// Email quan es cancel·la la reserva
export const enviarEmailCancelacion = async (
  destinatario: string,
  nombreCliente: string,
  tipoSesion: string,
  fecha: Date
) => {
  const fechaFormateada = formatearFecha(fecha);

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"La Camereta" <info@lacamereta.com>',
    to: destinatario,
    subject: '❌ Reserva cancel·lada - La Camereta',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #F44336; color: white; padding: 30px; text-align: center; }
          .content { padding: 35px; }
          .details-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #F44336; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reserva Cancel·lada</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombreCliente}</strong>,</p>
            <p>T'informem que la teva reserva ha estat cancel·lada.</p>
            
            <div class="details-box">
              <p><strong>📸 Tipus de sessió:</strong> ${tipoSesion}</p>
              <p><strong>📅 Data:</strong> ${fechaFormateada}</p>
            </div>
            
            <p>Si vols fer una nova reserva o tens qualsevol dubte, no dubtis en contactar-nos.</p>
            
            <p>Una abraçada,<br><strong>Alba</strong><br><em>La Camereta</em></p>
          </div>
          <div class="footer">
            <p>📍 Barcelona | 📧 info@lacamereta.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de cancel·lació enviat a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email de cancel·lació:', error);
    return false;
  }
};