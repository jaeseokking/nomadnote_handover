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
    Linking,
    Alert,
    PermissionsAndroid,
    ActivityIndicator,
    Keyboard
} from 'react-native';

import Toast from 'react-native-root-toast';
import axios from 'axios';
import AppStatusBar from '../../components/AppStatusBar';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import Moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import { setDeviceLang, setLang } from '../../utils/Utils';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import Video from 'react-native-video';
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import { WebView } from 'react-native-webview';
import { GEOCODING_API_KEY } from "@env"
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

const scale = SCREEN_WIDTH / 320;

let selectIndex = 0;

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

// function CertifiedWriting(props) {
//     return (
//         <>
//             <Image
//                 style={{ width: props.cardHeight * 0.07826, height: props.cardHeight * 0.07826, resizeMode: 'contain' }}
//                 source={require('../../images/scrap_opck.png')} />
//             <Text style={{ color: '#fff', fontSize: normalize(10), fontWeight: '400', marginLeft: props.cardHeight * 0.03478 }}>{Translate('confidence_writing')}</Text>
//         </>
//     );
// }

// function UnauthenticatedWriting(props) {
//     return (
//         <>
//             <Text style={{ color: '#fff', fontSize: normalize(10), fontWeight: '400' }}>{Translate('item_scrap_cirti')}</Text>
//             <Image
//                 style={{ width: props.cardHeight * 0.07826, height: props.cardHeight * 0.07826, resizeMode: 'contain', marginLeft: props.cardHeight * 0.03478 }}
//                 source={require('../../images/scrap_opck.png')} />
//         </>
//     );
// }

