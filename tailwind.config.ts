import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#faf5ff",
                    100: "#f3e8ff",
                    200: "#e9d5ff",
                    300: "#d8b4fe",
                    400: "#c084fc",
                    500: "#a855f7",
                    600: "#9333ea",
                    700: "#7e22ce",
                    800: "#6b21a8",
                    900: "#581c87",
                    950: "#3b0764",
                },
                surface: {
                    DEFAULT: "#050508",
                    raised: "#0c0b15",
                    overlay: "#13111f",
                    border: "#1e1a2e",
                    "border-light": "#2d2744",
                },
                gold: {
                    50: "#fefce8",
                    100: "#fef9c3",
                    200: "#fef08a",
                    300: "#fde047",
                    400: "#facc15",
                    500: "#eab308",
                    600: "#ca8a04",
                    700: "#a16207",
                    800: "#854d0e",
                    900: "#713f12",
                },
                accent: {
                    green: "#10b981",
                    red: "#ef4444",
                    yellow: "#facc15",
                    blue: "#3b82f6",
                    cyan: "#06b6d4",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                shimmer: "shimmer 2s linear infinite",
                "slide-up": "slideUp 0.3s ease-out",
                "fade-in": "fadeIn 0.2s ease-out",
                marquee: "marquee linear infinite",
                "ribbon-float": "ribbonFloat 40s ease-in-out infinite",
                "ribbon-float-2": "ribbonFloat2 50s ease-in-out infinite",
                "ribbon-float-3": "ribbonFloat3 60s ease-in-out infinite",
                "glow-pulse": "glowPulse 6s ease-in-out infinite",
            },
            keyframes: {
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                marquee: {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(-50%)" },
                },
                ribbonFloat: {
                    "0%, 100%": { transform: "translate(0, 0) rotate(0deg) scale(1)" },
                    "25%": { transform: "translate(50px, -30px) rotate(5deg) scale(1.05)" },
                    "50%": { transform: "translate(-20px, 20px) rotate(-3deg) scale(0.98)" },
                    "75%": { transform: "translate(30px, 10px) rotate(4deg) scale(1.02)" },
                },
                ribbonFloat2: {
                    "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
                    "33%": { transform: "translate(-40px, 20px) rotate(-4deg)" },
                    "66%": { transform: "translate(30px, -40px) rotate(6deg)" },
                },
                ribbonFloat3: {
                    "0%, 100%": { transform: "translate(0, 0) rotate(0deg) scale(1)" },
                    "20%": { transform: "translate(20px, -50px) rotate(3deg) scale(1.03)" },
                    "40%": { transform: "translate(-30px, 10px) rotate(-5deg) scale(0.97)" },
                    "60%": { transform: "translate(40px, 30px) rotate(2deg) scale(1.01)" },
                    "80%": { transform: "translate(-10px, -20px) rotate(-2deg) scale(0.99)" },
                },
                glowPulse: {
                    "0%, 100%": { opacity: "0.4" },
                    "50%": { opacity: "0.8" },
                },
            },
            backgroundSize: {
                "200%": "200% 100%",
            },
        },
    },
    plugins: [],
};

export default config;
