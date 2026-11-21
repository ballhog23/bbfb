// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
    fonts: [
        {
            provider: fontProviders.local(),
            name: "Orbitron",
            cssVariable: "--font-orbitron",
            options: {
                variants: [
                    {
                        weight: "100 900",
                        style: "normal",
                        src: ["./src/assets/fonts/orbitron-variable.woff2"],
                    },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: "Inter",
            cssVariable: "--font-inter",
            options: {
                variants: [
                    {
                        weight: "100 900",
                        style: "normal",
                        src: ["./src/assets/fonts/inter-variable.woff2"],
                    },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: "Doto",
            cssVariable: "--font-doto",
            options: {
                variants: [
                    {
                        weight: "100 900",
                        style: "normal",
                        src: ["./src/assets/fonts/doto-variable.woff2"],
                    },
                ],
            },
        },
    ],
});
