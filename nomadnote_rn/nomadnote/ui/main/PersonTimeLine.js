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
    Alert,
    ActivityIndicator,
    Linking,
    FlatList,
    Keyboard
} from 'react-native';
import DraggableFlatList, { RenderItemParams, } from 'react-native-draggable-flatlist';
import axios from 'axios';
import AppStatusBar from '../../components/AppStatusBar';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import { HeaderBackground } from 'react-navigation-stack';
import Moment from 'moment';
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import RNFetchBlob from 'rn-fetch-blob';
import Video from 'react-native-video';
import { NavigationActions } from 'react-navigation';
import Setting from './Setting';
import { PageControlJaloro } from 'react-native-chi-page-control';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import {
    TestIds, InterstitialAd, AdEventType, BannerAd,
    BannerAdSize
} from '@react-native-firebase/admob';
import Toast from 'react-native-root-toast';

const THEME_COLOR = '#375a64'

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

const unitId =
    Platform.OS === 'ios'
        ? 'ca-app-pub-5097070292431028/6211013887'
        : 'ca-app-pub-5097070292431028/1602847519'
// const interstitialAd = InterstitialAd.createForAdRequest(unitId);
const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);

export default class PersonTimeLine extends Component {
    constructor(props) {
        super(props);
        this.onScroll = this.onScroll.bind(this)
        this.handleBackButton = this.handleBackButton.bind(this);
        this.intervalPointer = null;
        SetI18nConfig();
        if (Platform.OS === 'android') {
            AndroidKeyboardAdjust.setAdjustPan();
        }

        this.state = {
            scrollOffset: 0,
            scrollEnabled: true,
            page: 1,
            endPage: 0,
            myTimeList: [],
            friendsInfo: [],
            nickname: '',
            horizontal: false,
            isLoading: true,
            paused: false,
            progress: 0,
            duration: 0,
            keyword: '',
            isDataLoading: false,
            b2bAd: [],
            b2bImageUri: [],
            sliderIndex: 0,
            mSlider: 0,
            adProgress: 0,
            noImage: false,
            isReLoading: false,
            isTop: true,
            currentIndex: 0,
            scrollY: 0,
            scrollOffset: 0,
            isScrollTop: false,
            isMoveScreen: false
        };
    }

    navigationPosition() {
        this.props.position
    }