export default class ScrapTimeLine extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        if (Platform.OS === 'android') {
            AndroidKeyboardAdjust.setAdjustPan();
        }
        this.handleBackButton = this.handleBackButton.bind(this);

        this.state = {
            scrapList: [],
            scrapPage: 1,
            scrapEndPage: 0,
            isMoreData: false,
            currentLat: 0,
            currentLong: 0,
            timeImage: '',
            translationText: '',
            translatedText: '',
            userLang: '',
            tId: 0,
            cardList: [],
            isLoading: true,
            isFirstLoading: true,
            isClickScrap: false,
            timelineId: '',
            isReLoading: false,
            isTrans: false,
            keyword: '',
            currentIndex: 0,
            friendsInfo: [],
            translationPlaceText: '',
            translatedPlaceText: '',
            isScrollTop: false,
            lang: setDeviceLang(),
            cardHeadTextHeight: SCREEN_WIDTH * 0.667 * 0.0565,
            isCertification: false,
            certificationId: '',
            certificationWriteId: '',
        };
    }


    componentDidMount() {
        console.log('componentDidMount')

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

                console.log('isAgree: ', global.isAgree)
                if (!global.isAgree) {
                    // this.props.navigation.dispatch(NavigationActions.navigate({ routeName: '스크랩타임라인' }));
                    // this.props.navigation.navigate('타인타임라인');
                }

                let page = 0
                if (this.state.page > 1) {
                    page = this.state.scrapPage
                } else {
                    page = 1
                }

                this.setState({ isLoading: true, scrapPage: page }, () => {
                    this.getCurrentLocation();
                    this.getRequestFriends()
                    this.getScrapTimeLine();
                })
            }
        );
        // this.didFocusListener = this.props.navigation.addListener(
        //     'didFocus',
        //     () => {
        //         this.getScrapTimeLine()
        //         this.getCurrentLocation()

        //     }
        // );

        // this.didFocusListener = this.props.navigation.addListener(
        //     'didBlur',
        //     () => {

        //     },
        // );

    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        this.willFocusSubscription.remove();
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
            // this.showAd();
            return true
        }
    };

    showAd() {
        if (interstitialAd.loaded) {
            interstitialAd.show().catch(error => console.warn(error));
        }
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    hasLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            const hasPermission = await this.hasLocationPermissionIOS();
            return hasPermission;
        }

        if (Platform.OS === 'android' && Platform.Version < 23) {
            return true;
        }

        const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasPermission) {
            return true;
        }

        const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (status === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        }

        if (status === PermissionsAndroid.RESULTS.DENIED) {
            Toast.show('Location permission denied by user.', {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Location permission denied by user.');
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Toast.show('Location permission revoked by user.', {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Location permission revoked by user.');
        }

        return false;
    };

    hasLocationPermissionIOS = async () => {
        const openSetting = () => {
            Linking.openSettings().catch(() => {
                Alert.alert('Unable to open settings');
            });
        };
        const status = await Geolocation.requestAuthorization('whenInUse');

        if (status === 'granted') {
            return true;
        }

        if (status === 'denied') {
            Alert.alert('Location permission denied');
        }

        if (status === 'disabled') {
            Alert.alert(
                `Turn on Location Services to allow nomadnote to determine your location.`,
                '',
                [
                    { text: 'Go to Settings', onPress: openSetting },
                    { text: "Don't Use Location", onPress: () => { } },
                ],
            );
        }

        return false;
    };

    getCurrentLocation = async () => {
        const hasLocationPermission = await this.hasLocationPermission();

        if (!hasLocationPermission) {
            return;
        }

        await Geolocation.getCurrentPosition(
            (position) => {
                global.lat = position.coords.latitude
                global.lon = position.coords.longitude
                this.setState({
                    currentLat: position.coords.latitude,
                    currentLong: position.coords.longitude,
                }, () => {
                    if (this.state.isCertification) {
                        this.setCertification(this.state.certificationId, this.state.certificationWriteId)
                    }
                })
                console.log('getCurrentLocation =', this.state.currentLong, this.state.currentLat)
            },
            (error) => {
                console.log('location err: ', error)
                Toast.show(`${Translate('message_receive_location')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
                // Toast.show(`${Translate('message_receive_location')}`)
            },
            {
                accuracy: {
                    android: 'high',
                    ios: 'best',
                },
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
                distanceFilter: 0,
            },
        );
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

        let itemList = [...this.state.scrapList]
        axios.all([axios.post(placeUrl + stringToTransPlace), axios.post(this.URL + stringToTranslate)])
            .then(axios.spread((firstResponse, secondResponse) => {
                let placeText = firstResponse.data.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                let contentText = secondResponse.data.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                for (var i = 0; i < itemList.length; i++) {
                    if (itemList[i].timeline_id === this.state.tId) {
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
        let itemList = [...this.state.scrapList]
        fetch(this.URL + string_to_translate)
            .then(res => res.json())
            .then(
                (res) => {
                    let text = res.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                    console.log('check Data', text)
                    if (key === 'content') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].timeline_id === this.state.tId) {
                                itemList[i].trans = `${notTranslateText}\n\n${text}`
                            }
                        }
                        this.setState({ translatedText: text, cardList: itemList, isTrans: false })
                    } else {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].timeline_id === this.state.tId) {
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

                let itemList = [...this.state.scrapList]

                this.setState({ tId: item.id }, () => {
                    console.log('this setState')
                    if (placeCheckLang === 'und' && contentCheckLang === 'und') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].timeline_id === item.id) {
                                itemList[i].trans = ''
                            }
                        }
                        this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false, translationPlaceText: item.place_name })
                    } else if (placeCheckLang === 'und') {
                        if (global.lang === contentCheckLang) {
                            for (var i = 0; i < itemList.length; i++) {
                                if (itemList[i].timeline_id === item.id) {
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
                                if (itemList[i].timeline_id === item.id) {
                                    itemList[i].trans = ''
                                }
                            }
                            this.setState({ translatedText: item.contents, cardList: itemList, isTrans: false, translationPlaceText: item.place_name })
                        } else {
                            this.translateText('place', `&q=${item.place_name}`, item.contents, placeCheckLang)
                        }
                    } else if (global.lang === placeCheckLang && global.lang === contentCheckLang) {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].timeline_id === item.id) {
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

    async getScrapTimeLine() {
        console.log('ScrapData')
        let strWrite = await getItemFromAsync('scrap_write');
        let modiId = await getItemFromAsync('modi_id');
        let removeId = await getItemFromAsync('remove_id');
        let isScrap = await getItemFromAsync('scrap_click');
        let scrapId = await getItemFromAsync('scrap_id');

        if (isScrap === null || isScrap === undefined || isScrap === '') {
            isScrap = 'confirm'
        }

        console.log('timeline isScrap: ', isScrap)

        if (this.state.isFirstLoading || this.state.isMoreData) {

        } else {
            if (isScrap === 'other' || isScrap === 'visited' || isScrap === 'map' || isScrap === 'unconfirm') {
                this.setState({ scrapPage: 1 })
            }
        }

        let url = global.server + '/api/timeline/my_timeline'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 'scrap')
        bodyFormData.append('keyword', this.state.keyword)
        bodyFormData.append('page', this.state.scrapPage);
        console.log('scrap body', bodyFormData)
        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("scrapData", response.data.scraps.data);
                let itemList = [...this.state.scrapList]
                // console.log(itemList)
                if (this.state.isClickScrap) {
                    if (itemList.length > 0) {
                        itemList = itemList.filter((item) => this.state.timelineId !== item.timeline_id)
                    } else {
                        response.data.scraps.data.forEach(item => {
                            itemList.push({
                                trans: '',
                                ...item
                            })
                        });
                    }
                } else {
                    if (strWrite === 'registration') {
                        itemList = []
                        response.data.scraps.data.forEach(item => {
                            itemList.push({
                                trans: '',
                                ...item
                            })
                        });
                        setItemToAsync('scrap_write', '')
                    } else if (strWrite === 'modi') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].timeline.id === modiId) {
                                itemList[i].timeline = global.detailTimeline
                                itemList[i] = { trans: '', ...itemList[i] }
                            }
                        }
                        console.log('modi: ', itemList)
                        setItemToAsync('scrap_write', '')
                    } else if (strWrite === 'remove') {
                        itemList = itemList.filter((item) => removeId !== item.timeline.id)

                        setItemToAsync('scrap_write', '')
                    } else {
                        if (this.state.isFirstLoading || this.state.isMoreData) {
                            response.data.scraps.data.forEach(item => {
                                itemList.push({
                                    trans: '',
                                    ...item
                                })
                            });
                            console.log('isFirstLoading')
                        } else {
                            if (isScrap === 'other') {
                                itemList = []
                                response.data.scraps.data.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'confirm')
                                console.log('other')
                            } else if (isScrap === 'visited' || isScrap === 'map') {
                                itemList = []
                                response.data.scraps.data.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'unconfirm')
                                console.log('visited, map')
                            } else if (isScrap === 'unconfirm') {
                                itemList = []
                                response.data.scraps.data.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'confirm')
                                console.log('unconfirm')
                            } else {
                                if (this.state.scrapPage === 1) {
                                    itemList = []
                                    response.data.scraps.data.forEach(item => {
                                        itemList.push({
                                            trans: '',
                                            ...item
                                        })
                                    });
                                    console.log('scrapPage 1')
                                }
                            }
                        }
                        setItemToAsync('scrap_write', '')
                    }
                }

                if (this.state.isScrollTop) {
                    this.refs._scrollView.scrollTo(0);
                }

                console.log('itemList: ', response.data.scraps.last_page, this.state.scrapPage)
                setItemToAsync('other_scrap_id', '')

                this.setState({
                    scrapList: itemList,
                    scrapEndPage: response.data.scraps.last_page,
                    isLoading: false,
                    isFirstLoading: false,
                    isReLoading: false,
                    isMoreData: false,
                    isClickScrap: false,
                    isScrollTop: false
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
                setItemToAsync('scrap_write', '')
                self.setState({ isLoading: false })
            });
    }

    setCertification = (id, writeId) => {
        console.log('certifi!!')
        if (global.user.id == id) {
            console.log('wirte ID?!!', id)
            Toast.show(`${Translate('authenticate_no')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('authenticate_no')}`)
            return
        } else {
            let url = global.server + '/api/certification/add_certification'

            var bodyFormData = new FormData();
            bodyFormData.append('member_id', global.user.id);
            bodyFormData.append('timeline_id', id)
            bodyFormData.append('latitude', this.state.currentLat)
            bodyFormData.append('longitude', this.state.currentLong)

            const self = this;

            console.log('bodyFormData', bodyFormData)

            axios.post(url, bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then(function (response) {
                    console.log("response", response.data);
                    let result = response.data.result

                    if (result === "ok") {
                        this.setState({ isCertification: false }, () => {
                            this.getScrapTimeLine();
                            this.getMyInfo();
                        })

                    } else {
                        Toast.show(`${Translate('authenticate_no')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('authenticate_no')}`)
                        this.setState({ isLoading: false, isCertification: false })
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
                    self.setState({ isLoading: false, isCertification: false })
                });
        }
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
                    } console.log('userInfo: ', response.data)
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


    setScrap = (id) => {
        let url = global.server + '/api/timeline/set_scrap'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('timeline_id', id)

        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                global.isClickScrap = true
                setItemToAsync('scrap_click', 'scrap')
                setItemToAsync('scrap_id', id)
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
        this.setState({ isMoreData: false, isLoading: true, isClickScrap: true, isScrollTop: false }, () => {
            this.getScrapTimeLine()
        });
    }

    updatePage() {
        this.setState({ scrapPage: this.state.scrapPage + 1, isLoading: true, isMoreData: true, isReLoading: true, isScrollTop: false }, () => {
            console.log('update scrap: ', this.state.scrapPage)
            this.getScrapTimeLine()
        });
    }

    onScroll = ({ layoutMeasurement, contentOffset, contentSize }) => {
        let itemSize = layoutMeasurement.height;
        let scrollY = contentOffset.y
        let totSize = contentSize.height
        let currentIndex = (scrollY / (SCREEN_WIDTH * 0.7))

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
        const videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
        // if (videoid != null) {
        //     console.log("video id = ", videoid[1]);
        // } else {
        //     console.log("The youtube url is not valid.");
        // }
        return videoid[1]
    }

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        this.setState({ cardHeadTextHeight: height + 10 })
    }

    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;
        console.log('scrapList : ', this.state.scrapList)
        console.log('scrapList length : ', this.state.scrapList.length)
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
                                                        style={styles.welcome1Text}>{Translate('scrapTop')}</Text>
                                                    {/* <Text
                                                    adjustsFontSizeToFit
                                                    style={styles.welcome2Text}>{Translate('nomadnote')}</Text> */}
                                                </View>
                                                {/* <Text
                                                adjustsFontSizeToFit
                                                style={styles.welcome3Text}>{Translate('welcome2')}</Text> */}
                                            </View>
                                            {/* <View style={{ width: '20%' }} /> */}
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    navigation.navigate('Write', {
                                                        qnaId: '',
                                                        modiImages: [],
                                                        modiData: [],
                                                        isModi: false
                                                    })
                                                }}>
                                                <View style={styles.writeContainer}>
                                                    <Text adjustsFontSizeToFit
                                                        style={styles.writeText}>{Translate('fragment_solo_addnote')}</Text>
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
                                                returnKeyType="done"
                                                onChangeText={(text) => this.setState({ keyword: text })}
                                                onSubmitEditing={() => {
                                                    this.setState({ isScrollTop: true, isLoading: true, scrapPage: 1 }, () => {
                                                        this.getScrapTimeLine();
                                                    })
                                                }}
                                            />
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    // navigation.navigate('ScrapDetail');
                                                    this.setState({ isScrollTop: true, isLoading: true, scrapPage: 1 }, () => {
                                                        this.getScrapTimeLine();
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
                            <View style={styles.contentContainer}>
                                <ScrollView
                                    onScroll={({ nativeEvent }) => {
                                        if (this.onScroll(nativeEvent)) {
                                            //do something
                                            // console.log('lastPage', this.state.endPage)
                                            if (this.state.scrapPage < this.state.scrapEndPage) {
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
                                    {this.state.scrapList.length <= 0 ? <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', alignSelf: 'center', marginTop: '50%' }}>
                                        <Text style={{ color: 'black', fontSize: normalize(14), alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('no_bookmarks')}</Text>
                                        <Text style={{ color: 'black', fontSize: normalize(11), alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('clickTheBookmark')}</Text>
                                    </View> :
                                        <View style={styles.scrollContainer}>

                                            <FlatList
                                                style={{ flex: 1 }}
                                                data={this.state.scrapList}
                                                extraData={this.state.cardList}
                                                renderItem={({ item, index }) => (
                                                    <TouchableWithoutFeedback
                                                        onPress={() => { this.props.navigation.navigate('CardDetail', { id: item.timeline.id }) }}>
                                                        <View style={styles.cardContainer}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', top: 0, left: 0 }}
                                                            >
                                                                <View style={{ marginLeft: SCREEN_WIDTH * 0.0417, marginTop: SCREEN_WIDTH * 0.667 * 0.089, marginRight: (SCREEN_WIDTH * 0.3194) + (SCREEN_WIDTH * 0.0333) + 8 }}>
                                                                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', marginBottom: SCREEN_WIDTH * 0.01389 }}>
                                                                        <Image
                                                                            style={{ width: SCREEN_WIDTH * 0.0847, height: SCREEN_WIDTH * 0.0847, resizeMode: 'cover', borderRadius: (SCREEN_WIDTH * 0.0847) / 2 }}
                                                                            source={item.timeline.member.profile == null ? item.timeline.member.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + item.timeline.member.profile }} />
                                                                        <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 5, alignSelf: 'center' }}>{item.timeline.member.name}</Text>
                                                                        <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 1, alignSelf: 'center' }}>{(item.timeline.member.join_type === 7 || item.timeline.member.join_type === 6) ? '' : item.timeline.member.age === null ? '' : ' / '}</Text>
                                                                        <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 1, alignSelf: 'center' }}>{(item.timeline.member.join_type === 7 || item.timeline.member.join_type === 6) ? '' : item.timeline.member.age === null ? '' : item.timeline.member.age}</Text>
                                                                        {
                                                                            this.state.lang === 'en' && <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', marginLeft: 1, alignSelf: 'center' }}>{' '}</Text>
                                                                        }
                                                                        <Text style={{ fontSize: normalize(12), color: '#878787', fontWeight: 'bold', alignSelf: 'center' }}>{(item.timeline.member.join_type === 7 || item.timeline.member.join_type === 6) ? '' : item.timeline.member.age === null ? '' : Translate('age')}</Text>
                                                                    </View>
                                                                    <View style={{ alignItems: 'flex-start', marginTop: SCREEN_WIDTH * 0.667 * 0.0365 }}>
                                                                        <Text style={{ color: '#878787', fontSize: normalize(11), fontWeight: '400', marginBottom: 2 }}>
                                                                            {item.timeline.place_name + ', ' + item.timeline.cost_str}
                                                                        </Text>
                                                                        {
                                                                            global.lang === 'ko' ?
                                                                                <Text style={{ color: '#878787', fontSize: normalize(11), fontWeight: '400' }}>
                                                                                    {Moment(item.timeline.created_at).format('YYYY.MM.DD A hh:mm')}
                                                                                </Text>
                                                                                :
                                                                                <Text style={{ color: '#878787', fontSize: normalize(11), fontWeight: '400' }}>
                                                                                    {Moment(item.timeline.created_at).format('YYYY.MM.DD hh:mm A')}
                                                                                </Text>
                                                                        }
                                                                    </View>
                                                                </View>
                                                                <View style={{ borderRadius: 6, backgroundColor: '#d8d8d8', width: SCREEN_WIDTH * 0.3194, height: SCREEN_WIDTH * 0.667 * 0.3348, marginRight: SCREEN_WIDTH * 0.0333, position: 'absolute', right: 0, top: 0, marginTop: SCREEN_WIDTH * 0.0333, alignSelf: 'flex-end', overflow: 'hidden' }}>

                                                                    {
                                                                        item.timeline.images.length > 0 > 0 && item.timeline.images[0].image_uri === null ?

                                                                            <Video
                                                                                source={{ uri: global.server + item.timeline.images[0].video_path }}
                                                                                ref={(ref) => {
                                                                                    this.player = ref
                                                                                }}
                                                                                volume={0.0}
                                                                                muted={true}
                                                                                onBuffer={this.onBuffer}
                                                                                resizeMode='stretch'
                                                                                repeat={true}
                                                                                paused={this.setPause(index)}
                                                                                onError={this.videoError}
                                                                                style={{ width: '100%', height: '100%', borderRadius: 6, }} />

                                                                            : item.timeline.youtube === null ?
                                                                                <Image
                                                                                    style={{ width: '100%', height: '100%', borderRadius: 6, }}
                                                                                    source={item.timeline.images.length > 0 ? { uri: global.server + item.timeline.images[0].image_uri } : require('../../images/time_bg.png')}
                                                                                />
                                                                                : <View style={{ width: '100%', height: '100%', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }}>
                                                                                    <Image
                                                                                        style={{ width: '100%', height: '100%', position: 'absolute', resizeMode: 'cover' }}
                                                                                        source={{ uri: `http://i.ytimg.com/vi/${this.getYoutubeId(item.timeline.youtube)}/0.jpg` }}
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
                                                                style={{ fontSize: normalize(12), color: '#4a4a4a', marginBottom: 5, marginHorizontal: SCREEN_WIDTH * 0.04167, flex: 1, marginTop: SCREEN_WIDTH * 0.667 * 0.0565 }}
                                                                ellipsizeMode={'tail'}>{item.timeline.contents}</Text>

                                                            <Text
                                                                style={{ fontSize: normalize(12), color: '#4a4a4a', marginBottom: 5, marginHorizontal: SCREEN_WIDTH * 0.04167, flex: 1, marginTop: SCREEN_WIDTH * 0.667 * 0.0565 }}
                                                                ellipsizeMode={'tail'}>{this.state.isTrans ? (selectIndex === index) ? Translate('transtrating') : item.trans : item.trans}</Text>

                                                            <View style={styles.elemTravel}>
                                                                <View style={styles.elemSetting}>

                                                                    <View style={{
                                                                        height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                        borderRadius: 2, flex: 1 / 6,
                                                                        alignItems: 'center', justifyContent: 'center', backgroundColor: item.timeline.style_id === 1 ? '#557f89' : '#ffffff',
                                                                    }}>
                                                                        <Text style={{ alignSelf: 'center', color: item.timeline.style_id === 1 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'ja' ? normalize(8) : this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('activity_write_healing')}</Text>
                                                                    </View>

                                                                    <View style={{
                                                                        height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                        marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                        alignItems: 'center', justifyContent: 'center', backgroundColor: item.timeline.style_id === 2 ? '#557f89' : '#ffffff'
                                                                    }}>
                                                                        <Text style={{ alignSelf: 'center', color: item.timeline.style_id === 2 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'ja' ? normalize(9) : this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('activity_write_hotplace')}</Text>
                                                                    </View>
                                                                    <View style={{
                                                                        height: SCREEN_HEIGHT * 0.0194 * 2.8,
                                                                        marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                        alignItems: 'center', justifyContent: 'center', backgroundColor: item.timeline.style_id === 3 ? '#557f89' : '#ffffff',
                                                                    }}>
                                                                        <Text style={{ alignSelf: 'center', color: item.timeline.style_id === 3 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('traditional_market')}</Text>
                                                                    </View>
                                                                    <View style={{
                                                                        height: SCREEN_HEIGHT * 0.0194 * 2.8,
                                                                        marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                        alignItems: 'center', justifyContent: 'center', backgroundColor: item.timeline.style_id === 4 ? '#557f89' : '#ffffff',
                                                                    }}>
                                                                        <Text style={{ alignSelf: 'center', color: item.timeline.style_id === 4 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('historicalstyle')}</Text>
                                                                    </View>
                                                                    <View style={{
                                                                        height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                        marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                        alignItems: 'center', justifyContent: 'center', backgroundColor: item.timeline.style_id === 5 ? '#557f89' : '#ffffff',
                                                                    }}>
                                                                        <Text style={{ alignSelf: 'center', color: item.timeline.style_id === 5 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('museumstyle')}</Text>
                                                                    </View>
                                                                    <View style={{
                                                                        height: SCREEN_HEIGHT * 0.0194 * 2.8,

                                                                        marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                        alignItems: 'center', justifyContent: 'center', backgroundColor: item.timeline.style_id === 6 ? '#557f89' : '#ffffff',
                                                                    }}>
                                                                        <Text style={{ alignSelf: 'center', color: item.timeline.style_id === 6 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10) }}>{Translate('artmuseumstyle')}</Text>
                                                                    </View>
                                                                </View>
                                                            </View>

                                                            <View style={{ width: '100%', height: SCREEN_WIDTH * 0.667 * 0.1435, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: '#6c6c6c', flexDirection: 'row' }}>
                                                                <TouchableWithoutFeedback
                                                                    onPress={() => {
                                                                        console.log('click', item.certification)
                                                                        if (item.certification === '1') {
                                                                            if (this.state.isCertification) {
                                                                                Toast.show(`${Translate('message_wait')}`, {
                                                                                    duration: 2000,
                                                                                    position: Toast.positions.CENTER
                                                                                })
                                                                                // Toast.show(`${Translate('message_wait')}`)
                                                                                return
                                                                            } else {
                                                                                this.setState({ isCertification: true, certificationId: item.timeline.id, certificationWriteId: item.timeline.member.id }, () => {
                                                                                    if (this.state.currentLat === 0 || this.state.currentLong === 0) {
                                                                                        this.getCurrentLocation()
                                                                                    } else {
                                                                                        this.setCertification(item.timeline.id, item.timeline.member.id);
                                                                                    }
                                                                                })
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    {
                                                                        item.certification == 1 ? <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginLeft: 10, flex: 1 }}>
                                                                            <Image style={{ width: 20, height: 20, resizeMode: 'contain' }}
                                                                                source={require('../../images/scrap_opck.png')} />
                                                                            <Text style={{ color: '#fff', fontSize: normalize(11), fontWeight: '400', marginLeft: 8 }}> {Translate('item_scrap_cirti')}</Text>

                                                                        </View> : <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginLeft: 10, flex: 1 }}>
                                                                            <Image style={{ width: 16, height: 22, resizeMode: 'contain' }}
                                                                                source={require('../../images/visit_city.png')} />
                                                                            <Text style={{ color: '#fff', fontSize: normalize(11), fontWeight: '400', marginLeft: 8 }}> {Translate('item_scrap_cirti_done')}</Text>
                                                                        </View>
                                                                    }
                                                                </TouchableWithoutFeedback>
                                                                <TouchableWithoutFeedback
                                                                    onPress={() => {
                                                                        selectIndex = index
                                                                        this.setState({ isTrans: true }, () => {
                                                                            // this.test(item.timeline)
                                                                            this.checkLanguage(item.timeline)
                                                                        })
                                                                    }}>
                                                                    <View style={{ width: 60, height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                                        {/* <Image
                                                                            style={{ width: 40, height: '100%', resizeMode: 'contain', marginRight: 10 }}
                                                                            source={require('../../images/logo_translation.png')} /> */}
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
                                                                        this.setState({ timelineId: item.timeline.id }, () => {
                                                                            this.setScrap(item.timeline.id)
                                                                        })
                                                                    }}>
                                                                    <View style={{ width: 45, height: '100%', alignItems: 'flex-end' }}>
                                                                        <Image
                                                                            style={{ height: '100%', width: 25, resizeMode: 'contain', marginRight: 14 }}
                                                                            source={require('../../images/scrap_ck.png')} />
                                                                    </View>
                                                                </TouchableWithoutFeedback>
                                                            </View>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                )}
                                                keyExtractor={(item, index) => index.toString()}>
                                            </FlatList>
                                        </View>
                                    }
                                </ScrollView>
                            </View>
                            {
                                isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
                                    pointerEvents={'none'}>
                                    <ActivityIndicator
                                        size="large"
                                        color={'#779ba4'}
                                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />
                                </View>
                            }
                        </View>
                    </TouchableWithoutFeedback>
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
        shadowOpacity: 0.33,
        shadowRadius: 4,
        elevation: 4,
    },
    scrollContainer: {
        flex: 1,
        alignItems: 'center',
        marginBottom: 20,
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
        resizeMode: 'stretch'
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
    elemTravel: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10
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