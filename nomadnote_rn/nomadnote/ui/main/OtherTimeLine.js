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
    Platform,
    PixelRatio,
    BackHandler,
    TouchableWithoutFeedback,
    TouchableOpacity,
    TextInput,
    ImageBackground,
    FlatList,
    ActivityIndicator,
    Keyboard,
    Alert
} from 'react-native';

import Toast from 'react-native-root-toast';
import axios from 'axios';
import AppStatusBar from '../../components/AppStatusBar';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import Moment from 'moment';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import Video from 'react-native-video';
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import CloseAppAdMob from '../../components/CloseAppAdMob';
import { WebView } from 'react-native-webview';
import { GEOCODING_API_KEY } from "@env"
import AgreeModal from '../../components/AgreeModal';
import { setDeviceLang } from '../../utils/Utils';
import FastImage from 'react-native-fast-image';
import { isIPhoneX } from 'react-native-status-bar-height';
import PopupAd from '../../components/PopupAd';
import {
    TestIds, InterstitialAd, AdEventType, BannerAd,
    BannerAdSize
} from '@react-native-firebase/admob';
import { decryption } from '../../utils/Decryption';

const THEME_COLOR = '#375a64'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

let selectIndex = 0;
let backHandlerClickCount = 0;

const scale = SCREEN_WIDTH / 320;

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

const unitId =
    Platform.OS === 'ios'
        ? 'ca-app-pub-5097070292431028/6211013887'
        : 'ca-app-pub-5097070292431028/1602847519'
// const interstitialAd = InterstitialAd.createForAdRequest(unitId);
const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);

