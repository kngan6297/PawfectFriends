import vue from "@vitejs/plugin-vue"
// import fs from 'fs';
import path from "path"
import { defineConfig } from "vite"

import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Components from "unplugin-vue-components/vite"

import { createHtmlPlugin } from "vite-plugin-html"

const pathSrc = path.resolve(__dirname, "src")

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    // https: {
    //     key: fs.readFileSync('key.pem'),
    //     cert: fs.readFileSync('cert.pem'),
    // },
  },
  resolve: {
    alias: {
      "~/": `${pathSrc}/`,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Element Plus styles are imported in main.ts, so we don't need global import here
        // additionalData: `@use "~/styles/element/index.scss" as *;`,
        // Suppress deprecation warnings
        quietDeps: true,
        // Use modern Sass API
        api: 'modern-compiler',
      },
    },
  },
  plugins: [
    vue(),
    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ["vue", "md"],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        ElementPlusResolver({
          importStyle: false, // Disable automatic style import since we're importing manually in main.ts
        }),
      ],
      dts: "src/components.d.ts",
    }),
    createHtmlPlugin({ inject: { data: { title: "" } } }),
  ],
  // Suppress deprecation warnings
  logLevel: 'warn',
  // Custom build options to suppress warnings
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress Sass deprecation warnings
        if (warning.message.includes('legacy-js-api') || warning.message.includes('Deprecation Warning')) {
          return;
        }
        warn(warning);
      },
    },
  },
})
