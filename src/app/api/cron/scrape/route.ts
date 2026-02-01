import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StoreScraper } from "@/lib/services/scraper";

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
    try {
        // Optional: Check for Cron secret to prevent unauthorized access
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new NextResponse('Unauthorized', { status: 401 });
        // }

        const supabase = await createClient();
        const scraper = new StoreScraper();

        // 1. Get all stores
        const { data: stores, error } = await supabase
            .from("store_management")
            .select("id, store_url, store_name");

        if (error) {
            console.error("Database fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!stores || stores.length === 0) {
            return NextResponse.json({ message: "No stores to scrape" });
        }

        const results = [];

        // 2. Iterate and scrape (In production, use a queue like Inngest/BullMQ for reliability)
        for (const store of stores) {
            if (!store.store_url) continue;

            console.log(`Scraping store: ${store.store_name} (${store.store_url})`);
            const data = await scraper.scrape(store.store_url);

            if (data.success) {
                // 3. Insert snapshot into store_news
                const { error: insertError } = await supabase
                    .from("store_news")
                    .insert({
                        store_id: store.id,
                        visitor_review_count: data.metrics?.visitorReviews || 0,
                        blog_review_count: data.metrics?.blogReviews || 0,
                        news_content: data.news || [],
                        reviews_content: data.reviews || [],
                        phone: data.basicInfo?.phone,
                        address: data.basicInfo?.address,
                    });

                if (insertError) {
                    console.error(`Failed to separate insert for ${store.store_name}:`, insertError);
                    results.push({ store: store.store_name, status: "failed_insert", error: insertError.message });
                } else {
                    results.push({ store: store.store_name, status: "success" });
                }
            } else {
                console.error(`Failed to scrape ${store.store_name}:`, data.error);
                results.push({ store: store.store_name, status: "failed_scrape", error: data.error });
            }
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error("Cron job error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
