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
    Linking,
    Alert,
    PermissionsAndroid,
    ActivityIndicator,
    Keyboard,
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import SetI18nConfig from '../../languages/SetI18nConfig';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, AnimatedRegion } from 'react-native-maps';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-root-toast';
import axios from 'axios';
import moment from 'moment';
// import AdBanner from '../../components/AdBanner';
import {
    TestIds, InterstitialAd, AdEventType, BannerAd,
    BannerAdSize
} from '@react-native-firebase/admob';
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import { Overlay } from 'react-native-share';


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

export default class SearchMap extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        if (Platform.OS === 'android') {
            AndroidKeyboardAdjust.setAdjustPan();
        }
        this.handleBackButton = this.handleBackButton.bind(this);

        this.state = {
            region: {
                latitude: 37.562087,
                longitude: 127.035192,
                // 얼마의 위도경도 차이까지 지도에 표시되는가 (zoom 설정)
                latitudeDelta: 0.009,
                longitudeDelta: 0.004,
            },
            visited: [],
            lat: 0,
            long: 0,
            isMapLoading: false,
            loadPlace: [],
            keyWord: '',
            isLoading: true,
            kLat: 0,
            kLong: 0,
            isTyping: false,
            location: '',
            friendsInfo: [],

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

                this.getLocation()
                this.getRequestFriends()
            }
        );
        this.willFocusSubscription = this.props.navigation.addListener(
            'didBlur',
            () => {
                this.willFocusSubscription.remove()
            },
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


    //장소
    getPlace() {
        let url = global.server + '/api/place/load_place'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append("keyword", this.state.keyWord)
        bodyFormData.append('language', global.lang)
        bodyFormData.append('latitude', this.state.lat)
        bodyFormData.append('longitude', this.state.long)
        // bodyFormData.append('latitude', parseFloat(37.2776879))
        // bodyFormData.append('longitude', parseFloat(126.9741046))



        const self = this;
        console.log('placeBody=', bodyFormData)
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("getPlaceIVisited: ", response.data)
                var data = response.data.place
                var filter = []
                if (data.length > 0 && data != null) {
                    data.reduce(function (acc, current) {
                        if (acc.findIndex(({ lat, lng }) => lat === current.lat && lng === current.lng) === -1) {
                            acc.push(current);
                        }
                        console.log('filtering', acc)
                        filter = acc
                        return acc;
                    }, [])
                    this.setState({
                        loadPlace: filter,
                        isLoading: false,
                    })
                    console.log('dataCheck=', filter.length)


                    if (this.state.keyWord != '') {
                        this.setState({
                            kLat: response.data.place[0].lat,
                            kLong: response.data.place[0].lng,
                            isTyping: false
                        })
                    } else {
                        this.setState({
                            isTyping: false
                        })
                    }
                } else if (data.length == 0) {
                    // Toast.show(Translate('Please_verify_the_place_first'))
                    this.setState({
                        isLoading: false,
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
                self.setState({ isLoading: false });
            });
    }



    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    handlePin = (marker) => {
        var convertTime = moment.utc(marker.total_durations * 1000).format('HH:mm');
        console.log(marker.place + ' : ' + marker.total_durations)
        // console.log('convertTime =', convertTime)
        var placeSting = ''
        // console.log('makerLanguage=', global.lang)

        if (global.lang == 'ko') {
            placeSting = marker.place
        } else if (global.lang == 'ja') {
            placeSting = marker.ja
        } else if (global.lang == 'zh_rCN') {
            placeSting = marker.zh_rCN
        } else if (global.lang == 'zh_rTW') {
            placeSting = marker.zh_rTW
        } else if (global.lang == 'zh-Hant-MO') {
            placeSting = marker.zh_rTW
        } else {
            placeSting = marker.en
        }


        return (
            <View>
                <ImageBackground source={require('../../images/pin2.png')} style={{ height: SCREEN_WIDTH * 0.4, width: SCREEN_WIDTH * 0.37, alignItems: 'center' }}>
                    <Text style={{ marginTop: 30, fontSize: normalize(12), color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{placeSting}</Text>
                    <Text style={{ marginTop: 10, fontSize: normalize(11), color: '#fff' }}>{convertTime}</Text>
                    <Text style={{ marginTop: 10, fontSize: normalize(11), color: '#fff' }}>{marker.total_costs + Translate('unit')}</Text>
                </ImageBackground>
            </View>
        )
    }

    handleCenter = () => {
        const { latitudeDelta, longitudeDelta } = this.state.location;
        let latitude = this.state.lat;
        let longitude = this.state.long;

        this.map.animateToRegion({
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta
        })

        console.log('center: ', latitude, longitude, parseFloat(this.state.lat), parseFloat(this.state.long))
    }

    //아이디 받고 
    markerClick(id) {
        console.log('click marker', id)
        this.goDetail(id)
    }

    //이동은 여기서 , 안드로이드 에러남 
    goDetail(id) {
        this.props.navigation.navigate('SearchMapDetail', { id: id })
    }


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

    getLocation = async () => {
        const hasLocationPermission = await this.hasLocationPermission();

        if (!hasLocationPermission) {
            return;
        }

        await Geolocation.getCurrentPosition(
            (position) => {
                global.lat = position.coords.latitude
                global.lon = position.coords.longitude

                let posi = { ...this.state.region }

                posi.lat = position.coords.latitude
                posi.long = position.coords.longitude

                this.setState({
                    region: posi,
                    lat: position.coords.latitude,
                    long: position.coords.longitude,
                    isMapLoading: true
                }, () => {
                    this.getPlace()
                })
                console.log('visitedData', this.state.region)
            },
            (error) => {
                Alert.alert(`Code ${error.code}`, error.message);
                console.log(error);
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

    render() {
        const { navigation } = this.props;
        console.log(BannerAdSize)
        console.log(BannerAdSize.SMART_BANNER)

        //테스트  // ca-app-pub-3940256099942544/2934735716  
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
                                                        style={styles.welcome1Text}>{Translate('mapTop')}</Text>
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
                                                placeholder={Translate('searchkeyword')}
                                                placeholderTextColor="rgba(255,255,255,0.5)"
                                                textAlign={'center'}
                                                textAlignVertical={'center'}
                                                autoCapitalize="none"
                                                returnKeyType="done"
                                                onChangeText={(text) => this.setState({ keyWord: text, isTyping: true })}
                                                onSubmitEditing={() =>
                                                    this.getPlace()}
                                            />
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    // navigation.navigate('SearchMapDetail');
                                                    console.log('scrap search click')
                                                    this.getPlace()
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
                                {/* <Banner
                                unitId={unitId}
                                size={'SMART_BANNER'}
                                request={request.build()}
                                onAdLoaded={() => {
                                    console.log('Advert loaded');
                                }}
                                onAdFailedToLoad={() => {
                                    console.log('Advert failed to load!!!!')
                                }}
                            /> */}

                                <BannerAd
                                    unitId={unitId}
                                    // unitId={TestIds.BANNER}
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

                                {
                                    this.state.isMapLoading ?
                                        <MapView style={{ flex: 1 }} provider={PROVIDER_GOOGLE}
                                            ref={ref => (this.map = ref)}
                                            onUserLocationChange={this._setMyLocation}
                                            // onRegionChangeComplete={region => this.setState({ region })}
                                            showsUserLocation={true}
                                            followsUserLocation={true}
                                            showsMyLocationButton={true}
                                            region={{
                                                latitude: parseFloat(this.state.lat),
                                                longitude: parseFloat(this.state.long),
                                                // latitude: 37.2776879,
                                                // longitude: 126.9741046,
                                                latitudeDelta: 0.015,
                                                longitudeDelta: 0.015,
                                            }}
                                        >
                                            {this && this.state && this.state.loadPlace.map(
                                                (marker, i) => (
                                                    <Marker
                                                        key={i}
                                                        coordinate={{ latitude: parseFloat(marker.lat), longitude: parseFloat(marker.lng) }}
                                                        onPress={() => this.markerClick(marker.id)}
                                                    >
                                                        {this.handlePin(marker)}
                                                    </Marker>
                                                ))}
                                        </MapView>
                                        : null
                                }

                            </View>
                            {
                                this.state.isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
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
        height: SCREEN_HEIGHT * 0.20,
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
        marginTop: SCREEN_HEIGHT * 0.20 * 0.42
    },
    cardContainer: {
        height: SCREEN_WIDTH * 0.667,
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
        alignItems: 'center'
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
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SCREEN_WIDTH * 0.0417,
        marginRight: SCREEN_WIDTH * 0.0417,
        marginBottom: 10
    },
});