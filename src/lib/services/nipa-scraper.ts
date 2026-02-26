import * as cheerio from "cheerio";

const BASE_URL = "https://www.nipa.kr";
const LIST_URL = `${BASE_URL}/home/2-3/`;

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type NipaAnnouncement = {
    articleId: string;
    title: string;
    date: string;       // YYYY-MM-DD
    content: string;
    source_url: string;
};

// ── fetch helper ──────────────────────────────────────────────────────────────
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

// ── 날짜 정규화 ───────────────────────────────────────────────────────────────
function normalizeDate(raw: string): string {
    const m = raw.trim().match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if (!m) return raw.trim();
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

// ── 목록 페이지에서 articleId 추출 ───────────────────────────────────────────
export async function fetchNipaList(
    maxPages: number = 1
): Promise<Array<{ articleId: string; title: string; date: string }>> {
    const items: Array<{ articleId: string; title: string; date: string }> = [];

    for (let page = 1; page <= maxPages; page++) {
        const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        // 선택자: table.tb03 tbody tr > td.al > a (제목 링크)
        // 대안: td a[href*="/home/2-3/"]
        const linkEls = $("table td a[href*='/home/2-3/'], table.tb03 td.al a").toArray();

        if (linkEls.length === 0) {
            // 폴백: 모든 a[href] 에서 /home/2-3/{숫자} 패턴 탐색
            $("a[href]").each((_, el) => {
                const href = $(el).attr("href") ?? "";
                const match = href.match(/\/home\/2-3\/(\d+)/);
                if (!match) return;
                const articleId = match[1];
                const title = $(el).text().trim();
                if (!title || title.length < 2) return;

                const rowText = $(el).closest("tr").text();
                const date = normalizeDate(
                    rowText.match(/(\d{4})[.\-/]\d{1,2}[.\-/]\d{1,2}/)?.[0] ?? ""
                );
                if (!items.find((i) => i.articleId === articleId)) {
                    items.push({ articleId, title, date });
                }
            });
        } else {
            for (const el of linkEls) {
                const href = $(el).attr("href") ?? "";
                const match = href.match(/\/home\/2-3\/(\d+)/);
                if (!match) continue;
                const articleId = match[1];

                const title = $(el).text().replace(/\s+/g, " ").trim();
                if (!title || title.length < 2) continue;

                // 날짜: 같은 tr의 텍스트에서 추출
                const rowText = $(el).closest("tr").text();
                const date = normalizeDate(
                    rowText.match(/(\d{4})[.\-/]\d{1,2}[.\-/]\d{1,2}/)?.[0] ?? ""
                );
                if (!items.find((i) => i.articleId === articleId)) {
                    items.push({ articleId, title, date });
                }
            }
        }

        if (linkEls.length === 0) break;
    }

    return items;
}

// ── 상세 페이지에서 내용 추출 ─────────────────────────────────────────────────
export async function fetchNipaDetail(
    articleId: string
): Promise<{ content: string; date: string; title: string }> {
    const url = `${BASE_URL}/home/2-3/${articleId}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // 제목: table.tb05 thead tr th, .view-title, h3 등
    const title =
        $("table.tb05 thead tr th, .view-title, .tit_view, h3.tit").first().text().trim() ||
        $("h2, h3").first().text().trim();

    // 날짜: span.infoDt, .reg-date, .date 등
    const dateRaw =
        $("span.infoDt, .reg-date, [class*='date']").toArray()
            .map((e) => $(e).text().trim())
            .find((t) => /\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(t)) ?? "";
    const date = normalizeDate(dateRaw);

    // 본문: div.tbCont, .view-content, .board-content
    const content =
        $("div.tbCont, .view-content, .board-content, .con_area").first()
            .text()
            .replace(/\s{3,}/g, "\n\n")
            .trim();

    return { title, date, content };
}

// ── 전체 수집 파이프라인 ──────────────────────────────────────────────────────
export async function scrapeNipaAnnouncements(
    maxPages: number = 1,
    fetchDetail: boolean = true
): Promise<NipaAnnouncement[]> {
    const listItems = await fetchNipaList(maxPages);
    const results: NipaAnnouncement[] = [];

    for (const item of listItems) {
        const source_url = `${BASE_URL}/home/2-3/${item.articleId}`;
        let content = "";
        let date = item.date;
        let title = item.title;

        if (fetchDetail) {
            try {
                const detail = await fetchNipaDetail(item.articleId);
                content = detail.content;
                if (detail.date) date = detail.date;
                if (detail.title && detail.title.length > title.length) title = detail.title;
            } catch (e) {
                console.warn(`[NipaScraper] Detail fetch failed for articleId=${item.articleId}:`, e);
            }
        }

        results.push({ articleId: item.articleId, title, date, content, source_url });
    }

    return results;
}
