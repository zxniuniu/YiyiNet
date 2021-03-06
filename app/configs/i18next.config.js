import i18n from 'i18next';
import i18nextBackend from 'i18next-node-fs-backend';
import config from './app.config';
import path from 'path';
import store from './settings'

const i18nextOptions = {
    backend: {
        loadPath: path.join(__dirname, './../assets/locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, './../assets/locales/{{lng}}/{{ns}}.json'),
        jsonIndent: 2,
    },
    // debug: true,
    // saveMissing: true,
    interpolation: {
        escapeValue: false
    },
    lng: store.get('DEFAULT_LANGUAGE') || 'cn',
    fallbackLng: config.fallbackLng,
    whitelist: config.languages,
    react: {
        wait: false
    }
};

if (!i18n.isInitialized) {
  i18n
    .use(i18nextBackend)
    .init(i18nextOptions);
}

export default i18n;
