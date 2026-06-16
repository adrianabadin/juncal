import { resend } from "./resend";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replace(new RegExp(`{{${key}}}`, "g"), value),
    template,
  );
}

export async function sendConfirmationEmail(
  to: string,
  name: string,
  specialty: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  const template = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f5f6f4;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{background:#045572;color:white;padding:24px;text-align:center}.content{padding:24px;color:#0f172a}.footer{padding:16px 24px;background:#f5f6f4;text-align:center;font-size:12px;color:#51606b}</style></head><body><div class="container"><div class="header"><h1>Sanatorio Juncal</h1></div><div class="content"><h2>Tu reemplazo fue confirmado</h2><p>Hola <strong>{{name}}</strong>,</p><p>El coordinador ha confirmado el siguiente reemplazo:</p><ul><li><strong>Especialidad:</strong> {{specialty}}</li><li><strong>Fecha:</strong> {{date}}</li><li><strong>Horario:</strong> {{startTime}} - {{endTime}}</li></ul><p>Si tenés alguna consulta, contactá al coordinador.</p></div><div class="footer">Sanatorio Juncal — Gestión de Guardias</div></div></body></html>`;
  const html = fillTemplate(template, { name, specialty, date, startTime, endTime });
  await resend.emails.send({
    from: "Sanatorio Juncal <onboarding@resend.dev>",
    to,
    subject: "Reemplazo confirmado — Sanatorio Juncal",
    html,
  });
}

export async function sendForgotPasswordEmail(to: string, name: string, resetUrl: string) {
  const template = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f5f6f4;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{background:#045572;color:white;padding:24px;text-align:center}.content{padding:24px;color:#0f172a}.button{display:inline-block;background:#7f9976;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold}.footer{padding:16px 24px;background:#f5f6f4;text-align:center;font-size:12px;color:#51606b}</style></head><body><div class="container"><div class="header"><h1>Sanatorio Juncal</h1></div><div class="content"><h2>Recuperar contraseña</h2><p>Hola <strong>{{name}}</strong>,</p><p>Haz clic en el botón para restablecer tu contraseña:</p><p><a href="{{resetUrl}}" class="button">Restablecer contraseña</a></p><p>Este enlace expira en 1 hora.</p><p>Si no solicitaste este cambio, ignorá este email.</p></div><div class="footer">Sanatorio Juncal — Gestión de Guardias</div></div></body></html>`;
  const html = fillTemplate(template, { name, resetUrl });
  await resend.emails.send({
    from: "Sanatorio Juncal <onboarding@resend.dev>",
    to,
    subject: "Recuperar contraseña — Sanatorio Juncal",
    html,
  });
}

export async function sendReminder24h(to: string, name: string, specialty: string, startTime: string, endTime: string) {
  const template = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f5f6f4;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{background:#045572;color:white;padding:24px;text-align:center}.content{padding:24px;color:#0f172a}.highlight{background:#eef6f9;border-left:4px solid #045572;padding:12px;margin:16px 0}.footer{padding:16px 24px;background:#f5f6f4;text-align:center;font-size:12px;color:#51606b}</style></head><body><div class="container"><div class="header"><h1>Sanatorio Juncal</h1></div><div class="content"><h2>Recordatorio: mañana tenés un turno</h2><p>Hola <strong>{{name}}</strong>,</p><p>Te recordamos que mañana tenés asignado el siguiente turno:</p><div class="highlight"><p><strong>Especialidad:</strong> {{specialty}}</p><p><strong>Horario:</strong> {{startTime}} - {{endTime}}</p></div><p>Por favor, presentate a tiempo.</p></div><div class="footer">Sanatorio Juncal — Gestión de Guardias</div></div></body></html>`;
  const html = fillTemplate(template, { name, specialty, startTime, endTime });
  await resend.emails.send({
    from: "Sanatorio Juncal <onboarding@resend.dev>",
    to,
    subject: "Recordatorio: mañana tenés un turno — Sanatorio Juncal",
    html,
  });
}

export async function sendReminderDay(to: string, name: string, specialty: string, startTime: string, endTime: string) {
  const template = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f5f6f4;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{background:#7f9976;color:white;padding:24px;text-align:center}.content{padding:24px;color:#0f172a}.highlight{background:#f1f4ef;border-left:4px solid #7f9976;padding:12px;margin:16px 0}.footer{padding:16px 24px;background:#f5f6f4;text-align:center;font-size:12px;color:#51606b}</style></head><body><div class="container"><div class="header"><h1>Sanatorio Juncal</h1></div><div class="content"><h2>Hoy tenés un turno</h2><p>Hola <strong>{{name}}</strong>,</p><p>Te recordamos que hoy tenés asignado el siguiente turno:</p><div class="highlight"><p><strong>Especialidad:</strong> {{specialty}}</p><p><strong>Horario:</strong> {{startTime}} - {{endTime}}</p></div><p>¡Que tengas un buen día!</p></div><div class="footer">Sanatorio Juncal — Gestión de Guardias</div></div></body></html>`;
  const html = fillTemplate(template, { name, specialty, startTime, endTime });
  await resend.emails.send({
    from: "Sanatorio Juncal <onboarding@resend.dev>",
    to,
    subject: "Hoy tenés un turno — Sanatorio Juncal",
    html,
  });
}
