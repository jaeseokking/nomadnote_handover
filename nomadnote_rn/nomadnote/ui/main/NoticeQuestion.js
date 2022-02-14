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
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';

import axios from 'axios';
import moment from 'moment-timezone';
import LinearGradient from 'react-native-linear-gradient';
import AppStatusBar from '../../components/AppStatusBar';
import CustomHeader from '../../components/CustomHeader';
import SetI18nConfig from '../../languages/SetI18nConfig';
import DeviceInfo from 'react-native-device-info';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import {
    TestIds, InterstitialAd, AdEventType, BannerAd,
    BannerAdSize
} from '@react-native-firebase/admob';
import { formatTimeByOffset } from '../../utils/Utils';

const THEME_COLOR = '#375a64'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
const unitId =
    Platform.OS === 'ios'
        ? 'ca-app-pub-5097070292431028/6211013887'
        : 'ca-app-pub-5097070292431028/1602847519'
// const interstitialAd = InterstitialAd.createForAdRequest(unitId);
const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - 30;
}

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class NoticeQuestion extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        this.handleBackButton = this.handleBackButton.bind(this);

        this.state = {
            questList: '',
            page: 1,
            currentDate: '',
            endPage: 0,
            isMoreQuest: false,
            friendsInfo: [],
            isDataLoading: false,
            isLoading: true
        };
    }

    componentDidMount() {

        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        this.willFocusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
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

                if (this.state.isMoreQuest) {
                } else {
                    this.getUserQuestion()
                    this.getRequestFriends()
                }
            }
        );
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
            return true
        }
    };

    showAd() {
        if (interstitialAd.loaded) {
            interstitialAd.show().catch(error => console.warn(error));
        }
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

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    updatePage() {
        this.setState({ isMoreQuest: true, page: this.state.page + 1, isLoading: true }, () => {
            this.getUserQuestion()
        });
    }

    getUserQuestion() {
        let url = global.server + '/api/qnas/get_qnas'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('page', this.state.page);
        console.log('memberId = ', global.user.id)
        console.log('setPage', this.state.page)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("questReturn!", response.data.qnas);

                if (this.state.page === 1) {
                    this.setState({ questList: [] })
                }

                this.setState({
                    questList: this.state.isMoreQuest ? this.state.questList.concat(response.data.qnas.data)
                        : response.data.qnas.data,
                    endPage: response.data.qnas.last_page,
                    isDataLoading: true,
                    isLoading: false
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

    getTime(createdAt) {
        var a = moment();
        var create = moment(createdAt).format("YYYY-MM-DD HH:mm:ss");

        const koreaTime = moment.tz('Asia/Seoul');

        const currentTimeZone = RNLocalize.getTimeZone();
        const today = moment(create).tz(currentTimeZone);
        const currentTimeZoneOffsetInHours = today.utcOffset() / 60
        const koreaTimeZoneOffsetInHours = koreaTime.utcOffset() / 60

        const convertedToLocalTime = formatTimeByOffset(
            moment(today).format("YYYY-MM-DD HH:mm:ss"),
            currentTimeZoneOffsetInHours - koreaTimeZoneOffsetInHours,
        );
        const formLocal = moment(convertedToLocalTime).format("YYYY-MM-DD HH:mm:ss")

        console.log('current time format: ', create, today, currentTimeZone)
        console.log('time format: ', formLocal)
        console.log('currentTimeZoneOffsetInHours: ', currentTimeZoneOffsetInHours, koreaTimeZoneOffsetInHours)

        let diff

        if (currentTimeZoneOffsetInHours === koreaTimeZoneOffsetInHours) {
            diff = a.diff(create, 'Hour')
        } else {
            diff = a.diff(formLocal, 'Hour')
        }

        if (diff > 23) {
            return parseInt(diff / 24) + 'D'
        } else {
            if (diff < 0) {
                return 0 + 'H'
            } else {
                return diff + 'H'
            }
        }
    }


    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;
        console.log('QuestList : ', this.state.questList);


        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <Image style={styles.logoImg} source={require('../../images/login_white_logo.png')} />
                            <View style={styles.textContainer}>
                                <Text style={styles.writeReply}>{Translate('writeReply')}</Text>
                            </View>
                        </LinearGradient>
                        <View style={{ marginTop: 20 }}>
                            {this.state.questList.length > 0 ?
                                <ScrollView
                                    onScroll={({ nativeEvent }) => {
                                        if (isCloseToBottom(nativeEvent)) {
                                            //do something
                                            console.log('scrollEnd')
                                            console.log('lastPage', this.state.endPage)
                                            console.log('currentPage', this.state.page)

                                            if (this.state.page <= this.state.endPage) {
                                                this.updatePage()
                                            }
                                        }
                                    }}
                                    style={{ display: 'flex' }}
                                    horizontal={false}
                                    showsVerticalScrollIndicator={false}>
                                    <View style={styles.scrollContainer}>
                                        <FlatList
                                            style={{ flex: 1, paddingBottom: SCREEN_WIDTH * 0.125 + 30 }}
                                            data={this.state.questList}
                                            renderItem={({ item, index }) => (
                                                <View style={styles.questContainer}>
                                                    <TouchableWithoutFeedback
                                                        onPress={() => {
                                                            (item.answer !== null) && (item.answer !== '') ?
                                                                navigate('CardDetail', { id: item.id }) :
                                                                navigation.navigate('Write', {
                                                                    qnaId: item.id,
                                                                    modiImages: [],
                                                                    modiData: [],
                                                                    isModi: false,
                                                                    isReply: true,
                                                                })
                                                        }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                            <View style={{
                                                                width: SCREEN_WIDTH * 0.105,
                                                                height: SCREEN_WIDTH * 0.105,
                                                                backgroundColor: this.getTime(item.created_at).slice(-1) === 'D' ? '#D8D8D8' : '#557f89',
                                                                borderRadius: SCREEN_WIDTH * 0.105 / 2,
                                                                marginLeft: 9,
                                                                justifyContent: 'center',
                                                                alignItems: 'center'
                                                            }}>
                                                                <Text
                                                                    style={{ fontSize: normalize(10), color: '#fff', alignSelf: 'center' }}
                                                                    numberOfLines={2}
                                                                    ellipsizeMode={'tail'}>{this.getTime(item.created_at)}</Text>
                                                            </View>
                                                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                                                <Text style={{ fontSize: normalize(12), color: '#4a4a4a', paddingLeft: 10 }} >{item.question}</Text>
                                                            </View>
                                                            <View style={styles.answerContainer}>
                                                                <TouchableOpacity onPress={() => {
                                                                    navigation.navigate('Write', {
                                                                        qnaId: item.id,
                                                                        modiImages: [],
                                                                        modiData: [],
                                                                        isModi: false,
                                                                        isReply: true,
                                                                    })
                                                                }}>
                                                                    <Text style={{ fontSize: normalize(11), color: '#f5cd04', fontWeight: 'bold' }}>{Translate('reply')}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </View>
                                            )}
                                            keyExtractor={item => item.id}>
                                        </FlatList>
                                    </View>
                                </ScrollView> : <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', alignSelf: 'center', marginTop: '50%' }}>
                                    <Text style={{ color: 'black', fontSize: normalize(12), alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('reply_bottom')}</Text>
                                </View>
                            }

                        </View>
                        {
                            (this.state.questList === null || this.state.questList === '') && this.state.isDataLoading ? <View style={{
                                alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column',
                                position: 'absolute', alignSelf: 'center', height: SCREEN_HEIGHT, width: SCREEN_WIDTH
                            }}>
                                <Text style={{
                                    color: 'black', fontSize: normalize(16), marginHorizontal: '10%',
                                    alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap'
                                }}>{Translate('empty_noti')}</Text>
                            </View> : null
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
    linearGradient: {
        alignItems: 'center',
        height: SCREEN_HEIGHT * 0.12
    },
    logoImg: {
        width: SCREEN_WIDTH * 0.22,
        height: SCREEN_WIDTH * 0.22 * 0.3,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginTop: '3%',
        top: 0
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
    questContainer: {
        height: SCREEN_WIDTH * 0.16,
        width: SCREEN_WIDTH * 0.92,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderColor: '#878787',
        borderWidth: 1,
        justifyContent: 'center',
        marginTop: 5,
    },
    scrollContainer: {
        flex: 1,
        alignItems: 'center'
    },
    answerContainer: {
        padding: 16,
        alignItems: 'center'
    },
    writeReply: {
        color: '#fff',
        fontSize: SCREEN_HEIGHT * 0.018,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center'
    }

});