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
    ActivityIndicator
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import NextButton from '../../components/NextButton';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import axios from 'axios';
import Toast from 'react-native-root-toast';
import DeviceInfo from 'react-native-device-info';
import { StackActions, NavigationActions } from "react-navigation";
import CryptoJS from 'crypto-js';
import { decryption } from '../../utils/Decryption';
import { encryption } from '../../utils/Encryption';
import i18n from 'i18n-js';
import { setDeviceLang } from '../../utils/Utils';

const THEME_COLOR = '#4a4a4a'

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

export default class EmailLogin extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        this.state = {
            email: '',
            pw: '',
            btnHeight: 0,
            isLoading: false,
            isCheckedAutoLogin: true,
            isCheckEmail: false,
            lang: setDeviceLang(),
        };
    }

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
                console.log(response.data);

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

    login() {
        if (this.state.email === '') {
            Toast.show(`${Translate('enter_email')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('enter_email')}`)
            this.inputEmail.focus();
            this.setState({ isLoading: false })
            return
        }
        if (!this.state.isCheckEmail) {
            Toast.show(`${Translate('error_email')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('error_email')}`)
            this.inputEmail.focus();
            this.setState({ isLoading: false })
            return
        }
        if (this.state.pw === '') {
            Toast.show(`${Translate('enter_password')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('enter_password')}`)
            this.inputPw.focus();
            this.setState({ isLoading: false })
            return
        }

        let url = global.server + `/api/login/login`
        console.log(url)

        let uniqueId = DeviceInfo.getUniqueId();
        const lang = global.lang
        const self = this
        const deviceType = Platform.OS === 'ios' ? 'ios' : 'android'
        const encryptedPW = CryptoJS.SHA256(this.state.pw).toString();
        const encryptedEmail = encryption(this.state.email);
        console.log(encryptedPW);
        var bodyFormData = new FormData();
        bodyFormData.append('email', encryptedEmail);
        bodyFormData.append('passwd', encryptedPW);
        // bodyFormData.append('email', this.state.email);
        //bodyFormData.append('passwd', this.state.pw);
        bodyFormData.append('android_id', uniqueId);
        bodyFormData.append('device_type', deviceType);
        bodyFormData.append('language', lang);
        console.log('FormData : ', bodyFormData);
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('ios check =', response.data);

                if (response.data.result === 'ok') {
                    setItemToAsync('email', this.state.email)
                    setItemToAsync('pw', this.state.pw)
                    setItemToAsync('device_id', uniqueId)
                    setItemToAsync('auto_login', this.state.isCheckedAutoLogin)
                    setItemToAsync('sns', '');
                    //멤버 객체 불변성 유지 //phone 내용 복호화하여 member 객체 수정후 저장
                    const member = response.data.member;
                    console.log('MEMBER !!! :::: ', member);
                    if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                        global.user = { ...member, "phone": '', "email": '' };
                    } else if (member.phone === null || member.phone === '') {
                        global.user = { ...member, "phone": '', "email": decryption(member.email) };
                    } else if (member.email === null || member.email === '') {
                        global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                    } else {
                        global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                    }

               
                        if(member.start_ampm !== null || member.end_ampm !== null){
                            if (member.start_ampm === 'PM') {
                                if(member.start_time !== null){
                                    var calHour = member.start_time.split(':')
                                    let h = parseInt(calHour[0]) + 12
                                    setItemToAsync('startH', h);
                                    setItemToAsync('startM', calHour[1]);
                                }
                                
                
                            } else {
                                if(member.start_time !== null){
                                    var calHour = member.start_time.split(':')
                                    let h = parseInt(calHour[0])
                                    setItemToAsync('startH', h);
                                    setItemToAsync('startM', calHour[1]);
                                }
                             
                            }
    

                            if (member.end_ampm === 'PM') {
                                var calHour = member.end_time.split(':')
                                let h = parseInt(calHour[0]) + 12
                                setItemToAsync('endH', h);
                                setItemToAsync('endM', calHour[1]);
                
                            } else {
                                var calHour = member.end_time.split(':')
                                let h = parseInt(calHour[0])
                                setItemToAsync('endH', h);
                                setItemToAsync('endM', calHour[1]);
                
                
                            }
            
                        }

                    if(response.data.member.push_block_yn === "Y"){
                        setItemToAsync('pushBlock', true)
                    }else {
                        setItemToAsync('pushBlock', false)
                    }

                    if(response.data.member.time_notpush_yn === "Y"){
                        setItemToAsync('pushSetting', true)
                    }else {
                        setItemToAsync('pushSetting', false)
                    }

                    
                    this.updateToken(response.data.member.id)
                    setItemToAsync('join_type', response.data.member.join_type)
                    this.props.navigation.replace('TabHome')
                    // intentLoginView()
                } else {
                    Toast.show(`${Translate('different_id_pw')}`, {
                        duration: 3000,
                        position: SCREEN_HEIGHT / 3
                    })
                    // Toast.show(`${Translate('different_id_pw')}`)
                }
                this.setState({ isLoading: false })
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    self.setState({ isLoading: false })
                }
                else {
                    console.log(error)
                    self.setState({ isLoading: false })
                }
            });
    }

    intentLoginView() {
        const resetAction = StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({
                routeName: 'TabHome',
            })]
        });
        this.props.navigation.dispatch(resetAction)
    }

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        this.setState({ btnHeight: height })
    }

    componentDidMount = async () => {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);

        let fetchParams = {
            first: Platform.OS === 'ios' ? 10000 : 10000,
            assetType: 'All',
        }
      

        const autoLogin = await getItemFromAsync('auto_login')
        console.log('auto login: ', autoLogin)
        if (autoLogin === null || autoLogin === '') {
            this.setState({ isCheckedAutoLogin: true })
        } else {
            this.setState({ isCheckedAutoLogin: autoLogin })
        }
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    validateEmail = (text) => {
        console.log(text);
        let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
        if (reg.test(text) === false) {
            console.log("Email is Not Correct");
            this.setState({ email: text, isCheckEmail: false })
            return false;
        }
        else {
            this.setState({ email: text, isCheckEmail: true })
            console.log("Email is Correct");
        }
    }



    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <View style={styles.topContainer}>
                            <TouchableWithoutFeedback
                                onPress={() => { navigation.goBack() }}
                            >
                                <View style={{ width: '100%', height: '100%', paddingLeft: 25 }}>
                                    <Image
                                        style={{
                                            width: 20,
                                            height: '100%',
                                            resizeMode: 'contain',
                                            marginRight: 10,
                                        }}
                                        source={require('../../images/ic_back.png')} />
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>{Translate('do_login')}</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={(input) => { this.inputEmail = input; }}
                                onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}
                                style={styles.input}
                                underlineColorAndroid="transparent"
                                placeholder={Translate('emailET_hint')}
                                placeholderTextColor="#878787"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onChangeText={(text) => this.validateEmail(text)}
                                onSubmitEditing={() => { this.inputPw.focus(); }}
                                returnKeyType="next"
                            />
                            <TextInput
                                ref={(input) => { this.inputPw = input; }}
                                style={styles.marginInput}
                                underlineColorAndroid="transparent"
                                secureTextEntry
                                placeholder={Translate('pwdET_hint')}
                                placeholderTextColor="#878787"
                                autoCapitalize="none"
                                secureTextEntry={true}
                                onChangeText={(text) => this.setState({ pw: text })}
                                returnKeyType="done" />
                        </View>
                        <View style={{ marginTop: 10, width: '77.78%', alignSelf: 'center' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    this.setState({ isCheckedAutoLogin: !this.state.isCheckedAutoLogin }, async () => {
                                        await setItemToAsync('auto_login', this.state.isCheckedAutoLogin);
                                    })
                                }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                                        <Image
                                            style={{ position: 'absolute', resizeMode: 'contain', width: '100%', height: '100%' }}
                                            source={require('../../images/ic_not_checked_bg.png')} />
                                        {
                                            this.state.isCheckedAutoLogin && <Image
                                                style={{ position: 'absolute', resizeMode: 'contain', width: '70%', height: '60%' }}
                                                source={require('../../images/ic_not_checked_arrow.png')} />
                                        }
                                    </View>
                                    <Text style={{ fontSize: normalize(12), color: '#779ba4', marginLeft: 5 }}>{Translate('auto_login')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ width: '77.78%', marginTop: SCREEN_HEIGHT * 0.023, alignSelf: 'center', height: this.state.btnHeight }}>
                            <NextButton
                                title={Translate('activity_login_login')}
                                buttonColor={'#779ba4'}
                                onPress={() => {
                                    this.setState({ isLoading: true })
                                    this.login();
                                }} />
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
    topContainer: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: SCREEN_HEIGHT * 0.0156,
        height: 50,
        width: 60
    },
    titleContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        marginTop: SCREEN_HEIGHT * 0.151
    },
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    titleText: {
        fontSize: normalize(35),
        color: '#779ba4',
        marginBottom: SCREEN_HEIGHT * 0.09375,
        fontWeight: '400',
        alignSelf: 'center'
    },
    input: {
        width: '77.78%',
        borderColor: '#878787',
        borderRadius: 4,
        borderWidth: 1,
        paddingVertical: 11,
        fontSize: normalize(14),
        fontWeight: '400',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#4a4a4a'
    },
    marginInput: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        flexShrink: 1,
        width: '77.78%',
        borderColor: '#878787',
        borderRadius: 4,
        borderWidth: 1,
        paddingVertical: 11,
        fontSize: normalize(14),
        fontWeight: '400',
        justifyContent: 'center',
        textAlign: 'center',
        marginTop: SCREEN_HEIGHT * 0.0078,
        color: '#4a4a4a',
        alignItems: 'flex-start'
    },
    marginInputEn: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        flexShrink: 1,
        width: '77.78%',
        borderColor: '#878787',
        borderRadius: 4,
        borderWidth: 1,
        paddingVertical: 5,
        fontSize: Platform.OS === 'ios' ? normalize(11) : normalize(14),
        fontWeight: '400',
        justifyContent: 'center',
        textAlign: 'center',
        marginTop: SCREEN_HEIGHT * 0.0078,
        color: '#4a4a4a',
        alignItems: 'flex-start',
        height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.0609 : null
    },
    eventText: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        flexShrink: 1,
        fontSize: normalize(9),
        fontWeight: '400',
        color: '#878787',
        justifyContent: 'center',
        alignItems: 'center'
    },
    numberText: {
        fontSize: normalize(9),
        fontWeight: '200',
        color: '#878787',
        alignSelf: 'flex-end',
        marginBottom: '1%',
        marginLeft: normalize(2)
    }
});