export default class OtherTimeLine extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        if (Platform.OS === 'android') {
            AndroidKeyboardAdjust.setAdjustPan();
        }

        this.handleBackButton = this.handleBackButton.bind(this);

        this.state = {
            healing: false,
            hot: false,
            traditional_market: false,
            history: false,
            museum: false,
            art: false,
            page: 1,
            endPage: 0,
            timeList: [],
            isMoreTimeList: false,
            refresh: false,
            translationText: '',
            translatedText: '',
            userLang: '',
            tId: 0,
            cardList: [],
            isLoading: true,
            isFirstLoading: true,
            isClickScrap: false,
            isReLoading: false,
            isTrans: false,
            keyword: '',
            currentIndex: 0,
            scrollY: 0,
            isCloseApp: false,
            versionAgree: '',
            versionPersonInfo: '',
            versionLocationInfo: '',
            isModal: false,
            isCheckedAgreement: false,
            isCheckedPersonalInfo: false,
            isCheckedLocationInfo: false,
            isCheckedTotal: false,
            isFirstAgree: true,
            styleId: 0,
            lang: setDeviceLang(),
            friendsInfo: [],
            translationPlaceText: '',
            translatedPlaceText: '',
            isScrollTop: false,
            isFirstBanner: true,
            validCloseWindow: false,
            isMoveScreen: false,
            isPopupModal: false,
            popupList: [],
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        this.willFocusSubscription = this.props.navigation.addListener(
            'willFocus',
            async () => {
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

                let strWrite = await getItemFromAsync('write');
                let page = 0
                const auto = await getItemFromAsync('auto_login');
                console.log('auto login main: ', auto)

                if (this.state.isFirstBanner) {
                    this.getPopupAd();
                }

                if (this.state.page > 1) {
                    if (strWrite === 'registration') {
                        page = 1
                    } else {
                        page = this.state.page
                    }
                } else {
                    page = 1
                }

                this.setState({ isLoading: true, page: page, isScrollTop: false }, () => {
                    if (strWrite === 'registration' || strWrite === 'modi' || strWrite === 'remove') {
                        this.setState({
                            healing: false,
                            hot: false,
                            traditional_market: false,
                            history: false,
                            museum: false,
                            art: false,
                            styleId: 0,
                        })
                        this.getOtherTimeLine()
                    } else {
                        if (this.state.healing) {
                            this.getOtherTimeLine(1)
                        } else if (this.state.hot) {
                            this.getOtherTimeLine(2)
                        } else if (this.state.traditional_market) {
                            this.getOtherTimeLine(3)
                        } else if (this.state.history) {
                            this.getOtherTimeLine(4)
                        } else if (this.state.museum) {
                            this.getOtherTimeLine(5)
                        } else if (this.state.art) {
                            this.getOtherTimeLine(6)
                        } else {
                            this.getOtherTimeLine()
                        }
                    }
                    this.getMyInfo();
                    this.getRequestFriends()
                })
            }
        );
    }

    handleBackButton = () => {
        let index = this.props.navigation.dangerouslyGetParent().state.index;
        console.log('navigation: ', this.props.navigation.isFocused())
        if (this.props.navigation.isFocused()) {
            console.log('other focus')
            this.props.navigation.navigate('CloseBn')
            // this.showAd();
            return true
            // if (this.state.isMoveScreen) {
            //     console.log('moved')
            //     this.setState({ isMoveScreen: false })
            //     return true
            // } else {
            //     console.log('not moved')
            //     if (index > 0) {
            //         // if (this.state.validCloseWindow)
            //         //     return false;
            //         // this.state.validCloseWindow = true
            //         // setTimeout(() => {
            //         //     this.state.validCloseWindow = false
            //         // }, 3000);
            //         // Toast.show(`${Translate('back_message')}`, Toast.SHORT);
            //         // return true;
            //         this.props.navigation.navigate('CloseBn')
            //         return true
            //     }
            // }
        }
    };

    showAd() {
        if (interstitialAd.loaded) {
            interstitialAd.show().catch(error => console.warn(error));
        }
    }

    async getPopupAd() {
        let url = global.server + '/api/popup'
        const today = await getItemFromAsync('today');
        const startTime = new Date(today);
        const currentTime = new Date();
        let isAdOpen = true
        const oneDay = 60 * 60 * 24 * 1000

        console.log('time: ', currentTime - startTime, oneDay, (currentTime - startTime) / oneDay)
        if (today === '' || today === null) {
            isAdOpen = true
        } else {
            if (oneDay <= (currentTime - startTime)) {
                isAdOpen = true
            } else {
                isAdOpen = false
            }
        }

        axios.get(url)
            .then(function (response) {
                console.log('popup Ad: ', response.data)
                if (response.data.result === 'ok') {
                    if (response.data.data.length > 0) {
                        // this.props.navigation.navigate('PopupBn', {
                        //     banner: response.data.data
                        // });
                        this.setState({ popupList: response.data.data, isFirstBanner: false }, () => {
                            if (isAdOpen) {
                                this.togglePopupModal();
                            }
                        })
                    }
                }
            }.bind(this))
            .catch(function (error) {
                console.log('popup error')
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
            });
    }

    agreeVersionCheck() {
        var self = this

        let url = global.server + `/api/agrees`
        axios.get(url)
            .then(function (response) {
                if (response.data.result === 'ok') {
                    // console.log('version: ', response.data)
                    var versionInfo = response.data
                    this.setState({
                        versionAgree: versionInfo.data[0].version,
                        versionPersonInfo: versionInfo.data[1].version,
                        versionLocationInfo: versionInfo.data[2].version,
                        isFirstAgree: false
                    })

                    if (versionInfo.data[0].version !== global.user.agree1_version || versionInfo.data[1].version !== global.user.agree2_version || versionInfo.data[2].version !== global.user.agree3_version) {
                        this.setState({ isModal: true })
                        global.isAgree = false;
                    } else {
                        global.isAgree = true;
                    }
                    console.log('version', versionInfo.data[2].version, global.user.agree3_version)
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

    requestAlert = () =>
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
        );

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

    setAgree() {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 1);
        bodyFormData.append('version', this.state.versionAgree);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    setItemToAsync('isCheckedAgreement', false)
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

    setPersonalInfo() {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 2);
        bodyFormData.append('version', this.state.versionPersonInfo);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    setItemToAsync('isCheckedPersonalInfo', false)
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

    setLocationInfo() {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 3);
        bodyFormData.append('version', this.state.versionLocationInfo);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    setItemToAsync('isCheckedLocationInfo', false)
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

    toggleSettingModal() {
        this.setState({
            isModal: !this.state.isModal,
        })
    }

    togglePopupModal() {
        this.setState({
            isPopupModal: !this.state.isPopupModal,
        })
    }

    setChecked() {
        if (!this.state.isCheckedAgreement) {
            Toast.show(`${Translate('message_areement')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('message_areement')}`);
            return
        } else if (!this.state.isCheckedPersonalInfo) {
            Toast.show(`${Translate('message_personal_info')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('message_personal_info')}`);
            return
        } else if (!this.state.isCheckedLocationInfo) {
            Toast.show(`${Translate('message_location_info')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('message_location_info')}`);
            return
        } else {
            this.toggleSettingModal();
            this.setAgree();
            this.setPersonalInfo();
            this.setLocationInfo();
            global.isAgree = true;
        }
    }

    checkAgreement() {
        this.setState({ isCheckedAgreement: !this.state.isCheckedAgreement })
    }

    checkPersonalInfo() {
        this.setState({ isCheckedPersonalInfo: !this.state.isCheckedPersonalInfo })
    }

    checkLocationInfo() {
        this.setState({ isCheckedLocationInfo: !this.state.isCheckedLocationInfo })
    }

    checkTotAgreement() {
        this.setState({
            isCheckedTotal: !this.state.isCheckedTotal
        }, () => {
            this.setState({
                isCheckedAgreement: this.state.isCheckedTotal,
                isCheckedPersonalInfo: this.state.isCheckedTotal,
                isCheckedLocationInfo: this.state.isCheckedTotal
            })
        })
    }

    openAgreementView() {
        this.props.navigation.navigate('AgreeInfo', { title: Translate('terms_and_conditions'), aId: 1 })
    }

    openPersonalInfoView() {
        this.props.navigation.navigate('AgreeInfo', { title: Translate('private_infomation'), aId: 2 })
    }

    openLocationInfoView() {
        this.props.navigation.navigate('AgreeInfo', { title: Translate('location_service'), aId: 3 })
    }

    goToWrite() {
        this.props.navigation.navigate('Write', {
            qnaId: global.qId,
            modiImages: [],
            modiData: [],
            isModi: false
        })
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        this.willFocusSubscription.remove();
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };




    // test(item) {
    //     let itemList = [...this.state.timeList]

    //     this.setState({ tId: item.id }, () => {
    //         if (global.lang == item.language) {
    //             for (var i = 0; i < itemList.length; i++) {
    //                 if (itemList[i].id === item.id) {
    //                     itemList[i].trans = item.contents
    //                 }
    //             }
    //             this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false })
    //         } else {
    //             this.translate('key', '&q=' + encodeURI(item.contents), item.language)
    //         }

    //     })
    // }

    translate = (key, stringToTranslate, stringToTransPlace, fromLang, fromLangPlace) => {
        const self = this
        if (global.lang === 'zh_rCN') {
            this.userLanguage = 'zh'
        } else if (global.lang == 'zh_rTW') {
            this.userLanguage = 'zh-TW'
        } else if (global.lang == 'zh-Hant-MO') {
            this.userLanguage = 'zh-TW'
        } else {
            this.userLanguage = global.lang
        }
        console.log('check userlang = ', global.lang)
        this.API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`;
        this.URL += `&source=${fromLang}`;
        this.URL += `&target=${this.userLanguage}`

        const placeUrl = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}&source=${fromLangPlace}&target=${this.userLanguage}`;

        let itemList = [...this.state.timeList]
        axios.all([axios.post(placeUrl + stringToTransPlace), axios.post(this.URL + stringToTranslate)])
            .then(axios.spread((firstResponse, secondResponse) => {
                let placeText = firstResponse.data.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                let contentText = secondResponse.data.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                for (var i = 0; i < itemList.length; i++) {
                    if (itemList[i].id === this.state.tId) {
                        itemList[i].trans = `${placeText}\n\n${contentText}`
                    }
                }
                console.log('check', placeText, contentText)

                this.setState({ translatedText: contentText, cardList: itemList, isTrans: false })
            }).bind(this))
            .catch(function (error) {
                self.setState({ isTrans: false });
                console.log("There was an error: ", error);
            });
    }

    translateText = (key, string_to_translate, notTranslateText, fromLang) => {
        if (global.lang === 'zh_rCN') {
            this.userLanguage = 'zh'
        } else if (global.lang == 'zh_rTW') {
            this.userLanguage = 'zh-TW'
        } else if (global.lang == 'zh-Hant-MO') {
            this.userLanguage = 'zh-TW'
        } else {
            this.userLanguage = global.lang
        }
        console.log('check userlang = ', global.lang)
        this.API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`;
        this.URL += `&source=${fromLang}`;
        this.URL += `&target=${this.userLanguage}`
        let itemList = [...this.state.timeList]
        fetch(this.URL + string_to_translate)
            .then(res => res.json())
            .then(
                (res) => {
                    let text = res.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                    console.log('check Data', text)
                    if (key === 'content') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].id === this.state.tId) {
                                itemList[i].trans = `${notTranslateText}\n\n${text}`
                            }
                        }
                        this.setState({ translatedText: text, cardList: itemList, isTrans: false })
                    } else {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].id === this.state.tId) {
                                itemList[i].trans = `${text}\n\n${notTranslateText}`
                            }
                        }
                        this.setState({ translatedText: text, cardList: itemList, isTrans: false })
                    }
                }
            ).catch(
                (error) => {
                    this.setState({ isTrans: false })
                    console.log("There was an error: ", error);
                }
            )
    }

    checkLanguage(item) {
        let reg = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        if ((reg.test(item.contents) === true || reg.test(item.place_name) === true) && (this.state.lang === 'ko')) {
            Toast.show(`${Translate('cant_korean_translate')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('cant_korean_translate')}`)
        }

        let API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}`;
        this.URL += `&q=${item.contents}`;
        // const contentUrl = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}&q=${item.contents}`;
        const placeUrl = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}&q=${item.place_name}`;

        console.log('url: ', this.URL, placeUrl)

        axios.all([axios.post(placeUrl), axios.post(this.URL)])
            .then(axios.spread((firstResponse, secondResponse) => {
                let placeData = firstResponse.data.data.detections[0]
                let placeCheckLang = placeData[0].language

                let contentData = secondResponse.data.data.detections[0]
                let contentCheckLang = contentData[0].language
                console.log('content checkLang =', contentCheckLang, placeCheckLang)

                let itemList = [...this.state.timeList]

                this.setState({ tId: item.id }, () => {
                    console.log('this setState')
                    if (placeCheckLang === 'und' && contentCheckLang === 'und') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].id === item.id) {
                                itemList[i].trans = ''
                            }
                        }
                        this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false, translationPlaceText: item.place_name })
                    } else if (placeCheckLang === 'und') {
                        if (global.lang === contentCheckLang) {
                            for (var i = 0; i < itemList.length; i++) {
                                if (itemList[i].id === item.id) {
                                    itemList[i].trans = ''
                                }
                            }
                            this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false, translationPlaceText: item.place_name })
                        } else {
                            this.translateText('content', '&q=' + encodeURI(item.contents), item.place_name, contentCheckLang)
                        }
                    } else if (contentCheckLang === 'und') {
                        if (global.lang === placeCheckLang) {
                            for (var i = 0; i < itemList.length; i++) {
                                if (itemList[i].id === item.id) {
                                    itemList[i].trans = ''
                                }
                            }
                            this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false, translationPlaceText: item.place_name })
                        } else {
                            this.translateText('place', `&q=${item.place_name}`, item.contents, placeCheckLang)
                        }
                    } else if (global.lang === placeCheckLang && global.lang === contentCheckLang) {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].id === item.id) {
                                itemList[i].trans = ''
                            }
                        }
                        this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false, translationPlaceText: item.place_name })
                    } else if (global.lang === placeCheckLang) {
                        this.translateText('content', '&q=' + encodeURI(item.contents), item.place_name, contentCheckLang)
                    } else if (global.lang === contentCheckLang) {
                        this.translateText('place', `&q=${item.place_name}`, item.contents, placeCheckLang)
                    } else {
                        this.translate('key', '&q=' + encodeURI(item.contents), `&q=${item.place_name}`, contentCheckLang, placeCheckLang)
                    }
                })
            }).bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
            });
    }



    async getOtherTimeLine(id) {
        console.log('here come')
        let strWrite = await getItemFromAsync('write');
        let modiId = await getItemFromAsync('modi_id');
        let removeId = await getItemFromAsync('remove_id');
        let isScrap = await getItemFromAsync('scrap_click');
        let scrapId = await getItemFromAsync('scrap_id');

        if (this.state.isFirstLoading || this.state.isMoreTimeList) {

        } else if (isScrap === 'scrap' || isScrap === 'visited' || isScrap === 'map' || isScrap === 'unconfirm') {
            this.setState({ page: 1 })
        }

        let url = global.server + '/api/timeline/my_timeline'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 'all')
        bodyFormData.append('keyword', this.state.keyword)
        if (this.state.styleId === 0) {
            bodyFormData.append('style_id', '')
        } else {
            bodyFormData.append('style_id', this.state.styleId)
        }
        bodyFormData.append('page', this.state.page);


        console.log('otherBodyForm', bodyFormData)
        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn1", response.data.timeline.data);
                let itemList = [...this.state.timeList]
                if (this.state.isClickScrap) {
                    if (itemList.length > 0) {
                        for (var i = 0; i < itemList.length; i++) {
                            // itemList.push({})
                            if (scrapId === itemList[i].id) {
                                itemList[i].scrap = (itemList[i].scrap == 1) ? 2 : 1
                            }
                        }
                        setItemToAsync('scrap_id', '')
                    } else {
                        response.data.timeline.data.forEach(item => {
                            itemList.push({
                                trans: '',
                                ...item
                            })
                        });
                    }
                } else {
                    if (strWrite === 'registration') {
                        itemList = []
                        response.data.timeline.data.forEach(item => {
                            itemList.push({
                                trans: '',
                                ...item
                            })
                        });
                        this.refs._scrollView.scrollTo(0);
                        setItemToAsync('write', '')
                    } else if (strWrite === 'modi') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].id === modiId) {
                                itemList[i] = global.detailTimeline
                                itemList[i] = { trans: '', ...itemList[i] }
                            }
                        }
                        console.log('modi: ', itemList)
                        setItemToAsync('write', '')
                    } else if (strWrite === 'remove') {
                        itemList = itemList.filter((item) => removeId !== item.id)
                        setItemToAsync('write', '')
                    } else {
                        if (this.state.isFirstLoading || this.state.isMoreTimeList) {
                            response.data.timeline.data.forEach(item => {
                                itemList.push({
                                    trans: '',
                                    ...item
                                })
                            });
                        } else {
                            if (isScrap === 'scrap') {
                                itemList = []
                                response.data.timeline.data.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'confirm')
                            } else if (isScrap === 'visited' || isScrap === 'map') {
                                itemList = []
                                response.data.timeline.data.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'unconfirm')
                            } else if (isScrap === 'unconfirm') {
                                itemList = []
                                response.data.timeline.data.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'confirm')
                            } else {
                                if (this.state.page === 1) {
                                    itemList = []
                                    response.data.timeline.data.forEach(item => {
                                        itemList.push({
                                            trans: '',
                                            ...item
                                        })
                                    });
                                }
                            }
                        }
                        setItemToAsync('write', '')
                    }
                }

                if (this.state.isScrollTop) {
                    this.refs._scrollView.scrollTo(0);
                }

                // console.log('itemList lenght: ', itemList.length, this.state.page)
                // console.log('lastpage', response.data.timeline)


                this.setState({
                    timeList: itemList,
                    endPage: response.data.timeline.last_page,
                    isLoading: false,
                    isFirstLoading: false,
                    isClickScrap: false,
                    isMoreTimeList: false,
                    isReLoading: false,
                })
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('error', error.response.data)
                    // Toast.show(error.response.data.message);
                }
                else {
                    console.log(error)
                }
                setItemToAsync('write', '')
                self.setState({ isLoading: false });
            });
    }

    getMyInfo() {
        let url = global.server + '/api/member/my_info'
        var self = this

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                if (response.data.result === 'ok') {
                    global.disk = response.data.disk
                    global.useByte = response.data.usebytes
                    const member = response.data.member;
                    if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                        global.user = { ...member, "phone": '', "email": '' };
                    } else if (member.phone === null || member.phone === '') {
                        global.user = { ...member, "phone": '', "email": decryption(member.email) };
                    } else if (member.email === null || member.email === '') {
                        global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                    } else {
                        global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                    }

                    if (this.state.isFirstAgree) {
                        this.agreeVersionCheck();
                    }

                    console.log('userInfo: ', response.data)
                }
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

    setScrap = async (id) => {
        // const arrScrapId = await getItemFromAsync('other_scrap_id');
        // let scrapedId = []
        // if (arrScrapId === '' || arrScrapId === undefined || arrScrapId === null) {
        //     arrScrapId = ''
        // } else {
        //     scrapedId = arrScrapId.split(" ")
        // }

        let url = global.server + '/api/timeline/set_scrap'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('timeline_id', id)
        console.log('check bodyForm=', bodyFormData)
        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                // let scrapId

                // if (arrScrapId === '' || arrScrapId === null) {
                //     scrapId = `${id}`
                // } else {
                //     scrapedId.map((item) => {
                //         console.log('scrapId item: ', item, id)
                //         if (id !== item) {
                //             scrapId = `${arrScrapId} ${id}`
                //         }
                //     })
                // }
                global.isClickOtherScrap = true
                setItemToAsync('scrap_click', 'other')
                setItemToAsync('scrap_id', id)
                // setItemToAsync('other_scrap_id', scrapId)
                this.updateScrap();
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    // Toast.show(error.response.data.message);
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    updateScrap() {
        // this.setState({ page: 1 }, () => {
        //     console.log(this.state.page);
        // });
        this.setState({ isLoading: true, isClickScrap: true, isMoreTimeList: false, isScrollTop: false }, () => {
            if (this.state.healing) {
                this.getOtherTimeLine(1)
            } else if (this.state.hot) {
                this.getOtherTimeLine(2)
            } else if (this.state.traditional_market) {
                this.getOtherTimeLine(3)
            } else if (this.state.history) {
                this.getOtherTimeLine(4)
            } else if (this.state.museum) {
                this.getOtherTimeLine(5)
            } else if (this.state.art) {
                this.getOtherTimeLine(6)
            } else {
                this.getOtherTimeLine()
            }
        });
    }

    updatePage() {
        this.setState({ page: this.state.page + 1, isLoading: true, isMoreTimeList: true, isReLoading: true, isScrollTop: false }, () => {
            console.log(this.state.page);
            if (this.state.healing) {
                this.getOtherTimeLine(1)
            } else if (this.state.hot) {
                this.getOtherTimeLine(2)
            } else if (this.state.traditional_market) {
                this.getOtherTimeLine(3)
            } else if (this.state.history) {
                this.getOtherTimeLine(4)
            } else if (this.state.museum) {
                this.getOtherTimeLine(5)
            } else if (this.state.art) {
                this.getOtherTimeLine(6)
            } else {
                this.getOtherTimeLine()
            }
        });
    }

    onScroll = ({ layoutMeasurement, contentOffset, contentSize }) => {
        let itemSize = layoutMeasurement.height;
        let scrollY = contentOffset.y
        let totSize = contentSize.height
        let currentIndex = (scrollY / (SCREEN_WIDTH * 0.7))

        // console.log('currentIndex: ', parseInt(currentIndex))

        this.setState({ currentIndex: parseInt(currentIndex), scrollY: scrollY })

        return itemSize + scrollY >= totSize - 30;
    }

    setPause(index) {
        if (index < this.state.currentIndex || index > this.state.currentIndex + 1) {
            return true
        } else {
            return false
        }
    }

    getYoutubeId(url) {
        console.log('youtube url: ', url)
        const videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
        if (videoid != null) {
            // console.log("video id = ", videoid[1]);
        } else {
            console.log("The youtube url is not valid.");
        }
        return videoid[1]
    }

    render() {
        const { navigation } = this.props;
        const { isLoading, isCloseApp, isModal, isPopupModal } = this.state;

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <TouchableWithoutFeedback
                        onPress={() => {
                            Keyboard.dismiss();
                        }}>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <ImageBackground
                                    style={styles.headerImg}
                                    source={require('../../images/solotime_top.png')}>
                                    <View style={styles.imgContainer}>
                                        <Image
                                            style={styles.logoImg}
                                            source={require('../../images/login_white_logo.png')} />
                                        <View style={styles.buttonContainer}>
                                            <View style={styles.welcomeContainer}>
                                                <View style={styles.welcomeRowContainer}>
                                                    <Text
                                                        style={styles.welcome1Text}>{Translate('timeTop')}</Text>
                                                    {/* <Text style={styles.welcome2Text}>{Translate('nomadnote')}</Text> */}
                                                </View>
                                                {/* <Text
                                                adjusts Font SizeToFit
                                                style={styles.welcome3Text}>{Translate('welcome2')}</Text> */}
                                            </View>
                                            {/* <View style={{ width: '20%' }} /> */}
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ isMoveScreen: true }, () => {
                                                        navigation.navigate('Write', {
                                                            qnaId: '',
                                                            modiImages: [],
                                                            modiData: [],
                                                            isModi: false
                                                        })
                                                    })
                                                }}>
                                                <View style={styles.writeContainer}>
                                                    <Text adjustsFontSizeToFit style={styles.writeText}>{Translate('fragment_solo_addnote')}</Text>
                                                    <Image
                                                        source={require('../../images/paper_air.png')}
                                                        style={styles.writeImg}
                                                        resizeMode={'contain'} />
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                        <View style={styles.searchContainer}>
                                            <TextInput
                                                style={styles.input}
                                                underlineColorAndroid="transparent"
                                                placeholder={Translate('scrapKeyword')}
                                                placeholderTextColor="rgba(255,255,255,0.5)"
                                                textAlign={'center'}
                                                textAlignVertical={'center'}
                                                autoCapitalize="none"
                                                onChangeText={(text) => this.setState({ keyword: text })}
                                                onSubmitEditing={() => {
                                                    this.setState({ isScrollTop: true, isLoading: true }, () => {
                                                        this.getOtherTimeLine();
                                                    })
                                                }}
                                                returnKeyType="done" />
                                            <TouchableWithoutFeedback
                                                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                                onPress={() => {
                                                    this.setState({ isScrollTop: true, isLoading: true }, () => {
                                                        this.getOtherTimeLine();
                                                    })
                                                }}>
                                                <Image
                                                    style={styles.searchImg}
                                                    source={require('../../images/search_op.png')} />
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>
                                </ImageBackground>
                            </View>
                            <View style={styles.typeButtonContainer}>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.setState({
                                            healing: !this.state.healing,
                                            isScrollTop: true
                                        }, () => {
                                            if (this.state.healing) {
                                                this.setState({
                                                    hot: false,
                                                    traditional_market: false,
                                                    history: false,
                                                    museum: false,
                                                    art: false,
                                                    isLoading: true,
                                                    styleId: 1,
                                                    page: 1,
                                                })
                                                this.getOtherTimeLine(1)
                                            } else {
                                                this.setState({
                                                    isLoading: true,
                                                    styleId: 0,
                                                    page: 1,
                                                }, () => this.getOtherTimeLine())
                                            }
                                        })
                                    }}>
                                    <View style={this.state.healing ? styles.selectedView : styles.typeView}>
                                        <Text adjustsFontSizeToFit style={this.state.healing ? styles.selectedTypeButton : styles.typeButton}>{Translate('activity_write_healing')}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.setState({
                                            hot: !this.state.hot,
                                            isScrollTop: true
                                        }, () => {
                                            if (this.state.hot) {
                                                this.setState({
                                                    healing: false,
                                                    traditional_market: false,
                                                    history: false,
                                                    museum: false,
                                                    art: false,
                                                    page: 1,
                                                    styleId: 2,
                                                    isLoading: true
                                                })
                                                this.getOtherTimeLine(2)
                                            } else {
                                                this.setState({
                                                    isLoading: true,
                                                    styleId: 0,
                                                    page: 1,
                                                }, () => this.getOtherTimeLine())
                                            }
                                        })
                                    }}>
                                    <View style={this.state.hot ? styles.selectedMarginView : styles.typeMarginView}>
                                        <Text adjustsFontSizeToFit
                                            style={this.state.hot ? styles.selectedTypeButton : styles.typeButton}>{Translate('activity_write_hotplace')}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.setState({
                                            traditional_market: !this.state.traditional_market,
                                            isScrollTop: true
                                        }, () => {
                                            if (this.state.traditional_market) {
                                                this.setState({
                                                    healing: false,
                                                    hot: false,
                                                    history: false,
                                                    museum: false,
                                                    art: false,
                                                    page: 1,
                                                    isLoading: true,
                                                    styleId: 3
                                                })
                                                this.getOtherTimeLine(3)
                                            } else {
                                                this.setState({
                                                    isLoading: true,
                                                    styleId: 0,
                                                    page: 1,
                                                }, () => this.getOtherTimeLine())
                                            }
                                        })
                                    }}>
                                    <View style={this.state.traditional_market ? styles.selectedMarginView : styles.typeMarginView}>
                                        <Text adjustsFontSizeToFit
                                            style={this.state.traditional_market ? {
                                                color: '#fff',
                                                fontSize: this.state.lang === 'en' ? normalize(8) : Platform.OS === 'ios' ? normalize(9) : normalize(10),
                                                textAlign: 'center',
                                                textAlignVertical: 'center',
                                            } : {
                                                color: '#878787',
                                                fontSize: this.state.lang === 'en' ? normalize(8) : Platform.OS === 'ios' ? normalize(9) : normalize(10),
                                                textAlign: 'center',
                                                textAlignVertical: 'center',
                                            }}>{Translate('traditional_market')}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.setState({
                                            history: !this.state.history,
                                            isScrollTop: true
                                        }, () => {
                                            if (this.state.history) {
                                                this.setState({
                                                    healing: false,
                                                    hot: false,
                                                    traditional_market: false,
                                                    museum: false,
                                                    art: false,
                                                    page: 1,
                                                    isLoading: true,
                                                    styleId: 4
                                                })
                                                this.getOtherTimeLine(4)
                                            } else {
                                                this.setState({
                                                    isLoading: true,
                                                    styleId: 0,
                                                    page: 1,
                                                }, () => this.getOtherTimeLine())
                                            }
                                        })
                                    }}>
                                    <View style={this.state.history ? styles.selectedMarginView : styles.typeMarginView}>
                                        <Text adjustsFontSizeToFit
                                            style={this.state.history ? styles.selectedTypeButton : styles.typeButton}>{Translate('historicalstyle')}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.setState({
                                            museum: !this.state.museum,
                                            isScrollTop: true
                                        }, () => {
                                            if (this.state.museum) {
                                                this.setState({
                                                    healing: false,
                                                    hot: false,
                                                    traditional_market: false,
                                                    history: false,
                                                    art: false,
                                                    page: 1,
                                                    isLoading: true,
                                                    styleId: 5
                                                })
                                                this.getOtherTimeLine(5)
                                            } else {
                                                this.setState({
                                                    isLoading: true,
                                                    styleId: 0,
                                                    page: 1,
                                                }, () => this.getOtherTimeLine())
                                            }
                                        })
                                    }}>
                                    <View style={this.state.museum ? styles.selectedMarginView : styles.typeMarginView}>
                                        <Text adjustsFontSizeToFit
                                            style={this.state.museum ? styles.selectedTypeButton : styles.typeButton}>{Translate('museumstyle')}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                                <TouchableWithoutFeedback
                                    onPress={() => {
                                        this.setState({
                                            art: !this.state.art,
                                            isScrollTop: true
                                        }, () => {
                                            if (this.state.art) {
                                                this.setState({
                                                    healing: false,
                                                    hot: false,
                                                    traditional_market: false,
                                                    history: false,
                                                    museum: false,
                                                    page: 1,
                                                    isLoading: true,
                                                    styleId: 6
                                                })
                                                this.getOtherTimeLine(6)
                                            } else {
                                                this.setState({
                                                    isLoading: true,
                                                    styleId: 0,
                                                    page: 1,
                                                }, () => this.getOtherTimeLine())
                                            }
                                        })
                                    }}>
                                    <View style={this.state.art ? styles.selectedMarginView : styles.typeMarginView}>
                                        <Text adjustsFontSizeToFit
                                            style={this.state.art ? {
                                                color: '#fff',
                                                fontSize: this.state.lang === 'en' ? normalize(8) : normalize(9),
                                                textAlign: 'center',
                                                textAlignVertical: 'center',
                                                justifyContent: 'center',
                                                alignSelf: 'center'
                                            } : {
                                                color: '#878787',
                                                fontSize: this.state.lang === 'en' ? normalize(8) : normalize(9),
                                                textAlign: 'center',
                                                textAlignVertical: 'center',
                                                justifyContent: 'center',
                                                alignSelf: 'center'
                                            }}>{Translate('artmuseumstyle')}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                            <View style={styles.contentContainer}>
                                <ScrollView
                                    onScroll={({ nativeEvent }) => {
                                        if (this.onScroll(nativeEvent)) {
                                            //do something
                                            // console.log('lastPage', this.state.endPage)
                                            // console.log('currentPage', this.state.page)
                                            if (this.state.page < this.state.endPage) {
                                                if (!this.state.isReLoading) {
                                                    this.updatePage();
                                                }
                                            }
                                        }
                                    }}
                                    style={{ display: 'flex' }}
                                    horizontal={false}
                                    showsVerticalScrollIndicator={false}
                                    scrollEventThrottle={1}
                                    ref='_scrollView'>
                                    <View style={styles.scrollContainer}>
                                        <FlatList
                                            style={{ flex: 1 }}
                                            data={this.state.timeList}
                                            extraData={this.state.cardList}
                                            ref={ref => (this.flatList = ref)}
                                            renderItem={({ item, index }) => (
                                                <TouchableWithoutFeedback
                                                    onPress={() => {
                                                        this.setState({ isMoveScreen: true }, () => {
                                                            this.props.navigation.navigate('CardDetail', { id: item.id });
                                                        })
                                                    }}>
                                                    <View style={styles.cardContainer}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', top: 0, left: 0, }}>
                                                            <View style={{ marginLeft: SCREEN_WIDTH * 0.0417, marginTop: SCREEN_WIDTH * 0.667 * 0.089, marginRight: (SCREEN_WIDTH * 0.3194) + (SCREEN_WIDTH * 0.0333) + 8 }}>
                                                                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', marginBottom: SCREEN_WIDTH * 0.01389 }}>
                                                                    <Image
                                                                        style={{ width: SCREEN_WIDTH * 0.0847, height: SCREEN_WIDTH * 0.0847, resizeMode: 'cover', borderRadius: (SCREEN_WIDTH * 0.0847) / 2 }}
                                                                        source={item.member.profile == null ? item.member.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + item.member.profile }} />
                                                                    <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 5, alignSelf: 'center' }}>{item.member.name}</Text>
                                                                    <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 1, alignSelf: 'center' }}>{(item.member.join_type === 7 || item.member.join_type === 6) ? '' : item.member.age === null ? '' : ' / '}</Text>
                                                                    <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 1, alignSelf: 'center' }}>{(item.member.join_type === 7 || item.member.join_type === 6) ? '' : item.member.age === null ? '' : item.member.age}</Text>
                                                                    {
                                                                        this.state.lang === 'en' && <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 1, alignSelf: 'center' }}>{' '}</Text>
                                                                    }
                                                                    <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', alignSelf: 'center' }}>{(item.member.join_type === 7 || item.member.join_type === 6) ? '' : item.member.age === null ? '' : Translate('age')}</Text>
                                                                </View>
                                                                <View style={{ alignItems: 'flex-start', marginTop: SCREEN_WIDTH * 0.667 * 0.0365 }}>
                                                                    <Text style={{ color: '#878787', fontSize: normalize(11), fontWeight: '400', marginBottom: 2 }}>
                                                                        {item.place_name + ', ' + item.cost_str}
                                                                    </Text>
                                                                    {
                                                                        global.lang === 'ko' ?
                                                                            <Text style={{ color: '#878787', fontSize: normalize(11), fontWeight: '400' }}>
                                                                                {Moment(item.created_at).format('YYYY.MM.DD A hh:mm')}
                                                                            </Text>
                                                                            :
                                                                            <Text style={{ color: '#878787', fontSize: normalize(11), fontWeight: '400' }}>
                                                                                {Moment(item.created_at).format('YYYY.MM.DD hh:mm A')}
                                                                            </Text>
                                                                    }
                                                                </View>
                                                            </View>
                                                            <View style={{ borderRadius: 6, backgroundColor: '#d8d8d8', width: SCREEN_WIDTH * 0.3194, height: SCREEN_WIDTH * 0.667 * 0.3348, marginRight: SCREEN_WIDTH * 0.0333, position: 'absolute', right: 0, top: 0, marginTop: SCREEN_WIDTH * 0.0333, alignSelf: 'flex-end', overflow: 'hidden' }}>
                                                                {
                                                                    item.images.length > 0 && item.images[0].image_uri === null ?
                                                                        <Video
                                                                            source={{ uri: global.server + item.images[0].video_path }}
                                                                            ref={(ref) => {
                                                                                this.player = ref
                                                                            }}
                                                                            muted={true}
                                                                            volume={0.0}
                                                                            onBuffer={this.onBuffer}
                                                                            resizeMode='stretch'
                                                                            repeat={true}
                                                                            paused={this.setPause(index)}
                                                                            onError={this.videoError}
                                                                            style={{ width: '100%', height: '100%', borderRadius: 6, }} />
                                                                        : item.youtube === null ?
                                                                            <FastImage
                                                                                style={{ width: '100%', height: '100%', borderRadius: 6, }}
                                                                                source={item.images.length > 0 ? { uri: global.server + item.images[0].image_uri } : require('../../images/time_bg.png')}
                                                                            />
                                                                            : <View style={{ width: '100%', height: '100%', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }}>
                                                                                <Image
                                                                                    style={{ width: '100%', height: '100%', position: 'absolute', resizeMode: 'cover' }}
                                                                                    source={{ uri: `http://i.ytimg.com/vi/${this.getYoutubeId(item.youtube)}/0.jpg` }}
                                                                                />
                                                                                <Image
                                                                                    style={{ width: '30%', height: '30%', resizeMode: 'contain' }}
                                                                                    source={require('../../images/ic_youtube.png')}
                                                                                />
                                                                            </View>
                                                                }
                                                            </View>
                                                        </View>
                                                        <Text
                                                            style={{ fontSize: normalize(12), color: '#4a4a4a', marginBottom: 2, paddingBottom: 4, marginHorizontal: SCREEN_WIDTH * 0.04167, flex: 1, marginTop: SCREEN_WIDTH * 0.667 * 0.0565 }}
                                                            ellipsizeMode={'tail'}>{item.contents}</Text>

                                                        <Text
                                                            style={{ fontSize: normalize(12), color: '#4a4a4a', marginBottom: 2, paddingBottom: 4, marginHorizontal: SCREEN_WIDTH * 0.04167, flex: 1, marginTop: SCREEN_WIDTH * 0.667 * 0.0565 }}
                                                            ellipsizeMode={'tail'}>{this.state.isTrans ? (selectIndex === index) ? Translate('transtrating') : item.trans : item.trans}</Text>

                                                        <View style={styles.elemTravel}>
                                                            <View style={styles.elemSetting}>

                                                                <View style={{
                                                                    height: SCREEN_HEIGHT * 0.0194 * 2.8,
                                                                    borderRadius: 2, flex: 1 / 6,
                                                                    alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 1 ? '#557f89' : '#ffffff',
                                                                }}>
                                                                    <Text style={{ alignSelf: 'center', color: item.style_id === 1 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'ja' ? normalize(8) : this.state.lang === 'en' ? normalize(9) : normalize(10) }} > {Translate('activity_write_healing')}</Text>
                                                                </View>

                                                                <View style={{
                                                                    height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                    marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                    alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 2 ? '#557f89' : '#ffffff',
                                                                }}>
                                                                    <Text style={{ alignSelf: 'center', color: item.style_id === 2 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'ja' ? normalize(9) : this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('activity_write_hotplace')}</Text>
                                                                </View>
                                                                <View style={{
                                                                    height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                    marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                    alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 3 ? '#557f89' : '#ffffff',
                                                                }}>
                                                                    <Text style={{ alignSelf: 'center', color: item.style_id === 3 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('traditional_market')}</Text>
                                                                </View>
                                                                <View style={{
                                                                    height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                    marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                    alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 4 ? '#557f89' : '#ffffff',
                                                                }}>
                                                                    <Text style={{ alignSelf: 'center', color: item.style_id === 4 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('historicalstyle')}</Text>
                                                                </View>
                                                                <View style={{
                                                                    height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                    marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                    alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 5 ? '#557f89' : '#ffffff',
                                                                }}>
                                                                    <Text style={{ alignSelf: 'center', color: item.style_id === 5 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('museumstyle')}</Text>
                                                                </View>
                                                                <View style={{
                                                                    height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                    marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                    alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 6 ? '#557f89' : '#ffffff',
                                                                }}>
                                                                    <Text style={{ alignSelf: 'center', color: item.style_id === 6 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('artmuseumstyle')}</Text>
                                                                </View>
                                                            </View>
                                                        </View>

                                                        <View style={{ width: '100%', height: SCREEN_WIDTH * 0.667 * 0.1435, alignItems: 'center', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: '#6c6c6c', justifyContent: 'flex-end', flexDirection: 'row', }}>
                                                            <TouchableWithoutFeedback
                                                                onPress={() => {
                                                                    selectIndex = index
                                                                    this.setState({ isTrans: true }, () => {
                                                                        // this.test(item)
                                                                        this.checkLanguage(item)
                                                                    })
                                                                }}>
                                                                <View style={{ width: 60, height: '100%', alignItems: 'flex-end' , justifyContent: 'center'}}>
                                                                    {/* <Image
                                                                        style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                        source={require('../../images/test2_translation.png')} /> */}

                                                                    {
                                                                        this.state.lang === 'en' && <Image
                                                                            style={{ width: 60, height: '100%',  marginRight: 10 }}
                                                                            source={require(`../../images/translation/en_translation.png`)}
                                                                        />
                                                                    }
                                                                    {
                                                                        this.state.lang === 'ko' && <Image
                                                                            style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                            source={require(`../../images/translation/ko_translation.png`)}
                                                                        />
                                                                    }
                                                                    {
                                                                        this.state.lang === 'ja' && <Image
                                                                            style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                            source={require(`../../images/translation/ja_translation.png`)}
                                                                        />
                                                                    }
                                                                    {
                                                                        this.state.lang === 'zh_rCN' && <Image
                                                                            style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                            source={require(`../../images/translation/rCN_translation.png`)}
                                                                        />
                                                                    }
                                                                    {
                                                                        this.state.lang === 'zh_rTW' && <Image
                                                                            style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                            source={require(`../../images/translation/rTW_translation.png`)}
                                                                        />
                                                                    }
                                                                    {
                                                                        this.state.lang === 'zh-Hant-MO' && <Image
                                                                            style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                            source={require(`../../images/translation2/rTW_translation.png`)}
                                                                        />
                                                                    }


                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                            <TouchableWithoutFeedback
                                                                onPress={() => {
                                                                    this.setScrap(item.id)
                                                                    this.setState({ isLoading: true })
                                                                }}>
                                                                <View style={{ width: 45, height: '100%', alignItems: 'flex-end' }}>
                                                                    <Image
                                                                        style={{ height: '100%', width: 25, resizeMode: 'contain', marginRight: 14 }}
                                                                        source={item.scrap == '2' ? require('../../images/scrap_ck.png') : require('../../images/ic_bookmark_y.png')} />
                                                                </View>
                                                            </TouchableWithoutFeedback>
                                                        </View>
                                                    </View>
                                                </TouchableWithoutFeedback>
                                            )}
                                            keyExtractor={(item, index) => index.toString()}>
                                        </FlatList>
                                    </View>
                                </ScrollView>
                            </View>
                            {
                                // isCloseApp && <CloseAppAdMob />
                            }
                            {
                                isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
                                    pointerEvents={'none'}>
                                    <ActivityIndicator
                                        size="large"
                                        color={'#779ba4'}
                                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />
                                </View>
                            }
                            {
                                isModal && <AgreeModal
                                    modalHandler={() => {

                                    }}
                                    content={Translate('message_agreement_content')}
                                    confirmText={Translate('confirm')}
                                    logo={Translate('welcome')}
                                    lang={this.state.lang}
                                    isBackgroundTranparant={true}
                                    agreement={`[${Translate('necessity')}] ${Translate('agreement')}`}
                                    personalInfo={`[${Translate('necessity')}] ${Translate('agreement_personal_info')}`}
                                    locationInfo={`[${Translate('necessity')}] ${Translate('agreement_location_info')}`}
                                    viewText={Translate('view')}
                                    totAgreement={Translate('total_agreement')}
                                    totAgreementContent={Translate('confirm_total_agreement')}
                                    isCheckedAgreement={this.state.isCheckedAgreement}
                                    isCheckedPersonalInfo={this.state.isCheckedPersonalInfo}
                                    isCheckedLocationInfo={this.state.isCheckedLocationInfo}
                                    isCheckedTotal={this.state.isCheckedTotal}
                                    onPressOk={() => { this.setChecked() }}
                                    onPressAgreement={() => { this.checkAgreement() }}
                                    onPressAgreementView={() => { this.openAgreementView() }}
                                    onPressPersonalInfo={() => { this.checkPersonalInfo() }}
                                    onPressPersonalInfoView={() => { this.openPersonalInfoView() }}
                                    onPressLocationInfo={() => { this.checkLocationInfo() }}
                                    openLocationInfoView={() => { this.openLocationInfoView() }}
                                    onPressTotalAgreement={() => { this.checkTotAgreement() }}
                                />
                            }
                            {
                                isPopupModal && <PopupAd
                                    adList={this.state.popupList}
                                    modalHandler={() => {
                                        this.togglePopupModal();
                                    }}
                                    onPressOk={() => {
                                        this.togglePopupModal();
                                    }}
                                    onPressToday={() => {
                                        setItemToAsync('today', new Date())
                                        this.togglePopupModal();
                                    }}
                                    txtTodayOk={Translate('btn_today_close')}
                                    txtOk={Translate('btn_close')}
                                    lang={this.state.lang}
                                />
                            }
                        </View>
                    </TouchableWithoutFeedback>
                </SafeAreaView >
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8eaed'
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
    header: {
        height: SCREEN_HEIGHT * 0.2,
        backgroundColor: '#fff'
    },
    contentContainer: {
        flex: 420,
        backgroundColor: '#e8eaed'
    },
    imgContainer: {
        flex: 1,
        backgroundColor: 'rgba(61,96,110,0.5)',
        justifyContent: 'flex-start'
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        marginTop: SCREEN_HEIGHT * 0.2 * 0.42,
    },
    searchContainer: {
        width: '96%',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        marginBottom: '1.5%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderRadius: 17.5,
        borderColor: '#fff',
        borderWidth: 1,
        position: 'absolute',
        bottom: 0
    },
    welcomeContainer: {
        justifyContent: 'flex-start',
        marginTop: '2%',
        marginLeft: SCREEN_WIDTH * 0.06,
        flex: 1,
    },
    welcomeRowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    writeContainer: {
        height: '100%',
        width: SCREEN_WIDTH * 0.2,
        backgroundColor: 'transparent',
        marginRight: SCREEN_WIDTH * 0.02
    },
    scrollContainer: {
        flex: 1,
        alignItems: 'center'
    },
    cardContainer: {
        // height: SCREEN_WIDTH * 0.75,
        width: SCREEN_WIDTH * 0.97,
        marginTop: 8,
        borderRadius: 4,
        justifyContent: 'flex-end',
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    logoImg: {
        width: SCREEN_WIDTH * 0.22,
        height: SCREEN_WIDTH * 0.22 * 0.3,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginTop: '3%',
        position: 'absolute',
        top: 0
    },
    headerImg: {
        flex: 1,
        height: '100%',
        resizeMode: 'center'
    },
    input: {
        flex: 1,
        fontWeight: '500',
        fontSize: SCREEN_HEIGHT * 0.015,
        color: '#fff',
        paddingVertical: Platform.OS === 'ios' ? 5 : 1,
        height: SCREEN_HEIGHT * 0.03
    },
    searchImg: {
        position: 'absolute',
        width: SCREEN_WIDTH * 0.03,
        height: SCREEN_WIDTH * 0.03,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginLeft: SCREEN_WIDTH * 0.025
    },
    welcome1Text: {
        fontSize: normalize(10),
        textAlign: 'left',
        textAlignVertical: 'bottom',
        color: '#fff',
        fontWeight: '400',
    },
    welcome2Text: {
        fontSize: normalize(13),
        textAlign: 'center',
        textAlignVertical: 'top',
        color: '#fff',
        fontWeight: '600',
        marginLeft: '3%'
    },
    welcome3Text: {
        fontSize: normalize(10),
        textAlign: 'center',
        color: '#fff',
        justifyContent: 'flex-end',
        fontWeight: '400',
    },
    writeText: {
        fontSize: normalize(10),
        textAlign: 'center',
        color: '#fff',
        justifyContent: 'flex-end',
        marginTop: '14%',
        marginLeft: 5
    },
    writeImg: {
        width: 23,
        height: 26,
        position: 'absolute',
        justifyContent: 'flex-start',
    },
    typeButtonContainer: {
        marginTop: SCREEN_HEIGHT * 0.011,
        marginBottom: SCREEN_HEIGHT * 0.011,
        marginHorizontal: SCREEN_WIDTH * 0.015,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    typeView: {
        flex: 1,
        paddingVertical: SCREEN_WIDTH * 0.0194,
        borderRadius: 2,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    typeButton: {
        color: '#878787',
        fontSize: normalize(9),
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    typeMarginView: {
        flex: 1,
        paddingVertical: SCREEN_WIDTH * 0.0194,
        borderRadius: 2,
        backgroundColor: '#fff',
        marginLeft: SCREEN_WIDTH * 0.01389,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fff'
    },
    selectedView: {
        flex: 1,
        paddingVertical: SCREEN_WIDTH * 0.0194,
        backgroundColor: '#557f89',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 2,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedTypeButton: {
        color: '#fff',
        fontSize: normalize(9),
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    selectedMarginView: {
        flex: 1,
        paddingVertical: SCREEN_WIDTH * 0.0194,
        backgroundColor: '#557f89',
        marginLeft: SCREEN_WIDTH * 0.01389,
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 2,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 1,
    },
    elemTravel: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    elemSetting: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: SCREEN_WIDTH * 0.02,
        marginBottom: 10,
    },
});