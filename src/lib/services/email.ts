import nodemailer from "nodemailer";


// ── SMTP 트랜스포터 (hanbiro, SSL 465) ───────────────────────────────────────
function createTransporter() {
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  if (!password) throw new Error("SMTP_PASSWORD 환경변수가 설정되지 않았습니다.");
  if (!from) throw new Error("SMTP_FROM 환경변수가 설정되지 않았습니다.");

  return nodemailer.createTransport({
    host: "mtsco.hanbiro.net",
    port: 465,
    secure: true,        // SSL
    auth: {
      user: from,
      pass: password,
    },
  });
}

// ── 신규 공고 이메일 알림 ─────────────────────────────────────────────────────
export type NewAnnouncementItem = {
  title: string;
  org_name: string | null;
  announce_date: string | null;
  category: string | null;
  source_url: string | null;
};

export async function sendNewAnnouncementsEmail(
  items: NewAnnouncementItem[],
  keywords: string[] = []
): Promise<void> {
  if (items.length === 0) return;

  const from = process.env.SMTP_FROM;
  const to = process.env.SMTP_TO;
  if (!from || !to) throw new Error("SMTP_FROM 또는 SMTP_TO 환경변수가 설정되지 않았습니다.");

  const transporter = createTransporter();

  // ── 카테고리 뱃지 ─────────────────────────────────────────────────────────────
  const categoryBadge = (cat: string | null) => {
    const map: Record<string, { bg: string; color: string }> = {
      "입찰공고": { bg: "#1c3d9c", color: "#ffffff" },
      "공모": { bg: "#166534", color: "#ffffff" },
      "지원사업": { bg: "#92400e", color: "#ffffff" },
      "조달": { bg: "#6b21a8", color: "#ffffff" },
    };
    const c = cat ?? "-";
    const s = map[c] ?? { bg: "#475569", color: "#ffffff" };
    return `<span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;background-color:${s.bg};color:${s.color};white-space:nowrap;">${c}</span>`;
  };

  // ── 기관명 → 약어 매핑 ──────────────────────────────────────────────────────
  const ORG_ABBR: Record<string, string> = {
    "한국지능정보사회진흥원": "NIA",
    "정보통신산업진흥원": "NIPA",
    "정보통신기획평가원": "IITP",
    "한국산업기술기획평가원": "KEIT",
    "나라장터_입찰": "G2B",
  };

  // ── 행 생성 ─────────────────────────────────────────────────────────────────
  const rows = items.map((item, i) => {
    const dateStr = item.announce_date ?? "-";
    const orgLabel = item.org_name ? (ORG_ABBR[item.org_name] ?? item.org_name) : "미상";
    const titleHtml = item.source_url
      ? `<a href="${item.source_url}" style="color:#1d4ed8;text-decoration:underline;font-weight:700;font-size:14px;line-height:1.6;letter-spacing:-0.01em;">${item.title} <span style="font-size:12px;">↗</span></a>`
      : `<span style="color:#1e293b;font-weight:700;font-size:14px;line-height:1.6;">${item.title}</span>`;
    const rowBg = i % 2 === 0 ? "#ffffff" : "#f9fafb";

    return `<tr style="background-color:${rowBg};">
      <td style="padding:14px 0;border-bottom:1px solid #edf0f7;text-align:center;vertical-align:middle;width:40px;color:#3a4a6b;font-size:12px;font-weight:700;">${i + 1}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #edf0f7;vertical-align:top;">${titleHtml}</td>
      <td style="padding:14px 10px;border-bottom:1px solid #edf0f7;font-size:12px;color:#1e293b;white-space:nowrap;vertical-align:middle;font-weight:600;width:80px;text-align:center;">${orgLabel}</td>
      <td style="padding:14px 16px 14px 8px;border-bottom:1px solid #edf0f7;white-space:nowrap;vertical-align:middle;font-size:12px;color:#1e293b;font-weight:600;width:110px;text-align:center;">${dateStr}</td>
    </tr>`;
  }).join("");

  // ── 날짜 ────────────────────────────────────────────────────────────────────
  const dateLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const shortDate = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>신규 사업공고 알림</title>
</head>
<body style="margin:0;padding:0;background-color:#eef1f7;font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f7;">
<tr><td align="center" style="padding:24px 16px 40px;">
<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

  <!-- ══ 상단 브랜드바 ══ -->
  <tr><td style="padding:0 0 12px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:13px;font-weight:700;color:#1c3d9c;letter-spacing:-0.01em;">에이마비서</td>
          <td style="padding:0 10px;"><span style="display:inline-block;width:1px;height:14px;background-color:#c0c8d8;vertical-align:middle;"></span></td>
          <td style="font-size:10px;color:#8a96aa;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;">Business Announcement Alert</td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- ══ 메인 카드 ══ -->
  <tr><td style="border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

    <!-- ① 헤더 (파란 배경) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c3d9c;">
      <tr>
        <td style="padding:22px 28px 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;">
              <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#a0b4e8;letter-spacing:0.1em;text-transform:uppercase;">&#128203; NEW BUSINESS ANNOUNCEMENTS</p>
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;line-height:1.25;letter-spacing:-0.02em;">신규 사업공고<br>알림 리포트</h1>
              <p style="margin:8px 0 0;font-size:12px;color:#a0b4e8;">${dateLabel}</p>
            </td>
            <td style="vertical-align:top;text-align:right;padding-left:20px;">
              <table cellpadding="0" cellspacing="0" style="margin-left:auto;background-color:#162e7a;border-radius:6px;overflow:hidden;min-width:100px;">
                <tr><td style="padding:10px 16px;text-align:center;">
                  <div style="font-size:38px;font-weight:900;color:#f5a623;line-height:1;letter-spacing:-2px;">${items.length}</div>
                  <div style="font-size:10px;color:#a0b4e8;margin-top:4px;">건의 신규 공고</div>
                </td></tr>
              </table>
            </td>
          </tr></table>
        </td>
      </tr>
      <!-- 키워드 + 기관 -->
      <tr>
        <td style="padding:14px 28px 20px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td>
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#e0e8ff;line-height:1.8;">
                  <span style="color:#a0b4e8;font-weight:700;">키워드 :&nbsp;</span>${keywords.length > 0 ? keywords.join("  ") : `<span style="color:#6a80b0;">등록된 키워드 없음</span>`}
                </p>
                <p style="margin:0;font-size:12px;font-weight:600;color:#e0e8ff;line-height:1.8;">
                  <span style="color:#a0b4e8;font-weight:700;">수집기관 :&nbsp;</span>NIA &nbsp;·&nbsp; NIPA &nbsp;·&nbsp; IITP &nbsp;·&nbsp; KEIT &nbsp;·&nbsp; G2B
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- ③ 헤더 + 공고 행 (단일 테이블) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
      <colgroup>
        <col style="width:40px;">
        <col style="width:auto;">
        <col style="width:150px;">
        <col style="width:110px;">
      </colgroup>
      <thead style="background-color:#f0f2f7;border-top:1px solid #dde2ef;">
        <tr>
          <th style="padding:10px 0;font-size:11px;font-weight:700;color:#6b7897;text-align:center;">#</th>
          <th style="padding:10px 8px;font-size:11px;font-weight:700;color:#3a4a6b;text-align:center;letter-spacing:0.05em;">공&nbsp;&nbsp;고&nbsp;&nbsp;명</th>
          <th style="padding:10px 10px;font-size:11px;font-weight:700;color:#3a4a6b;text-align:center;white-space:nowrap;">기관</th>
          <th style="padding:10px 16px 10px 8px;font-size:11px;font-weight:700;color:#3a4a6b;text-align:center;white-space:nowrap;">공고날짜</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- ⑥ 푸터 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fc;border-top:1px solid #e2e8f0;">
      <tr>
        <td style="padding:18px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:12px;color:#6b7897;line-height:1.8;">
                  본 메일은 <strong style="color:#1c3d9c;">에이마비서</strong>의 사업공고 자동 수집 시스템이 발송했습니다.<br>
                  수신 거부 · 문의: 관리자에게 연락하세요.
                </p>
              </td>
              <td style="text-align:right;vertical-align:middle;padding-left:16px;">
                <div style="display:inline-block;background-color:#1c3d9c;border-radius:6px;padding:8px 16px;text-align:center;">
                  <div style="font-size:12px;font-weight:700;color:#ffffff;">에이마비서</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

  </td></tr><!-- /메인 카드 -->

</table>
</td></tr>
</table>
</body>
</html>`;

  // 수신자 목록을 콤마로 분리하여 각각 개별 발송
  const recipients = to.split(",").map(addr => addr.trim()).filter(Boolean);

  for (const recipient of recipients) {
    await transporter.sendMail({
      from: `"에이마비서 알림" <${from}>`,
      to: recipient,
      subject: `[사업공고] 신규 ${items.length}건 - ${new Date().toLocaleDateString("ko-KR")}`,
      html,
    });
    console.log(`[Email] 신규 공고 ${items.length}건 이메일 발송 완료 → ${recipient}`);
  }
}
