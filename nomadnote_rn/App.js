/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { Component } from 'react';
import {
  Dimensions,
  Platform,
  PixelRatio,
  Alert,
  BackHandler,
} from 'react-native';

import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import {
  createBottomTabNavigator,
  createTabNavigator,
} from 'react-navigation-tabs';
import SetI18nConfig from './nomadnote/languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import translate from './nomadnote/languages/Translate';

import Splash from './nomadnote/ui/Splash';
import Login from './nomadnote/ui/login/Login';
import JoinStep1 from './nomadnote/ui/join/JoinStep1';
import JoinStep2 from './nomadnote/ui/join/JoinStep2';
import EmailLogin from './nomadnote/ui/login/EmailLogin';
import PersonTimeLine from './nomadnote/ui/main/PersonTimeLine';
import NoticeQuestion from './nomadnote/ui/main/NoticeQuestion';
import SearchMap from './nomadnote/ui/main/SearchMap';
import OtherTimeLine from './nomadnote/ui/main/OtherTimeLine';
import ScrapTimeLine from './nomadnote/ui/main/ScrapTimeLine';
import Setting from './nomadnote/ui/main/Setting';
import TabIcon from './nomadnote/components/TabIcon';

import { isIphoneX, getBottomSpace } from 'react-native-iphone-x-helper';
import CardDetail from './nomadnote/ui/detail/CardDetail';
import Write from './nomadnote/ui/board/Write';
import ModiUserInfo from './nomadnote/ui/setting/ModiUserInfo';
import Visited from './nomadnote/ui/setting/Visited';
import Question from './nomadnote/ui/setting/Question';
import FindId from './nomadnote/ui/login/FindId';
import AgreeInfo from './nomadnote/ui/detail/AgreeInfo';
import SearchMapDetail from './nomadnote/ui/detail/SearchMapDetail';
import AddFriend from './nomadnote/ui/setting/AddFriend';
import ManageFriends from './nomadnote/ui/setting/ManageFriends';
import Picker from './nomadnote/ui/board/Picker';
import OtaDetail from './nomadnote/ui/detail/OtaDetail';
import NotdisturbTime from './nomadnote/ui/setting/NotdisturbTime';
import VisitedTimeline from './nomadnote/ui/setting/VisitedTimeline';
import OpenLicense from './nomadnote/ui/setting/OpenLicense';
import EditPassword from './nomadnote/ui/login/EditPassword';

import { getItemFromAsync, setItemToAsync } from './nomadnote/utils/AsyncUtil';
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import NotifService from './NotifService';
import PushNotification from 'react-native-push-notification';
import CloseAppAdMob from './nomadnote/components/CloseAppAdMob';
import PhotoPicker from './nomadnote/components/PhotoPicker';
import CloseBn from './nomadnote/ui/banner/CloseBn';
import { RootSiblingParent } from 'react-native-root-siblings';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PUSH_COLOR = 'rgba(78, 109, 118, 1)';

let screenHeight = Dimensions.get('window').height;
let tabHeight;
if (Platform.OS === 'ios') {
  if (isIphoneX()) {
    tabHeight = screenHeight * 0.06;
  } else {
    tabHeight = screenHeight * 0.07;
  }
} else {
  tabHeight = screenHeight * 0.07;
}

const scale = SCREEN_WIDTH / 320;

export function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

const searchMapStackNavigator = createStackNavigator(
  {
    SearchMap: { screen: SearchMap },
  },
  { initialRouteName: 'SearchMap', headerMode: 'none' }
);

const TabNavigator = createBottomTabNavigator(
  {
    개인타임라인: {
      screen: PersonTimeLine,
      navigationOptions: () => {
        return {
          tabBarLabel: translate('mytimeline'),
          tabBarIcon: ({ tintColor }) => {
            var soureImge;
            if (tintColor == '#0c6e87') {
              soureImge = 'activePersonTimeLine';
            } else {
              soureImge = 'inactivePersonTimeLine';
            }
            return <TabIcon name={soureImge} size={21} color={tintColor} />;
          },
        };
      },
    },
    누적질문보기: {
      screen: NoticeQuestion,
      navigationOptions: () => {
        return {
          tabBarLabel: translate('reply'),
          tabBarIcon: ({ tintColor }) => {
            var soureImge;
            if (tintColor == '#0c6e87') {
              soureImge = 'activeQuestion';
            } else {
              soureImge = 'inactiveQuestion';
            }
            return <TabIcon name={soureImge} size={18} color={tintColor} />;
          },
        };
      },
    },
    지도검색: {
      screen: searchMapStackNavigator,
      navigationOptions: () => {
        return {
          tabBarLabel: translate('searchbymap'),
          tabBarIcon: ({ tintColor }) => {
            var soureImge;
            if (tintColor == '#0c6e87') {
              soureImge = 'activeSearchMap';
            } else {
              soureImge = 'inactiveSearchMap';
            }
            return <TabIcon name={soureImge} size={19} color={tintColor} />;
          },
        };
      },
    },
    타인타임라인: {
      screen: OtherTimeLine,
      navigationOptions: () => {
        return {
          tabBarLabel: translate('timelineofothers'),
          tabBarIcon: ({ tintColor }) => {
            var soureImge;
            if (tintColor == '#0c6e87') {
              soureImge = 'activeOtherTimeLine';
            } else {
              soureImge = 'inactiveOtherTimeLine';
            }
            return <TabIcon name={soureImge} size={25} color={tintColor} />;
          },
        };
      },
    },
    스크랩타임라인: {
      screen: ScrapTimeLine,
      navigationOptions: () => {
        return {
          tabBarLabel: translate('savedpoststimeline'),
          tabBarIcon: ({ tintColor }) => {
            var soureImge;
            if (tintColor == '#0c6e87') {
              soureImge = 'activeScrapTimeLine';
            } else {
              soureImge = 'inactiveScrapTimeLine';
            }
            return <TabIcon name={soureImge} size={16} color={tintColor} />;
          },
        };
      },
    },
    설정: {
      screen: Setting,
      navigationOptions: () => {
        return {
          tabBarLabel: translate('settings'),
          tabBarIcon: ({ tintColor }) => {
            var soureImge;
            if (tintColor == '#0c6e87') {
              soureImge = 'activeSetting';
            } else {
              soureImge = 'inactiveSetting';
            }
            return <TabIcon name={soureImge} size={23} color={tintColor} />;
          },
        };
      },
    },
  },
  {
    initialRouteName: '타인타임라인',
    lazy: false,
    navigationOptions: {
      gesturesEnabled: false,
    },
    tabBarOptions: {
      activeTintColor: '#0c6e87',
      inactiveTintColor: '#878787',
      labelStyle: {
        fontSize: 8,
        fontWeight: '400',
        marginBottom: 5,
      },
      style: {
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        backgroundColor: '#fff',
        height: tabHeight,
        paddingTop: 2,
      },
    },
  }
);

