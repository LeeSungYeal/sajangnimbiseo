const cheerio = require("cheerio");
const vm = require("vm");

async function runScraper(url) {
    console.log("Testing Scraper via VM execution on:", url);
    const response = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } });
    const match = response.url.match(/place\/(\d+)/) || response.url.match(/restaurant\/(\d+)/);
    const placeId = match ? match[1] : null;

    if (!placeId) return;

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
        // Self-reference window
    };
    sandbox.window.window = sandbox.window;
    sandbox.self = sandbox.window;

    try {
        const homeUrl = `https://m.place.naver.com/restaurant/${placeId}/home`;
        const homeHtml = await (await fetch(homeUrl, { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1" } })).text();

        let $ = cheerio.load(homeHtml);
        let scriptContent = $('script:contains("window.__APOLLO_STATE__")').html();

        if (scriptContent) {
            vm.createContext(sandbox);
            vm.runInContext(scriptContent, sandbox);

            const data = sandbox.window.__APOLLO_STATE__;
            console.log("HOME Data Keys:", Object.keys(data).length);

            // Check Metrics
            let blogReviews = 0;
            Object.values(data).forEach(item => {
                if (item.__typename === "FsasReviewsResult" && item.total) {
                    console.log("Found Blog Reviews:", item.total);
                }
            });
        }

        // NEWS
        const newsUrl = `https://m.place.naver.com/restaurant/${placeId}/news`;
        const newsHtml = await (await fetch(newsUrl, { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1" } })).text();
        $ = cheerio.load(newsHtml);
        scriptContent = $('script:contains("window.__APOLLO_STATE__")').html();

        if (scriptContent) {
            // Reset state? Or reuse? Naver might override.
            // Let's reuse sandbox but clear data? No, new script might assign.
            vm.runInContext(scriptContent, sandbox);
            const data = sandbox.window.__APOLLO_STATE__;

            let newsCount = 0;
            Object.values(data).forEach(item => {
                if (item.__typename === "News") {
                    console.log("Found News:", item.title);
                    newsCount++;
                }
            });
        }
    } catch (e) {
        console.error("VM Error:", e);
    }
}

runScraper("https://naver.me/5Kqz2lc7");
