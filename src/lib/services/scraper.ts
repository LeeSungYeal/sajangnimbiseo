import * as cheerio from "cheerio";
import vm from "vm";

export type ScrapedData = {
    success: boolean;
    error?: string;
    metrics?: {
        visitorReviews: number;
        blogReviews: number;
    };
    basicInfo?: {
        phone?: string;
        address?: string;
        name?: string;
    };
    news?: any[];
    reviews?: any[];
};

export class StoreScraper {
    private userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

    async scrape(url: string): Promise<ScrapedData> {
        try {
            console.log(`[Scraper] Starting scrape for: ${url}`);

            // 1. Resolve Place ID
            const placeId = await this.getPlaceId(url);
            if (!placeId) {
                return { success: false, error: "매장 ID를 찾을 수 없습니다." };
            }
            console.log(`[Scraper] Place ID: ${placeId}`);

            // 2. Fetch Mobile Home Page
            const homeUrl = `https://m.place.naver.com/restaurant/${placeId}/home`;
            console.log(`[Scraper] Fetching Home: ${homeUrl}`);
            const homeHtml = await this.fetchHtml(homeUrl);
            const homeData = this.parseJsonFromHtml(homeHtml, homeUrl);

            // 3. Extract Basic Info & Metrics from Home
            const basicInfo = this.extractBasicInfo(homeData);
            let metrics = this.extractMetrics(homeData);
            let news = this.extractNews(homeData);

            console.log(`[Scraper] Home Metrics:`, metrics);
            console.log(`[Scraper] Home News Count: ${news.length}`);

            // 4. Fetch Reviews (Review page)
            const reviewUrl = `https://m.place.naver.com/restaurant/${placeId}/review/visitor`;
            console.log(`[Scraper] Fetching Reviews: ${reviewUrl}`);
            const reviewHtml = await this.fetchHtml(reviewUrl);
            const reviewData = this.parseJsonFromHtml(reviewHtml, reviewUrl);
            const reviews = this.extractReviews(reviewData);

            // 5. Fetch News (News page) - If missing in Home
            if (news.length === 0) {
                const newsUrl = `https://m.place.naver.com/restaurant/${placeId}/news`;
                console.log(`[Scraper] Fetching News Tab: ${newsUrl}`);
                try {
                    const newsHtml = await this.fetchHtml(newsUrl);
                    const newsData = this.parseJsonFromHtml(newsHtml, newsUrl);
                    const newsFromTab = this.extractNews(newsData);
                    if (newsFromTab.length > 0) {
                        news = newsFromTab;
                        console.log(`[Scraper] News Tab found ${news.length} items.`);
                    } else {
                        console.log(`[Scraper] News Tab empty.`);
                    }
                } catch (e) {
                    console.warn(`[Scraper] Failed to fetch news tab: ${e}`);
                }
            }

            // 5.1 Check Metrics in Review/News data if missing (Blog reviews often here)
            // Use Math.max to avoid overwriting successful extraction with 0
            const m2 = this.extractMetrics(reviewData);
            metrics.visitorReviews = Math.max(metrics.visitorReviews, m2.visitorReviews);
            metrics.blogReviews = Math.max(metrics.blogReviews, m2.blogReviews);

            console.log(`[Scraper] Final Metrics:`, metrics);

            return {
                success: true,
                metrics,
                basicInfo,
                news,
                reviews
            };

        } catch (error: any) {
            console.error("Scraping error:", error);
            return { success: false, error: error.message };
        }
    }

