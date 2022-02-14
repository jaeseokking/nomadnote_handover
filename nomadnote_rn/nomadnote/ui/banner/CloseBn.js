import React, { Component } from 'react';
import { StackActions, NavigationActions } from "react-navigation";
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
    FlatList,
    ActivityIndicator
} from 'react-native';

import Toast from 'react-native-root-toast';
import axios from 'axios';
import Translate from '../../languages/Translate';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import AppStatusBar from '../../components/AppStatusBar';

import { translate } from 'i18n-js';
import { back } from 'react-native/Libraries/Animated/src/Easing';
import { Dialog } from 'react-native-simple-dialogs';
import {
    WheelPicker,
    TimePicker,
    DatePicker
} from "react-native-wheel-picker-android";
import { setDeviceLang } from '../../utils/Utils';
import {
    TestIds, InterstitialAd, AdEventType, BannerAd,
    BannerAdSize
} from '@react-native-firebase/admob';


const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('screen');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
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

export default class CloseBn extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        this.state = {
            isLoading: false
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
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
            }
        );
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.willFocusMount.remove();
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    showAd() {
        if (interstitialAd.loaded) {
            interstitialAd.show().catch(error => console.warn(error));
        }
    }

    render() {
        const { isLoading } = this.state;
        const { navigation } = this.props;

        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                    activeOpacity={1}
                    onPress={() => navigation.goBack()}
                />
                <View style={styles.modal}>
                    <View style={styles.bannerContainer}>
                        <BannerAd
                            unitId={unitId}
                            size={BannerAdSize.MEDIUM_RECTANGLE}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: true,
                            }}
                            onAdLoaded={() => {
                                console.log('Advert loaded');
                            }}
                        />
                        {/* <Text>{'앱을 종료하시겠습니까?'}</Text> */}
                    </View>
                    <View style={styles.btnContainer}>
                        <TouchableOpacity
                            onPress={() => {
                                // this.showAd();
                                navigation.goBack();
                            }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}>
                            <Text style={{
                                fontSize: normalize(15),
                                color: '#878787',
                                fontWeight: '600',
                                marginVertical: 15,
                                marginHorizontal: 10,
                                textAlign: 'center'
                            }}>{Translate('cancel')}</Text>
                        </TouchableOpacity>
                        <View style={{ width: 1, height: '60%', backgroundColor: '#e0e0e0', alignSelf: 'center' }} />
                        <TouchableOpacity
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => {
                                BackHandler.exitApp();
                            }}>
                            <Text style={{
                                fontSize: normalize(15),
                                color: '#000',
                                fontWeight: '600',
                                marginVertical: 15,
                                marginHorizontal: 10,
                                textAlign: 'center'
                            }}>{Translate('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    // bottomSafeArea: {
    //     width: SCREEN_WIDTH * 0.6,
    //     height: SCREEN_HEIGHT * 0.6,
    //     flexDirection: 'column',
    //     alignItems: 'center',
    //     justifyContent: 'center'
    // },
    bannerContainer: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_HEIGHT * 0.4,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#b7d1da',
    },

    container: {
        position: 'absolute',
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center'
    },
    background: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        width: SCREEN_WIDTH * 0.8,
        borderRadius: 10,
        backgroundColor: '#b7d1da',
        shadowColor: '#000',
        marginBottom: Platform.OS === 'ios' ? '20%' : '10%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 4,
        alignItems: 'center'
    },
    btnContainer: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: 'white',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10
    },
});