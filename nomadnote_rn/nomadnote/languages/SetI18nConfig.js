import * as RNLocalize from 'react-native-localize';
import i18n from 'i18n-js';
import Translate from './Translate';
import { I18nManager } from 'react-native';

const translationGetters = {
    // lazy requires (metro bundler does not support symlinks)
    en: () => require('./strings.en.json'),
    ko: () => require('./strings.ko.json'),
    zh: () => require('./strings.cn.json'),
    'zh-Hant-HK': () => require('./strings.hk.json'),
    ja: () => require('./strings.ja.json'),
    'zh-Hant-MO': () => require('./strings.mo.json'),
    'zh-Hant-TW': () => require('./strings.tw.json'),
    'en-GB': () => require('./strings.uk.json'),
    'en-US': () => require('./strings.us.json'),
};

const SetI18nConfig = () => {
    // fallback if no available language fits
    const fallback = { languageTag: 'ko', isRTL: false };

    const { languageTag, isRTL } = RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) || fallback;

    // clear translation cache
    Translate.cache.clear();
    // update layout direction
    I18nManager.forceRTL(isRTL);
    // set i18n-js config
    console.log('languageTag: ', languageTag);
    i18n.translations = { [languageTag]: translationGetters[languageTag]() };
    i18n.locale = languageTag;
};

export default SetI18nConfig