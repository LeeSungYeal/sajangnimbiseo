import * as cheerio from "cheerio";

const BASE_URL = "https://www.nia.or.kr";
const LIST_URL = `${BASE_URL}/site/nia_kor/ex/bbs/List.do?cbIdx=78336`;
const DETAIL_URL = `${BASE_URL}/site/nia_kor/ex/bbs/View.do`;

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type NiaAnnouncement = {
    bcIdx: string;
    title: string;
    date: string;          // YYYY-MM-DD
    content: string;
    source_url: string;
};

// ── HTML fetch helper ─────────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": BASE_URL,
        },
        signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.text();
}

// ── 날짜 정규화 (2026.02.24 → 2026-02-24) ────────────────────────────────────
function normalizeDate(raw: string): string {
    const m = raw.trim().match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if (!m) return raw.trim();
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

// ── 목록 페이지에서 bcIdx 목록 추출 ──────────────────────────────────────────
export async function fetchNiaList(maxPages: number = 1): Promise<Array<{ bcIdx: string; title: string; date: string }>> {
    const items: Array<{ bcIdx: string; title: string; date: string }> = [];

    for (let page = 1; page <= maxPages; page++) {
        const url = page === 1 ? LIST_URL : `${LIST_URL}&pageIndex=${page}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        // a[href="#view"] 기반으로 공고 항목 탐색 (ul.board-list 클래스 없음)
        $("a[href='#view']").each((_, anchor) => {
            const onclick = $(anchor).attr("onclick") ?? "";
            // onclick: doBbsFView('78336','29066','16010100','29066');return false;
            const match = onclick.match(/doBbsFView\(\s*['"]?\d+['"]?\s*,\s*['"]?(\d+)['"]?/);
            if (!match) return;
            const bcIdx = match[1];

            // 제목: span 목록에서 아이콘/뱃지 제외하고 텍스트 합치기
            const spans = $(anchor).find("span").toArray();
            const spanTexts = spans
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((s: any) => $(s).clone().children().remove().end().text().trim())
                .filter((t: string) => t.length > 1 && !/^(첨부|new|N)$/i.test(t));

            // span에서 추출 실패하면 anchor 전체 텍스트(정제) 사용
            const title = spanTexts.length > 0
                ? spanTexts.join(" ").replace(/\s+/g, " ").trim()
                : $(anchor).clone().find("em").remove().end().text().replace(/\s+/g, " ").trim();

            if (!title || title.length < 2) return;

            // 날짜: 같은 a 태그 내 em 또는 span > em에서 날짜 패턴
            const dateRaw = $(anchor).find("em").toArray()
                .map((e) => $(e).text().trim())
                .find((t) => /\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(t)) ?? "";
            const date = normalizeDate(dateRaw);

            items.push({ bcIdx, title, date });
        });

        if (items.length === 0 && page === 1) break;
    }

    return items;
}

// ── 상세 페이지에서 내용 추출 ─────────────────────────────────────────────────
export async function fetchNiaDetail(bcIdx: string): Promise<{ content: string; date: string }> {
    const url = `${DETAIL_URL}?cbIdx=78336&bcIdx=${bcIdx}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // 날짜: .src em 또는 .type01_info em
    const dateRaw =
        $(".detail_type01 .src em, .type01_info .src em, .src em").first().text().trim() ||
        $(".date, .reg_date").first().text().trim();
    const date = normalizeDate(dateRaw);

    // 본문: .con_area 내부 텍스트 (HTML태그 제거, 정제)
    const conArea = $(".detail_type01 .con_area, .con_area").first();
    const content = conArea.text()
        .replace(/\s{3,}/g, "\n\n")  // 연속 공백/줄바꿈 정리
        .trim();

    return { content, date };
}

// ── 전체 수집 파이프라인 ──────────────────────────────────────────────────────
export async function scrapeNiaAnnouncements(
    maxPages: number = 1,
    fetchDetail: boolean = true
): Promise<NiaAnnouncement[]> {
    const listItems = await fetchNiaList(maxPages);
    const results: NiaAnnouncement[] = [];

    for (const item of listItems) {
        const source_url = `${DETAIL_URL}?cbIdx=78336&bcIdx=${item.bcIdx}`;

        let content = "";
        let date = item.date;

        if (fetchDetail) {
            try {
                const detail = await fetchNiaDetail(item.bcIdx);
                content = detail.content;
                // 상세 페이지 날짜가 더 정확한 경우 사용
                if (detail.date) date = detail.date;
            } catch (e) {
                console.warn(`[NiaScraper] Detail fetch failed for bcIdx=${item.bcIdx}:`, e);
            }
        }

        results.push({
            bcIdx: item.bcIdx,
            title: item.title,
            date,
            content,
            source_url,
        });
    }

    return results;
}