    componentDidMount() {
        console.log('PersonTimeLine componentDidMount')

        this.timer()
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        this.willFocus = this.props.navigation.addListener(
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

                var createTimeLine = await getItemFromAsync('createTimeLine')
                let myWrite = await getItemFromAsync('my_timeline_write');
                let page = 0
                const auto = await getItemFromAsync('auto_login');
                console.log('auto login main: ', auto)
                if (this.state.page > 1) {
                    if (this.state.isTop) {
                        page = 1
                    } else {
                        if (myWrite === 'registration') {
                            page = 1
                        } else {
                            page = this.state.page
                        }
                    }
                } else {
                    page = this.state.page
                }

                //타임라인 수정 삭제 시 개인타임라인 리스트 초기화
                console.log('createTimeLine : ', createTimeLine)
                if (createTimeLine) {
                    setItemToAsync('createTimeLine', false)
                    createTimeLine = false
                    this.setState({
                        page: 1, myTimeList: [], currentIndex: 0, endPage: 0
                    })
                }

                this.setState({ isScrollTop: false }, () => {
                    console.log('b2b length: ', this.state.b2bImageUri.length)
                    console.log('current_page : ', this.state.page)
                    console.log('last_page : ', this.state.endPage)


                    if (this.state.page !== this.state.endPage) {
                        if (this.state.b2bImageUri.length > 0) {
                            this.getMyTimeLine(false);
                        } else {
                            this.getB2BAd();
                        }
                        this.getRequestFriends()
                    }
                })
            }
        );
    }

    handleBackButton = () => {
        let index = this.props.navigation.dangerouslyGetParent().state.index;
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

    showAd() {
        if (interstitialAd.loaded) {
            interstitialAd.show().catch(error => console.warn(error));
        }
    }

    setRef = (c) => {
        this.listRef = c;
    }

    scrollToIndex = (index, animated) => {
        this.listRef && this.listRef.scrollToIndex({ index, animated })
    }

    timer() {
        this.intervalPointer = setInterval(function () {
            const { sliderIndex, mSlider } = this.state
            let nextIndex = 0

            if (sliderIndex < mSlider) {
                nextIndex = sliderIndex + 1
            }

            this.scrollToIndex(nextIndex, true)
            this.setState({ sliderIndex: nextIndex })
        }.bind(this), 4000)
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        if (this.intervalPointer) {
            clearInterval(this.intervalPointer)
        }
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    setData() {
        this.setState({
            data: this.state.data
        })
    }

    onScroll(e) {
        // Get progress by dividing current FlatList X offset with full FlatList width
        if (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) {
            const { mSlider } = this.state
            this.setState({ adProgress: e.nativeEvent.contentOffset.x / (mSlider * SCREEN_WIDTH) })
            // console.log('check X position =', e.nativeEvent.contentOffset.x)
        }
    };

    async getB2BAd() {
        let writeType = await getItemFromAsync('my_timeline_write');
        let modiId = await getItemFromAsync('modi_id');
        let removeId = await getItemFromAsync('remove_id');

        const self = this
        let url = global.server + `/api/advertise/adver_list`

        let timelineUrl = global.server + '/api/timeline/my_timeline2'

        var timelineBodyFormData = new FormData();
        timelineBodyFormData.append('member_id', global.user.id);
        timelineBodyFormData.append('keyword', this.state.keyword)
        timelineBodyFormData.append('page', this.state.page);
        console.log('check form:', bodyFormData)

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        axios.all([axios.get(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }), axios.post(timelineUrl, timelineBodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })])
            .then(axios.spread((firstResponse, secondResponse) => {
                if (firstResponse.data.result === 'ok') {
                    this.setState({ b2bAd: firstResponse.data.advers }, () => {
                    })

                    var imageA = firstResponse.data.advers
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
                            //   Image.getSize(aImg.image, (width, height) => {
                            //     console.log('b2bImage height', height)
                            //   })
                        })
                        console.log('b2bImage =', aImg)

                        this.setState({ b2bImageUri: aImg, mSlider: aImg.length - 1 })
                    }
                } else {
                    Toast.show(`${Translate('occur_error')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('occur_error')}`)
                }

                if (secondResponse.data.result === 'ok') {
                    console.log("myTimeline", secondResponse.data.current_page);
                    var shuffle = require('shuffle-array')
                    let timeline = [...this.state.myTimeList]
                    if (this.state.page === 1) {
                        if (this.state.b2bImageUri.length > 0 && this.state.b2bAd.length > 0) {
                            timeline = ['']
                        } else {
                            timeline = []
                        }


                        secondResponse.data.data.map((item) => {
                            timeline = timeline.concat(item)
                        })

                    } else {
                        if (writeType === 'registration' || writeType === 'modi' || writeType === 'remove') {
                            if (this.state.b2bImageUri.length > 0 && this.state.b2bAd.length > 0) {
                                timeline = ['']
                            } else {
                                timeline = []
                            }
                            secondResponse.data.data.map((item) => {
                                timeline = timeline.concat(item)
                            });
                            setItemToAsync('my_timeline_write', '')
                            // } else if (writeType === 'modi') {
                            //     for (var i = 0; i < timeline.length; i++) {
                            //         if (timeline[i].id === modiId) {
                            //             timeline[i] = global.detailTimseline
                            //         }
                            //     }
                            //     console.log('modi: ', timeline)
                            //     setItemToAsync('my_timeline_write', '')
                        // } else if (writeType === 'remove') {
                        //     console.log('remove 들어옴 222222')

                        //     timeline = timeline.filter((item) => removeId !== item.id)
                        //     setItemToAsync('my_timeline_write', '')
                        }
                    }

                    console.log('timeline: ', timeline)
                    this.setState({
                        myTimeList: timeline,
                        endPage: secondResponse.data.last_page,
                        isLoading: false,
                        isDataLoading: true,
                        isReLoading: false
                    })
                }
            }).bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('b2bError =', error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false, isDataLoading: true })
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

    async getMyTimeLine(isUpdate) {
        let writeType = await getItemFromAsync('my_timeline_write');
        let modiId = await getItemFromAsync('modi_id');
        let removeId = await getItemFromAsync('remove_id');
        let friends = await getItemFromAsync('friends')

        let url = global.server + '/api/timeline/my_timeline2'
        const self = this;

        console.log('person page: ', this.state.page)

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('keyword', this.state.keyword)
        bodyFormData.append('page', this.state.page);
        console.log('check form:', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                if (response.data.result === 'ok') {
                    if (response.data.data === '' || response.data.data === null) {
                        this.setState({ page: this.state.page - 1 })
                    }
                    var shuffle = require('shuffle-array')
                    let timeline = [...this.state.myTimeList]
                    if (writeType === 'registration' || writeType === 'modi' || writeType === 'remove') {
                        if (this.state.b2bImageUri.length > 0 && this.state.b2bAd.length > 0) {
                            timeline = ['']
                        } else {
                            timeline = []
                        }
                        response.data.data.map((item) => {
                            timeline = timeline.concat(item)
                        });
                        console.log('regist qna')
                        // this.refs._scrollView.scrollTo(0);
                        setItemToAsync('my_timeline_write', '')
                        // } else if (writeType === 'modi') {
                        //     for (var i = 0; i < timeline.length; i++) {
                        //         if (timeline[i].id === modiId) {
                        //             timeline[i] = global.detailTimeline
                        //         }
                        //     }
                        //     console.log('modi: ', timeline)
                        //     setItemToAsync('my_timeline_write', '')
                    // } else if (writeType === 'remove') {
                    //     console.log('remove 들어옴 11111')
                    //     timeline = timeline.filter((item) => removeId !== item.id)
                    //     setItemToAsync('my_timeline_write', '')
                    } else {
                        if (friends === 'delete') {
                            if (this.state.b2bImageUri.length > 0 && this.state.b2bAd.length > 0) {
                                timeline = ['']
                            } else {
                                timeline = []
                            }
                            response.data.data.map((item) => {
                                timeline = timeline.concat(item)
                            });

                            // this.refs._scrollView.scrollTo(0);
                            setItemToAsync('friends', '')
                        } else if (this.state.page === 1) {
                            if (this.state.b2bImageUri.length > 0 && this.state.b2bAd.length > 0) {
                                timeline = ['']

                            } else {
                                timeline = []
                            }

                            response.data.data.map((item) => {
                                timeline = timeline.concat(item)
                            })

                        } else {
                            response.data.data.map((item) => {
                                timeline = timeline.concat(item)
                            })
                        }
                    }

                    console.log('timeline: ', response.data.last_page)
                    this.setState({
                        myTimeList: timeline,
                        initTimeList: timeline,
                        endPage: response.data.last_page,
                        isLoading: false,
                        isDataLoading: true,
                        isReLoading: false
                    })
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
                self.setState({ isLoading: false, isDataLoading: false })
            });
    }

    getBackgroundImage(item) {
        // console.log('images: ', item.images[0])
        if (item.images.length > 0) {
            if (item.images[0].video_path === null) {
                return { uri: global.server + item.images[0].image_uri }
            } else {
                // this.getBackgroundVideo(global.server + item.images[0].video_path)
                return null
            }
        } else {
            return require('../../images/time_bg.png')
        }
    }

    // async getBackgroundVideo(uri) {
    //     const fileName = uri.split('/').pop()
    //     const destPath = RNFetchBlob.fs.dirs.DocumentDir + '/' + fileName;
    //     console.log('destPath: ', destPath)
    //     const config = {
    //         fileCache: true,
    //         path: destPath,
    //     };

    //     await RNFetchBlob.config(config)
    //         .fetch('GET', uri)
    //         .then(async (res) => {
    //             console.log('res: ', res.path())
    //             return { uri: `file://${res.path()}` }
    //             // await RNFetchBlob.fs.stat(res.path())
    //             //     .then((stats) => {
    //             //         console.log('stats', stats)
    //             //         return { uri: `file://${stats.path}` }
    //             //     })
    //             //     .catch((err) => {
    //             //         console.log('error =', err)
    //             //     })
    //         })
    // }

    handleLoad = (meta) => {
        this.setState({
            duration: meta.duration,
            paused: false
        }, () => {
            console.log('du?', this.state.duration)
        })
    }

    handleProgress = (progress) => {
        var pg = parseFloat(progress.currentTime / this.state.duration)
        if (pg > 0.92) {
            pg = 1
        }

        this.setState({
            progress: pg
        });
    }

    handleEnd = () => {
        this.setState({ paused: true }, () => this.player.seek(0))
    }

    setColumn(index) {
        let numberColumn

        if (index === 0 || index % 7 === 0 || index % 7 === 3) {
            numberColumn = 1
        } else if (index % 7 === 1 || index % 7 === 2) {
            numberColumn = 2
        } else {
            numberColumn = 3
        }

        return numberColumn
    }

    onScrollPage = ({ layoutMeasurement, contentOffset, contentSize }) => {
        let itemSize = layoutMeasurement.height;
        let scrollY = contentOffset.y
        let totSize = contentSize.height
        let currentIndex = (scrollY / (SCREEN_WIDTH * 0.24))

        console.log('currentIndex: ', parseInt(currentIndex))

        this.setState({ isTop: (parseInt(currentIndex) === 0) || (parseInt(currentIndex) === 1) ? true : false, currentIndex: parseInt(currentIndex), scrollY: scrollY })

        return itemSize + scrollY >= totSize - 30;
    }

    updatePage() {
        this.setState({ page: this.state.page + 1, isLoading: true, isReLoading: true, isScrollTop: false }, () => {
            console.log(this.state.page);
            this.getMyTimeLine(true);
        });
    }

    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;

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
                                        <View style={{
                                            // width: '86%',
                                            // height: '25.6%',
                                            flexDirection: 'row',
                                            justifyContent: 'space-around',
                                            marginTop: SCREEN_HEIGHT * 0.20 * 0.4
                                        }}>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    console.log('방문한 국가 클릭');
                                                    this.setState({ isMoveScreen: true }, () => {
                                                        navigation.navigate('Visited');
                                                    })
                                                }}>
                                                <View style={{
                                                    flex: 0.25,
                                                    backgroundColor: 'transparent',
                                                    // marginRight: SCREEN_WIDTH * 0.1,
                                                    // marginLeft: SCREEN_WIDTH * 0.1,
                                                }}>
                                                    <Text adjustsFontSizeToFit
                                                        style={{
                                                            fontSize: SCREEN_HEIGHT * 0.015,
                                                            textAlign: 'center',
                                                            color: '#fff',
                                                            justifyContent: 'flex-end',
                                                            marginTop: 14,
                                                            fontWeight: '400',
                                                            marginLeft: global.lang === 'en' ? 12 : global.lang === 'ko' ? 0 : global.lang === 'ja' ? 12 : 10,
                                                        }}>{Translate('activity_visit_visited2')}</Text>
                                                    <Image
                                                        source={require('../../images/visit_city.png')}
                                                        style={{
                                                            width: 16,
                                                            height: 20,
                                                            position: 'absolute',
                                                            justifyContent: 'flex-start',
                                                            marginLeft: global.lang === 'ko' ? 10 : 0
                                                        }}
                                                        resizeMode={'contain'} />
                                                </View>
                                            </TouchableWithoutFeedback>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    global.isClickTravelStyle = true;

                                                    this.props.navigation.dispatch(NavigationActions.navigate({ routeName: '개인타임라인' }));
                                                    this.props.navigation.navigate('설정');
                                                }}>
                                                <View style={{
                                                    flex: 0.25,
                                                    backgroundColor: 'transparent',
                                                    // marginRight: SCREEN_WIDTH * 0.1
                                                }}>
                                                    <Text adjustsFontSizeToFit
                                                        style={{
                                                            fontSize: SCREEN_HEIGHT * 0.015,
                                                            textAlign: 'center',
                                                            color: '#fff',
                                                            justifyContent: 'flex-end',
                                                            marginTop: 14,
                                                            fontWeight: '400',
                                                            marginLeft: global.lang === 'en' ? 8 : global.lang === 'ko' ? 0 : global.lang === 'ja' ? 16 : 12
                                                        }}>{Translate('fragment_solo_style')}</Text>
                                                    <Image
                                                        source={require('../../images/op_ss.png')}
                                                        style={{
                                                            width: 16,
                                                            height: 22,
                                                            position: 'absolute',
                                                            justifyContent: 'flex-start',
                                                        }}
                                                        resizeMode={'contain'} />
                                                </View>
                                            </TouchableWithoutFeedback>
                                            {/* 페이지와 렌더링될 리스트 초기화 */}
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    //this.setState({ isMoveScreen: true, page: 1, myTimeList: [], currentIndex: 0, endPage: 0 }, () => {
                                                    this.setState({ isMoveScreen: true }, () => {
                                                        navigation.navigate('Write', {
                                                            qnaId: '',
                                                            modiImages: [],
                                                            modiData: [],
                                                            isModi: false
                                                        });
                                                    })
                                                }}>
                                                <View style={{
                                                    flex: 0.25,
                                                    backgroundColor: 'transparent',

                                                    // marginRight: SCREEN_WIDTH * 0.1,
                                                }}>
                                                    <Text adjustsFontSizeToFit
                                                        style={{
                                                            fontSize: SCREEN_HEIGHT * 0.015,
                                                            textAlign: 'center',
                                                            color: '#fff',
                                                            justifyContent: 'flex-end',
                                                            marginTop: 14,
                                                            fontWeight: '400',
                                                            marginLeft: global.lang === 'en' ? 16 : global.lang === 'ja' ? 20 : 0
                                                        }}>{Translate('fragment_solo_addnote')}</Text>
                                                    <Image
                                                        source={require('../../images/paper_air.png')}
                                                        style={{
                                                            width: 23,
                                                            height: 26,
                                                            position: 'absolute',
                                                            justifyContent: 'flex-start',
                                                        }}
                                                        resizeMode={'contain'} />
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                        <View style={styles.searchContainer}>
                                            <TextInput
                                                style={styles.input}
                                                underlineColorAndroid="transparent"
                                                placeholder={Translate('searchkeyword')}
                                                placeholderTextColor="rgba(255,255,255,0.5)"
                                                textAlign={'center'}
                                                textAlignVertical={'center'}
                                                autoCapitalize="none"
                                                returnKeyType="done"
                                                onChangeText={(text) => this.setState({ keyword: text })}
                                                onSubmitEditing={() => {
                                                    this.setState({ isScrollTop: true }, () => {
                                                        this.getMyTimeLine(false);
                                                    })
                                                }}
                                            />
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    // navigation.navigate('CardDetail', { id: 0 })
                                                    this.setState({ isScrollTop: true }, () => {
                                                        this.getMyTimeLine(false);
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
                                {/* <ScrollView style={{ flex: 1 }} scrollEnabled={true}> */}
                                {
                                    this.state.myTimeList.length > 2 ?
                                        <ScrollView
                                            onScroll={({ nativeEvent }) => {
                                                if (this.onScrollPage(nativeEvent)) {
                                                    //do something
                                                    console.log('lastPage', this.state.endPage)
                                                    console.log('currentPage', this.state.page)
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
                                            ref='_scrollView'
                                        >
                                            <FlatList
                                                data={this.state.myTimeList}
                                                // onMoveBegin={() => this.setState({ scrollEnabled: false })}
                                                // dragItemOverflow={true}
                                                // activationDistance={12}
                                                key={this.state.myTimeList.length}
                                                renderItem={({ item, index }) => {
                                                    return (
                                                        <View style={{
                                                            width: this.setColumn(index) === 1 ? SCREEN_WIDTH - 20 : this.setColumn(index) === 2 ? (SCREEN_WIDTH - 30) / 2 : this.setColumn(index) === 3 ? (SCREEN_WIDTH - 40) / 3 : SCREEN_WIDTH - 20,
                                                            height: SCREEN_WIDTH * 0.24,
                                                            backgroundColor: '#e7eaed',
                                                            marginTop: 10,
                                                            borderRadius: 10,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            flexWrap: 'wrap',
                                                            marginLeft: 10,
                                                        }}>
                                                            <TouchableOpacity
                                                                style={{ flex: 1 }}
                                                                onPress={() => {
                                                                    this.setState({ isMoveScreen: true }, () => {
                                                                        this.props.navigation.navigate('CardDetail', { id: item.id })
                                                                    })
                                                                }}>
                                                                <View style={{
                                                                    flex: 1,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                }}>
                                                                    {
                                                                        index === 0 ? (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) ?
                                                                            <ScrollView
                                                                                showsVerticalScrollIndicator={false}
                                                                                scrollEnabled={false}>
                                                                                <View style={{ height: '100%', width: '100%', overflow: 'hidden', borderRadius: 10 }}>
                                                                                    <FlatList
                                                                                        ref={this.setRef}
                                                                                        horizontal
                                                                                        onScrollToIndexFailed={info => {
                                                                                            if (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) {
                                                                                                const wait = new Promise(resolve => setTimeout(resolve, 500));
                                                                                                wait.then(() => {
                                                                                                    flatList.current?.scrollToIndex({ index: info.index, animated: true });
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        showsHorizontalScrollIndicator={false}
                                                                                        pagingEnabled
                                                                                        onScroll={this.onScroll}
                                                                                        keyExtractor={item => item._id}
                                                                                        onMomentumScrollEnd={(event) => {
                                                                                            if (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) {
                                                                                                console.log('check X=', event.nativeEvent.contentOffset.x)
                                                                                                let sliderIndex = event.nativeEvent.contentOffset.x ? event.nativeEvent.contentOffset.x / (Platform.OS === 'ios' ? SCREEN_WIDTH - 20 : SCREEN_WIDTH) : 0
                                                                                                this.setState({ sliderIndex })
                                                                                            }
                                                                                        }}
                                                                                        data={this.state.b2bAd.length === 0 ? null : this.state.b2bImageUri}
                                                                                        renderItem={({ item, key }) => (
                                                                                            <View style={{
                                                                                                backgroundColor: '#fff'
                                                                                            }} >
                                                                                                <TouchableWithoutFeedback
                                                                                                    onPress={() => {
                                                                                                        Linking.openURL(item.link)
                                                                                                    }}>
                                                                                                    <Image
                                                                                                        key={key}
                                                                                                        style={{
                                                                                                            width: SCREEN_WIDTH - 20,
                                                                                                            height: SCREEN_WIDTH * 0.24, alignSelf: 'center'
                                                                                                        }}
                                                                                                        resizeMode='cover'
                                                                                                        source={{ uri: item.image }}
                                                                                                    />
                                                                                                </TouchableWithoutFeedback>
                                                                                            </View>
                                                                                        )}
                                                                                    />
                                                                                </View>
                                                                            </ScrollView> : <ImageBackground
                                                                                resizeMode={'cover'}
                                                                                style={{ flex: 1, height: '100%', width: '100%' }}
                                                                                imageStyle={{ borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                                                                                source={this.getBackgroundImage(item)}>
                                                                                <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10 }}>
                                                                                    {
                                                                                        (item.images.length > 0 && item.images[0].image_uri === null) && <Video source={{ uri: global.server + item.images[0].video_path }}
                                                                                            ref={(ref) => {
                                                                                                this.player = ref
                                                                                            }}
                                                                                            onBuffer={this.onBuffer}
                                                                                            muted={true}
                                                                                            volume={0.0}
                                                                                            paused={this.state.paused}
                                                                                            onLoad={this.handleLoad}
                                                                                            repeat={false}
                                                                                            //    repeat={this.state.paused ? true : false}
                                                                                            onProgress={this.handleProgress}
                                                                                            onEnd={this.handleEnd}
                                                                                            resizeMode='stretch'
                                                                                            onError={this.videoError}
                                                                                            minLoadRetryCount={3}
                                                                                            style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 10 }} />
                                                                                    }
                                                                                    <Text
                                                                                        style={{
                                                                                            color: '#fff', marginTop: 8, marginLeft: 10, marginRight: 10, fontSize: normalize(12), flex: 1
                                                                                        }}
                                                                                        numberOfLines={1}
                                                                                        ellipsizeMode={'tail'}
                                                                                    >{item?.contents}</Text>
                                                                                    <View style={{ position: 'absolute', bottom: 0, width: '100%', marginTop: 10, marginBottom: 10, marginHorizontal: 10, paddingRight: 10 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                color: '#fff', fontSize: normalize(10), flex: 1
                                                                                            }}
                                                                                            numberOfLines={1}
                                                                                            ellipsizeMode={'tail'}
                                                                                        >{`${item.place_name}, ${item.cost_str}`}</Text>
                                                                                        {
                                                                                            global.lang === 'ko' ?
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                    }}
                                                                                                    numberOfLines={1}
                                                                                                    ellipsizeMode={'tail'}
                                                                                                >{Moment(item.created_at).format('YYYY.MM.DD A hh:mm')}</Text> :
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                    }}
                                                                                                    numberOfLines={1}
                                                                                                    ellipsizeMode={'tail'}
                                                                                                >{Moment(item.created_at).format('YYYY.MM.DD hh:mm A')}</Text>

                                                                                        }
                                                                                    </View>
                                                                                </View>
                                                                            </ImageBackground>
                                                                            : <ImageBackground
                                                                                resizeMode={'cover'}
                                                                                style={{ flex: 1, height: '100%', width: '100%' }}
                                                                                imageStyle={{ borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                                                                                source={this.getBackgroundImage(item)}>
                                                                                <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10 }}>
                                                                                    {
                                                                                        (item.images.length > 0 && item.images[0].image_uri === null) && <Video source={{ uri: global.server + item.images[0].video_path }}
                                                                                            ref={(ref) => {
                                                                                                this.player = ref
                                                                                            }}
                                                                                            onBuffer={this.onBuffer}
                                                                                            muted={true}
                                                                                            volume={0.0}
                                                                                            paused={this.state.paused}
                                                                                            onLoad={this.handleLoad}
                                                                                            repeat={false}
                                                                                            onProgress={this.handleProgress}
                                                                                            onEnd={this.handleEnd}
                                                                                            resizeMode='stretch'
                                                                                            onError={this.videoError}
                                                                                            style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 10 }} />
                                                                                    }
                                                                                    <Text
                                                                                        style={{
                                                                                            color: '#fff', marginTop: 8, marginLeft: 10, marginRight: 10, fontSize: normalize(12), flex: 1
                                                                                        }}
                                                                                        numberOfLines={1}
                                                                                        ellipsizeMode={'tail'}
                                                                                    >{item?.contents}</Text>
                                                                                    <View style={{ position: 'absolute', bottom: 0, width: '100%', marginTop: 10, marginBottom: 10, marginHorizontal: 10, paddingRight: 10 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                color: '#fff', fontSize: normalize(10), flex: 1
                                                                                            }}
                                                                                            numberOfLines={1}
                                                                                            ellipsizeMode={'tail'}
                                                                                        >{`${item.place_name}, ${item.cost_str}`}</Text>
                                                                                        {
                                                                                            global.lang === 'ko' ?
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                    }}
                                                                                                    numberOfLines={1}
                                                                                                    ellipsizeMode={'tail'}
                                                                                                >{Moment(item.created_at).format('YYYY.MM.DD A hh:mm')}</Text> :
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                    }}
                                                                                                    numberOfLines={1}
                                                                                                    ellipsizeMode={'tail'}
                                                                                                >{Moment(item.created_at).format('YYYY.MM.DD hh:mm A')}</Text>

                                                                                        }
                                                                                    </View>
                                                                                </View>
                                                                            </ImageBackground>
                                                                    }
                                                                </View>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )
                                                }
                                                }
                                                keyExtractor={(item, index) => item}
                                                onDragEnd={({ data }) => this.setState({ myTimeList: data })}
                                                columnWrapperStyle={{ flexWrap: 'wrap', flex: 1 }}
                                                numColumns={this.state.myTimeList.length}
                                                horizontal={false}
                                            // scrollingContainerOffset={this.state.scrollOffset}
                                            // scrollEventThrottle={1}
                                            // onScrollOffsetChange={({ nativeEvent }) => {
                                            //     console.log('nativeEvent: ', nativeEvent)
                                            //     if (this.onScrollPage(nativeEvent)) {
                                            //         //do something
                                            //         // console.log('lastPage', this.state.endPage)
                                            //         // console.log('currentPage', this.state.page)
                                            //         if (this.state.page <= this.state.endPage) {
                                            //             if (!this.state.isReLoading) {
                                            //                 this.updatePage();
                                            //             }
                                            //         }
                                            //     }
                                            // }}
                                            />
                                        </ScrollView> : <ScrollView
                                            nScroll={({ nativeEvent }) => {
                                                if (this.onScrollPage(nativeEvent)) {
                                                    //do something
                                                    // console.log('lastPage', this.state.endPage)
                                                    // console.log('currentPage', this.state.page)
                                                    if (this.state.endPage > 0) {
                                                        if (!this.state.isReLoading && this.state.page !== this.state.endPage) {
                                                            this.updatePage();
                                                        }
                                                    }
                                                }
                                            }}
                                            style={{ display: 'flex' }}
                                            horizontal={false}
                                            showsVerticalScrollIndicator={false}
                                            scrollEventThrottle={1}
                                        >
                                            <FlatList
                                                data={this.state.myTimeList}
                                                // onMoveBegin={() => this.setState({ scrollEnabled: false })}
                                                // dragItemOverflow={true}
                                                // activationDistance={12}
                                                key={this.state.myTimeList.length}
                                                renderItem={({ item, index }) => {
                                                    return (
                                                        <View style={{
                                                            width: this.setColumn(index) === 1 ? SCREEN_WIDTH - 20 : this.setColumn(index) === 2 ? (SCREEN_WIDTH - 30) / 2 : this.setColumn(index) === 3 ? (SCREEN_WIDTH - 40) / 3 : SCREEN_WIDTH - 20,
                                                            height: SCREEN_WIDTH * 0.24,
                                                            backgroundColor: '#e7eaed',
                                                            marginTop: 10,
                                                            borderRadius: 10,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            flexWrap: 'wrap',
                                                            marginLeft: 10,
                                                        }}>
                                                            <TouchableOpacity
                                                                style={{ flex: 1 }}
                                                                onPress={() => {
                                                                    this.setState({ isMoveScreen: true }, () => {
                                                                        this.props.navigation.navigate('CardDetail', { id: item.id })
                                                                    })
                                                                }}>
                                                                <View style={{
                                                                    flex: 1,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                }}>
                                                                    {
                                                                        index === 0 ? (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) ?
                                                                            <ScrollView
                                                                                showsVerticalScrollIndicator={false}
                                                                                scrollEnabled={false}>
                                                                                <View style={{ height: '100%', width: '100%', overflow: 'hidden', borderRadius: 10 }}>
                                                                                    <FlatList
                                                                                        ref={this.setRef}
                                                                                        horizontal
                                                                                        onScrollToIndexFailed={info => {
                                                                                            if (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) {
                                                                                                const wait = new Promise(resolve => setTimeout(resolve, 500));
                                                                                                wait.then(() => {
                                                                                                    flatList.current?.scrollToIndex({ index: info.index, animated: true });
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        showsHorizontalScrollIndicator={false}
                                                                                        pagingEnabled
                                                                                        onScroll={this.onScroll}
                                                                                        keyExtractor={item => item._id}
                                                                                        onMomentumScrollEnd={(event) => {
                                                                                            if (this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0) {
                                                                                                console.log('x position?', event.nativeEvent.contentOffset.x)
                                                                                                let sliderIndex = event.nativeEvent.contentOffset.x ? event.nativeEvent.contentOffset.x / (Platform.OS === 'ios' ? SCREEN_WIDTH - 20 : SCREEN_WIDTH) : 0
                                                                                                this.setState({ sliderIndex })
                                                                                            }
                                                                                        }}
                                                                                        data={this.state.b2bAd.length === 0 ? null : this.state.b2bImageUri}
                                                                                        renderItem={({ item, key }) => (
                                                                                            <View style={{
                                                                                                backgroundColor: '#fff'
                                                                                            }}>
                                                                                                <TouchableWithoutFeedback
                                                                                                    onPress={() => {
                                                                                                        Linking.openURL(item.link)
                                                                                                    }}>
                                                                                                    <Image
                                                                                                        key={key}
                                                                                                        style={{
                                                                                                            width: SCREEN_WIDTH - 20,
                                                                                                            height: SCREEN_WIDTH * 0.24, alignSelf: 'center'
                                                                                                        }}
                                                                                                        resizeMode={'cover'}
                                                                                                        source={{ uri: item.image }}
                                                                                                    />
                                                                                                </TouchableWithoutFeedback>
                                                                                            </View>
                                                                                        )}
                                                                                    />
                                                                                </View>
                                                                            </ScrollView> : <ImageBackground
                                                                                resizeMode={'cover'}
                                                                                style={{ flex: 1, height: '100%', width: '100%' }}
                                                                                imageStyle={{ borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                                                                                source={this.getBackgroundImage(item)}>
                                                                                <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, paddingRight: 10 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            color: '#fff', marginTop: 8, marginLeft: 10, marginRight: 10, fontSize: normalize(12), flex: 1
                                                                                        }}
                                                                                        numberOfLines={2}
                                                                                        ellipsizeMode={'tail'}
                                                                                    >{item?.contents}</Text>

                                                                                    <View style={{ position: 'absolute', bottom: 0, width: '100%', marginTop: 10, marginBottom: 10, marginHorizontal: 10 }}>
                                                                                        <Text
                                                                                            style={{
                                                                                                color: '#fff', fontSize: normalize(10), flex: 1
                                                                                            }}
                                                                                            numberOfLines={1}
                                                                                            ellipsizeMode={'tail'}
                                                                                        >{`${item.place_name}, ${item.duration}, ${item.cost_str}`}</Text>
                                                                                        {
                                                                                            global.lang === 'ko' ?
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                    }}
                                                                                                    numberOfLines={1}
                                                                                                    ellipsizeMode={'tail'}
                                                                                                >{Moment(item.created_at).format('YYYY.MM.DD A hh:mm')}</Text> :
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                    }}
                                                                                                    numberOfLines={1}
                                                                                                    ellipsizeMode={'tail'}
                                                                                                >{Moment(item.created_at).format('YYYY.MM.DD hh:mm A')}</Text>

                                                                                        }
                                                                                    </View>
                                                                                </View>
                                                                            </ImageBackground> : <ImageBackground
                                                                                resizeMode={'cover'}
                                                                                style={{ flex: 1, height: '100%', width: '100%' }}
                                                                                imageStyle={{ borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                                                                                source={this.getBackgroundImage(item)}>
                                                                            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, paddingRight: 10 }}>
                                                                                <Text
                                                                                    style={{
                                                                                        color: '#fff', marginTop: 8, marginLeft: 10, marginRight: 10, fontSize: normalize(12), flex: 1
                                                                                    }}
                                                                                    numberOfLines={2}
                                                                                    ellipsizeMode={'tail'}
                                                                                >{item?.contents}</Text>
                                                                                <View style={{ position: 'absolute', bottom: 0, width: '100%', marginTop: 10, marginBottom: 10, marginHorizontal: 10 }}>
                                                                                    <Text
                                                                                        style={{
                                                                                            color: '#fff', fontSize: normalize(10), flex: 1
                                                                                        }}
                                                                                        numberOfLines={1}
                                                                                        ellipsizeMode={'tail'}
                                                                                    >{`${item.place_name}, ${item.duration}, ${item.cost_str}`}</Text>
                                                                                    {
                                                                                        global.lang === 'ko' ?
                                                                                            <Text
                                                                                                style={{
                                                                                                    color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                }}
                                                                                                numberOfLines={1}
                                                                                                ellipsizeMode={'tail'}
                                                                                            >{Moment(item.created_at).format('YYYY.MM.DD A hh:mm')}</Text> :
                                                                                            <Text
                                                                                                style={{
                                                                                                    color: '#fff', fontSize: normalize(10), flex: 1
                                                                                                }}
                                                                                                numberOfLines={1}
                                                                                                ellipsizeMode={'tail'}
                                                                                            >{Moment(item.created_at).format('YYYY.MM.DD hh:mm A')}</Text>

                                                                                    }
                                                                                </View>
                                                                            </View>
                                                                        </ImageBackground>
                                                                    }
                                                                </View>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )
                                                }
                                                }
                                                keyExtractor={(item, index) => item}
                                                // onDragEnd={({ data }) => this.setState({ myTimeList: data })}
                                                columnWrapperStyle={{ flexWrap: 'wrap', flex: 1 }}
                                                numColumns={4}
                                                horizontal={false}
                                            />
                                        </ScrollView>
                                }
                                {/* </ScrollView> */}
                                {/* {this.state.myTimeList.map(data => 
                            <View style={styles.item}>
                     <TouchableOpacity 
                     onPress={() => {this.props.navigation.navigate('CardDetail',{id:data.id})}}>
                     <View style={{flex:1}}>
                     <ImageBackground
                         resizeMode ={'cover'}
                 style ={{flex:1, width: SCREEN_WIDTH*0.944,height: '100%'}}
          imageStyle={{borderRadius: 10, justifyContent:'center',alignItems:'center'}}
          source = {require('../../images/time_bg.png')}>
          <View style={{ flex: 1, width: '100%' , backgroundColor: 'rgba(0,0,0,0.4)',borderRadius :10 }}>
          <Text
           style = {{color:'#fff', marginTop:8, marginLeft:10, marginRight:10, height:SCREEN_HEIGHT*0.03}}
           >{data.contents}</Text>
            <Text
           style = {{color:'#fff', marginTop:10, marginLeft:10, marginRight:10,}}
           >{data.place_name}</Text>
            <Text
           style = {{color:'#fff', marginTop :2, marginLeft:10, marginRight:10,}}
           >{data.created_at}</Text>
          </View>
            </ImageBackground>
            </View>
          </TouchableOpacity>
        </View>
                        )} */}
                                {
                                    this.state.b2bAd.length > 0 && this.state.b2bImageUri.length > 0 ? (((this.state.myTimeList.length === 1 || this.state.myTimeList.length === 0) && this.state.isDataLoading) && <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', position: 'absolute', alignSelf: 'center', marginTop: '50%' }}>
                                        <Text style={{ color: 'black', fontSize: normalize(16), marginHorizontal: '2%', alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('createNewTime')}</Text>
                                    </View>) : (this.state.myTimeList.length === 0 && this.state.isDataLoading) && <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', position: 'absolute', alignSelf: 'center', marginTop: '50%' }}>
                                        <Text style={{ color: 'black', fontSize: normalize(16), marginHorizontal: '2%', alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('createNewTime')}</Text>
                                    </View>
                                }
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
        ); a
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e7eaed'
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
        height: SCREEN_HEIGHT * 0.20,
        backgroundColor: '#fff'
    },
    contentContainer: {
        flex: 420,
        backgroundColor: '#e8eaed',
        marginTop: 10,
        marginBottom: 10,
        flexDirection: 'column',
        // flexWrap:'wrap'
    },
    imgContainer: {
        flex: 1,
        backgroundColor: 'rgba(61,96,110,0.5)',
        justifyContent: 'flex-start'
    },
    buttonContainer: {
        // width: '86%',
        // height: '25.6%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: '10%'
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
    stateContainer: {
        backgroundColor: 'transparent',
        marginRight: SCREEN_WIDTH * 0.1,
        marginLeft: SCREEN_WIDTH * 0.1,
    },
    styleContainer: {
        backgroundColor: 'transparent',
        marginRight: SCREEN_WIDTH * 0.1
    },
    writeContainer: {
        backgroundColor: 'transparent',
        marginRight: SCREEN_WIDTH * 0.1,
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
    stateText: {
        fontSize: normalize(12),
        textAlign: 'center',
        color: '#fff',
        justifyContent: 'flex-end',
        marginTop: '14%',
        fontWeight: '400',
        marginLeft: Platform.OS === 'ios' ? '10%' : global.lang === 'en' ? '10%' : global.lang === 'ko' ? 0 : '5%'
    },
    styleText: {
        fontSize: normalize(11),
        textAlign: 'center',
        color: '#fff',
        justifyContent: 'flex-end',
        marginTop: '14%',
        fontWeight: '400',
        marginLeft: '12%'
    },
    writeText: {
        fontSize: normalize(11),
        textAlign: 'center',
        color: '#fff',
        justifyContent: 'flex-end',
        marginTop: '14%',
        fontWeight: '400',
        marginLeft: 19
    },
    stateImg: {
        width: '18%',
        height: '35%',
        position: 'absolute',
        justifyContent: 'flex-start',
    },
    styleImg: {
        width: '16%',
        height: '36%',
        position: 'absolute',
        justifyContent: 'flex-start',
    },
    writeImg: {
        width: 23,
        height: 26,
        position: 'absolute',
        justifyContent: 'flex-start',
    },
    item: {
        height: SCREEN_WIDTH * 0.24,
        backgroundColor: '#e7eaed',
        marginTop: 10,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },

});