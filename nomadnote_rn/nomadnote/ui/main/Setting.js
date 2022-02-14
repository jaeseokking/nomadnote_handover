import React, { Component } from 'react';
import { StackActions, NavigationActions, ThemeColors } from "react-navigation";
import LinearGradient from 'react-native-linear-gradient';
import { FlatGrid } from 'react-native-super-grid';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  PixelRatio,
  BackHandler,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Alert,
  Button,
  Linking,
  FlatList
} from 'react-native';

import axios from 'axios';
import Toast from 'react-native-root-toast';
import Translate from '../../languages/Translate';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Modal from "react-native-simple-modal";
import AppStatusBar from '../../components/AppStatusBar';
import { translate } from 'i18n-js';
import CustomHeaderText from '../../components/CustomHeaderText';
import { clearAsync, getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trans } from 'react-i18next';
import RNIap, {
  InAppPurchase,
  PurchaseError,
  SubscriptionPurchase,
  acknowledgePurchaseAndroid,
  consumePurchaseAndroid,
  finishTransaction,
  finishTransactionIOS,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { PageControlJaloro } from 'react-native-chi-page-control';
import {
  TestIds, InterstitialAd, AdEventType, BannerAd,
  BannerAdSize
} from '@react-native-firebase/admob';
import { setDeviceLang } from '../../utils/Utils';


const itemSkus = Platform.select({
  ios: [
    '1gb',
    '600mb'
  ],
  android: [
    '1gb',
    '600mb'
  ]
});


let purchaseUpdateSubscription;
let purchaseErrorSubscription;

const THEME_COLOR = '#375a64'
const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const memory_width = SCREEN_WIDTH * 0.875

const scale = SCREEN_WIDTH / 320;
const image_arrow = require('../../images/icon_arrowR.png');
const image_arrow_click = require('../../images/icon_arrow.png');
const image_uncheck = require('../../images/btn_select_picture_cancel.png');
const image_check = require('../../images/icon_check.png');

const unitId =
  Platform.OS === 'ios'
    ? 'ca-app-pub-5097070292431028/6211013887'
    : 'ca-app-pub-5097070292431028/1602847519'
// const interstitialAd = InterstitialAd.createForAdRequest(unitId);
const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);

export function normalize(size) {
  const newSize = size * scale
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize))
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
  }
}

export default class Setting extends Component {
  constructor(props) {
    super(props);
    this.onScroll = this.onScroll.bind(this);
    this.handleBackButton = this.handleBackButton.bind(this);
    this.intervalPointer = null;
    this.state = {
      gbString: '100gb',
      show1gbImg: false,
      show600mgImg: false,
      showFreeImg: false,
      showCoupon: false,
      phoneS: false,
      emailS: false,
      addListS: false,
      payTitle: '',
      travelType: 1,
      userData: [],
      usage: 0,
      total: 0,
      content: false,
      b2bAd: [],
      b2bImageUri: [],
      voucher1: '',
      voucher2: '',
      voucher3: '',
      voucher4: '',
      payContent: false,
      productList: [],
      receipt: '',
      availableItemsMessage: '',
      isModalOpen: false,
      isLastOpen: false,
      isRealLastOpen: false,
      sliderIndex: 0,
      maxSlider: 0,
      progress: 0,
      isAutoLogin: true,
      friendsInfo: [],
      todayAd: '',
      lang: setDeviceLang(),
      joinType: getItemFromAsync('join_type'),
    };
  }
  setRef = (c) => {
    this.listRef = c;
  }

  scrollToIndex = (index, animated) => {
    this.listRef && this.listRef.scrollToIndex({ index, animated })
  }


