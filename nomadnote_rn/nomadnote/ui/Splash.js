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
    PixelRatio,
    NativeModules,
    Platform
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { StackActions, NavigationActions } from "react-navigation";
import { isIphoneX, getBottomSpace } from 'react-native-iphone-x-helper';
import SetI18nConfig from '../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../languages/Translate';

import AppStatusBar from '../components/AppStatusBar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItemFromAsync, setItemToAsync } from '../utils/AsyncUtil';
import { setDeviceLang } from '../utils/Utils';
import CryptoJS from 'crypto-js';
import { encryption } from '../utils/Encryption';
import { decryption } from '../utils/Decryption';


const THEME_COLOR = '#51707a';
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

const deviceLanguage =
    Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
        : NativeModules.I18nManager.localeIdentifier;

export default class Splash extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();

        this.state = {
        }
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    updateToken(id) {
        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', id);
        bodyFormData.append('token', global.pushToken);


        let url = global.server + `/api/member/update_info`
        console.log(url)
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('update token: ', response.data);

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

    async checkUserInfo() {
        const email = await getItemFromAsync('email');
        const encryptedEmail = await encryption(email);
        const pw = await getItemFromAsync('pw');
        const encryptedPW = await CryptoJS.SHA256(pw).toString();
        const joinType = await getItemFromAsync('join_type');
        const snsKey = await getItemFromAsync('sns');
        const deviceId = await getItemFromAsync('device_id');
        const autoLogin = await getItemFromAsync('auto_login');
        const lang = global.lang
        const deviceType = Platform.OS === 'ios' ? 'ios' : 'android'

        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('email', encryptedEmail);
        bodyFormData.append('passwd', pw !== null ? encryptedPW : null);
        // bodyFormData.append('email', email);
        // bodyFormData.append('passwd', pw)
        bodyFormData.append('android_id', deviceId);
        bodyFormData.append('device_type', deviceType);
        bodyFormData.append('language', lang);
        bodyFormData.append('join_type', joinType);
        if (snsKey === null || snsKey === '') {
            bodyFormData.append('sns_key', '');
        } else {
            bodyFormData.append('sns_key', snsKey);
        }

        let url = global.server + `/api/login/valid_user`
        console.log(url)
        console.log('splashdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(async function (response) {
                console.log('is user in splash: ', response.data);

                if (response.data.result === 'ok') {
                    if (autoLogin === null || autoLogin === '') {
                        this.intentLoginView();
                    } else {
                        if (autoLogin) {
                            const member = response.data.member;
                            //global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                            if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                                global.user = { ...member, "phone": '', "email": '' };
                            } else if (member.phone === null || member.phone === '') {
                                global.user = { ...member, "phone": '', "email": decryption(member.email) };
                            } else if (member.email === null || member.email === '') {
                                global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                            } else {
                                global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                            }

                            this.updateToken(response.data.member.id)
                            this.props.navigation.replace('TabHome')
                        } else {
                            this.intentLoginView();
                        }
                    }

                } else {
                    this.intentLoginView();
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    self.intentLoginView();
                }
                else {
                    console.log(error)
                    self.intentLoginView();
                }
            });



    }

    

    intentLoginView() {
        const resetAction = StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({
                routeName: 'Login',
            })]
        });
        this.props.navigation.dispatch(resetAction)
    }

    getStatusBarSize() {
        if (Platform.OS === 'ios') {
            if (isIphoneX()) {
                global.statusbarHeight = 44;
            } else {
                global.statusbarHeight = 20;
            }
        } else {
            global.statusbarHeight = StatusBar.currentHeight;
        }
    }


    setLang() {
        let lang
        // if (Platform.OS === 'ios') {
        //     lang = deviceLanguage.substring(0, 2);
        //     console.log('splash_lang: ', deviceLanguage)

        // } else {
        // lang = deviceLanguage.substring(0, 2);
        lang = setDeviceLang()
        // }
        global.lang = lang
    }

    setDeviceType() {
        let deviceT
        if (Platform.OS === 'ios') {
            deviceT = 'ios'
        } else {
            deviceT = ''
        }
        global.deviceType = deviceT
    }

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        console.log('font_12: ', height)
        global.indicatorMarginTop = height + ((SCREEN_WIDTH * 0.15) * 0.5) + (SCREEN_WIDTH * 0.019 * 2);
        global.font_12 = height
    }

 

    render() {
        this.getStatusBarSize()
        this.setLang()
        this.setDeviceType()
        setTimeout(() => {
            this.checkUserInfo()
            // this.props.navigation.navigate('Login');
        }, 1000);


        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <LinearGradient colors={['#638d96', '#3d606e']} style={styles.linearGradient}>
                        <Image
                            style={styles.splashImage}
                            source={require('../images/login_white_logo.png')} />
                        <View style={styles.textContainer}>
                            <Text style={styles.logoText}>{Translate('welcome')} </Text>
                            {/* <Text style={styles.logoText}>{Translate('nomadnote')}</Text> */}
                            <View
                                onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}>
                                <Text style={{ fontSize: normalize(12), width: 0 }}>/</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </SafeAreaView>
            </>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    linearGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashImage: {
        width: SCREEN_WIDTH * 0.49,
        height: SCREEN_HEIGHT * 0.0796,
        resizeMode: 'contain',
        marginBottom: 2
    },
    textContainer: {
        flexDirection: 'row',
        marginBottom: '20%',
        alignItems: 'center'
    },
    topSafeArea: {
        flex: 0,
        backgroundColor: THEME_COLOR
    },
    bottomSafeArea: {
        flex: 1,
        backgroundColor: THEME_COLOR
    },
    logoText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'ios' ? normalize(15) : normalize(16)
    }
});