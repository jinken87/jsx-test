import locales from './i18n.locale';
import zh from './assets/lang/zh-TW/index.json'
import en from './assets/lang/en/index.json'

export default defineI18nConfig(() => ({
  
    legacy: false,
    locales,
    messages: {
        zh,
        en
      }
      
    }));
    
    // messages: {
    //   en: {
    //     hello: 'Hello!',
    //     language: 'Language'
    //   },
    //   zh: {
    //     hello: '你好!',
    //     language: '語言',
    //     ttes:'132'
    //   }
    // }