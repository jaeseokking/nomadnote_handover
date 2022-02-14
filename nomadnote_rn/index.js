/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import './global/GlobalData';
import messaging from '@react-native-firebase/messaging';
import NotifService from './NotifService';
import { getItemFromAsync,  setItemToAsync} from './nomadnote/utils/AsyncUtil';

const noti = new NotifService ();

messaging ().setBackgroundMessageHandler (async remoteMessage => {
  console.log ('Message handled in the background!', remoteMessage);
  noti.localNotif (remoteMessage);
});

AppRegistry.registerComponent (appName, () => App);
  