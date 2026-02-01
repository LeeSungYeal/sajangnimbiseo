const cheerio = require("cheerio");

async function debugStore(id) {
    const url = `https://m.place.naver.com/place/${id}/home`;
    console.log("Testing Generic Mobile URL:", url);
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
            }
        });

        console.log("Response URL:", response.url); // Does it redirect to /restaurant/?
        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $('meta[property="og:title"]').attr("content");
        console.log("OG:Title:", title);

    } catch (e) {
        console.error("Error:", e);
    }
}

debugStore("2043252871");
