import * as cheerio from "cheerio";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { scrapeNiaAnnouncements } from "./nia-scraper";
import { scrapeNipaAnnouncements } from "./nipa-scraper";
import { scrapeIitpAnnouncements } from "./iitp-scraper";
import { scrapeKeitAnnouncements } from "./keit-scraper";
import { scrapeNaraAnnouncements } from "./nara-scraper";
import { sendNewAnnouncementsEmail, NewAnnouncementItem } from "./email";

// ── Supabase Admin Client (service_role 우선, 없으면 anon key 폴백) ──────────
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // rfp_announcements는 RLS disabled이므로 anon key로도 INSERT 가능
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
            process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key-here"
            ? process.env.SUPABASE_SERVICE_ROLE_KEY
            : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

// ── 타입 ─────────────────────────────────────────────────────────────────────
export type CollMeth = "API" | "RSS" | "Static Scraper" | "Dynamic Scraper";

export type PublicOrg = {
    id: number;
    org_name: string;
    org_type: string | null;
    homepage_url: string | null;
    rfp_url: string | null;
    coll_meth: CollMeth | null;
    is_active: boolean;
};

export type ScrapedAnnouncement = {
    title: string;
    category?: string;
    announce_date?: string | null;   // ISO date string
    description?: string | null;
    source_url?: string | null;
    org_name?: string | null;        // 발주기관명 (나라장터 등 멀티기관 API에서 사용)
    demand_org_name?: string | null; // 수요기관명 (나라장터 dminsttNm)
};

export type ScrapeOrgResult = {
    org_id: number;
    org_name: string;
    status: "success" | "skipped" | "error";
    inserted: number;
    skipped: number;
    error?: string;
    newItems?: NewAnnouncementItem[];  // 신규 공고 목록 (이메일용)
};

// ── unique_key 생성 (단방향 해시 없이 결정적 문자열로 처리) ─────────────────
function buildUniqueKey(orgId: number, title: string, announce_date: string | null | undefined): string {
    const d = announce_date ?? "no-deadline";
    // Node.js crypto 없이 간단한 결정적 키 생성 (서버리스 환경 호환)
    return `${orgId}::${title.trim().toLowerCase()}::${d}`;
}

// ── 정적 스크래퍼 (Cheerio) ──────────────────────────────────────────────────
export class StaticScraper {
    private readonly userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    async scrape(rfpUrl: string): Promise<ScrapedAnnouncement[]> {
        const html = await this.fetchHtml(rfpUrl);
        const $ = cheerio.load(html);
        const results: ScrapedAnnouncement[] = [];

        // ── 전략 1: table 기반 목록 ─────────────────────────────────────────
        const tableRows = $("table tbody tr, table tr").toArray();
        if (tableRows.length > 0) {
            for (const row of tableRows) {
                const cells = $(row).find("td");
                if (cells.length < 2) continue;

                const titleEl = $(row).find("td a").first();
                const title = titleEl.text().trim() || $(cells.get(0)).text().trim();
                if (!title || title.length < 2) continue;

                const href = titleEl.attr("href");
                const source_url = href
                    ? href.startsWith("http") ? href : new URL(href, rfpUrl).href
                    : null;

                // 날짜 패턴 찾기 (YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD)
                const rowText = $(row).text();
                const announce_date = this.extractDate(rowText);

                results.push({ title, source_url, announce_date, description: null });
            }
        }

        // ── 전략 2: list item 기반 ──────────────────────────────────────────
        if (results.length === 0) {
            const listItems = $(
                "ul li a, .list-item a, .bbs-list a, .board-list a, .notice-list a, article a"
            ).toArray();

            for (const el of listItems) {
                const title = $(el).text().trim();
                if (!title || title.length < 3) continue;

                const href = $(el).attr("href");
                const source_url = href
                    ? href.startsWith("http") ? href : new URL(href, rfpUrl).href
                    : null;

                const parentText = $(el).parent().text();
                const announce_date = this.extractDate(parentText);

                results.push({ title, source_url, announce_date, description: null });
            }
        }

        // ── 전략 3: RSS/Atom feed XML ────────────────────────────────────────
        if (results.length === 0 && (rfpUrl.includes("rss") || rfpUrl.includes("feed") || rfpUrl.includes("atom"))) {
            $("item, entry").each((_, el) => {
                const title = $(el).find("title").text().trim();
                if (!title) return;

                const source_url = $(el).find("link").text().trim() ||
                    $(el).find("link").attr("href") || null;
                const pubDate = $(el).find("pubDate, published, updated").text().trim();
                const description = $(el).find("description, summary, content").text().trim() || null;
                const announce_date = this.extractDate(pubDate || "");

                results.push({ title, source_url, announce_date, description });
            });
        }

        return results.slice(0, 100); // 최대 100개 제한
    }

