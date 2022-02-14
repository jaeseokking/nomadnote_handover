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
    ActivityIndicator
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import moment from 'moment';
import Moment from 'moment';
import Toast from 'react-native-root-toast';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import Video from 'react-native-video';
import { KeyboardAvoidingView } from 'react-native';
import { GEOCODING_API_KEY } from "@env"
import { setDeviceLang } from '../../utils/Utils';


const THEME_COLOR = 'rgba(78, 109, 118, 1)'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

let selectIndex = 0;

export default class VisitedTimeline extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        const { params } = this.props.navigation.state
        this.state = {
            placeInfo: [],
            placeTimeline: [],
            cardList: [],
            translatedText: '',
            isLoading: true,
            isFirstLoading: true,
            isClickScrap: false,
            isReLoading: false,
            isMoreData: false,
            placeEndPage: 0,
            timelineId: '',
            timelineKey: '',
            name: params.name,
            id: params.cid,
            page: 1,
            endPage: 0,
            timeList: [],
            isMoreTimeList: false,
            refresh: false,
            translationText: '',
            userLang: '',
            tId: 0,
            isTop: true,
            isTrans: false,
            currentIndex: 0,
            scrollY: 0,
            scrapPage: 1,
            translationPlaceText: '',
            translatedPlaceText: '',
            lang: setDeviceLang()
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.didFocusListener = this.props.navigation.addListener(
            'didFocus',
            async () => {
                let strWrite = await getItemFromAsync('visit_write');
                if (strWrite === 'modi' || strWrite === 'remove') {
                    this.setState({ isLoading: true }, () => {
                        this.getCountryTimeLine()
                    })
                } else {
                    this.getCountryTimeLine()
                }

            }
        );

    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    statusbarHiddenAndroid() {
        if (Platform.OS === 'android') {
            StatusBar.setHidden(true, 'none')
        }
    }

    // trans(item) {
    //     let itemList = [...this.state.placeTimeline]

    //     this.setState({ tId: item.id }, () => {
    //         if (global.lang == item.language) {
    //             for (var i = 0; i < itemList.length; i++) {
    //                 if (itemList[i].id === item.id) {
    //                     itemList[i].trans = item.contents
    //                 }
    //             }
    //             this.setState({ translatedText: item.contents, cardList: itemList, isLoading: false })
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


    async getCountryTimeLine() {
        console.log('cid =', this.state.id)
        let strWrite = await getItemFromAsync('visit_write');
        let modiId = await getItemFromAsync('modi_id');
        let removeId = await getItemFromAsync('remove_id');
        let isScrap = await getItemFromAsync('scrap_click');
        let scrapId = await getItemFromAsync('scrap_id');

        let url = global.server + '/api/timeline/country_timeline'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('country_id', this.state.id)
        bodyFormData.append('keyword', this.state.timelineKey)

        console.log('otherBodyForm', bodyFormData)
        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("visitedTimeline: ", response.data);
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
                        this.setState({
                            timeList: itemList,
                            isLoading: false,
                            isFirstLoading: false,
                            isClickScrap: false,
                            isMoreTimeList: false,
                            isReLoading: false
                        })
                    } else {
                        response.data.timeline.forEach(item => {
                            itemList.push({
                                trans: '',
                                ...item
                            })
                        });
                        this.setState({
                            timeList: itemList,
                            isLoading: false,
                            isFirstLoading: false,
                            isClickScrap: false,
                            isMoreTimeList: false,
                            isReLoading: false
                        })
                    }
                } else {
                    if (strWrite === 'registration') {
                        itemList = []
                        response.data.timeline.forEach(item => {
                            itemList.push({
                                trans: '',
                                ...item
                            })
                        });
                        this.refs._scrollView.scrollTo(0);
                        setItemToAsync('visit_write', '')
                        this.setState({
                            timeList: itemList,
                            isLoading: false,
                            isFirstLoading: false,
                            isClickScrap: false,
                            isMoreTimeList: false,
                            isReLoading: false
                        })
                    } else if (strWrite === 'modi') {
                        for (var i = 0; i < itemList.length; i++) {
                            if (itemList[i].id === modiId) {
                                itemList[i] = global.detailTimeline
                                itemList[i] = { trans: '', ...itemList[i] }
                            }
                        }
                        console.log('modi: ', itemList)
                        setItemToAsync('visit_write', '')
                        this.setState({
                            timeList: itemList,
                            isLoading: false,
                            isFirstLoading: false,
                            isClickScrap: false,
                            isMoreTimeList: false,
                            isReLoading: false
                        })
                    } else if (strWrite === 'remove') {
                        itemList = itemList.filter((item) => removeId !== item.id)
                        setItemToAsync('visit_write', '')
                        this.setState({
                            timeList: itemList,
                            isLoading: false,
                            isFirstLoading: false,
                            isClickScrap: false,
                            isMoreTimeList: false,
                            isReLoading: false
                        })
                    } else {
                        if (this.state.isFirstLoading || this.state.isMoreTimeList) {
                            response.data.timeline.forEach(item => {
                                itemList.push({
                                    trans: '',
                                    ...item
                                })
                            });
                            this.setState({
                                timeList: itemList,
                                isLoading: false,
                                isFirstLoading: false,
                                isClickScrap: false,
                                isMoreTimeList: false,
                                isReLoading: false
                            })
                        } else {
                            if (isScrap === 'scrap' || isScrap === 'map' || isScrap === 'other') {
                                itemList = []
                                response.data.timeline.forEach(item => {
                                    itemList.push({
                                        trans: '',
                                        ...item
                                    })
                                });
                                setItemToAsync('scrap_click', 'visited')
                                this.setState({
                                    timeList: itemList,
                                    isLoading: false,
                                    isFirstLoading: false,
                                    isClickScrap: false,
                                    isMoreTimeList: false,
                                    isReLoading: false
                                })
                            } else {
                                if (this.state.page === 1) {
                                    itemList = []
                                    response.data.timeline.forEach(item => {
                                        itemList.push({
                                            trans: '',
                                            ...item
                                        })
                                    });
                                    this.setState({
                                        timeList: itemList,
                                        isLoading: false,
                                        isFirstLoading: false,
                                        isClickScrap: false,
                                        isMoreTimeList: false,
                                        isReLoading: false
                                    })
                                } else {
                                    if (this.state.isTop) {
                                        itemList = []
                                        response.data.timeline.forEach(item => {
                                            itemList.push({
                                                trans: '',
                                                ...item
                                            })
                                        });
                                        this.setState({
                                            timeList: itemList,
                                            isLoading: false,
                                            isFirstLoading: false,
                                            isClickScrap: false,
                                            isMoreTimeList: false,
                                            isReLoading: false
                                        })
                                    }
                                }
                            }
                        }
                        setItemToAsync('visit_write', '')
                    }
                }
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

    async getPlaceTimeline() {

    }

    setScrap = (id) => {
        let url = global.server + '/api/timeline/set_scrap'
        console.log('id', id)
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
                setItemToAsync('scrap_click', 'visited')
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
        this.setState({ isMoreData: false, isLoading: true, isClickScrap: true }, () => {
            this.getCountryTimeLine()
        });
    }

    updatePage() {
        this.setState({ scrapPage: this.state.scrapPage + 1, isLoading: true, isMoreData: true, isReLoading: true }, () => {
            this.getCountryTimeLine()
        });
    }

    onScroll = ({ layoutMeasurement, contentOffset, contentSize }) => {
        let itemSize = layoutMeasurement.height;
        let scrollY = contentOffset.y
        let totSize = contentSize.height
        let currentIndex = (scrollY / (SCREEN_WIDTH * 0.7))

        console.log('currentIndex: ', parseInt(currentIndex))

        if (scrollY < SCREEN_WIDTH * 0.7) {
            this.setState({ isTop: true, currentIndex: parseInt(currentIndex), scrollY: scrollY })
        } else {
            this.setState({ isTop: false, currentIndex: parseInt(currentIndex), scrollY: scrollY })
        }

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
        if (videoid != null) {
            console.log("video id = ", videoid[1]);
        } else {
            console.log("The youtube url is not valid.");
        }
        return videoid[1]
    }

    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;


        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="dark-content" />
                    <View style={styles.container}>
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', width: SCREEN_WIDTH, height: 50 }}>
                                <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ position: 'absolute', left: 0, height: '100%', justifyContent: 'center' }} >
                                    <Image style={{ width: 20, height: 18, resizeMode: 'contain', marginLeft: 20, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                </TouchableOpacity>
                                <Text style={styles.titleText}>{this.state.name}</Text>
                            </View>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.input}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('visitedKeyword')}
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    textAlign={'center'}
                                    textAlignVertical={'center'}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onChangeText={(text) => this.setState({ timelineKey: text })}
                                    onSubmitEditing={() => this.getCountryTimeLine()}
                                />
                                <TouchableWithoutFeedback
                                    style={{ marginTop: 10 }}
                                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    onPress={() => {
                                        this.getCountryTimeLine()
                                    }}>
                                    <Image
                                        style={styles.searchImg}
                                        source={require('../../images/search_op.png')} />
                                </TouchableWithoutFeedback>
                            </View>
                        </LinearGradient>
                        <View style={styles.contentContainer}>
                            <ScrollView
                                onScroll={({ nativeEvent }) => {
                                    if (this.onScroll(nativeEvent)) {
                                        //do something
                                        // console.log('lastPage', this.state.endPage)
                                        // console.log('currentPage', this.state.page)
                                        if (this.state.page <= this.state.endPage) {
                                            if (!this.state.isReLoading) {
                                                this.updateScrap();
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
                                        renderItem={({ item, index }) => (
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.props.navigation.navigate('CardDetail', { id: item.id });
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
                                                        <View style={{ borderRadius: 6, backgroundColor: '#d8d8d8', width: SCREEN_WIDTH * 0.3194, height: SCREEN_WIDTH * 0.667 * 0.3348, marginRight: SCREEN_WIDTH * 0.0333, position: 'absolute', right: 0, top: 0, marginTop: SCREEN_WIDTH * 0.0333, alignSelf: 'flex-end' }}>
                                                            {
                                                                item.images.length > 0 && item.images[0].image_uri === null ?

                                                                    <Video
                                                                        source={{ uri: global.server + item.images[0].video_path }}
                                                                        ref={(ref) => {
                                                                            this.player = ref
                                                                        }}
                                                                        muted={true}
                                                                        onBuffer={this.onBuffer}
                                                                        resizeMode='stretch'
                                                                        paused={this.setPause(index)}
                                                                        repeat={true}
                                                                        onError={this.videoError}
                                                                        style={{ width: '100%', height: '100%', borderRadius: 6, }} />
                                                                    : item.youtube === null ?
                                                                        <Image
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
                                                        style={{ fontSize: normalize(12), color: '#4a4a4a', marginBottom: 1, marginHorizontal: SCREEN_WIDTH * 0.04167, flex: 1, marginTop: SCREEN_WIDTH * 0.667 * 0.0565 }}
                                                        ellipsizeMode={'tail'}>{item.contents}</Text>

                                                    <Text
                                                        style={{ fontSize: normalize(12), color: '#4a4a4a', marginBottom: 1, marginHorizontal: SCREEN_WIDTH * 0.04167, flex: 1, marginTop: SCREEN_WIDTH * 0.667 * 0.0565 }}
                                                        ellipsizeMode={'tail'}>{this.state.isTrans ? (selectIndex === index) ? Translate('transtrating') : item.trans : item.trans}</Text>


                                                    <View style={styles.elemTravel}>
                                                        <View style={styles.elemSetting}>

                                                            <View style={{
                                                                borderRadius: 2, flex: 1 / 6,
                                                                alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 1 ? '#557f89' : '#ffffff',
                                                            }}>
                                                                <Text adjustsFontSizeToFit style={{ alignSelf: 'stretch', color: item.style_id === 1 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'ja' ? normalize(8) : this.state.lang === 'en' ? normalize(9) : normalize(10), marginHorizontal: 1, marginVertical: 4 }}>{Translate('activity_write_healing')}</Text>
                                                            </View>

                                                            <View style={{
                                                                marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 2 ? '#557f89' : '#ffffff',
                                                            }}>
                                                                <Text adjustsFontSizeToFit style={{ alignSelf: 'stretch', color: item.style_id === 2 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'ja' ? normalize(8) : this.state.lang === 'en' ? normalize(9) : normalize(10), marginHorizontal: 1, marginVertical: 4 }}>{Translate('activity_write_hotplace')}</Text>
                                                            </View>
                                                            <View style={{
                                                                marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 3 ? '#557f89' : '#ffffff',
                                                            }}>
                                                                <Text adjustsFontSizeToFit style={{ alignSelf: 'stretch', color: item.style_id === 3 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10), marginHorizontal: 1, marginVertical: 4 }}>{Translate('traditional_market')}</Text>
                                                            </View>
                                                            <View style={{
                                                                marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 4 ? '#557f89' : '#ffffff',
                                                            }}>
                                                                <Text adjustsFontSizeToFit style={{ alignSelf: 'stretch', color: item.style_id === 4 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10), marginHorizontal: 1, marginVertical: 4 }}>{Translate('historicalstyle')}</Text>
                                                            </View>
                                                            <View style={{
                                                                marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 5 ? '#557f89' : '#ffffff',
                                                            }}>
                                                                <Text adjustsFontSizeToFit style={{ alignSelf: 'stretch', color: item.style_id === 5 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10), marginHorizontal: 1, marginVertical: 4 }}>{Translate('museumstyle')}</Text>
                                                            </View>
                                                            <View style={{
                                                                marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                                                alignItems: 'center', justifyContent: 'center', backgroundColor: item.style_id === 6 ? '#557f89' : '#ffffff',
                                                            }}>
                                                                <Text adjustsFontSizeToFit style={{ alignSelf: 'stretch', color: item.style_id === 6 ? '#ffffff' : '#878787', textAlign: 'center', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10), marginHorizontal: 1, marginVertical: 4 }}>{Translate('artmuseumstyle')}</Text>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View style={{ width: '100%', height: SCREEN_WIDTH * 0.667 * 0.1435, alignItems: 'center', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: '#6c6c6c', justifyContent: 'flex-end', flexDirection: 'row', }}>
                                                        <TouchableWithoutFeedback
                                                            onPress={() => {
                                                                // this.trans(item)
                                                                selectIndex = index
                                                                this.setState({ isTrans: true }, () => {
                                                                    this.checkLanguage(item)
                                                                })
                                                            }}>
                                                            <View style={{ width: 60, height: '100%', alignItems: 'flex-end' , justifyContent: 'center'}}>
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
                                                                console.log('check ', item.id)
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
                            isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
                                pointerEvents={'none'}>
                                <ActivityIndicator
                                    size="large"
                                    color={'#779ba4'}
                                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />
                            </View>
                        }
                    </View>
                </ SafeAreaView>
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
        flex: 60,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    searchContainer: {
        width: '96%',
        height: '27%',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        marginBottom: '2.5%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderRadius: 17.5,
        borderColor: '#fff',
        borderWidth: 1,
        paddingVertical: '1.6%',
    },
    contentContainer: {
        flex: 330
    },
    imgContainer: {
        flex: 198,
    },
    imgBackgroundContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'space-evenly',
        alignItems: 'center'
    },
    placeInfoContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: '2%'
    },
    timeContainer: {
        alignItems: 'center',
        marginLeft: '4%'
    },
    amountContainer: {
        alignItems: 'center',
        marginRight: '4%'
    },
    cardContainer: {
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
    placeText: {
        fontSize: normalize(19),
        fontWeight: 'bold',
        color: '#fff',
        marginTop: '5%'
    },
    timeTitleText: {
        fontSize: normalize(12),
        fontWeight: 'bold',
        color: '#fff'
    },
    amountTitleText: {
        fontSize: normalize(12),
        fontWeight: 'bold',
        color: '#fff'
    },
    timeText: {
        fontSize: normalize(18),
        fontWeight: '500',
        color: '#fff',
    },
    amountText: {
        fontSize: normalize(18),
        fontWeight: '500',
        color: '#fff',
    },
    bar: {
        width: 2,
        height: '92%',
        backgroundColor: '#fff',
        borderRadius: 1,
    },
    searchImg: {
        position: 'absolute',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'center'
    },
    input: {
        flex: 1,
        fontWeight: '500',
        fontSize: normalize(11),
        color: '#fff',
        paddingVertical: 0
    },
    titleText: {
        fontSize: normalize(15),
        color: '#fff',
        fontWeight: '600',
        alignSelf: 'center'
    },
    placeImg: {
        flex: 1,
        width: SCREEN_WIDTH,
        resizeMode: 'stretch'
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