    private async getPlaceId(url: string): Promise<string | null> {
        const response = await fetch(url, {
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const finalUrl = response.url;
        const match = finalUrl.match(/place\/(\d+)/) || finalUrl.match(/restaurant\/(\d+)/);
        return match ? match[1] : null;
    }

    private async fetchHtml(url: string): Promise<string> {
        const response = await fetch(url, {
            headers: { "User-Agent": this.userAgent }
        });
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        return response.text();
    }

    private parseJsonFromHtml(html: string, url: string = "https://m.place.naver.com"): any {
        const $ = cheerio.load(html);
        let scriptContent = $('script:contains("window.__APOLLO_STATE__")').html();

        if (!scriptContent) return null;

        // Use VM to robustly execute the script and get the state
        try {
            // Mock DOM environment for Naver scripts
            const dummyDom = {
                createElement: () => ({ style: {}, setAttribute: () => { }, appendChild: () => { } }),
                getElementsByTagName: () => ([{ parentNode: { insertBefore: () => { } } }]),
                getElementById: () => null,
                cookie: ""
            };

            const sandbox = {
                window: {
                    location: { href: url, hostname: "m.place.naver.com" },
                    __APOLLO_STATE__: {},
                    navigator: { userAgent: "node" }
                },
                document: dummyDom,
                location: { href: url },
                navigator: { userAgent: "node" },
                naver: {},
                Image: class { },
            };
            // @ts-ignore
            sandbox.window.window = sandbox.window;
            // @ts-ignore
            sandbox.self = sandbox.window;

            vm.createContext(sandbox);
            vm.runInContext(scriptContent, sandbox);

            return sandbox.window.__APOLLO_STATE__;

        } catch (e) {
            console.error(`[Scraper] VM Parsing Error for ${url}:`, e);
            return null;
        }
    }

    private extractBasicInfo(data: any) {
        if (!data) return {};
        let phone: string | undefined, address: string | undefined, name: string | undefined;

        Object.values(data).forEach((item: any) => {
            if (item.__typename === "PlaceDetailBase") {
                if (item.phone) phone = item.phone;
                else if (item.virtualPhone) phone = item.virtualPhone;

                if (item.roadAddress) address = item.roadAddress;
                if (item.name) name = item.name;
            }
            if (!phone && (item.phone || item.virtualPhone)) phone = item.phone || item.virtualPhone;
            if (!address && item.roadAddress) address = item.roadAddress;
            if (!name && item.name) name = item.name;
        });

        return { phone, address, name };
    }

    private extractMetrics(data: any) {
        if (!data) return { visitorReviews: 0, blogReviews: 0 };
        let visitorReviews = 0;
        let blogReviews = 0;

        Object.values(data).forEach((item: any) => {
            // Strategy 1: Look for specific stats objects
            if (item.__typename === "VisitorReviewStatsResult" && item.review) {
                if (item.review.totalCount) visitorReviews = Math.max(visitorReviews, item.review.totalCount);
            }
            // FsasReviewsResult for blog reviews
            if (item.__typename === "FsasReviewsResult") {
                if (item.total) blogReviews = Math.max(blogReviews, item.total);
            }

            // Strategy 2: Look for keys directly on any object
            if (item.visitorReviewCount) visitorReviews = Math.max(visitorReviews, item.visitorReviewCount);
            if (item.visitorReviewsTotal) visitorReviews = Math.max(visitorReviews, item.visitorReviewsTotal);

            if (item.blogReviewCount) blogReviews = Math.max(blogReviews, item.blogReviewCount);
            if (item.blogReviewsTotal) blogReviews = Math.max(blogReviews, item.blogReviewsTotal);

            // Nested FsasReviewsResult check (seen in some objects)
            if (item.fsasReviewsResult && item.fsasReviewsResult.total) {
                blogReviews = Math.max(blogReviews, item.fsasReviewsResult.total);
            }
        });

        return { visitorReviews, blogReviews };
    }

    private extractNews(data: any) {
        if (!data) return [];
        const newsList: any[] = [];
        Object.values(data).forEach((item: any) => {
            if (item.__typename === "News") {
                newsList.push({
                    title: item.title,
                    content: item.content,
                    date: item.date
                });
            }
        });
        return newsList;
    }

    private extractReviews(data: any) {
        if (!data) return [];
        const reviewList: any[] = [];
        Object.values(data).forEach((item: any) => {
            if (item.__typename === "VisitorReview") {
                reviewList.push({
                    content: item.body,
                    author: item.author?.nickname,
                    rating: item.rating,
                    date: item.created
                });
            }
        });
        return reviewList;
    }
}