    private async fetchHtml(url: string): Promise<string> {
        const res = await fetch(url, {
            headers: { "User-Agent": this.userAgent },
            signal: AbortSignal.timeout(20_000), // 20초 타임아웃
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.text();
    }

    /** 텍스트에서 YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD 패턴 추출 */
    private extractDate(text: string): string | null {
        const match = text.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
        if (!match) return null;
        const [, y, m, d] = match;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
}

// ── 동적 스크래퍼 Stub ───────────────────────────────────────────────────────
export class DynamicScraperStub {
    async scrape(rfpUrl: string, orgName: string): Promise<ScrapedAnnouncement[]> {
        console.warn(
            `[RfpScraper] Dynamic Scraper not available in serverless env. ` +
            `Skipping ${orgName} (${rfpUrl}). ` +
            `To enable: integrate BrowserBase or ScrapingBee API.`
        );
        return [];
    }
}

// ── 메인 오케스트레이터 ──────────────────────────────────────────────────────
export class RfpScraper {
    private staticScraper = new StaticScraper();
    private dynamicScraper = new DynamicScraperStub();

    /** NIA(한국지능정보사회진흥원) URL 패턴 감지 */
    private isNiaUrl(url: string): boolean {
        return url.includes("nia.or.kr") && url.includes("cbIdx=78336");
    }

    /** NIPA(정보통신산업진흥원) URL 패턴 감지 */
    private isNipaUrl(url: string): boolean {
        return url.includes("nipa.kr");
    }

    /** IITP(정보통신기획평가원) URL 패턴 감지 */
    private isIitpUrl(url: string): boolean {
        return url.includes("iitp.kr");
    }

    /** KEIT(한국산업기술기획평가원) URL 패턴 감지 */
    private isKeitUrl(url: string): boolean {
        return url.includes("keit.re.kr");
    }

    /** 나라장터(조달청) 기관명 감지 */
    private isNaraOrg(orgName: string): boolean {
        return orgName.includes("나라장터") || orgName.includes("조달청");
    }

    async run(): Promise<ScrapeOrgResult[]> {
        const supabase = getAdminClient();
        const results: ScrapeOrgResult[] = [];

        // 1. 활성 필터링 키워드 목록 조회
        const { data: keywordRows } = await supabase
            .from("rfp_filter_keywords")
            .select("keyword")
            .eq("is_active", true);

        const filterKeywords: string[] = (keywordRows ?? []).map((r: any) =>
            (r.keyword as string).toLowerCase()
        );

        if (filterKeywords.length > 0) {
            console.log(`[RfpScraper] 필터링 키워드 ${filterKeywords.length}개 적용: ${filterKeywords.join(", ")}`);
        } else {
            console.log("[RfpScraper] 필터링 키워드 없음 — 전체 수집 모드");
        }

        // 2. 수집 활성화된 기관 목록 조회
        const { data: orgs, error: orgsErr } = await supabase
            .from("rfp_public_org")
            .select("id, org_name, org_type, homepage_url, rfp_url, coll_meth, is_active")
            .eq("is_active", true);

        if (orgsErr) {
            console.error("[RfpScraper] Failed to fetch orgs:", orgsErr.message);
            return [{ org_id: 0, org_name: "N/A", status: "error", inserted: 0, skipped: 0, error: orgsErr.message }];
        }

        if (!orgs || orgs.length === 0) {
            console.log("[RfpScraper] No active orgs found.");
            return [];
        }

        console.log(`[RfpScraper] Processing ${orgs.length} active orgs`);

        // 3. 기관별 수집
        for (const org of orgs as PublicOrg[]) {
            const result = await this.scrapeOrg(supabase, org, filterKeywords);
            results.push(result);
            console.log(
                `[RfpScraper] ${org.org_name}: ${result.status} ` +
                `(inserted=${result.inserted}, skipped=${result.skipped})`
            );
        }

        // 4. 신규 공고가 있으면 이메일 발송
        const allNewItems: NewAnnouncementItem[] = results.flatMap((r) => r.newItems ?? []);
        if (allNewItems.length > 0) {
            try {
                // 활성 키워드 조회
                const { data: kwData } = await getAdminClient()
                    .from("rfp_filter_keywords")
                    .select("keyword")
                    .eq("is_active", true)
                    .order("id", { ascending: true });
                const activeKeywords = (kwData ?? []).map((k: any) => k.keyword);
                await sendNewAnnouncementsEmail(allNewItems, activeKeywords);
            } catch (mailErr: any) {
                console.error("[RfpScraper] 이메일 발송 실패:", mailErr.message);
            }
        }

        return results;
    }

    /** 제목 또는 설명에 활성 필터링 키워드가 하나라도 포함되는지 검사 */
    private matchesKeywords(ann: ScrapedAnnouncement, keywords: string[]): boolean {
        if (keywords.length === 0) return true; // 키워드 없으면 전체 통과
        const haystack = [
            ann.title ?? "",
            ann.description ?? "",
        ].join(" ").toLowerCase();
        return keywords.some((kw) => haystack.includes(kw));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async scrapeOrg(supabase: SupabaseClient<any, any, any>, org: PublicOrg, filterKeywords: string[] = []): Promise<ScrapeOrgResult> {
        const base: ScrapeOrgResult = {
            org_id: org.id,
            org_name: org.org_name,
            status: "success",
            inserted: 0,
            skipped: 0,
        };

        if (!org.rfp_url && !this.isNaraOrg(org.org_name)) {
            return { ...base, status: "skipped", error: "rfp_url 없음" };
        }

        // 3. 엔진 분기: URL 패턴 우선 → coll_meth 순서로 결정
        let announcements: ScrapedAnnouncement[] = [];
        try {
            if (this.isNaraOrg(org.org_name)) {
                // 나라장터(조달청): Open API 사용 — rfp_url 불필요
                const naraResults = await scrapeNaraAnnouncements(
                    filterKeywords.length > 0 ? filterKeywords : []
                );
                announcements = naraResults.map((r) => ({
                    title: r.title,
                    category: "입찰공고",
                    announce_date: r.announce_date || null,
                    description: r.description,
                    source_url: r.source_url,
                    org_name: r.org_name || null,      // 공고기관명 (ntceInsttNm)
                    demand_org_name: r.demand_org_name || null,  // 수요기관명 (dminsttNm)
                }));
            } else if (org.coll_meth === "Dynamic Scraper") {
                announcements = await this.dynamicScraper.scrape(org.rfp_url!, org.org_name);
            } else if (this.isNiaUrl(org.rfp_url!)) {
                // NIA(한국지능정보사회진흥원): 전용 스크래퍼 사용
                const niaResults = await scrapeNiaAnnouncements(1, true);
                announcements = niaResults.map((r) => ({
                    title: r.title,
                    category: "입찰공고",
                    announce_date: r.date || null,
                    description: r.content?.slice(0, 2000) || null,
                    source_url: r.source_url,
                }));
            } else if (this.isNipaUrl(org.rfp_url!)) {
                // NIPA(정보통신산업진흥원): 전용 스크래퍼 사용
                const nipaResults = await scrapeNipaAnnouncements(1, true);
                announcements = nipaResults.map((r) => ({
                    title: r.title,
                    category: "공고",
                    announce_date: r.date || null,
                    description: r.content?.slice(0, 2000) || null,
                    source_url: r.source_url,
                }));
            } else if (this.isIitpUrl(org.rfp_url!)) {
                // IITP(정보통신기획평가원): 전용 스크래퍼 사용
                const iitpResults = await scrapeIitpAnnouncements(20);
                announcements = iitpResults.map((r) => ({
                    title: r.title,
                    category: "입찰공고",
                    announce_date: r.date || null,
                    description: r.content?.slice(0, 2000) || null,
                    source_url: r.source_url,
                }));
            } else if (this.isKeitUrl(org.rfp_url!)) {
                // KEIT(한국산업기술기획평가원): 전용 스크래퍼 사용
                const keitResults = await scrapeKeitAnnouncements(1);
                announcements = keitResults.map((r) => ({
                    title: r.title,
                    category: "공고",
                    announce_date: r.date || null,
                    description: r.receiptEnd
                        ? `접수기간: ${r.receiptStart} ~ ${r.receiptEnd}`
                        : null,
                    source_url: r.source_url,
                }));
            } else if (this.isNaraOrg(org.org_name)) {
                // 나라장터(조달청): Open API 사용 (키워드 내부 적용)
                const naraResults = await scrapeNaraAnnouncements(
                    filterKeywords.length > 0 ? filterKeywords : []
                );
                announcements = naraResults.map((r) => ({
                    title: r.title,
                    category: "입찰공고",
                    announce_date: r.announce_date || null,
                    description: r.description,
                    source_url: r.source_url,
                }));
            } else {
                // 범용 Cheerio 스크래퍼 (table/list/RSS 전략)
                announcements = await this.staticScraper.scrape(org.rfp_url!);
            }
        } catch (err: any) {
            return { ...base, status: "error", error: err.message };
        }

        if (announcements.length === 0) {
            return { ...base, status: "skipped", error: "공고 없음 (파싱 결과 0건)" };
        }

        // 4. 필터링 키워드 적용
        const filtered = announcements.filter((ann) => this.matchesKeywords(ann, filterKeywords));
        console.log(
            `[RfpScraper] ${org.org_name}: 수집 ${announcements.length}건 → 키워드 필터 후 ${filtered.length}건`
        );

        if (filtered.length === 0) {
            return { ...base, status: "skipped", error: "키워드 매칭 결과 0건" };
        }

        // 5. 증분 저장 (unique_key 기준 → 신규만 INSERT)
        let inserted = 0;
        let skipped = 0;
        const newItems: NewAnnouncementItem[] = [];

        for (const ann of filtered) {
            if (!ann.title?.trim()) continue;

            const unique_key = buildUniqueKey(org.id, ann.title, ann.announce_date);

            const row = {
                org_id: org.id,
                unique_key,
                title: ann.title.trim(),
                category: ann.category ?? org.org_type ?? null,
                announce_date: ann.announce_date ?? null,
                description: ann.description ?? null,
                source_url: ann.source_url ?? null,
                org_name: ann.org_name ?? null,          // 공고기관명 (ntceInsttNm)
                demand_org_name: ann.demand_org_name ?? null, // 수요기관명 (dminsttNm)
                is_active: true,
                scraped_at: new Date().toISOString(),
            };

            // 증분 수집: unique_key 중복 여부 먼저 확인
            const { data: existing } = await supabase
                .from("rfp_announcements")
                .select("id")
                .eq("unique_key", unique_key)
                .maybeSingle();

            if (existing) {
                skipped++;
                continue;
            }

            const { error: insertErr } = await supabase
                .from("rfp_announcements")
                .insert(row);

            if (insertErr) {
                console.error(`[RfpScraper] Insert error for "${ann.title}":`, insertErr.message);
            } else {
                inserted++;
                // 이메일 발송용 신규 공고 누적
                newItems.push({
                    title: ann.title.trim(),
                    org_name: org.org_name,
                    announce_date: ann.announce_date ?? null,
                    category: ann.category ?? null,
                    source_url: ann.source_url ?? null,
                });
            }
        }

        return { ...base, inserted, skipped, newItems };
    }
}
