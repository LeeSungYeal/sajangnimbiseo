/**
 * 조달청 나라장터 Open API 스크래퍼
 * - 엔드포인트: https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServc
 * - 조회구분: 1 (등록일시)
 * - 조회기간: D-1 00:00 ~ 오늘 23:59
 * - 업무유형: 용역 (계약방법 제한 없음)
 */

export type NaraAnnouncement = {
    title: string;           // bidNtceNm
    bidNtceNo: string;       // 입찰공고번호
    announce_date: string;   // YYYY-MM-DD (등록일시)
    source_url: string | null; // 나라장터 상세 URL (API bidNtceDtlUrl)
    org_name: string;        // 공고기관명 (ntceInsttNm)
    demand_org_name: string | null; // 수요기관명 (dminsttNm)
    description: string;     // 간략 설명 (발주기관 + 계약방법)
};

const API_BASE = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServc";

/** YYYYMMDDHHMM 포맷으로 변환 */
function toApiDate(d: Date, endOfDay = false): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = endOfDay ? "23" : "00";
    const mm = endOfDay ? "59" : "00";
    return `${y}${m}${day}${hh}${mm}`;
}

/** D-1 날짜 계산 */
function getYesterday(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
}

/** 등록일시(YYYY/MM/DD HH:MM) → YYYY-MM-DD */
function formatDate(raw: string | undefined): string {
    if (!raw) return "";
    const m = raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (!m) return raw.slice(0, 10);
    return `${m[1]}-${m[2]}-${m[3]}`;
}



/**
 * 나라장터 용역 입찰공고 수집
 * @param keywords 활성 키워드 목록 (하나라도 포함되면 수집). 빈 배열이면 전체 수집.
 */
export async function scrapeNaraAnnouncements(
    keywords: string[] = []
): Promise<NaraAnnouncement[]> {
    const serviceKey = process.env.NARA_API_KEY;
    if (!serviceKey) {
        console.warn("[NaraScraper] NARA_API_KEY 환경변수가 없습니다. 스킵합니다.");
        return [];
    }

    const yesterday = getYesterday();
    const today = new Date();
    const inqryBgnDt = toApiDate(yesterday, false);  // D-1 00:00
    const inqryEndDt = toApiDate(today, true);        // 오늘 23:59

    const results: NaraAnnouncement[] = [];
    let pageNo = 1;
    const numOfRows = 100;

    console.log(`[NaraScraper] 조회기간: ${inqryBgnDt} ~ ${inqryEndDt}`);

    while (true) {
        const params = new URLSearchParams({
            serviceKey,
            pageNo: String(pageNo),
            numOfRows: String(numOfRows),
            type: "json",
            inqryDiv: "1",          // 등록일시
            inqryBgnDt,
            inqryEndDt,
        });

        const url = `${API_BASE}?${params.toString()}`;

        let json: any;
        try {
            const res = await fetch(url, {
                signal: AbortSignal.timeout(30_000),
            });
            if (!res.ok) {
                console.error(`[NaraScraper] HTTP ${res.status}`);
                break;
            }
            json = await res.json();
        } catch (err: any) {
            console.error(`[NaraScraper] 요청 실패: ${err.message}`);
            break;
        }

        // API 응답 파싱
        const header = json?.response?.header;
        if (!header || header.resultCode !== "00") {
            console.error(`[NaraScraper] API 오류: ${header?.resultMsg ?? JSON.stringify(json)}`);
            break;
        }

        const body = json?.response?.body;
        const totalCount: number = body?.totalCount ?? 0;
        const items: any[] = body?.items ?? [];

        if (!Array.isArray(items) || items.length === 0) break;

        console.log(`[NaraScraper] 페이지 ${pageNo}: ${items.length}건 (전체 ${totalCount}건)`);

        for (const item of items) {
            const title: string = item.bidNtceNm ?? "";
            if (!title) continue;

            // 키워드 필터링
            if (keywords.length > 0) {
                const lower = title.toLowerCase();
                const desc = ((item.ntceInsttNm ?? "") + " " + (item.dminsttNm ?? "")).toLowerCase();
                const matched = keywords.some(
                    (kw) => lower.includes(kw.toLowerCase()) || desc.includes(kw.toLowerCase())
                );
                if (!matched) continue;
            }

            const bidNtceNo: string = item.bidNtceNo ?? "";
            const bidNtceOrd: string = item.bidNtceOrd ?? "000";
            const announceDate = formatDate(item.rgstDt ?? item.bidNtceDt ?? "");
            const orgName: string = item.ntceInsttNm ?? "조달청";  // 공고기관명
            const demandOrgName: string | null = item.dminsttNm ?? null;  // 수요기관명
            const contractMethod: string = item.cntrctMthdNm ?? "";
            const description = `[${orgName}] ${contractMethod ? contractMethod + " / " : ""}입찰공고`;
            // API 응답의 bidNtceDtlUrl 필드를 직접 사용 (2025년 나라장터 개편 대응)
            const sourceUrl: string | null = item.bidNtceDtlUrl ?? item.bidNtceUrl ?? null;

            results.push({
                title,
                bidNtceNo,
                announce_date: announceDate,
                source_url: sourceUrl,
                org_name: orgName,
                demand_org_name: demandOrgName,
                description,
            });
        }

        // 다음 페이지 여부
        if (pageNo * numOfRows >= totalCount) break;
        pageNo++;
    }

    console.log(`[NaraScraper] 최종 수집(키워드 필터 적용): ${results.length}건`);
    return results;
}
