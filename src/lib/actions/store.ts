"use server";

import { createClient } from "@/lib/supabase/server";
import * as cheerio from "cheerio";

export type ExtractResult = {
    success: boolean;
    name?: string;
    error?: string;
};

export type RegisterResult = {
    success: boolean;
    error?: string;
};

/**
 * Extracts the store name from the given Naver Map URL.
 */
export async function extractStoreName(url: string): Promise<ExtractResult> {
    if (!url) {
        return { success: false, error: "URL을 입력해주세요." };
    }

    try {
        // 1. Follow redirects (short URL -> full URL)
        // We use a desktop UA for the initial fetch to ensure correct redirection behavior,
        // although Naver often redirects correctly with any UA.
        const initialResponse = await fetch(url, {
            redirect: "follow",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
        });

        if (!initialResponse.ok) {
            return { success: false, error: "URL에 접근할 수 없습니다." };
        }

        const finalUrl = initialResponse.url;

        // 2. Extract Place ID from the final URL
        // Patterns:
        // https://map.naver.com/p/entry/place/2043252871?...
        // https://m.place.naver.com/restaurant/2043252871/...
        const placeIdMatch = finalUrl.match(/place\/(\d+)/) || finalUrl.match(/restaurant\/(\d+)/);

        if (!placeIdMatch) {
            // Fallback: Try parsing the initial HTML if it's not a standard map URL but still contains title
            // (Unlikely for Naver Map shortlinks, but safety net)
            const html = await initialResponse.text();
            const $ = cheerio.load(html);
            let title = $('meta[property="og:title"]').attr("content") || $("title").text();
            if (title && title !== "네이버지도" && title !== "네이버 플레이스") {
                title = title.replace(/ - 네이버 지도.*$/, "").replace(/ : 네이버.*$/, "").trim();
                return { success: true, name: title };
            }
            return { success: false, error: "매장 ID를 찾을 수 없습니다." };
        }

        const placeId = placeIdMatch[1];

        // 3. Fetch Mobile Place URL for SSR Content
        // m.place.naver.com returns Server-Side Rendered HTML suitable for crawlers if we use a mobile UA
        const mobileUrl = `https://m.place.naver.com/place/${placeId}/home`;

        const mobileResponse = await fetch(mobileUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            },
        });

        if (!mobileResponse.ok) {
            return { success: false, error: "매장 정보를 가져올 수 없습니다." };
        }

        const html = await mobileResponse.text();
        const $ = cheerio.load(html);

        // 4. Extract Title
        let title = $('meta[property="og:title"]').attr("content");

        if (!title) {
            // Fallback to title tag
            title = $("title").text();
        }

        if (!title) {
            return { success: false, error: "매장명을 찾을 수 없습니다." };
        }

        // 5. Clean up title
        // Example: "누리마을감자탕 영도점 : 네이버" -> "누리마을감자탕 영도점"
        title = title.replace(/ : 네이버.*$/, "").replace(/ - 네이버 지도.*$/, "").trim();

        return { success: true, name: title };

    } catch (error) {
        console.error("Error extracting store name:", error);
        return { success: false, error: "매장명 추출 중 시스템 오류가 발생했습니다." };
    }
}

/**
 * Registers the store in the database.
 */
export async function registerStore(name: string, url: string): Promise<RegisterResult> {
    try {
        const supabase = await createClient();

        // Get current user (required for RLS)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "로그인이 필요합니다." };
        }

        // Insert into store_management
        // Note: We are using the types we manually updated
        const { error } = await supabase
            .from("store_management")
            .insert({
                store_name: name,
                store_url: url,
                user_id: user.id,
            });

        if (error) {
            console.error("Supabase insert error:", error);
            return { success: false, error: "매장 등록에 실패했습니다." };
        }

        return { success: true };
    } catch (error) {
        console.error("Register store error:", error);
        return { success: false, error: "매장 등록 중 오류가 발생했습니다." };
    }
}
