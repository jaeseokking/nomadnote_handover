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
    Animated,
    ActivityIndicator,
    Alert
} from 'react-native';

import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import AppStatusBar from '../../components/AppStatusBar';
import NextButton from '../../components/NextButton';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import FlatGrid from 'react-native-super-grid';
import Translate from '../../languages/Translate'
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import Toast from 'react-native-root-toast';
import appleAuth, {
    AppleAuthRequestOperation,
    AppleAuthRequestScope,
    AppleAuthCredentialState,
    AppleAuthError,
} from '@invertase/react-native-apple-authentication';
import jwtDecode from 'jwt-decode';
import LineLogin from '@xmartlabs/react-native-line'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import KakaoLogin from '@actbase/react-native-kakao-login';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from "react-native-fbsdk-next";
import DeviceInfo from 'react-native-device-info';
import { setDeviceLang } from '../../utils/Utils';
import ModalDropdown from 'react-native-modal-dropdown';
import CryptoJS from 'crypto-js';

import { decryption } from '../../utils/Decryption';
import { encryption } from '../../utils/Encryption';
import Modal from "react-native-simple-modal";

const THEME_COLOR = '#4a4a4a'
const emailData = [];
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;


const image_arrow = require('../../images/icon_arrowR.png');
const image_arrow_click = require('../../images/icon_arrow.png');



export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2
    }
}


export default class FindId extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();

        this.state = {
            email: this.props.navigation.state.params.email,
            pw: '',
            pwConfirm: '',
            isCheckPassword: false,

        };
    }


    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);

    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
    }

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        this.setState({ btnHeight: height })
    }

    validatePW = (text) => {
        //대문자, 소문자, 숫자, 특수문자 8~16자
        let reg = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,16}$/;
        if (reg.test(text) === false) {
            console.log("Password is Not Correct");
            this.setState({ pw: text, isCheckPassword: false })
            return false;
        }
        else {
            this.setState({ pw: text, isCheckPassword: true })
            console.log("Password is Correct");
        }
    }

    editPW = () => {
        if (this.state.pw === '') {
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('enter_password')}`, {
                    duration: 2000,
                });
            } else {
                Toast.show(`${Translate('enter_password')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                });
            }
            // Toast.show(`${Translate('enter_password')}`)
            this.inputPw.focus();
            return
        }
        if (!this.state.isCheckPassword) {
            this.inputPw.focus();

            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('password_valid')}`, {
                    duration: 7000,
                });
            } else {
                Toast.show(`${Translate('password_valid')}`, {
                    duration: 7000,
                    position: SCREEN_HEIGHT / 4
                });
            }
            // Toast.show(`${Translate('password_valid')}`)
            return
        }
        if (this.state.pwConfirm === '') {
            this.inputPwConfirm.focus();

            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('enter_password')}`, {
                    duration: 2000,
                });
            } else {
                Toast.show(`${Translate('enter_password')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                });
            }
            // Toast.show(`${Translate('enter_password')}`)
            return
        }

        if (this.state.pw != this.state.pwConfirm) {
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('mismatch_password')}`, {
                    duration: 3000,
                });
            } else {
                Toast.show(`${Translate('mismatch_password')}`, {
                    duration: 3000,
                    position: SCREEN_HEIGHT / 4
                });
            }
            // Toast.show(`${Translate('mismatch_password')}`)
            this.inputPwConfirm.focus();

            return
        }


        let url = global.server + '/api/join/check_phone'

        var bodyFormData = new FormData();
        bodyFormData.append('type', 'change');
        const encryptedEmail = encryption(this.state.email);
        bodyFormData.append('id', encryptedEmail);
        const encryptedPW = CryptoJS.SHA256(this.state.pw).toString();
        bodyFormData.append('passwd', encryptedPW);

        console.log('checkParams', bodyFormData)
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(function (response) {
            console.log("response", response.data);
            let res = response.data.result
            if (res === 'ok') {

                this.setState({ isLoading: false })
                this.props.navigation.goBack()
                Toast.show(`${Translate('changedInfo')}`, {
                    position: SCREEN_HEIGHT / 2
                });
            } else if (res === 'empty') {
                Toast.show(`${Translate('add_friends_empty')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                })
                // Toast.show(Translate('add_friends_empty'))
                this.setState({ isLoading: false })
            }
        }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('error =', error.response.data)
                }
                else {

                    console.log(error)
                }
                this.setState({ isLoading: false })
            });

    }


    render() {
        const { navigation } = this.props;
        console.log(this.props.navigation.state)
        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <ScrollView
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', height: 50 }}>
                                {/* <Text style={{ flex: 1, fontSize: normalize(15), textAlign: 'center' }} >{Translate('find_password')}</Text> */}
                                <Text style={{ flex: 1, fontSize: normalize(15), textAlign: 'center' }} >{Translate('change_password')}</Text>
                                <TouchableOpacity onPress={() => {

                                    navigation.goBack()
                                }} style={{ position: 'absolute', height: '100%' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 18, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/ic_back.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={{ backgroundColor: '#D7D7D7', height: 1 }} />

                            <View style={styles.inputContainer}>
                                <Text style={{ fontSize: normalize(14), textAlign: 'left', marginBottom: 5, color: '#878787' }} >{Translate('email')}</Text>
                                <TextInput
                                    // ref={(input) => { this.inputEmail = input; }}
                                    style={styles.input}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    backgroundColor="#11111120"

                                    editable={false}
                                >{this.state.email}</TextInput>
                                <TextInput
                                    ref={(input) => { this.inputPw = input; }}
                                    onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}

                                    style={styles.marginInput}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('pwdET_hint')}
                                    placeholderTextColor="#878787"
                                    autoCapitalize="none"
                                    secureTextEntry={true}
                                    returnKeyType="next"
                                    onChangeText={(text) => this.validatePW(text)}
                                    onSubmitEditing={() => { this.inputPwConfirm.focus(); }}
                                />
                                <TextInput
                                    ref={(input) => { this.inputPwConfirm = input; }}
                                    style={styles.input}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('pwdET_hint2')}
                                    placeholderTextColor="#878787"
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    onChangeText={(text) => this.setState({ pwConfirm: text })}
                                    returnKeyType="done" />
                                <View style={{ width: '100%', marginTop: SCREEN_HEIGHT * 0.014, alignSelf: 'center', height: this.state.btnHeight }}>
                                    <NextButton
                                        title={Translate('sign_in')}
                                        buttonColor={'#FF0000'}
                                        onPress={() => {
                                            this.editPW()
                                        }} />
                                </View>

                            </View>
                        </ScrollView>

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

    inputContainer: {
        flex: 1,
        paddingTop: '20%',
        paddingBottom: '3%',
        paddingHorizontal: '10%'
    },
    input: {
        borderColor: '#878787',
        borderRadius: 4,
        borderWidth: 1,
        paddingVertical: 11,
        fontSize: normalize(14),
        fontWeight: '400',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#4a4a4a',
        marginTop: 8
    },
    marginInput: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        flexShrink: 1,
        borderColor: '#878787',
        borderRadius: 4,
        borderWidth: 1,
        paddingVertical: 11,
        fontSize: normalize(14),
        fontWeight: '400',
        justifyContent: 'center',
        textAlign: 'center',
        marginTop: SCREEN_HEIGHT * 0.02,
        color: '#4a4a4a',
        alignItems: 'flex-start'
    },


    topSafeArea: {
        flex: 0,
        backgroundColor: THEME_COLOR
    },
    bottomSafeArea: {
        flex: 1,
        backgroundColor: THEME_COLOR
    },





});

