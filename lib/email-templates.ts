export function magicLinkEmailHtml(url: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0A1712;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1712;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="420" cellpadding="0" cellspacing="0" style="background:#12241B;border:1px solid #1C2F24;border-radius:12px;padding:32px;">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <span style="font-size:26px;font-weight:900;color:#FFC72C;letter-spacing:1px;">LA POLLA</span>
                <span style="font-size:13px;color:#8FA396;letter-spacing:2px;"> LIGA BETPLAY</span>
              </td>
            </tr>
            <tr>
              <td style="color:#F3EFDD;font-size:15px;line-height:1.6;text-align:center;padding-bottom:24px;">
                Haz clic en el botón para entrar. Este enlace es válido por 24 horas y solo funciona una vez.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:8px;">
                <a href="${url}" style="display:inline-block;background:#FFC72C;color:#0A1712;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Entrar a La Polla</a>
              </td>
            </tr>
            <tr>
              <td style="color:#5E7568;font-size:12px;text-align:center;padding-top:20px;">
                Si tú no pediste este correo, ignóralo con confianza.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function magicLinkEmailText(url: string) {
  return `Entra a La Polla BetPlay con este enlace:\n${url}\n\nSi tú no pediste este correo, ignóralo.`;
}
