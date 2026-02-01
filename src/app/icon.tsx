import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 24,
                    background: "transparent",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="3 3 38 38"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="main-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#5548F9" />
                            <stop offset="100%" stopColor="#8075FF" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 20 4 C 22 14 26 18 36 20 C 26 22 22 26 20 36 C 18 26 14 22 4 20 C 14 18 18 14 20 4 Z"
                        fill="url(#main-gradient)"
                    />
                    <path
                        d="M 34 5 C 35 7 36 8 38 9 C 36 10 35 11 34 13 C 33 11 32 10 30 9 C 32 8 33 7 34 5 Z"
                        fill="url(#main-gradient)"
                    />
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
