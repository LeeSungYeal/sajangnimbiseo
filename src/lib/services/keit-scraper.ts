/**
 * KEIT (한국산업기술기획평가원) 과제공고 스크래퍼
 *
 * 사이트: https://srome.keit.re.kr/srome/biz/perform/opnnPrpsl/retrieveTaskAnncmListView.do
 * 방식: SSR HTML → Cheerio 파싱
 *
 * HTML 구조 (확인된 패턴):
 *   - 제목: 각 공고 항목의 a 태그
 *   - 등록일: "등록일YYYY-MM-DD" 텍스트 패턴
 *   - 접수기간: "접수기간YYYY-MM-DD HH:MM ~ YYYY-MM-DD HH:MM" 패턴
 *   - 상세 링크: onclick 또는 별도 파라미터로 이동 → 없으면 목록 URL 사용
 */

import * as cheerio from "cheerio";

const BASE_URL = "https://srome.keit.re.kr";
const LIST_URL = `${BASE_URL}/srome/biz/perform/opnnPrpsl/retrieveTaskAnncmListView.do`;

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type KeitAnnouncement = {
    articleId: string;
    title: string;
    date: string;           // 등록일 YYYY-MM-DD
    receiptStart: string;   // 접수 시작일
    receiptEnd: string;     // 접수 마감일
    source_url: string;
};

// ── fetch helper ──────────────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": BASE_URL,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
        signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.text();
}

// ── 날짜 추출 helper ──────────────────────────────────────────────────────────
function extractDate(text: string): string {
    const m = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "";
    return `${m[1]}-${m[2]}-${m[3]}`;
}

// ── 목록 파싱 ─────────────────────────────────────────────────────────────────
// 실제 HTML 구조 (디버그로 확인):
//   <div class="table_box_wrap">
//     <p class="no">676</p>
//     <div class="table_box_detail">
//       <p class="subject">
//         <a onclick="f_detail('I18835', '2026'); return false;" href="#">
//           <span class="title">2026년도 자동차산업기술개발사업...</span>
//         </a>
//       </p>
//       <div class="info">
//         <p><span class="label">접수기간</span><span class="value">2026-02-06 09:00 ~ 2026-04-08 18:00</span></p>
//         <p><span class="label">등록일</span><span class="value">2026-02-10</span></p>
//       </div>
//     </div>
//   </div>
async function fetchKeitList(maxPages: number = 1): Promise<KeitAnnouncement[]> {
    const results: KeitAnnouncement[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= maxPages; page++) {
        const url = page === 1
            ? `${LIST_URL}?prgmId=XPG201040000`
            : `${LIST_URL}?pageIndex=${page}`;

        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        let pageCount = 0;

        // div.table_box_wrap 기반 파싱
        $("div.table_box_wrap").each((_, wrap) => {
            // 제목: p.subject > a > span.title
            const titleEl = $(wrap).find("p.subject a").first();
            const title = $(wrap).find("p.subject span.title").text().replace(/\s+/g, " ").trim();
            if (!title || title.length < 3) return;

            // ID: onclick="f_detail('I18835', '2026')" 에서 추출
            const onclick = titleEl.attr("onclick") ?? "";
            const idMatch = onclick.match(/f_detail\(['"]([\w]+)['"]/);
            const articleId = idMatch ? idMatch[1] : $(wrap).find("p.no").text().trim();

            if (seen.has(articleId)) return;
            seen.add(articleId);

            // 날짜: .info 안의 label+value 쌍
            let date = "";
            let receiptStart = "";
            let receiptEnd = "";

            $(wrap).find("div.info p").each((_, p) => {
                const label = $(p).find("span.label").text().trim();
                const value = $(p).find("span.value").text().trim();
                if (label === "등록일") {
                    date = value; // 이미 YYYY-MM-DD 형식
                } else if (label === "접수기간") {
                    // "2026-02-06 09:00 ~ 2026-04-08 18:00"
                    const m = value.match(/(\d{4}-\d{2}-\d{2}).*?~.*?(\d{4}-\d{2}-\d{2})/);
                    receiptStart = m ? m[1] : "";
                    receiptEnd = m ? m[2] : "";
                }
            });

            // 상세 URL: retrieveTaskAnncmInfoView.do?ancmId=I18835&bsnsYy=2026
            const yearMatch = onclick.match(/f_detail\(['"][\w]+['"],\s*['"](\d{4})['"]/);
            const year = yearMatch ? yearMatch[1] : "";
            const source_url = articleId && year
                ? `${BASE_URL}/srome/biz/perform/opnnPrpsl/retrieveTaskAnncmInfoView.do?ancmId=${articleId}&bsnsYy=${year}&prgmId=XPG201040000`
                : `${LIST_URL}?prgmId=XPG201040000`;

            results.push({ articleId, title, date, receiptStart, receiptEnd, source_url });
            pageCount++;
        });

        console.log(`[KeitScraper] 페이지 ${page}: ${pageCount}건`);
        if (pageCount === 0) break;
    }

    return results;
}


// ── 전체 수집 파이프라인 ──────────────────────────────────────────────────────
export async function scrapeKeitAnnouncements(
    maxPages: number = 1,
): Promise<KeitAnnouncement[]> {
    console.log("[KeitScraper] 수집 시작");
    try {
        const results = await fetchKeitList(maxPages);
        console.log(`[KeitScraper] 최종 수집: ${results.length}건`);
        return results;
    } catch (err: any) {
        console.error("[KeitScraper] 수집 실패:", err.message);
        return [];
    }
}
