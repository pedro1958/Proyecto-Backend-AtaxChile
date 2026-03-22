export const confirmacionEmailTemplate = (url: string, emailNuevo: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff; border-radius:8px; overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#1a56db; padding:32px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:24px;">AtaxChile</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="color:#1a1a1a; margin:0 0 16px;">Confirma tu nuevo correo</h2>
              <p style="color:#555; line-height:1.6; margin:0 0 8px;">
                Recibimos una solicitud para cambiar el correo de tu cuenta a:
              </p>
              <p style="color:#1a1a1a; font-weight:bold; margin:0 0 24px;">${emailNuevo}</p>
              <p style="color:#555; line-height:1.6; margin:0 0 24px;">
                Haz clic en el botón para confirmar el cambio. Si no solicitaste esto,
                ignora este correo — tu dirección actual no se modificará.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px; background:#1a56db;">
                    <a href="${url}"
                       style="display:inline-block; padding:14px 28px; color:#ffffff;
                              text-decoration:none; font-weight:bold; font-size:15px;">
                      Confirmar nuevo correo
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#999; font-size:13px; margin:24px 0 0; line-height:1.5;">
                Este enlace expira en <strong>24 horas</strong>.
              </p>
              <p style="color:#999; font-size:12px; margin:12px 0 0; line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${url}" style="color:#1a56db; word-break:break-all;">${url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9; padding:20px 32px; text-align:center;">
              <p style="color:#aaa; font-size:12px; margin:0;">
                Agrupación AtaxChile
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
