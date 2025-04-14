import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, "env");
    return {
        plugins: [react()],
        envDir: "env",
        base: env.VITE_BASE + "/",
        css: {
            preprocessorOptions: {
                scss: {
                    api: "modern",
                }
            }
        },
        build: {
            outDir: `dist-${env.VITE_TITLE}`,
        },
    }
})