const StackNavigation = createStackNavigator(
  {
    Splash: { screen: Splash },
    Login: { screen: Login },
    EmailLogin: { screen: EmailLogin },
    JoinStep1: { screen: JoinStep1 },
    JoinStep2: { screen: JoinStep2 },
    FindId: { screen: FindId },

    TabHome: {
      screen: TabNavigator,
      navigationOptions: ({ navigation }) => ({
        headerShown: false,
      }),
    },
    SearchMapDetail: { screen: SearchMapDetail },
    CardDetail: { screen: CardDetail },
    Write: { screen: Write },
    ModiUserInfo: { screen: ModiUserInfo },
    Visited: { screen: Visited },
    Picker: { screen: Picker },
    Question: { screen: Question },
    AgreeInfo: { screen: AgreeInfo },
    AddFriend: { screen: AddFriend },
    ManageFriends: { screen: ManageFriends },
    OtaDetail: { screen: OtaDetail },
    NotdisturbTime: { screen: NotdisturbTime },
    VisitedTimeline: { screen: VisitedTimeline },
    PhotoPicker: { screen: PhotoPicker },
    OpenLicense: { screen: OpenLicense },
    EditPassword: { screen: EditPassword },
    CloseBn: {
      screen: CloseBn,
      navigationOptions: {
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardOverlayEnabled: true,
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 0.5, 0.9, 1],
              outputRange: [0, 0.25, 0.7, 1],
            }),
          },
          overlayStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
              extrapolate: 'clamp',
            }),
          },
        }),
      }
    }
  },
  { initialRouteName: 'Splash', headerMode: 'none' }
);

const AppContainer = createAppContainer(StackNavigation);

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      validCloseWindow: false
    };
    console.disableYellowBox = true;
    this.noti = new NotifService();

    // this.notif = new NotifService(
    //   this.onRegister.bind(this),
    //   this.onNotification.bind(this),
    // );
  }

  async componentDidMount() {
    this._checkPermission();
    this._listenForNotifications();
    // BackHandler.addEventListener('hardwareBackPress', this.handleBackButton.bind(this));
  }

  componentWillUnmount() {
    // this.notificationListener();
    // this.popInitialNotification();
    this.notificationOpenedListener();
    this.messageListener();
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton.bind(this));
  }

  // onRegister(token) {
  //   this.setState({ registerToken: token.token, fcmRegistered: true });
  // }

  onNotification(notif) {
    console.log('noti: ', notif.finish);
    this.localNotif(notif);
  }

  // onAction(notification) {
  //   console.log("ACTION:", notification.action);
  //   console.log("NOTIFICATION:", notification);
  // }

  _checkPermission = async () => {
    const authStatus = await messaging().requestPermission();
    console.log("authStatus!@#!#@!#!@#!@ :::::::::::",authStatus)
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      

    if (enabled) {
      console.log('Authorization status:', authStatus);
      this.getToken();
    }
  };

  getToken = async () => {
    // storage에 저장된 token을 가지고옴
    let fcmToken = await getItemFromAsync('fcm_token');
    if (!fcmToken) {
      // 저장된 token이 없으면 token을 발급
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        // 발급한 token을 저장함

        await setItemToAsync('fcm_token', fcmToken);
        this.setState({
          fcmToken: fcmToken,
        });
      }
    }
  
    
    global.pushToken = fcmToken;
    console.log('fcmToken:', fcmToken);
  };

 _listenForNotifications = async () => {
    /*
    * foreground에 있을때 터치한다.
    */
    this.messageListener = messaging().onMessage(message => {
      console.log('message11', JSON.stringify(message));
      // global.qId = JSON.stringify (message.data.last_id);
      global.pushData = message.data;
      console.log('gData ', global.pushData);

      this.noti.localNotif(message);
      if (global.isPush) {
        navigation.navigate('Write');
      }
    });



    this.notificationOpenedListener = messaging().onNotificationOpenedApp(
      async remoteMessage => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage
        );
      }
    );

    // const notificationOpen = await firebase
    //   .notifications ()
    //   .getInitialNotification ();
    // if (notificationOpen) {
    //   navigationDeferred.promise.then (() => {
    //     // NavigationService.navigate (notificationOpen.notification._data.url);
    //     NavigationService.navigate ('Write');
    //   });
    // }
  };

  render() {
    return <RootSiblingParent><AppContainer /></RootSiblingParent>;
  }
}

// export default createAppContainer(StackNavigation)
