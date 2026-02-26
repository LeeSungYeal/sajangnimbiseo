import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeNiaAnnouncements } from "@/lib/services/nia-scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ORG_RFP_URL = "https://www.nia.or.kr/site/nia_kor/ex/bbs/List.do?cbIdx=78336";

// anon key fallback (RLS disabled on rfp_announcements)
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
            process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key-here"
            ? process.env.SUPABASE_SERVICE_ROLE_KEY
            : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
    // 보안 검증
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const startedAt = new Date().toISOString();
    const supabase = getSupabase();

    try {
        // 1. rfp_public_org에서 NIA 기관 ID 조회 (rfp_url로 매핑)
        const { data: org } = await supabase
            .from("rfp_public_org")
            .select("id, org_name")
            .eq("rfp_url", ORG_RFP_URL)
            .maybeSingle();

        const orgId: number = org?.id ?? 0; // 미등록이면 0 (테스트용)
        const orgName: string = org?.org_name ?? "한국지능정보사회진흥원(NIA)";

        console.log(`[nia-scrape] Start scraping for ${orgName} (org_id=${orgId})`);

        // 2. NIA 공고 수집 (최신 1페이지 = 10건)
        const announcements = await scrapeNiaAnnouncements(1, true);
        console.log(`[nia-scrape] Fetched ${announcements.length} announcements`);

        let inserted = 0;
        let skipped = 0;
        const errors: string[] = [];

        // 3. DB 증분 저장
        for (const ann of announcements) {
            const unique_key = `${orgId}::nia::${ann.bcIdx}`;

            // 중복 체크
            const { data: existing } = await supabase
                .from("rfp_announcements")
                .select("id")
                .eq("unique_key", unique_key)
                .maybeSingle();

            if (existing) {
                skipped++;
                continue;
            }

            const { error } = await supabase.from("rfp_announcements").insert({
                org_id: orgId || null,
                unique_key,
                title: ann.title,
                category: "입찰공고",
                announce_date: ann.date || null,
                description: ann.content?.slice(0, 2000) || null, // 최대 2000자
                source_url: ann.source_url,
                is_active: true,
                scraped_at: new Date().toISOString(),
            });

            if (error) {
                console.error(`[nia-scrape] Insert error:`, error.message);
                errors.push(`${ann.title}: ${error.message}`);
            } else {
                inserted++;
            }
        }

        console.log(`[nia-scrape] Done. inserted=${inserted}, skipped=${skipped}, errors=${errors.length}`);

        return NextResponse.json({
            success: true,
            startedAt,
            completedAt: new Date().toISOString(),
            org: orgName,
            summary: {
                fetched: announcements.length,
                inserted,
                skipped,
                errors: errors.length,
            },
            errorDetails: errors,
        });
    } catch (err: any) {
        console.error("[nia-scrape] Fatal:", err);
        return NextResponse.json(
            { success: false, error: err.message, startedAt },
            { status: 500 }
        );
    }
}
