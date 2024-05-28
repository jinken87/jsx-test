// https://nuxt.com/docs/api/configuration/nuxt-config
import locales from './i18n.locale';

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/i18n", '@element-plus/nuxt', '@nuxtjs/tailwindcss'],
  devServer: { port: 3000 },
  i18n: {
    vueI18n: './i18n.config.ts',
    defaultLocale: 'en',
    locales,
    strategy: 'no_prefix',

  }
})