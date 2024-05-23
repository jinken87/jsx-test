// https://nuxt.com/docs/api/configuration/nuxt-config
import locales from './i18n.locale';

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/i18n"],
  i18n: {
    vueI18n: './i18n.config.ts',
    defaultLocale: 'zh-TW',
    locales,
    strategy: 'no_prefix',

  }
})