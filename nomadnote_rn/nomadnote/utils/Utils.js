import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
  Dimensions,
  PixelRatio,
  NativeModules,
  Platform,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { StackActions, NavigationActions } from 'react-navigation';
import { isIphoneX, getBottomSpace } from 'react-native-iphone-x-helper';
import SetI18nConfig from '../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Moment from 'moment';

export const stringToByte = str => {
  String.prototype.encodeHex = function () {
    var bytes = [];
    for (var i = 0; i < this.length; ++i) {
      bytes.push(this.charCodeAt(i));
    }
    return bytes;
  };

  var byteArray = str.encodeHex();
  return byteArray;
};

export const byteLength = str => {
  // returns the byte length of an utf8 string
  var s = str.length;
  for (var i = str.length - 1; i >= 0; i--) {
    var code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
  }
  return s;
};

export const formatTimeByOffset = (dateString, offset) => {
  // Params:
  // How the backend sends me a timestamp
  // dateString: on the form yyyy-mm-dd hh:mm:ss
  // offset: the amount of hours to add.

  // If we pass anything falsy return empty string
  if (!dateString) return ''
  if (dateString.length === 0) return ''

  // Step 1: Parse the backend date string

  // Get Parameters needed to create a new date object
  const year = dateString.slice(0, 4)
  const month = dateString.slice(5, 7)
  const day = dateString.slice(8, 10)
  const hour = dateString.slice(11, 13)
  const minute = dateString.slice(14, 16)
  const second = dateString.slice(17, 19)

  // Step: 2 Make a JS date object with the data
  const dateObject = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)

  // Step 3: Get the current hours from the object
  const currentHours = dateObject.getHours()

  // Step 4: Add the offset to the date object
  dateObject.setHours(currentHours + offset)

  // Step 5: stringify the date object, replace the T with a space and slice off the seconds.
  const newDateString = dateObject
    .toISOString()
    .replace('T', ' ')
    .slice(0, 16)

  // Step 6: Return the new formatted date string with the added offset
  return `${newDateString}`
}

export const millisecondsToTime = function (millisec) {
  var date = new Date(millisec);
  const a = Moment(date).format('a');
  const languageTag = RNLocalize.findBestAvailableLanguage(
    Object.keys(translationGetters)
  );
  let meridiem;
  if (a === 'am') {
    if (languageTag.languageTag == 'en-GB') {
      meridiem = 'AM';
    } else if (languageTag.languageTag == 'en-US') {
      meridiem = 'AM';
    } else if (languageTag.languageTag == 'zh') {
      meridiem = 'AM';
    } else if (languageTag.languageTag == 'ja') {
      meridiem = 'AM';
    } else if (languageTag.languageTag == 'zh-Hant-HK') {
      meridiem = 'AM';
    } else if (languageTag.languageTag == 'ko') {
      meridiem = '오전';
    }
  } else {
    if (languageTag.languageTag == 'en-GB') {
      meridiem = 'PM';
    } else if (languageTag.languageTag == 'en-US') {
      meridiem = 'PM';
    } else if (languageTag.languageTag == 'zh') {
      meridiem = 'PM';
    } else if (languageTag.languageTag == 'ja') {
      meridiem = 'PM';
    } else if (languageTag.languageTag == 'zh-Hant-HK') {
      meridiem = 'PM';
    } else if (languageTag.languageTag == 'ko') {
      meridiem = '오후';
    }
  }

  return `${meridiem} ${Moment(date).format('hh:mm')}`;
};

export const convertLocalIdentifierToAssetLibrary = (localIdentifier, ext) => {
  const hash = localIdentifier.split('/')[0];
  return `assets-library://asset/asset.${ext}?id=${hash}&ext=${ext}`;
};

export const setTransLang = () => {
  const languageTag = RNLocalize.findBestAvailableLanguage(
    Object.keys(translationGetters)
  );
  console.log('language?', languageTag.languageTag);
  var lang = '';
  if (languageTag.languageTag == 'en-GB') {
    lang = 'en';
  } else if (languageTag.languageTag == 'en-US') {
    lang = 'en';
  } else if (languageTag.languageTag == 'zh') {
    lang = 'zh';
  } else if (languageTag.languageTag == 'ja') {
    lang = 'ja';
  } else if (languageTag.languageTag == 'zh-Hant-HK') {
    lang = 'zh-TW';
  } else if (languageTag.languageTag == 'ko') {
    lang = 'ko';
  } else if (languageTag.languageTag == 'zh-Hant-MO') {
    lang = 'zh-TW';
  } else if (languageTag.languageTag == 'zh-Hant-TW') {
    lang = 'zh-TW';
  } else {
    lang = 'en';
  }
  return lang;
};

export const setDeviceLang = () => {
  const languageTag = RNLocalize.findBestAvailableLanguage(
    Object.keys(translationGetters)
  );

  console.log('langgg=', languageTag.languageTag);
  var lang = '';
  if (languageTag.languageTag == 'en-GB') {
    lang = 'en';
  } else if (languageTag.languageTag == 'en-US') {
    lang = 'en';
  } else if (languageTag.languageTag == 'zh') {
    lang = 'zh_rCN';
  } else if (languageTag.languageTag == 'ja') {
    lang = 'ja';
  } else if (languageTag.languageTag == 'zh-Hant-HK') {
    lang = 'zh_rTW';
  } else if (languageTag.languageTag == 'ko') {
    lang = 'ko';
  } else if (languageTag.languageTag == 'zh-Hant-MO') {
    lang = 'zh_rTW';
  } else if (languageTag.languageTag == 'zh-Hant-TW') {
    lang = 'zh_rTW';
  } else {
    lang = 'en';
  }
  return lang;
};

const translationGetters = {
  // lazy requires (metro bundler does not support symlinks)
  en: () => require('../languages/strings.en.json'),
  ko: () => require('../languages/strings.ko.json'),
  zh: () => require('../languages/strings.cn.json'),
  'zh-Hant-HK': () => require('../languages/strings.hk.json'),
  ja: () => require('../languages/strings.ja.json'),
  'zh-Hant-MO': () => require('../languages/strings.mo.json'),
  'zh-Hant-TW': () => require('../languages/strings.tw.json'),
  'en-GB': () => require('../languages/strings.uk.json'),
  'en-US': () => require('../languages/strings.us.json'),
};
