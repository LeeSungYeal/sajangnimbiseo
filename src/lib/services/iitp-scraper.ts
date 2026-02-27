/**
 * IITP (정보통신기획평가원) 입찰공고 스크래퍼
 *
 * 목록 API: POST https://www.iitp.kr/board-svc/api/bbs/A/list.do
 * 상세 API: POST https://www.iitp.kr/board-svc/api/bbs/A/view.do (내용 추출용)
 *
 * 목록 응답 필드: rn, article_seq, board_seq, title, reg_dt, reg_nm, ...
 * 상세 응답 필드: article_seq, title, content(nttCn), reg_dt, ...
 */

const BASE_URL = "https://www.iitp.kr";
const LIST_API_URL = `${BASE_URL}/board-svc/api/bbs/A/list.do`;
const VIEW_API_URL = `${BASE_URL}/board-svc/api/bbs/A/view.do`;
const LIST_PAGE_URL = `${BASE_URL}/web/lay1/bbs/S1T12C38/A/8/list.do`;
const DETAIL_PAGE_URL = `${BASE_URL}/web/lay1/bbs/S1T12C38/A/8/view.do`;

const CMS_MENU_SEQ = "38";

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const COMMON_HEADERS = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Referer": LIST_PAGE_URL,
    "Origin": BASE_URL,
};

export type IitpAnnouncement = {
    articleId: string;
    title: string;
    date: string;       // YYYY-MM-DD
    content: string;
    source_url: string;
};

// ── 목록 API 호출 ─────────────────────────────────────────────────────────────
async function fetchIitpList(rows: number = 20): Promise<Array<{
    articleId: string;
    title: string;
    date: string;
    source_url: string;
}>> {
    const res = await fetch(LIST_API_URL, {
        method: "POST",
        headers: COMMON_HEADERS,
        body: JSON.stringify({
            cms_menu_seq: CMS_MENU_SEQ,
            cpage: 1,
            rows: String(rows),
            keyword: "",
            condition: "",
            sort: "latest",
        }),
        signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`[IitpScraper] List API HTTP ${res.status}`);

    const json = await res.json();
    if (json.result !== "SUCCESS") throw new Error(`[IitpScraper] List API result=${json.result}`);

    const items: any[] = json.list ?? [];
    console.log(`[IitpScraper] 목록 API: ${items.length}건`);

    return items
        .filter((item: any) => item.title?.trim().length > 1)
        .map((item: any) => ({
            articleId: String(item.article_seq),
            title: String(item.title).trim(),
            date: String(item.reg_dt ?? ""),          // 이미 YYYY-MM-DD 형식
            source_url: `${DETAIL_PAGE_URL}?article_seq=${item.article_seq}&cms_menu_seq=${CMS_MENU_SEQ}`,
        }));
}

// ── 상세 API 호출 (내용 추출) ─────────────────────────────────────────────────
// 응답 구조: { result: "SUCCESS", data: { view: { conts, reg_dt, ... }, next: {...} } }
async function fetchIitpDetail(articleSeq: string): Promise<string> {
    try {
        const res = await fetch(VIEW_API_URL, {
            method: "POST",
            headers: COMMON_HEADERS,
            body: JSON.stringify({
                cms_menu_seq: CMS_MENU_SEQ,
                article_seq: articleSeq,
                sort: "latest",
                cpage: 1,
                rows: "20",
                keyword: "",
                condition: "",
            }),
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) return "";

        const json = await res.json();
        if (json.result !== "SUCCESS") return "";

        // 응답: data.view.conts (HTML)
        const viewItem = json.data?.view ?? json.view ?? json.data ?? json;
        const rawContent = String(
            viewItem.conts ?? viewItem.nttCn ?? viewItem.content ?? viewItem.cn ?? ""
        ).trim();

        // HTML 태그 제거 후 공백 정리
        return rawContent.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s{2,}/g, " ").trim();
    } catch {
        return "";
    }
}

// ── 전체 수집 파이프라인 ──────────────────────────────────────────────────────
export async function scrapeIitpAnnouncements(
    maxRows: number = 20,
    fetchDetail: boolean = true,
): Promise<IitpAnnouncement[]> {
    console.log("[IitpScraper] 수집 시작");

    let listItems: Awaited<ReturnType<typeof fetchIitpList>>;
    try {
        listItems = await fetchIitpList(maxRows);
    } catch (err: any) {
        console.error("[IitpScraper] 목록 수집 실패:", err.message);
        return [];
    }

    const results: IitpAnnouncement[] = [];

    for (const item of listItems) {
        let content = "";

        if (fetchDetail) {
            content = await fetchIitpDetail(item.articleId);
            if (!content) {
                console.warn(`[IitpScraper] 상세 내용 없음 article_seq=${item.articleId}`);
            }
        }

        results.push({
            articleId: item.articleId,
            title: item.title,
            date: item.date,
            content,
            source_url: item.source_url,
        });
    }

    console.log(`[IitpScraper] 최종 수집: ${results.length}건`);
    return results;
}