  async clearIap() {
    RNIap.initConnection().then(() => {
      RNIap.flushFailedPurchasesCachedAsPendingAndroid().catch(() => {

      }).then(() => {
        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: InAppPurchase) => {
          console.log('purchaseUpdatedListener', purchase);
          const receipt =
            Platform.OS === 'ios' ? purchase.transactionReceipt : purchase.purchaseToken;
          console.log('receipt = ?', receipt)
          if (receipt) {
            finishTransaction(purchase)
              .then(async () => {
                if (Platform.OS === 'ios') {
                  await RNIap.finishTransactionIOS(purchase.transactionId);
                  this.setState({ receipt })
                } else {
                  this.comsumeItem(receipt, purchase);
                }
                // From react-native-iap@4.1.0 you can simplify above `method`. Try to wrap the statement with `try` and `catch` to also grab the `error` message.
                // If consumable (can be purchased again)
                // If not consumable

                this.checkReceipt(receipt);
                console.log('receipt11 = ?', receipt)
                // setIsSubscription(true);
              })
              .catch(() => {
                console.warn('purchase is failed');
              });
          }
        });

        purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
          console.warn('purchaseErrorListener', error);
        });
      })
    })
  }

  goNext = () => {
    Alert.alert('Receipt', this.state.receipt);
  };

  componentDidMount() {
    this.timer();
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
    this.didFocusListener = this.props.navigation.addListener(
      'didFocus',
      async () => {
        console.log('width: ', SCREEN_WIDTH, SCREEN_HEIGHT * 0.3)
        interstitialAd.onAdEvent(type => {
          if (type === AdEventType.LOADED) {
            console.log('InterstitialAd adLoaded');
          } else if (type === AdEventType.ERROR) {
            console.warn('InterstitialAd => Error');
          } else if (type === AdEventType.OPENED) {
            console.log('InterstitialAd => adOpened');
          } else if (type === AdEventType.CLICKED) {
            console.log('InterstitialAd => adClicked');
          } else if (type === AdEventType.LEFT_APPLICATION) {
            console.log('InterstitialAd => adLeft_App');
          } else if (type === AdEventType.CLOSED) {
            console.log('InterstitialAd => adClosed');
            interstitialAd.load();
            BackHandler.exitApp()
          }
        });

        interstitialAd.load();

        const autoLogin = await getItemFromAsync('auto_login');
        const today = await getItemFromAsync('today');

        this.setState({ isAutoLogin: autoLogin, todayAd: today })

        this.clearIap()
        this.getMyInfo()
        this.getB2BAd()
        this.getItems()
        this.getRequestFriends()

        if (global.isClickTravelStyle) {
          this.setState({ content: true });
          global.isClickTravelStyle = false
        }
      }
    );

    this.didFocusListener = this.props.navigation.addListener(
      'didBlur',
      () => {
        console.log('checkddd')

      },
    );
  }

  showAd() {
    if (interstitialAd.loaded) {
      interstitialAd.show().catch(error => console.warn(error));
    }
  }

  timer() {
    this.intervalPointer = setInterval(function () {
      const { sliderIndex, maxSlider } = this.state
      let nextIndex = 0

      if (sliderIndex < maxSlider) {
        nextIndex = sliderIndex + 1
      }

      this.scrollToIndex(nextIndex, true)
      this.setState({ sliderIndex: nextIndex })
    }.bind(this), 4000)
  }



  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);

    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
    if (this.intervalPointer) {
      clearInterval(this.intervalPointer)
    }
    RNIap.endConnection();
  }

  handleBackButton = () => {
    console.log('navigation: ', this.props.navigation.isFocused())
    if (this.props.navigation.isFocused()) {
      console.log('other focus')
      // if (this.state.isMoveScreen) {
      //     console.log('moved')
      //     this.setState({ isMoveScreen: false })
      //     return true
      // } else {
      //     console.log('not moved')
      //     this.props.navigation.navigate('CloseBn')
      //     return true
      // }
      this.props.navigation.navigate('CloseBn')
      return true
    }
  };

  getItems = async () => {
    try {
      const isReady = await RNIap.initConnection();
      if (isReady) {
        const products: RNIap.Product[] = await RNIap.getProducts(itemSkus);
        console.log('Products', products);
        this.setState({ productList: products });
      }
    } catch (err) {
      console.log('getItems || purchase error => ', err);
    }
  };

  async comsumeItem(token, purchase) {
    if (Platform.OS === 'android') {
      //끝나면 다시 살수있도록 해주는거 같음!!!!!!
      // If consumable (can be purchased again)
      await RNIap.consumePurchaseAndroid(token)
        .then(result => log('IAP', 'consumeAllItemsAndroid', result))
        .catch(error => log('IAP', 'consumeAllItemsAndroid error', error));

      await RNIap.finishTransaction(purchase, true);
    }
  }

  onScroll(e) {
    // Get progress by dividing current FlatList X offset with full FlatList width
    this.setState({ progress: e.nativeEvent.contentOffset.x / ((this.state.maxSlider) * SCREEN_WIDTH) })
  };


  componentHideAndShow = () => {
    this.setState(previousState => ({ content: !previousState.content }))
  }

  progressHideAndShow = () => {
    this.setState(progressState => ({ progressContent: !progressState.progressContent }))
  }

  snsHideAndShow = () => {
    this.setState(snsState => ({ snsContent: !snsState.snsContent }))
  }

  friendHideAndShow = () => {
    this.setState(fState => ({ friendContent: !fState.friendContent }))
  }

  payHideAndShow = () => {
    this.setState(payState => ({ payContent: !payState.payContent }))
  }

  editProfileHideAndShow = () => {
    this.setState(editProfile => ({ epContent: !editProfile.epContent }))
  }

  goToVisited = () => {
    this.props.navigation.navigate('Visited');
  };


  //소모품 구매 요청
  requestPurchase = async (sku) => {
    try {
      await RNIap.requestPurchase(sku, false);
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }

  // 결제 관련
  checkReceipt(receipt) {
    console.log('transaction', receipt)
    var self = this
    var bodyFormData = new FormData();
    var modiQ = 0


    if (this.state.show1gbImg) {
      modiQ = 1024 * 1024 * 1024
    } else if (this.state.show600mgImg) {
      modiQ = 1024 * 1024 * 600
    }

    bodyFormData.append('member_id', global.user.id);
    bodyFormData.append('quota', modiQ);
    bodyFormData.append('purchaseToken', receipt);
    console.log('chargeBodyform', bodyFormData)
    let url = global.server + `/api/member/charge`
    axios.post(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        console.log(response.data);

        if (response.data.return === 1) {
          Toast.show('your_purchase_is_complete', {
            duration: 2000,
            position: Toast.positions.CENTER
          })
          // Toast.show(Translate('your_purchase_is_complete'))
          this.setState({
            payContent: false,
            show1gbImg: false,
            show600mgImg: false,
            showCoupon: false,
            showFreeImg: false
          }, () => { this.getMyInfo() })

        } else {
          Toast.show(`${Translate('occur_error')}`, {
            duration: 2000,
            position: Toast.positions.CENTER
          })
          // Toast.show(`${Translate('occur_error')}`)
        }
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log(error.response.data)
        }
        else {
          console.log(error)
        }
      });
  }


  userVoucher() {
    if (this.state.voucher1.length !== 4) {
      Toast.show(`${Translate('voucher_error')}`, {
        duration: 2000,
        position: Toast.positions.CENTER
      })
      // Toast.show(Translate('voucher_error'))
      return
    } else if (this.state.voucher2.length !== 4) {
      Toast.show(`${Translate('voucher_error')}`, {
        duration: 2000,
        position: Toast.positions.CENTER
      })
      // Toast.show(Translate('voucher_error'))
      return
    } else if (this.state.voucher3.length !== 4) {
      Toast.show(`${Translate('voucher_error')}`, {
        duration: 2000,
        position: Toast.positions.CENTER
      })
      // Toast.show(Translate('voucher_error'))
      return
    } else if (this.state.voucher4.length !== 4) {
      Toast.show(`${Translate('voucher_error')}`, {
        duration: 2000,
        position: Toast.positions.CENTER
      })
      // Toast.show(Translate('voucher_error'))
      return
    } else {

      var self = this
      var bodyFormData = new FormData();
      bodyFormData.append('member_id', global.user.id);
      bodyFormData.append('voucher1', this.state.voucher1);
      bodyFormData.append('voucher2', this.state.voucher2);
      bodyFormData.append('voucher3', this.state.voucher3);
      bodyFormData.append('voucher4', this.state.voucher4);

      let url = global.server + `/api/voucher/use_voucher`
      console.log(url)
      console.log('formdata: ', bodyFormData)

      axios.post(url, bodyFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(function (response) {

          if (response.data.result === 'ok') {
            Toast.show(`${Translate('voucher_use')}`, {
              duration: 2000,
              position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('voucher_use')}`)
            this.setState({
              voucher1: null, voucher2: null, voucher3: null, voucher4: null
              , showCoupon: false, payContent: false
            })
            this.getMyInfo()
          } else if (response.data.result === 'used') {
            Toast.show(`${Translate('voucher_used_error')}`, {
              duration: 2000,
              position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('voucher_used_error')}`)
          } else if (response.data.result === 'block') {
            Toast.show(`${Translate('voucher_block_error')}`, {
              duration: 2000,
              position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('voucher_block_error')}`)
          } else {
            Toast.show(`${Translate('voucher_error')}`, {
              duration: 2000,
              position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('voucher_error')}`)
          }
        }.bind(this))
        .catch(function (error) {
          if (error.response != null) {
            console.log(error.response.data)
          }
          else {
            console.log(error)
          }
        });
    }
  }


  getB2BAd() {
    const self = this
    let url = global.server + `/api/advertise/adver_list`

    var bodyFormData = new FormData();
    bodyFormData.append('member_id', global.user.id);
    axios.get(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        if (response.data.result === 'ok') {
          this.setState({ b2bAd: response.data.advers }, () => {
          })

          var imageA = response.data.advers
          var mArr = []
          var videoP = ''
          if (imageA.length == 0 || imageA === undefined) {
            this.setState({
              noImage: true,
            })
            console.log('no Data')
          } else {
            let aImg = []
            mArr = imageA.map((item) => {
              aImg = aImg.concat({ image: global.server + item.image_uri, link: item.link })
              // Image.getSize(aImg.image, (width, height) => {
              //   console.log('b2bImage height', height)
              // })
            })
            console.log('b2bImage =', aImg)
            this.setState({ b2bImageUri: aImg, maxSlider: aImg.length - 1 })
          }
        } else {
          Toast.show(`${Translate('occur_error')}`)
        }
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log('b2bError =', error.response.data)
        }
        else {
          console.log(error)
        }
      });
  }


  goAlert = () =>


    Alert.alert(
      Translate('member_delete'),
      // Translate('member_delete_confrim'),
      [
        {
          text: Translate('builderno'),
          onPress: () => console.log('No Pressed'),
          style: 'default'

        },
        {
          text: Translate('builderyes'),
          onPress: () => this.goConfirmAlert(),
          style: 'default'
        },
      ],
      { cancelable: true },
      //clicking out side of alert will not cancel
    );


  goConfirmAlert = () =>
    Alert.alert(
      Translate('delete_question'),
      Translate('member_delete'),
      [
        {
          text: Translate('builderno'),
          style: 'default'
        },
        {
          text: Translate('builderyes'),
          onPress: () => this.deleteMember(),
          style: 'default'
        },
      ],
      { cancelable: true },
      //clicking out side of alert will not cancel
    );

  deleteMember() {

    var self = this
    var bodyFormData = new FormData();
    bodyFormData.append('member_id', global.user.id);
    bodyFormData.append('del_yn', "Y");


    let url = global.server + `/api/member/update_info`
    console.log(url)
    console.log('formdata: ', bodyFormData)

    axios.post(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        console.log(response.data);

        if (response.data.result === 'ok') {
          Toast.show(`${Translate('delete_toast_message')}` + `\n` + `${Translate('goodbyte_message')}`, {
            duration: 2000,
            position: Toast.positions.CENTER
          })
          // Toast.show(`${Translate('delete_toast_message')}` + `${Translate('goodbyte_message')}`)
          this.logout()
        } else {
          Toast.show(`${Translate('occur_error')}`, {
            duration: 2000,
            position: Toast.positions.CENTER
          })
          // Toast.show(`${Translate('occur_error')}`)
        }
        this.setState({ isLoading: false })
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log(error.response.data)
        }
        else {
          console.log(error)
        }
      });
  }

  updateInfo(tId) {
    console.log('cant here?')
    var self = this
    var bodyFormData = new FormData();
    bodyFormData.append('member_id', global.user.id);
    bodyFormData.append('style', tId);


    let url = global.server + `/api/member/update_info`
    console.log(url)
    console.log('formdata: ', bodyFormData)

    axios.post(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        console.log(response.data);

        if (response.data.result === 'ok') {
          this.getMyInfo()
        } else {
          Toast.show(`${Translate('occur_error')}`, {
            duration: 2000,
            position: Toast.positions.CENTER
          })
          // Toast.show(`${Translate('occur_error')}`)
        }
        this.setState({ isLoading: false })
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log(error.response.data)
        }
        else {
          console.log(error)
        }
      });
  }




  getMyInfo() {
    let url = global.server + '/api/member/my_info'

    var bodyFormData = new FormData();
    bodyFormData.append('member_id', global.user.id);

    axios.post(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        console.log("dataReturn1", response.data);
        console.log('usage', response.data.usebytes)

        this.setState({
          userData: response.data.member,
          usage: response.data.usebytes,
          total: response.data.disk,
          travelType: response.data.member.style_id
        })
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log(error.response.data)
          // Toast.show(error.response.data.message);
        }
        else {
          console.log(error)
        }
      });
  }

  getAvailablePurchases = async (index) => {
    try {
      const purchases = await RNIap.getAvailablePurchases();
      let token
      console.info('Available purchases => ', purchases);
      if (purchases && purchases.length > 0) {
        token = purchases[index].purchaseToken;
        console.log('purchase token: ', token)
        this.comsumeItem(token);
        this.setState({
          availableItemsMessage: `Got ${purchases.length} items.`,
          receipt: purchases[index].transactionReceipt,
        }, () => { console.log('receipt!!', this.state.receipt) });
      }
    } catch (err) {
      console.warn(err.code, err.message);
      console.log('getAvailablePurchases error => ', err);
    }
  };

  purchaseConfirmed = () => {
    //you can code here for what changes you want to do in db on purchase successfull
  };

  getRequestFriends() {
    let url = global.server + '/api/member/request_friends'

    var bodyFormData = new FormData();
    bodyFormData.append('member_id', global.user.id);

    axios.post(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        console.log('request', response.data)
        if (response.data.result === 'ok') {
          this.setState({
            friendsInfo: response.data.friends[0],
          }, () => {
            this.requestAlert()
          })
        }
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log(error.response.data)
        }
        else {
          console.log(error)
        }
      });
  }

  requestAlert = () => {
    this.state.friendsInfo.Member !== null ?
      Alert.alert(
        '',
        this.state.friendsInfo.Member.name + ' ' + Translate('request'),
        [
          {
            text: Translate('builderno'),
            onPress: () => this.acceptRequest('del'),
            style: 'destructive'

          },
          {
            text: Translate('builderyes'),
            onPress: () => this.acceptRequest('add'),
            style: 'default'
          },
        ],
        { cancelable: true },
        //clicking out side of alert will not cancel
      )
      :
      null
  }
  acceptRequest(type) {
    console.log('friend_member_id', this.state.friendsInfo.id)
    console.log('type:', type)
    let url = global.server + '/api/member/confirm_friend'

    var bodyFormData = new FormData();
    bodyFormData.append('friend_id', this.state.friendsInfo.id);
    bodyFormData.append('type', type);

    axios.post(url, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        console.log('request', response.data)
        if (response.data.result === 'ok') {
        }
      }.bind(this))
      .catch(function (error) {
        if (error.response != null) {
          console.log(error.response.data)
        }
        else {
          console.log(error)
        }
      });
  }


  logout() {
    clearAsync();
    setItemToAsync('auto_login', this.state.isAutoLogin);
    setItemToAsync('today', this.state.todayAd);

    global.user = ''
    global.token = ''

    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({
        routeName: 'Login',
      })]
    });
    this.props.navigation.dispatch(resetAction)
  }

  render() {
    const { navigation } = this.props;
    // ca-app-pub-3940256099942544/2934735716 ios 테스트
    //ios출시 후 배너 나옴 : ca-app-pub-5097070292431028/6211013887
    var imgSource = !this.state.show1gbImg ? image_uncheck : image_check;
    var img2Source = !this.state.show600mgImg ? image_uncheck : image_check;
    var imgFreeSource = !this.state.showFreeImg ? image_uncheck : image_check;
    var couponImg = !this.state.showCoupon ? image_uncheck : image_check;
    var phoneSearch = !this.state.phoneS ? image_uncheck : image_check;
    var emailSearch = !this.state.emailS ? image_uncheck : image_check;
    var addListSearch = !this.state.addListS ? image_uncheck : image_check;


    var CB = ''
    var usedByte = ''
    var leftByte = ''
    var widthG = 0
    var convertB = this.state.total / Math.pow(1024, 2)
    if (convertB > 1024.0) {
      let findGB = convertB / 1024.0
      let GB = findGB.toFixed(1)
      CB = GB.toString() + 'GB'
    } else {
      var roundCB = Math.round(convertB)
      CB = roundCB.toString() + 'MB'
    }

    let sub = (this.state.total - this.state.usage) / Math.pow(1024, 2)
    let subtract = Math.round(sub)
    leftByte = subtract.toString() + 'MB'


    let check = this.state.usage / Math.pow(1024, 2)
    let usedFloor = Math.round(check)
    usedByte = usedFloor.toString() + 'MB'

    let findW = this.state.usage / this.state.total
    if (findW > 0) {
      findW = this.state.usage / this.state.total
    } else {
      findW = 0
    }

    onViewableItemsChanged = ({ viewableItems, changed }) => this.setState({ viewableItems })

    return (
      <>
        <SafeAreaView style={styles.topSafeArea} />
        <SafeAreaView style={styles.bottomSafeArea}>
          <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
          <View style={styles.container}>
            <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
              <Text style={styles.textStyle}>{Translate('settings')}</Text>
            </LinearGradient>

            {this.state.b2bAd.length > 0 ?
              <ScrollView showsVerticalScrollIndicator={false}
                scrollEnabled={false}>
                <View style={{ height: SCREEN_WIDTH * 0.65 }}>
                  <FlatList
                    ref={this.setRef}
                    horizontal
                    keyExtractor={item => item.id}
                    onScrollToIndexFailed={info => {
                      const wait = new Promise(resolve => setTimeout(resolve, 500));
                      wait.then(() => {
                        flatList.current?.scrollToIndex({ index: info.index, animated: true });
                      });
                    }}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    onScroll={this.onScroll}
                    keyExtractor={item => item._id}
                    onMomentumScrollEnd={(event) => {
                      let sliderIndex = event.nativeEvent.contentOffset.x ? event.nativeEvent.contentOffset.x / SCREEN_WIDTH : 0
                      this.setState({ sliderIndex })
                    }}
                    data={this.state.b2bAd.length === 0 ? null : this.state.b2bImageUri}
                    renderItem={({ item }) => (
                      <TouchableWithoutFeedback
                        onPress={() => {
                          Linking.openURL(item.link)
                        }}>
                        <Image
                          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.65, alignSelf: 'center', resizeMode: 'stretch', marginBottom: SCREEN_WIDTH * 0.65 * 0.3 }}
                          source={{ uri: item.image }}
                        />
                      </TouchableWithoutFeedback>
                    )}
                  />
                </View>
              </ScrollView>
              :
              <View style={{ width: '100%', minHeight: SCREEN_WIDTH * 0.65, marginBottom: SCREEN_WIDTH * 0.65 * 0.3 }} />
            }


            {this.state.b2bAd.length > 0 ?
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                {/* pageControl */}
                <PageControlJaloro
                  activeTintColor={'#557F89'}
                  inactiveTintColor={'#d8d8d8'}
                  borderRadius={5}
                  width={10}
                  height={10}
                  progress={this.state.progress}
                  numberOfPages={this.state.maxSlider + 1}
                />
              </View>
              :
              null
            }


            <View style={{ marginTop: 10, height: 3, backgroundColor: '#9b9b9b' }} />
            <ScrollView>
              <TouchableOpacity onPress={() => {
                navigation.navigate('Visited');
              }}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_logo.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('activity_visit_visited')}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>


              <TouchableOpacity onPress={this.componentHideAndShow}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_sh.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('travelstyle')}</Text>
                  </View>
                  <View style={{ padding: 25 }}>
                    <Image source={this.state.content ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>
              {
                this.state.content ?
                  <View>
                    <Text style={{ textAlign: 'center', marginTop: 15, color: '#878787', fontSize: normalize(12) }}>{Translate('travelquestion')}</Text>
                    <View style={styles.elemTravel}>
                      <View style={styles.elemSettingTravalStyle}>

                        <TouchableOpacity
                          onPress={() => {
                            this.updateInfo(1)
                          }}>
                          <View style={{
                            borderRadius: 10, borderColor: '#779ba4', borderWidth: 1, width: SCREEN_WIDTH * 0.23, flex: 1,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: this.state.userData.style_id === 1 ? '#557f89' : '#ffffff',
                            shadowColor: this.state.userData.style_id === 1 ? '#80000000' : null, shadowRadius: this.state.userData.style_id === 1 ? 5 : null
                          }}>
                            <Text style={{ color: this.state.userData.style_id === 1 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: normalize(12), marginVertical: 8 }}>{Translate('activity_write_healing')}</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            this.updateInfo(2)
                          }}>
                          <View style={{
                            marginLeft: 9, borderRadius: 10, borderColor: '#779ba4', borderWidth: 1, width: SCREEN_WIDTH * 0.23, flex: 1,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: this.state.userData.style_id === 2 ? '#557f89' : '#ffffff',
                            shadowColor: this.state.userData.style_id === 2 ? '#80000000' : null, shadowRadius: this.state.userData.style_id === 2 ? 5 : null
                          }}>
                            <Text style={{ color: this.state.userData.style_id === 2 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: normalize(12), marginVertical: 8 }}>{Translate('activity_write_hotplace')}</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            this.updateInfo(3)
                          }} >
                          <View style={{
                            marginLeft: 9, borderRadius: 10, borderColor: '#779ba4', borderWidth: 1, width: SCREEN_WIDTH * 0.23, flex: 1,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: this.state.userData.style_id === 3 ? '#557f89' : '#ffffff',
                            shadowColor: this.state.userData.style_id === 3 ? '#80000000' : null, shadowRadius: this.state.userData.style_id === 3 ? 5 : null
                          }}>
                            <Text style={{ color: this.state.userData.style_id === 3 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: normalize(12), marginVertical: 8 }}>{Translate('traditional_market')}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.elemTravel}>
                      <View style={styles.elemSettingTravalStyle}>
                        <TouchableOpacity
                          onPress={() => {
                            this.updateInfo(4)
                          }} >
                          <View style={{
                            borderRadius: 10, borderColor: '#779ba4', borderWidth: 1, width: SCREEN_WIDTH * 0.23, flex: 1,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: this.state.userData.style_id === 4 ? '#557f89' : '#ffffff',
                            shadowColor: this.state.userData.style_id === 4 ? '#80000000' : null, shadowRadius: this.state.userData.style_id === 4 ? 5 : null
                          }}>
                            <Text style={{ color: this.state.userData.style_id === 4 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: normalize(12), marginVertical: 8 }}>{Translate('historicalstyle')}</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            this.updateInfo(5)
                          }} >
                          <View style={{
                            marginLeft: 9, borderRadius: 10, borderColor: '#779ba4', borderWidth: 1, width: SCREEN_WIDTH * 0.23, flex: 1,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: this.state.userData.style_id === 5 ? '#557f89' : '#ffffff',
                            shadowColor: this.state.userData.style_id === 5 ? '#80000000' : null, shadowRadius: this.state.userData.style_id === 5 ? 5 : null
                          }}>
                            <Text style={{ color: this.state.userData.style_id === 5 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: normalize(12), marginVertical: 8 }}>{Translate('museumstyle')}</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            this.updateInfo(6)
                          }}>
                          <View style={{
                            marginLeft: 9, borderRadius: 10, borderColor: '#779ba4', borderWidth: 1, width: SCREEN_WIDTH * 0.23, flex: 1,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: this.state.userData.style_id === 6 ? '#557f89' : '#ffffff',
                            shadowColor: this.state.userData.style_id === 6 ? '#80000000' : null, shadowRadius: this.state.userData.style_id === 6 ? 5 : null
                          }}>
                            <Text style={{ color: this.state.userData.style_id === 6 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: normalize(12), marginVertical: 8 }}>{Translate('artmuseumstyle')}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ marginTop: 16, height: 1, backgroundColor: '#9b9b9b' }} />
                  </View>
                  : null
              }


              <TouchableOpacity onPress={() => {
                navigation.navigate('NotdisturbTime');
              }}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/slot1.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('not_disturb')}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={this.editProfileHideAndShow}>
              {/* <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ModiUserInfo');
                }}> */}
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_solo.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('setmyinfo2')}</Text>
                  </View>
                  <View style={{ padding: 25 }}>
                    <Image source={this.state.epContent ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>
              {
                this.state.epContent ?
                  <View style={{ paddingTop: 24 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => {
                      this.props.navigation.navigate('ModiUserInfo')
                    }}>
                      <Image
                        source={phoneSearch} style={{ overflow: 'hidden', width: 13, height: 13, marginLeft: '19%', borderColor: '#557f89', borderWidth: 1, borderRadius: 6.5, resizeMode: 'cover' }} />
                      <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: '3%' }}>{Translate('setmyinfo2')}</Text>
                    </TouchableOpacity>
                    {
                      global.user.join_type === 5 ?
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }} onPress={() => {
                          this.props.navigation.navigate('EditPassword', { email: global.user.email })
                        }}>
                          <Image source={emailSearch} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                          <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: '3%' }}>{Translate('change_password')}</Text>
                        </TouchableOpacity>
                        : null
                    }
                    <View style={{ marginTop: 18, height: 1, backgroundColor: '#9b9b9b' }} />
                  </View>
                  : null
              }
            



              {/* 메모리사용량 */}
              <TouchableOpacity onPress={this.progressHideAndShow}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_file.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('memoryused')}</Text>
                  </View>
                  <View style={{ padding: 25 }}>
                    <Image source={this.state.progressContent ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>
              {
                this.state.progressContent ?
                  <View style={{ height: 80, paddingTop: 15 }}>
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                      <Text style={{ marginLeft: 23, color: '#878787' }}>{Translate('totalmemory')}</Text>
                      <Text style={{ paddingRight: 25, color: '#878787' }}>{Translate('total') + ' ' + CB} </Text>
                    </View>
                    <View style={styles.progress}>
                      {/* <View styles={styles.progressInner}/> */}
                      <LinearGradient start={{ x: 0, y: 0.75 }} end={{ x: 1, y: 0.25 }} colors={['#507781', '#638d96']} style={{
                        height: 11,
                        width: memory_width * findW, borderRadius: 7.5
                      }}></LinearGradient>
                    </View>
                    <View style={{ marginTop: 4, justifyContent: 'space-between', flexDirection: 'row' }}>
                      {this.state.lang === 'en' || this.state.lang === 'ko' || this.state.lang === 'ja' ?
                        <Text style={{ marginLeft: 23, color: '#878787' }}> {`${usedByte} ${Translate('using')}`}</Text> :
                        <Text style={{ marginLeft: 23, color: '#878787' }}> {`${Translate('using')} ${usedByte}`}</Text>
                      }
                      <Text style={{ paddingRight: 25, color: '#878787' }}> {leftByte} </Text>
                    </View>
                    <View style={{ marginTop: 9, height: 1, backgroundColor: '#9b9b9b' }} />
                  </View>
                  : null
              }

              {/* 친구 추가 관리*/}
              <TouchableOpacity onPress={this.friendHideAndShow} >
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_add.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('addusersettings')}</Text>
                  </View>
                  <View style={{ padding: 25 }}>
                    <Image source={this.state.friendContent ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              {
                this.state.friendContent ?
                  <View style={{ paddingTop: 24 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => {
                      this.props.navigation.navigate('AddFriend', { phone: true, email: false, manageFriends: false })
                    }}>
                      <Image
                        source={phoneSearch} style={{ overflow: 'hidden', width: 13, height: 13, marginLeft: '19%', borderColor: '#557f89', borderWidth: 1, borderRadius: 6.5, resizeMode: 'cover' }} />
                      <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: '3%' }}>{Translate('searchphone')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }} onPress={() => {
                      this.props.navigation.navigate('AddFriend', { email: true, phone: false, manageFriends: false })
                    }}>
                      <Image source={emailSearch} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                      <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: '3%' }}>{Translate('searchid')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }} onPress={() => {
                      navigation.navigate('AddFriend', { email: false, phone: false, manageFriends: true });
                    }}>
                      <Image source={addListSearch} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                      <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: '3%' }}>{Translate('view_my_friends')}</Text>
                    </TouchableOpacity>
                    <View style={{ marginTop: 18, height: 1, backgroundColor: '#9b9b9b' }} />
                  </View>
                  : null
              }

              {/* 결제 시스템 */}
              <TouchableOpacity onPress={this.payHideAndShow} >
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_pay.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('paymentoptions')}</Text>
                  </View>
                  <View style={{ padding: 25 }}>
                    <Image source={this.state.payContent ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              {
                this.state.payContent ?
                  <View style={{ paddingTop: 27 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({
                      show1gbImg: !this.state.show1gbImg,
                      show600mgImg: false,
                      showFreeImg: false,
                      showCoupon: false
                    })}>
                      <Image source={imgSource} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                      <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: 12 }}>{Translate('prd_1gb') + " (" + this.state.productList[0].localizedPrice + ")"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}
                      onPress={() => this.setState({
                        show600mgImg: !this.state.show600mgImg,
                        show1gbImg: false,
                        showFreeImg: false,
                        showCoupon: false
                      })}>
                      <Image source={img2Source} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                      <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: 12 }}>{Translate('prd_600mb') + " (" + this.state.productList[1].localizedPrice + ")"}</Text>
                    </TouchableOpacity>

                    {/* 무료데이터 우선 히든 처리
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }} 
                  onPress={() => 
                  this.setState({ showFreeImg: !this.state.showFreeImg,
                  show1gbImg:false,
                  show600mgImg:false,
                  showCoupon:false })}>
                    <Image source={imgFreeSource} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                    <Text style={{ color: '#878787', fontSize: normalize(12), marginLeft: '3%' }}>{Translate('prd_20kb')}</Text>
                  </TouchableOpacity> */}


                    <TouchableOpacity style={{ marginTop: 15 }}
                      onPress={() => this.setState({
                        showCoupon: !this.state.showCoupon,
                        show1gbImg: false,
                        show600mgImg: false,
                        showFreeImg: false
                      })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={couponImg} style={{ resizeMode: 'cover', width: 13, height: 13, marginLeft: '19%', borderRadius: 6.5, borderColor: '#557f89', borderWidth: 1 }} />
                        <View style={{ marginLeft: 12, borderWidth: 1, borderRadius: 3, borderColor: '#999999' }}>
                          <TextInput
                            maxLength={4}
                            style={styles.input}
                            underlineColorAndroid="transparent"
                            placeholder={'0000'}
                            textAlign={'center'}
                            textAlignVertical={'center'}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({ voucher1: text })}
                            onSubmitEditing={() => { this.input2.focus(); }}
                          />
                        </View>
                        <Text style={{ marginLeft: 2 }} > - </Text>
                        <View style={{ marginLeft: 2, borderWidth: 1, borderRadius: 3, borderColor: '#999999' }}>
                          <TextInput
                            maxLength={4}
                            ref={(input) => { this.input2 = input; }}
                            style={styles.input}
                            underlineColorAndroid="transparent"
                            placeholder={'0000'}
                            textAlign={'center'}
                            textAlignVertical={'center'}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({ voucher2: text })}
                            onSubmitEditing={() => { this.input3.focus(); }}
                          />
                        </View>
                        <Text style={{ marginLeft: 2 }} > - </Text>
                        <View style={{ marginLeft: 2, borderWidth: 1, borderRadius: 3, borderColor: '#999999' }}>
                          <TextInput
                            maxLength={4}
                            ref={(input) => { this.input3 = input; }}
                            style={styles.input}
                            underlineColorAndroid="transparent"
                            placeholder={'0000'}
                            textAlign={'center'}
                            textAlignVertical={'center'}
                            autoCapitalize="none"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({ voucher3: text })}
                            onSubmitEditing={() => { this.input4.focus(); }}
                          />
                        </View>
                        <Text style={{ marginLeft: 2 }} > - </Text>
                        <View style={{ marginLeft: 2, borderWidth: 1, borderRadius: 3, borderColor: '#999999', marginRight: '10%' }}>
                          <TextInput
                            maxLength={4}
                            ref={(input) => { this.input4 = input; }}
                            style={styles.input}
                            underlineColorAndroid="transparent"
                            placeholder={'0000'}
                            textAlign={'center'}
                            textAlignVertical={'center'}
                            autoCapitalize="none"
                            returnKeyType="done"
                            onChangeText={(text) => this.setState({ voucher4: text })}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (this.state.show1gbImg) {
                          // this.getAvailablePurchases(0);
                          this.requestPurchase(itemSkus[0]);
                        } else if (this.state.show600mgImg) {
                          // this.getAvailablePurchases(1);
                          this.requestPurchase(itemSkus[1]);
                        } else if (this.state.showCoupon) {
                          this.userVoucher()
                        }
                      }}>
                      <View style={{ marginTop: 19, width: '66%', justifyContent: 'center', height: SCREEN_HEIGHT * 0.048, alignSelf: 'center', backgroundColor: '#557f89', borderRadius: 20 }}>
                        <Text style={{ color: '#ffffff', fontSize: normalize(13), textAlign: 'center' }}>{Translate('fra_setting_buy')}</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={{ marginTop: 18, height: 1, backgroundColor: '#9b9b9b' }} />
                  </View>
                  : null
              }

              {/* sns 연결정보 - 출시된 앱에 맞춰 히든 처리 */}
              {/* <TouchableOpacity onPress={this.snsHideAndShow}>
              <View style={styles.elem}>
                <View style={styles.elemSetting}>
                  <View style={{ paddingLeft: 26 }} >
                    <Image source={require('../../images/icon_sns.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                  </View>
                  <Text style={styles.contentText}>{Translate('socialaccounts')}</Text>
                </View>
                <View style={{ padding: 25 }}>
                  <Image source={this.state.snsContent ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
            </TouchableOpacity> */}

              {
                this.state.snsContent ?
                  <View style={{ marginTop: 11 }}>
                    <Text style={{ marginLeft: 66, color: '#878787' }}>{Translate('fra_setting_experien')}</Text>
                    <View style={{ marginTop: 6, justifyContent: 'space-between', flexDirection: 'row', marginLeft: '16%', marginRight: '17%' }}>
                      <TouchableOpacity style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Image style={styles.SnsImage} source={require('../../images/insta_bg.png')} />
                        <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_insta')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Image style={styles.SnsImage} source={require('../../images/face_bg.png')} />
                        <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_facebook')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Image style={styles.SnsImage} source={require('../../images/naver_bg.png')} />
                        <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_naverblog')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Image style={styles.SnsImage} source={require('../../images/kakao_bg.png')} />
                        <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_kakao')}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ marginTop: 9, height: 1, backgroundColor: '#9b9b9b' }} />
                    {/* <LinearGradient colors={['#638d96', '#507781']} style={styles.ProgressGradient}></LinearGradient> */}
                  </View>
                  : null
              }

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Question');
                }}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_quest.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('contactus')}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('OpenLicense');
                }}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_opensource.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('opensource')}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              {/* 탈퇴 */}
              <TouchableOpacity
                onPress={() => {
                  this.setState({ isModalOpen: true })
                  // this.goAlert()
                }}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_secse.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('deleteaccount')}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  this.logout();
                }}>
                <View style={styles.elem}>
                  <View style={styles.elemSetting}>
                    <View style={{ paddingLeft: 26 }} >
                      <Image source={require('../../images/icon_out.png')} style={{ resizeMode: 'contain', width: 19, height: 23 }} />
                    </View>
                    <Text style={styles.contentText}>{Translate('logout')}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              </TouchableOpacity>

              <BannerAd
                unitId={unitId}
                size={BannerAdSize.SMART_BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                  console.log('Advert loaded');
                }}
                onAdFailedToLoad={(error) => {
                  console.error('Advert failed to load: ', error);
                }}
              />
              <View style={{ height: 1, backgroundColor: '#9b9b9b' }} />
              {/* 이용약관 */}
              <View
                style={{
                  marginTop: '5%',
                  flex: 1,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  bottom: 0
                }}>
                <View style={styles.companyInfoLineContainer}>
                  <Image
                    style={styles.logoImg}
                    source={require('../../images/ic_company_logo.png')} />
                  <Text style={styles.numberText}>{Translate('service_center')} 0502-777-7770</Text>
                </View>
                <View style={styles.companyInfoButtonContainer}>
                  <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('terms_and_conditions'), aId: 1 }) }}>
                      <Text style={styles.eventText}>{Translate('terms_and_conditions')} </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.eventText}>|</Text>
                  <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('private_infomation'), aId: 2 }) }}>
                      <Text style={styles.eventText}> {Translate('private_infomation')} </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.eventText}>|</Text>
                  <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('location_service'), aId: 3 }) }}>
                      <Text style={styles.eventText}> {Translate('location_service')} </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.eventText}>|</Text>
                  <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                    <TouchableOpacity
                      onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('business_infomation'), aId: 4 }) }}>
                      <Text style={styles.eventText}> {Translate('business_infomation')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.copyText}>Copyright (c) nomadnote. All rights reserved.</Text>
              </View>


            </ScrollView>
            <Modal
              disableOnBackPress={false}
              open={this.state.isModalOpen}
              modalDidOpen={() => console.log('modal did open')}
              modalDidClose={() => this.setState({ isModalOpen: false })}
              modalStyle={{
                borderRadius: 10,
                margin: 20,
                padding: 10,
                backgroundColor: "#F5F5F5",
              }}
              style={{ alignItems: 'center' }}>
              <View>
                <Text style={styles.contentText}>{Translate('member_delete') /*+ '  ' + Translate('member_delete_confrim')*/}</Text>
                <View style={styles.btnContainer}>
                  <TouchableOpacity
                    onPress={() => { this.setState({ isModalOpen: false }) }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }} >
                    <Text style={styles.noText}>{Translate('builderno')}</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: '100%', backgroundColor: '#aaaaaa', }} />
                  <TouchableOpacity
                    hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { this.setState({ isModalOpen: false, isLastOpen: true }) }}
                  >
                    <Text style={styles.yesText}>{Translate('builderyes')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal
              disableOnBackPress={false}
              open={this.state.isLastOpen}
              modalDidClose={() => this.setState({ isLastOpen: false })}
              modalStyle={{
                borderRadius: 10,
                margin: 20,
                padding: 10,
                backgroundColor: "#F5F5F5",
              }}
              style={{ alignItems: 'center' }}>
              <View>
                <Text style={styles.contentText}>{Translate('delete_question')/* + '  ' + Translate('member_delete')*/}</Text>
                <View style={styles.btnContainer}>
                  <TouchableOpacity
                    onPress={() => { this.setState({ isLastOpen: false }) }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }} >
                    <Text style={styles.noText}>{Translate('builderno2')}</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: '100%', backgroundColor: '#aaaaaa', }} />
                  <TouchableOpacity
                    hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { this.deleteMember() }}>
                    <Text style={styles.yesText}>{Translate('builderyes2')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* <Modal
              disableOnBackPress={false}
              open={this.state.isLastRealOpen}
              modalDidClose={() => this.setState({ isLastRealOpen: false })}
              modalStyle={{
                borderRadius: 10,
                margin: 20,
                padding: 10,
                backgroundColor: "#F5F5F5",
              }}
              style={{ alignItems: 'center' }}>
              <View>
                <Text style={styles.contentText}>{Translate('realWithdraw')}</Text>
                <View style={styles.btnContainer}>
                  <TouchableOpacity
                    onPress={() => { this.setState({ isLastRealOpen: false }) }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }} >
                    <Text style={styles.noText}>{Translate('builderno')}</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: '100%', backgroundColor: '#aaaaaa', }} />
                  <TouchableOpacity
                    hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { this.deleteMember() }}>
                    <Text style={styles.yesText}>{Translate('builderyes')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal> */}


          </View>
        </SafeAreaView>

      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  backImg: {
    width: '5.1%',
    resizeMode: 'contain',
    marginStart: '6.9%'
  },
  topSafeArea: {
    flex: 0,
    backgroundColor: THEME_COLOR
  },
  bottomSafeArea: {
    flex: 1,
    backgroundColor: THEME_COLOR
  },
  linearGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  textStyle: {
    fontSize: normalize(15),
    color: '#ffffff'
  },
  elem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50
  },
  elemSetting: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  elemSettingTravalStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    flex: 1,
    marginHorizontal: '10%'
  },
  contentText: {
    marginLeft: 16,
    marginTop: 10,
    fontSize: normalize(14),
    color: '#878787'
  },
  scrollContainer: {

  },
  progress: {
    height: 11,
    width: memory_width,
    alignSelf: 'center',
    marginTop: 4,
    borderRadius: 7.5,
    backgroundColor: '#d8d8d8'
  },
  progressInner: {
    height: 11,
    marginRight: 25,
    marginLeft: 23,
    marginTop: 4,
    borderRadius: 7.5,
    backgroundColor: '#638d96'
  },
  ProgressGradient: {
    height: 11,
    width: memory_width * 0.9,
    borderRadius: 7.5,
  },
  SnsImage: {
    height: 44,
    width: 44,
    marginRight: '7%'
  },
  input: {
    flex: 1,
    fontSize: normalize(11),
    color: '#999999',
    marginHorizontal: 4,
    marginVertical: Platform.OS === 'ios' ? 4 : 0,
    paddingVertical: 0,
    minWidth: 40,
    textAlign: 'left'
  },
  modal: {
    marginHorizontal: 20,
    borderRadius: 4,
    backgroundColor: 'white',
    shadowColor: '#000',
    marginBottom: '20%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 4,
  },
  btnContainer: {
    flexDirection: 'row',
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#aaaaaa',
    width: '100%',
  },
  yesText: {
    width: '100%',
    color: '#557f89',
    fontSize: normalize(12),
    marginVertical: 20,
    marginLeft: 20,
    marginRight: 30,
    textAlign: 'center',
    justifyContent: 'center'
  },
  noText: {
    width: '100%',
    color: '#000',
    fontSize: normalize(12),
    marginVertical: 20,
    marginHorizontal: 20,
    textAlign: 'center',
    justifyContent: 'center'
  },
  companyInfoLineContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  companyInfoButtonContainer: {
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 2
  },
  logoImg: {
    width: '20%',
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'flex-end',
    marginBottom: '2%'
  },
  numberText: {
    fontSize: normalize(9),
    fontWeight: '400',
    color: '#878787',
    alignSelf: 'flex-end',
    marginBottom: '1%',
    marginLeft: normalize(2)
  },
  eventText: {
    textAlign: 'center',
    flexDirection: 'column',
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: normalize(9),
    fontWeight: '400',
    color: '#878787',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },
  copyText: {
    fontSize: normalize(9),
    fontWeight: '300',
    marginBottom: '6%',
    color: '#878787'
  },

});