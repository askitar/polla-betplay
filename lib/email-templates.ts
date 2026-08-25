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

export type DigestMatchRow = {
  homeTeam: string;
  awayTeam: string;
  kickoffLabel: string;
  predicted: boolean;
  predictionText: string | null;
};

export type DigestClubRow = {
  clubName: string;
  clubId: string;
  rank: number;
  total: number;
  points: number;
  motivational: string;
};

export type DailyDigestParams = {
  userName: string;
  matches: DigestMatchRow[];
  missingCount: number;
  clubs: DigestClubRow[];
  appUrl: string;
  primaryClubId: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function dailyDigestEmailHtml({
  userName,
  matches,
  missingCount,
  clubs,
  appUrl,
  primaryClubId,
}: DailyDigestParams) {
  const matchRows = matches
    .map((m) => {
      const statusHtml = m.predicted
        ? `<span style="color:#2FAE66;font-weight:700;">Ya la pusiste: ${escapeHtml(m.predictionText!)}</span>`
        : `<span style="color:#CE1126;font-weight:700;">Falta marcador</span>`;
      return `
            <tr>
              <td style="padding:12px 0;border-top:1px solid #1C2F24;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#F3EFDD;font-size:14px;font-weight:600;">
                      ${escapeHtml(m.homeTeam)} vs ${escapeHtml(m.awayTeam)}
                    </td>
                    <td align="right" style="color:#8FA396;font-size:12px;white-space:nowrap;">${escapeHtml(m.kickoffLabel)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-size:12.5px;padding-top:4px;">${statusHtml}</td>
                  </tr>
                </table>
              </td>
            </tr>`;
    })
    .join("");

  const statusBanner =
    missingCount > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(206,17,38,0.10);border:1px solid rgba(206,17,38,0.35);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 16px;color:#F3EFDD;font-size:13.5px;line-height:1.5;">
            Te ${missingCount === 1 ? "falta 1 marcador" : `faltan ${missingCount} marcadores`} por poner hoy. Entra antes de que cierren las predicciones.
          </td></tr>
        </table>`
      : `<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(47,174,102,0.10);border:1px solid rgba(47,174,102,0.35);border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:14px 16px;color:#F3EFDD;font-size:13.5px;line-height:1.5;">
            Ya tienes todos tus marcadores de hoy listos. ¡Bien ahí!
          </td></tr>
        </table>`;

  const clubBlocks = clubs
    .map(
      (c) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16291F;border:1px solid #1C2F24;border-radius:10px;margin-bottom:12px;">
            <tr><td style="padding:14px 16px;">
              <div style="color:#8FA396;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(c.clubName)}</div>
              <div style="color:#F3EFDD;font-size:14px;font-weight:600;margin-top:4px;">
                Vas ${c.rank}° de ${c.total} con <span style="color:#FFC72C;font-weight:800;">${c.points}</span> puntos
              </div>
              <div style="color:#8FA396;font-size:12.5px;margin-top:6px;font-style:italic;">${escapeHtml(c.motivational)}</div>
            </td></tr>
          </table>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0A1712;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1712;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="460" cellpadding="0" cellspacing="0" style="background:#12241B;border:1px solid #1C2F24;border-radius:12px;padding:32px;">
            <tr>
              <td style="text-align:center;padding-bottom:20px;">
                <span style="font-size:24px;font-weight:900;color:#FFC72C;letter-spacing:1px;">LA POLLA</span>
                <span style="font-size:12px;color:#8FA396;letter-spacing:2px;"> LIGA BETPLAY</span>
              </td>
            </tr>
            <tr>
              <td style="color:#F3EFDD;font-size:15px;line-height:1.5;padding-bottom:18px;">
                Hola ${escapeHtml(userName)}, hoy ${matches.length === 1 ? "juega 1 partido" : `juegan ${matches.length} partidos`}.
              </td>
            </tr>
            <tr><td>${statusBanner}</td></tr>
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${matchRows}
                </table>
              </td>
            </tr>
            <tr><td style="padding-top:22px;">${clubBlocks}</td></tr>
            <tr>
              <td align="center" style="padding-top:8px;padding-bottom:8px;">
                <a href="${appUrl}/clubs/${primaryClubId}/partidos" style="display:inline-block;background:#FFC72C;color:#0A1712;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Entrar a La Polla</a>
              </td>
            </tr>
            <tr>
              <td style="color:#5E7568;font-size:11.5px;text-align:center;padding-top:20px;">
                Recibes este correo porque estás registrado en La Polla BetPlay.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function dailyDigestEmailText({
  userName,
  matches,
  missingCount,
  clubs,
  appUrl,
  primaryClubId,
}: DailyDigestParams) {
  const lines = matches.map(
    (m) =>
      `- ${m.homeTeam} vs ${m.awayTeam} (${m.kickoffLabel}): ${
        m.predicted ? `ya la pusiste (${m.predictionText})` : "falta marcador"
      }`,
  );
  const clubLines = clubs.map(
    (c) => `${c.clubName}: vas ${c.rank}° de ${c.total} con ${c.points} puntos. ${c.motivational}`,
  );
  return `Hola ${userName}, hoy ${matches.length === 1 ? "juega 1 partido" : `juegan ${matches.length} partidos`}.

${missingCount > 0 ? `Te ${missingCount === 1 ? "falta 1 marcador" : `faltan ${missingCount} marcadores`} por poner hoy.` : "Ya tienes todos tus marcadores de hoy listos."}

${lines.join("\n")}

${clubLines.join("\n")}

Entra: ${appUrl}/clubs/${primaryClubId}/partidos`;
}
