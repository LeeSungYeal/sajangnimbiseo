import { NextResponse } from "next/server";
import { RfpScraper } from "@/lib/services/rfp-scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro: 최대 5분 실행 허용

export async function GET(request: Request) {
    // ── 보안: CRON_SECRET 검증 ─────────────────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn("[rfp-scrape] Unauthorized cron request");
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const startedAt = new Date().toISOString();
    console.log(`[rfp-scrape] Cron started at ${startedAt}`);

    try {
        const scraper = new RfpScraper();
        const results = await scraper.run();

        const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
        const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
        const errors = results.filter((r) => r.status === "error");

        console.log(
            `[rfp-scrape] Done. inserted=${totalInserted}, skipped=${totalSkipped}, errors=${errors.length}`
        );

        return NextResponse.json({
            success: true,
            startedAt,
            completedAt: new Date().toISOString(),
            summary: {
                totalOrgs: results.length,
                totalInserted,
                totalSkipped,
                totalErrors: errors.length,
            },
            results,
        });
    } catch (err: any) {
        console.error("[rfp-scrape] Fatal error:", err);
        return NextResponse.json(
            { success: false, error: err.message, startedAt },
            { status: 500 }
        );
    }
}
