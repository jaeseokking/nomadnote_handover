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
    Alert,
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
import { strftime, translate } from 'i18n-js';
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
import { Dialog } from 'react-native-simple-dialogs';
import {
    WheelPicker,
    TimePicker,
    DatePicker
} from "react-native-wheel-picker-android";
import { decryption } from '../../utils/Decryption';
import { encryption } from '../../utils/Encryption';
import Modal from "react-native-simple-modal";
import RNSmtpMailer from 'react-native-smtp-mailer';


var tempCode;
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
            id: this.props.navigation.state.params.id,
            pw: this.props.navigation.state.params.pw,
            emails: [],
            selectedValue: '',
            notSelf: 0,
            idInput: '',
            name: '',
            phone: '',
            email: '',
            gender: '',
            age: '',
            domain: Translate('direct_input'),
            domain1: '',
            isLoading: false,
            emailSelected: 0,
            type: 0,
            isModal: false,
            tempPassword: '',
            minutes: 0,
            seconds: 0,
            emailString: '',
        };
    }

    openEmail = show => {
        this.setState({ showEmailD: show });
    }

    selectedId() {
        this.setState({ id: true });
        this.setState({ pw: false });
    }

    selectedPw() {
        this.setState({ id: false });
        this.setState({ pw: true });

    }


    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocus = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.getEmailList()
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

    componentHideAndShow = () => {
        this.setState(previousState => ({ content: !previousState.content }))
    }

    emailComponentHideAndShow = () => {
        this.setState(previousState => ({ email: !previousState.email }))
    }

    snsComponentHideAndShow = () => {
        this.setState(previousState => ({ sns: !previousState.sns }))
    }

    onItemSelected = selectedItem => {
        // this.setState({ selectedItem });
        if (selectedItem === 0) {
            this.setState({ emailSelected: selectedItem, notSelf: 0 })
        } else {
            this.setState({ emailSelected: selectedItem, notSelf: 1 })
        }
        console.log('selected', selectedItem)
    };


    getEmailList() {
        let url = global.server + '/api/join/get_emaillist'
        axios.post(url)
            .then(function (response) {
                console.log(response.data);

                this.setState({ email: response.data.emails })

                if (response.data.emails != null) {

                    var emailD = response.data.emails
                    var emailA = []
                    let domainList = [{ email: Translate('direct_input') }]
                    emailA = emailD.map((item) => {
                        domainList = domainList.concat({ email: item.email })
                    })
                    console.log('emailD =', emailData.length)

                    if (emailData.length == 0) {
                        {
                            domainList.map((item) => (
                                emailData.push(item.email)
                            ))
                        }
                    }
                    this.setState({ emails: domainList })
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

    //휴대번호로 이메일, 비밀번호 찾기
    findIdWithPhone = (type) => {
        const self = this
        if (type == 'password') {
            if (this.state.email === '' || this.state.email === null) {
                Toast.show(`${Translate('enter_email')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                })
                // Toast.show(Translate('enter_email'))
                this.setState({ isLoading: false })
                return
            }
        }

        if (this.state.name === '' || this.state.name === null) {
            Toast.show(`${Translate('enter_name')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 4
            })
            // Toast.show(Translate('enter_name'))
            this.setState({ isLoading: false })
            return
        }

        if (this.state.phone === '' || this.state.phone === null) {
            Toast.show(`${Translate('enteryouraddress')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 4
            })
            // Toast.show(Translate('enteryouraddress'))
            this.setState({ isLoading: false })
            return
        }

        let url = global.server + '/api/join/check_phone'

        var bodyFormData = new FormData();
        bodyFormData.append('name', this.state.name);
        const encryptedPhone = encryption(this.state.phone);
        bodyFormData.append('phone', encryptedPhone);
        bodyFormData.append('type', type);
        if (type === 'password') {
            bodyFormData.append('id', this.state.email);

        }
        console.log('checkParams', bodyFormData)
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(function (response) {
            console.log("response", response.data);
            let res = response.data.result
            if (res === 'ok') {
                if (type === 'password') {
                    Toast.show(`${Translate('find_pw_send_phone')}`, {
                        duration: 2000,
                        position: SCREEN_HEIGHT / 4
                    })
                    // Toast.show(Translate('find_pw_send_phone'))
                } else {
                    Toast.show(`${Translate('find_pw_send_email')}`, {
                        duration: 2000,
                        position: SCREEN_HEIGHT / 4
                    })
                    // Toast.show(Translate('find_pw_send_email'))
                }
                this.setState({ isLoading: false })
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

                self.setState({ isLoading: false })
            });
    }

    //이메일로 아이디 비번 찾기 
    findIdWithEmail() {
        const self = this
        if (this.state.name === '' || this.state.name === null) {
            Toast.show(`${Translate('enter_name')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 4
            })
            // Toast.show(Translate('enter_name'))
            this.setState({ isLoading: false })
            return
        }

        if (this.state.email === '' || this.state.email === null) {
            Toast.show(`${Translate('enter_email')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 4
            })
            // Toast.show(Translate('enter_email'))
            this.setState({ isLoading: false })
            return
        }

        var emailString = ''
        if (this.state.notSelf === 0) {
            emailString = this.state.email + '@' + this.state.domain1
        } else {
            emailString = this.state.email + '@' + this.state.domain
        }

        console.log('check email=', emailString)
        let url = global.server + '/api/join/send_mail'

        const encryptedEmailStr = encryption(emailString);
        var bodyFormData = new FormData();
        bodyFormData.append('name', this.state.name);
        bodyFormData.append('type', 'password');
        bodyFormData.append('email', encryptedEmailStr);
        // bodyFormData.append('email', emailString);

        console.log('checkParams', bodyFormData)
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(function (response) {
            console.log("response", response.data);
            let res = response.data.result
            if (res === 'ok') {
                Toast.show(`${Translate('find_pw_send_phone')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                })
                // Toast.show(Translate('find_pw_send_phone'))
                this.props.navigation.goBack();
            } else if (res === 'empty') {
                Toast.show(`${Translate('add_friends_empty')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                })
                // Toast.show(Translate('add_friends_empty'))
            }
            this.setState({ isLoading: false })
        }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('error =', error.response.data)
                    // Toast.show(error.response.data.message);
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    findIdWithSns() {
        let uniqueId = DeviceInfo.getUniqueId();

        let url = global.server + '/api/join/find_pw_by_sns'

        var bodyFormData = new FormData();
        bodyFormData.append('android_id', uniqueId);
        bodyFormData.append('type', this.state.type);
        bodyFormData.append('sns_key', this.state.snsKey);
        bodyFormData.append('language', global.lang);

        console.log('checkParams', bodyFormData)
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(function (response) {
            console.log("response", response.data);
            let res = response.data.result
            if (res === 'ok') {
                Toast.show(`${Translate('find_pw_send_email')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                })
                // Toast.show(Translate('find_pw_send_email'))
                this.props.navigation.goBack();
            } else if (res === 'empty') {
                Toast.show(`${Translate('add_friends_empty')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 4
                })
                // Toast.show(Translate('add_friends_empty'))
            }
            this.setState({ isLoading: false })
        }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('error =', error.response.data)
                    // Toast.show(error.response.data.message);
                    this.setState({ isLoading: false })
                }
                else {
                    console.log(error)
                    this.setState({ isLoading: false })
                }
            });
    }
    //sns로 비밀번호 찾기 => 로그인 처리로 판단
    handleFacebookButtonPress = async () => {
        var self = this
        LoginManager.logInWithPermissions(["public_profile"]).then(
            function (result) {
                if (result.isCancelled) {
                    console.log("Login cancelled");
                } else {
                    AccessToken.getCurrentAccessToken().then(
                        (data) => {
                            console.log('accessToken:', data)
                            self.getFaceBookInfo();
                        })
                }
            },
            function (error) {
                console.log("Login fail with error: " + error);
            }
        );
    }

    getFaceBookInfo = async () => {
        const infoRequest = new GraphRequest(
            '/me?fields=id,name,email',
            null,
            (err, res) => {
                if (err) {
                    console.log('error', error.toString());
                } else {
                    console.log(res)
                    this.setState({
                        name: res.name,
                        joinType: 4,
                        snsKey: res.id
                    }, () => {
                        this.checkUserInfo()
                    })
                }
            },
        );
        new GraphRequestManager().addRequest(infoRequest).start();
    }

    kakaoLogin = () => {
        KakaoLogin.login()
            .then((result) => {
                this.getProfile();
                setItemToAsync('kakao_access_token', result.access_token)
                setItemToAsync('kakao_refresh_token', result.refresh_token)
                setItemToAsync('login_type', 'kakao')
                console.log(`Login Finished:${JSON.stringify(result)}`);
            })
            .catch((err) => {
                if (err.code === 'E_CANCELLED_OPERATION') {
                    console.log(`Login Cancelled:${err.message}`);
                } else {
                    console.log(`Login Failed:${err.code} ${err.message}`);
                }
            });
    };


    getProfile = () => {
        KakaoLogin.getProfile()
            .then((result) => {
                console.log(`Login Finished getProfile:${JSON.stringify(result)}`);
                setItemToAsync('sns', result.id)
                this.setState({
                    name: result.kakao_account.profile.nickname,
                    joinType: 1,
                    snsKey: result.id
                }, () => {
                    this.checkUserInfo();
                })
            })
            .catch((err) => {
                console.log(`Get Profile Failed:${err.code} ${err.message}`);
            });
    };


    //apple login
    async onAppleButtonPress() {
        // performs login request

        try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            console.log('USER LOG APPLEEEE ', appleAuthRequestResponse)


            // get current authentication state for user
            // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
            const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

            // use credentialState response to ensure the user is authenticated
            if (credentialState === appleAuth.State.AUTHORIZED) {
                const decode = jwtDecode(appleAuthRequestResponse.identityToken)
                console.log('decodedInfo', decode)
                //sub -> snsKey , email -> email 
                this.setState({
                    name: '',
                    joinType: 8,
                    snsKey: decode.sub
                }, () => {
                    console.log('snskey', this.state.snsKey)
                    this.checkUserInfo();
                })

            }

        } catch (error) {
            console.log('appleError', error)
        }
    }


    lineLoginPress() {
        LineLogin.login()
            .then(user => {
                console.log('user', user.userProfile);
                const userInfo = user.userProfile
                this.setState({
                    name: userInfo.displayName,
                    joinType: 2,
                    snsKey: userInfo.userID
                }, () => {
                    console.log('snskey', this.state.snsKey)
                    console.log('name', this.state.name)
                    this.checkUserInfo();
                })

            })
            .catch(err => {
                console.log('error check', err);
            });
    }

    //구글 로그인
    googleSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            console.log('googleUserInfo =', userInfo)
            this.setState({
                name: userInfo.user.name,
                email: userInfo.user.email,
                snsKey: userInfo.user.id,
                joinType: 3,
            }, () => {
                this.checkUserInfo()
            })
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                console.log('error1', error)
            } else {
                // some other error happened
                console.log('error2', error)
            }
        }
    };


    async checkUserInfo() {
        const joinType = this.state.joinType
        const snsKey = this.state.snsKey
        const deviceId = DeviceInfo.getUniqueId();
        const lang = setDeviceLang();
        const deviceType = Platform.OS === 'ios' ? 'ios' : 'android'


        var self = this
        var bodyFormData = new FormData();
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

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('memberData =', response.data.member);

                if (response.data.result === 'ok') {
                    var vData = response.data.member
                    console.log('response.data.member.kko_sns_key: ', response.data.member.kko_sns_key)
                    switch (joinType) {
                        case 1: { // 카카오
                            if (response.data.member.kko_sns_key === `${snsKey}`) {
                                const member = response.data.member;
                                if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                                    global.user = { ...member, "phone": '', "email": '' };
                                } else if (member.phone === null || member.phone === '') {
                                    global.user = { ...member, "phone": '', "email": decryption(member.email) };
                                } else if (member.email === null || member.email === '') {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                                } else {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                                } setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)

                                this.props.navigation.replace('TabHome')
                            } else {
                                this.setState({ age: vData.age, gender: vData.gender }, () => {
                                    this.join();
                                })
                            }
                            break;
                        }
                        case 2: { // 네이버 or 라인?
                            if (response.data.member.naver_sns_key === snsKey) {
                                const member = response.data.member;
                                if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                                    global.user = { ...member, "phone": '', "email": '' };
                                } else if (member.phone === null || member.phone === '') {
                                    global.user = { ...member, "phone": '', "email": decryption(member.email) };
                                } else if (member.email === null || member.email === '') {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                                } else {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                                } setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)
                                this.props.navigation.replace('TabHome')
                            } else {
                                this.setState({ age: vData.age, gender: vData.gender }, () => {
                                    this.join();
                                })
                            }
                            break;
                        }
                        case 3: { // 구글
                            if (response.data.member.google_sns_key === snsKey) {
                                const member = response.data.member;
                                if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                                    global.user = { ...member, "phone": '', "email": '' };
                                } else if (member.phone === null || member.phone === '') {
                                    global.user = { ...member, "phone": '', "email": decryption(member.email) };
                                } else if (member.email === null || member.email === '') {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                                } else {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                                } setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)
                                this.props.navigation.replace('TabHome')
                            } else {
                                this.setState({ age: vData.age, gender: vData.gender }, () => {
                                    this.join();
                                })
                            }
                            break;
                        }
                        case 4: { // 페이스북
                            if (response.data.member.facebook_sns_key === snsKey) {
                                const member = response.data.member;
                                if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                                    global.user = { ...member, "phone": '', "email": '' };
                                } else if (member.phone === null || member.phone === '') {
                                    global.user = { ...member, "phone": '', "email": decryption(member.email) };
                                } else if (member.email === null || member.email === '') {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                                } else {
                                    global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                                } console.log('check user', response.data.member)
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)

                                this.props.navigation.replace('TabHome')
                            } else {
                                this.setState({ age: vData.age, gender: vData.gender }, () => {
                                    this.join();
                                })
                            }
                            break;
                        }
                        case 5: { // 이메일

                        }
                        case 6: { // 관리자

                        }
                        case 7: { // 부관리자

                        }
                        case 8: { //애플
                            if (response.data.member.apple_sns_key === snsKey) {
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
                                console.log('check user', response.data.member)
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)

                                this.props.navigation.replace('TabHome')
                            } else {
                                this.setState({ age: vData.age, gender: vData.gender }, () => {
                                    this.join();
                                })
                            }
                            break;
                        }
                    }

                    global.token = response.data.member.token

                    // this.props.navigation.navigate('TabHome')
                } else {
                    Toast.show(`${Translate('nomember')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('nomember')}`);
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

    join() {
        let uniqueId = DeviceInfo.getUniqueId();
        const deviceId = uniqueId
        const lang = setDeviceLang();
        if (this.state.email === '' || this.state.email === null) {
            bodyFormData.append('email', this.state.email);
        } else {
            const encryptedEmail = encryption(this.state.email);
            bodyFormData.append('email', encryptedEmail);

        }

        var bodyFormData = new FormData();
        bodyFormData.append('name', this.state.name);
        bodyFormData.append('join_type', this.state.joinType);
        bodyFormData.append('android_id', deviceId);
        bodyFormData.append('language', lang);
        bodyFormData.append('sns_key', this.state.snsKey);
        bodyFormData.append('gender', this.state.gender);
        bodyFormData.append('age', this.state.age);
        bodyFormData.append('device_type', Platform.OS === 'ios' ? 'ios' : 'android');

        let url = global.server + `/api/join/join`
        console.log(url)
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log(response.data);

                if (response.data.result === 'ok') {
                    const member = response.data.member;
                    if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                        global.user = { ...member, "phone": '', "email": '' };
                    } else if (member.phone === null || member.phone === '') {
                        global.user = { ...member, "phone": '', "email": decryption(member.email) };
                    } else if (member.email === null || member.email === '') {
                        global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                    } else {
                        global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                    } setItemToAsync('join_type', this.state.joinType)
                    setItemToAsync('device_id', deviceId)

                    this.props.navigation.replace('TabHome')
                } else {
                    Toast.show(`${response.data.message}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${response.data.message}`)
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

    sendTempPW() {

        let uniqueId = DeviceInfo.getUniqueId();
        let url = global.server + `/api/join/check_email`


        var emailString = ''
        if (this.state.notSelf === 0) {
            emailString = this.state.email + '@' + this.state.domain1
        } else {
            emailString = this.state.email + '@' + this.state.domain
        }
        this.setState({
            emailString: emailString
        })
        console.log('emailString', this.state.emailString)
        const encryptedEmail = encryption(emailString)
        var bodyFormData = new FormData()
        bodyFormData.append('email', encryptedEmail);
        // bodyFormData.append('email', this.state.email);
        bodyFormData.append('android_id', uniqueId);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log(response.data);

                if (response.data.result === 'ok') {
                    if (Platform.OS === 'ios') {
                        Toast.show(`${Translate('add_friends_empty')}`, {
                            duration: 3000,
                        });
                    } else {
                        Toast.show(`${Translate('add_friends_empty')}`, {
                            duration: 3000,
                            position: 0
                        });
                    }
                    this.setState({
                        isLoading: false
                    })
                } else {

                    // 이메일이 있는 경우 
                    if (response.data.member !== null) {
                        if (response.data.member.join_type === 5) {
                            console.log('메일전송')

                            var newPassword = [];
                            var randomValue = "abcdefghijklmnopqrstuvwxyz"
                            var tempPW
                            //무작위 문자열 전송
                            // for (i = 0; i <= 4; i++) {
                            //     randomPoint = Math.round(Math.random() * 24 + 1);
                            //     Pwdchar = randomValue.charAt(randomPoint);
                            //     newPassword[i] = Pwdchar
                            // }

                            // var randomValue = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                            // for (i = 5; i <= 6; i++) {
                            //     randomPoint = Math.round(Math.random() * 24 + 1);
                            //     Pwdchar = randomValue.charAt(randomPoint);
                            //     newPassword[i] = Pwdchar
                            // }

                            randomValue = "0123456789"
                            for (i = 0; i <= 5; i++) {
                                randomPoint = Math.round(Math.random() * 8 + 1);
                                Pwdchar = randomValue.charAt(randomPoint);
                                newPassword[i] = Pwdchar
                            }

                            // randomValue = "~!@#$%^&*()_+"
                            // for (i = 9; i <= 9; i++) {
                            //     randomPoint = Math.round(Math.random() * 11 + 1);
                            //     Pwdchar = randomValue.charAt(randomPoint);
                            //     newPassword[i] = Pwdchar
                            // }


                            // for (let i = 0; i < newPassword.length; i++) {
                            //     let j = Math.floor(Math.random() * (i + 1));
                            //     [newPassword[i], newPassword[j]] = [newPassword[j], newPassword[i]];
                            // }


                            tempPW = newPassword.join("");
                            console.log('??? tempPW', tempPW);
                            // Alert.alert('임시 비밀번호 : ', tempPW)
                            RNSmtpMailer.sendMail({
                                mailhost: "smtp.gmail.com",
                                port: "465",
                                ssl: true,
                                username: "nomadnoteserver@gmail.com",
                                password: "fnvwbutaasvueudj",
                                recipients: `${this.state.emailString}`,
                                subject: `${Translate('smtp_title')}`,
                                fromName: "NomadNote",
                                htmlBody: `<p>${Translate('smtp_hello')}</p>
                                <p>${Translate('smtp_code1')} <strong>${tempPW}</strong> ${Translate("smtp_code2")}</p><br/>
                                <p>${Translate('smtp_content1')}</p><br/>
                                <p>${Translate('smtp_content2')}</p><br/>
                                <p>${Translate('smtp_content3')}</p><br/>
                                <p>${Translate('smtp_content4')}</p><br/>
                                <p>${Translate('smtp_content5')}</p>`,
                                attachmentPaths: [],
                                attachmentNames: [],
                                attachmentTypes: [],
                            })
                                .then(success => console.log(success),
                                    console.log('메일전송완료', tempPW),
                                    tempCode = tempPW

                                )
                                .catch(err => console.log(err));


                            // if (Platform.OS === 'ios') {
                            //     Toast.show(`임시코드 발송`, {
                            //         duration: 3000,
                            //     });
                            // } else {
                            //     Toast.show(`임시코드 발송`, {
                            //         duration: 3000,
                            //         position: 0
                            //     });
                            // }

                            this.setState({
                                isLoading: false,
                                isModal: true,
                                seconds: 0,
                                minutes: 5
                            })
                            var Timer = setInterval(() => {
                                const isPause = false
                                if (this.state.isModal == false) {
                                    clearInterval(Timer)
                                }
                                if (this.state.seconds !== 0) {
                                    this.setState({
                                        seconds: this.state.seconds - 1
                                    })
                                } else {
                                    if (this.state.minutes !== 0) {
                                        this.setState({ minutes: this.state.minutes - 1, seconds: 59 })
                                    } else {
                                        clearInterval(Timer)
                                        if (isPause === false) {
                                            Alert.alert(
                                                `${Translate('expired')}`,
                                                `${Translate('re_request')}`,
                                                [

                                                    {
                                                        text: `${Translate('reset_later')}`,
                                                        onPress: () => {
                                                            this.setState({
                                                                isModal: false
                                                            })
                                                        },
                                                        style: 'cancel'
                                                    },
                                                    {
                                                        text: `${Translate('requst_again')}`,
                                                        onPress: () => {
                                                            this.sendTempPW()
                                                        },
                                                    }
                                                ]
                                            )
                                        }
                                        isPasue = true


                                    }
                                }
                            }, 1000)
                        } else {
                            Toast.show(`${Translate('only_email')}`)
                            this.setState({
                                isLoading: false
                            })
                        }


                    } else {
                        Toast.show(`${Translate('add_friends_empty')}`, {
                            duration: 2000,
                            position: SCREEN_HEIGHT / 4
                        })

                    }
                    console.log(response.data)
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




    render() {
        const { navigation } = this.props;

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', height: 50 }}>
                            {this.state.id ? <Text style={{ flex: 1, fontSize: normalize(15), textAlign: 'center' }} >{Translate('find_id')}</Text>
                                : <Text style={{ flex: 1, fontSize: normalize(15), textAlign: 'center' }} >{Translate('find_password')}</Text>}

                            <TouchableOpacity onPress={() => {
                                navigation.goBack()
                            }} style={{ position: 'absolute', height: '100%' }}>
                                <View style={{ height: '100%', justifyContent: 'center' }}>
                                    <Image style={{ width: 18, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/ic_back.png')} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ backgroundColor: '#D7D7D7', height: 1 }} />
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1 }}
                        >
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity
                                    onPress={this.selectedId.bind(this)}
                                    style={{
                                        width: SCREEN_WIDTH * 0.5,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: normalize(13),
                                            color: this.state.id ? '#000000' : '#9B9B9B',
                                            marginBottom: 8
                                        }}
                                    >
                                        {Translate('find_id')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={this.selectedPw.bind(this)}
                                    style={{
                                        width: SCREEN_WIDTH * 0.5,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: normalize(13),
                                            color: this.state.pw ? '#000000' : '#9B9B9B',
                                            marginBottom: 8
                                        }}
                                    >
                                        {Translate('find_password')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ backgroundColor: '#878787', height: 1 }} />
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ backgroundColor: this.state.id ? '#000000' : '#fff', height: 3, width: SCREEN_WIDTH * 0.5 }} />
                                <View style={{ backgroundColor: this.state.pw ? '#000000' : '#fff', height: 3, width: SCREEN_WIDTH * 0.5 }} />
                            </View>
                            {/* <View style={styles.middleView}>
                                {this.state.id ? <Text style={styles.middleText}> {Translate('find_id_choice')}</Text> : <Text style={styles.middleText}> {Translate('find_password_choice')} {'\n'}{Translate('identity_verification')}</Text>}
                            </View> */}
                            {/* <View style={{ backgroundColor: '#d7d7d7', height: 4 }} /> */}
                            {
                                this.state.pw !== true &&
                                <TouchableWithoutFeedback onPress={this.componentHideAndShow}>
                                    <View style={styles.elem}>
                                        <View style={styles.elemSetting}>
                                            <Text style={{ marginLeft: 25, color: '#878787', fontSize: normalize(12) }}> {Translate('find_email')}</Text>
                                        </View>
                                        <View style={{ padding: 25 }}>
                                            <Image source={this.state.content ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            }
                            {
                                this.state.content && this.state.pw !== true ?
                                    <View>
                                        <View>
                                            {this.state.pw ? <TextInput
                                                style={styles.textSetting}
                                                underlineColorAndroid="transparent"
                                                placeholder={Translate('id')}
                                                placeholderTextColor="#878787"
                                                autoCapitalize="none"
                                                returnKeyType="done"
                                                onSubmitEditing={() => { this.inputName.focus(); }}
                                                onChangeText={(text) => this.setState({ email: text })}
                                            /> : null}


                                        </View>


                                        <TextInput
                                            ref={(input) => { this.inputName = input; }}
                                            style={styles.textSetting}
                                            underlineColorAndroid="transparent"
                                            placeholder={Translate('name')}
                                            placeholderTextColor="#878787"
                                            autoCapitalize="none"
                                            returnKeyType="next"
                                            onChangeText={(text) => this.setState({ name: text })}
                                            onSubmitEditing={() => { this.inputPhone.focus(); }}
                                        />

                                        <TextInput
                                            ref={(input) => { this.inputPhone = input; }}
                                            style={styles.textSetting}
                                            underlineColorAndroid="transparent"
                                            placeholder={Translate('phon_edit_message')}
                                            placeholderTextColor="#878787"
                                            autoCapitalize="none"
                                            keyboardType='number-pad'
                                            returnKeyType="done"
                                            onChangeText={(text) => this.setState({ phone: text })}
                                        />

                                        <View style={{ width: SCREEN_WIDTH * 0.85, height: 40, marginTop: 8, alignSelf: 'center' }}>
                                            <NextButton
                                                title={Translate('confirm')}
                                                buttonColor={'#FF0000'}
                                                onPress={() => {
                                                    this.setState({ isLoading: true }, () => {
                                                        this.state.pw ?
                                                            this.findIdWithPhone('password') :
                                                            this.findIdWithPhone('id')
                                                    })
                                                }} />
                                        </View>
                                    </View>
                                    : null
                            }


                            {this.state.pw !== true &&
                                <View style={{ backgroundColor: '#9b9b9b', height: 1, marginTop: this.state.content ? 10 : 2 }} />
                            }

                            <View>
                                {this.state.pw ?
                                    <TouchableWithoutFeedback onPress={this.emailComponentHideAndShow}>
                                        <View style={styles.elem}>
                                            <View style={styles.elemSetting}>
                                                <Text style={{ marginLeft: 25, color: '#878787', fontSize: normalize(12) }}> {Translate('find_email')}</Text>
                                            </View>
                                            <View style={{ padding: 25 }}>
                                                <Image source={this.state.email ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                    :
                                    null
                                }
                            </View>

                            {
                                this.state.email && this.state.pw ?
                                    <View>
                                        {/* <TextInput
                                            style={styles.textSetting}
                                            underlineColorAndroid="transparent"
                                            placeholder={Translate('name')}
                                            placeholderTextColor="#878787"
                                            autoCapitalize="none"
                                            returnKeyType="done"
                                            onChangeText={(text) => this.setState({ name: text })}
                                        />

                                        <View style={styles.elemEmail}>
                                            <View style={styles.elemSetting}>

                                                <TextInput
                                                    style={styles.emailSetting}
                                                    underlineColorAndroid="transparent"
                                                    //placeholder={Translate('email')}
                                                    keyboardType='email-address'
                                                    placeholderTextColor="#878787"
                                                    autoCapitalize="none"
                                                    returnKeyType="done"
                                                    onChangeText={(text) => this.setState({ email: text })}
                                                />

                                                <Text style={{ marginHorizontal: 3, color: '#878787', textAlign: 'center' }}> @ </Text>

                                                <View>
                                                    {
                                                        this.state.notSelf == 0 &&

                                                        <TextInput
                                                            style={{
                                                                width: this.state.notSelf == 0 ? SCREEN_WIDTH * 0.85 * 0.3 : SCREEN_WIDTH * 0.85 * 0.6,
                                                                height: 40,
                                                                borderWidth: 1,
                                                                borderRadius: 3,
                                                                borderColor: '#878787',
                                                                padding: 8,
                                                                marginTop: 8,
                                                                fontSize: normalize(13),
                                                                alignSelf: 'center'
                                                            }}
                                                            underlineColorAndroid="transparent"
                                                            //placeholder={this.state.notSelf == 0 ? Translate('email') : null}
                                                            placeholderTextColor="#878787"
                                                            autoCapitalize="none"
                                                            returnKeyType="done"
                                                            onChangeText={(text) => this.setState({ domain1: text })}
                                                        />
                                                    }
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => this.openEmail(true)}>
                                                    <View
                                                        style={{
                                                            marginLeft: 3,
                                                            width: this.state.notSelf == 0 ? SCREEN_WIDTH * 0.85 * 0.32 : SCREEN_WIDTH * 0.85 * 0.6,
                                                            height: 40,
                                                            borderWidth: 1,
                                                            borderRadius: 3,
                                                            borderColor: '#878787',
                                                            paddingLeft: 8,
                                                            marginTop: 8,
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexDirection: 'row',
                                                        }}>
                                                        <Text
                                                            style={{
                                                                flex: 1,
                                                                color: '#919191',
                                                                fontSize: normalize(12),
                                                                fontWeight: '300',
                                                            }}
                                                        >
                                                            {this.state.domain}
                                                        </Text>
                                                        <Image
                                                            resizeMode={'center'}
                                                            style={{ width: 10, height: 10, marginEnd: 10 }}
                                                            source={require('../../images/down_arrow.png')}>
                                                        </Image>
                                                    </View>
                                                </TouchableOpacity>

                                                <Dialog
                                                    animationType="fade"
                                                    contentStyle={{
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#fff',
                                                    }}
                                                    dialogStyle={{ backgroundColor: '#fff' }}
                                                    onTouchOutside={() => this.openEmail(false)}
                                                    visible={this.state.showEmailD}
                                                >
                                                    <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                                                        <WheelPicker
                                                            style={Platform.OS === 'ios' ? { width: 200 } : { width: 200, height: 80 }}
                                                            selectedItem={this.state.emailSelected}
                                                            data={emailData}
                                                            onItemSelected={this.onItemSelected}
                                                        />
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.setState({ domain: emailData[this.state.emailSelected] })
                                                            this.openEmail(false);
                                                        }}
                                                        style={{
                                                            marginTop: 10,
                                                            marginLeft: 28,
                                                            marginRight: 27,
                                                            width: 220,
                                                            height: 48,
                                                            borderRadius: 5,
                                                            backgroundColor: '#FF0000',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 16, color: '#fff' }}>{Translate('confirm')}</Text>
                                                    </TouchableOpacity>

                                                </Dialog>



                                            </View>
                                        </View>

                                        <View style={{ width: SCREEN_WIDTH * 0.85, height: 40, marginTop: 8, alignSelf: 'center', marginBottom: 8 }}>
                                            <NextButton
                                                title={Translate('confirm')}
                                                buttonColor={'#FF0000'}
                                                onPress={() => {
                                                    this.setState({ isLoading: true }, () => {
                                                        this.state.pw ?
                                                            this.findIdWithEmail('password') :
                                                            this.findIdWithEmail('id')
                                                    })
                                                }} />

                                        </View>
 */}

                                        {/*비밀번호 변경 */}


                                        <View style={styles.elemEmail}>
                                            <View style={styles.elemSetting}>

                                                <TextInput
                                                    style={styles.emailSetting}
                                                    underlineColorAndroid="transparent"
                                                    //placeholder={Translate('email')}
                                                    keyboardType='email-address'
                                                    placeholderTextColor="#878787"
                                                    autoCapitalize="none"
                                                    returnKeyType="done"
                                                    onChangeText={(text) => this.setState({ email: text })}
                                                />

                                                <Text style={{ marginHorizontal: 3, color: '#878787', textAlign: 'center' }}> @ </Text>

                                                <View>
                                                    {
                                                        this.state.notSelf == 0 &&

                                                        <TextInput
                                                            style={{
                                                                width: this.state.notSelf == 0 ? SCREEN_WIDTH * 0.85 * 0.3 : SCREEN_WIDTH * 0.85 * 0.6,
                                                                height: 40,
                                                                borderWidth: 1,
                                                                borderRadius: 3,
                                                                borderColor: '#878787',
                                                                padding: 8,
                                                                marginTop: 8,
                                                                fontSize: normalize(13),
                                                                alignSelf: 'center'
                                                            }}
                                                            underlineColorAndroid="transparent"
                                                            //placeholder={this.state.notSelf == 0 ? Translate('email') : null}
                                                            placeholderTextColor="#878787"
                                                            autoCapitalize="none"
                                                            returnKeyType="done"
                                                            onChangeText={(text) => this.setState({ domain1: text })}
                                                        />
                                                    }
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => this.openEmail(true)}>
                                                    <View
                                                        style={{
                                                            marginLeft: 3,
                                                            width: this.state.notSelf == 0 ? SCREEN_WIDTH * 0.85 * 0.32 : SCREEN_WIDTH * 0.85 * 0.6,
                                                            height: 40,
                                                            borderWidth: 1,
                                                            borderRadius: 3,
                                                            borderColor: '#878787',
                                                            paddingLeft: 8,
                                                            marginTop: 8,
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexDirection: 'row',
                                                        }}>
                                                        <Text
                                                            style={{
                                                                flex: 1,
                                                                color: '#919191',
                                                                fontSize: normalize(12),
                                                                fontWeight: '300',
                                                            }}
                                                        >
                                                            {this.state.domain}
                                                        </Text>
                                                        <Image
                                                            resizeMode={'center'}
                                                            style={{ width: 10, height: 10, marginEnd: 10 }}
                                                            source={require('../../images/down_arrow.png')}>
                                                        </Image>
                                                    </View>
                                                </TouchableOpacity>

                                                <Dialog
                                                    animationType="fade"
                                                    contentStyle={{
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#fff',
                                                    }}
                                                    dialogStyle={{ backgroundColor: '#fff' }}
                                                    onTouchOutside={() => this.openEmail(false)}
                                                    visible={this.state.showEmailD}
                                                >
                                                    <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                                                        <WheelPicker
                                                            style={Platform.OS === 'ios' ? { width: 200 } : { width: 200, height: 80 }}
                                                            selectedItem={this.state.emailSelected}
                                                            data={emailData}
                                                            onItemSelected={this.onItemSelected}
                                                        />
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.setState({ domain: emailData[this.state.emailSelected] })
                                                            this.openEmail(false);
                                                        }}
                                                        style={{
                                                            marginTop: 10,
                                                            marginLeft: 28,
                                                            marginRight: 27,
                                                            width: 220,
                                                            height: 48,
                                                            borderRadius: 5,
                                                            backgroundColor: '#FF0000',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 16, color: '#fff' }}>{Translate('confirm')}</Text>
                                                    </TouchableOpacity>

                                                </Dialog>



                                            </View>
                                        </View>

                                        <View style={{ width: SCREEN_WIDTH * 0.85, height: 40, marginTop: 8, alignSelf: 'center', marginBottom: 8 }}>
                                            <NextButton
                                                title={Translate('reset_password')}
                                                buttonColor={'#FF0000'}
                                                onPress={() => {
                                                    this.setState({ isLoading: true }, () => {
                                                        // this.state.pw ?
                                                        //     this.findIdWithEmail('password') :
                                                        //     this.findIdWithEmail('id')
                                                        this.sendTempPW()
                                                        // this.setState({ isModal: false, tempPW: '', email: '' })
                                                        // var emailString = ''
                                                        // if (this.state.notSelf === 0) {
                                                        //     emailString = this.state.email + '@' + this.state.domain1
                                                        // } else {
                                                        //     emailString = this.state.email + '@' + this.state.domain
                                                        // }
                                                        // this.setState({
                                                        //     emailString: emailString
                                                        // })
                                                        // console.log(this.state.emailString)
                                                        // this.props.navigation.navigate('EditPassword', {
                                                        //     email: this.state.emailString
                                                        // })
                                                    })
                                                }} />

                                        </View>
                                    </View>
                                    : null
                            }


                            {/* <View style={{ backgroundColor: '#9b9b9b', height: this.state.pw ? 1 : 0, marginTop: this.state.email && this.state.pw ? 10 : 2 }} /> */}

                            {/* <View>
                                {this.state.pw ?
                                    <TouchableWithoutFeedback onPress={this.snsComponentHideAndShow}>
                                        <View style={styles.elem}>
                                            <View style={styles.elemSetting}>
                                                <Text style={{ marginLeft: 25, color: '#878787', fontSize: normalize(12) }}> {Translate('find_sns_login')}</Text>
                                            </View>
                                            <View style={{ padding: 25 }}>
                                                <Image source={this.state.sns ? image_arrow : image_arrow_click} style={{ resizeMode: 'contain', width: 15, height: 15 }} />
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                    : null}
                            </View> */}

                            {
                                // this.state.sns && this.state.pw ?
                                //     <View>
                                //         <Text style={{ marginTop: 10, width: SCREEN_WIDTH * 0.85, color: '#9B9B9B', fontSize: normalize(12), alignSelf: 'center' }}>
                                //             {Translate('sns_sns_sns')}
                                //         </Text>
                                //         <View style={styles.elemSns}>
                                //             <View style={styles.elemSetting}>


                                //                 <TouchableWithoutFeedback
                                //                     onPress={() => {
                                //                         Platform.OS === 'ios' ?
                                //                             this.onAppleButtonPress() : this.googleSignIn()
                                //                     }}>
                                //                     <View
                                //                         style={{
                                //                             marginLeft: 10, height: 30, width: SCREEN_WIDTH * 0.85 / 2, backgroundColor: Platform.OS === 'ios' ? '#000' : '#e3411f',
                                //                             flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                         }}>
                                //                         <Image
                                //                             style={{ width: '8.2%', height: '58%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                             source={Platform.OS === 'ios' ? require('../../images/ic_apple_login.png') : require('../../images/ic_login_google.png')} />
                                //                         <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Platform.OS === 'ios' ? Translate('activity_login_apple') : Translate('activity_login_google')}</Text>
                                //                     </View>
                                //                 </TouchableWithoutFeedback>



                                //                 <TouchableWithoutFeedback
                                //                     onPress={() => {
                                //                         this.kakaoLogin();
                                //                     }}>
                                //                     <View
                                //                         style={{
                                //                             marginLeft: 10, height: 30, backgroundColor: '#ffde00', width: SCREEN_WIDTH * 0.85 / 2,
                                //                             flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                         }}>
                                //                         <Image
                                //                             style={{ width: '6.8%', height: '61.2%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                             source={require('../../images/kakao.png')} />
                                //                         <Text style={{ fontSize: normalize(12), color: '#3c1d21', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_kakao')}</Text>
                                //                     </View>
                                //                 </TouchableWithoutFeedback>
                                //             </View>
                                //         </View>

                                //         <View style={styles.elemSns}>
                                //             <View style={styles.elemSetting}>

                                //                 <TouchableWithoutFeedback
                                //                     onPress={() => {
                                //                         this.lineLoginPress()
                                //                     }}>
                                //                     <View
                                //                         style={{
                                //                             marginLeft: 10, height: 30, width: SCREEN_WIDTH * 0.85 / 2, backgroundColor: '#00c300',
                                //                             flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                         }}>
                                //                         <Image
                                //                             style={{ width: '6.8%', height: '61.2%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                             source={require('../../images/ic_login_line.png')} />
                                //                         <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_line')}</Text>
                                //                     </View>
                                //                 </TouchableWithoutFeedback>

                                //                 <TouchableWithoutFeedback
                                //                     onPress={() => {
                                //                         this.handleFacebookButtonPress()
                                //                     }}
                                //                 >
                                //                     <View
                                //                         style={{
                                //                             marginLeft: 10, height: 30, backgroundColor: '#3b5997', width: SCREEN_WIDTH * 0.85 / 2,
                                //                             flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                         }}>
                                //                         <Image
                                //                             style={{ width: '6.8%', height: '61%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                             source={require('../../images/facebook.png')} />
                                //                         <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_facebook')}</Text>
                                //                     </View>
                                //                 </TouchableWithoutFeedback>

                                //             </View>
                                //         </View>
                                //     </View>
                                //     : null

                            }
                            {
                                // this.state.id &&
                                // <View>
                                //     <Text style={{ marginTop: 10, width: SCREEN_WIDTH * 0.85, color: '#9B9B9B', fontSize: normalize(12), alignSelf: 'center' }}>
                                //         {Translate('sns_sns_sns')}
                                //     </Text>
                                //     <View style={styles.elemSns}>
                                //         <View style={styles.elemSetting}>


                                //             <TouchableWithoutFeedback
                                //                 onPress={() => {
                                //                     Platform.OS === 'ios' ?
                                //                         this.onAppleButtonPress() : this.googleSignIn()
                                //                 }}>
                                //                 <View
                                //                     style={{
                                //                         marginLeft: 10, height: 30, width: SCREEN_WIDTH * 0.85 / 2, backgroundColor: Platform.OS === 'ios' ? '#000' : '#e3411f',
                                //                         flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                     }}>
                                //                     <Image
                                //                         style={{ width: '8.2%', height: '58%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                         source={Platform.OS === 'ios' ? require('../../images/ic_apple_login.png') : require('../../images/ic_login_google.png')} />
                                //                     <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Platform.OS === 'ios' ? Translate('activity_login_apple') : Translate('activity_login_google')}</Text>
                                //                 </View>
                                //             </TouchableWithoutFeedback>



                                //             <TouchableWithoutFeedback
                                //                 onPress={() => {
                                //                     this.kakaoLogin();
                                //                 }}>
                                //                 <View
                                //                     style={{
                                //                         marginLeft: 10, height: 30, backgroundColor: '#ffde00', width: SCREEN_WIDTH * 0.85 / 2,
                                //                         flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                     }}>
                                //                     <Image
                                //                         style={{ width: '6.8%', height: '61.2%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                         source={require('../../images/kakao.png')} />
                                //                     <Text style={{ fontSize: normalize(12), color: '#3c1d21', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_kakao')}</Text>
                                //                 </View>
                                //             </TouchableWithoutFeedback>
                                //         </View>
                                //     </View>

                                //     <View style={styles.elemSns}>
                                //         <View style={styles.elemSetting}>

                                //             <TouchableWithoutFeedback
                                //                 onPress={() => {
                                //                     this.lineLoginPress()
                                //                 }}>
                                //                 <View
                                //                     style={{
                                //                         marginLeft: 10, height: 30, width: SCREEN_WIDTH * 0.85 / 2, backgroundColor: '#00c300',
                                //                         flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                     }}>
                                //                     <Image
                                //                         style={{ width: '6.8%', height: '61.2%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                         source={require('../../images/ic_login_line.png')} />
                                //                     <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_line')}</Text>
                                //                 </View>
                                //             </TouchableWithoutFeedback>

                                //             <TouchableWithoutFeedback
                                //                 onPress={() => {
                                //                     this.handleFacebookButtonPress()
                                //                 }}
                                //             >
                                //                 <View
                                //                     style={{
                                //                         marginLeft: 10, height: 30, backgroundColor: '#3b5997', width: SCREEN_WIDTH * 0.85 / 2,
                                //                         flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
                                //                     }}>
                                //                     <Image
                                //                         style={{ width: '6.8%', height: '61%', resizeMode: 'contain', alignSelf: 'center' }}
                                //                         source={require('../../images/facebook.png')} />
                                //                     <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_facebook')}</Text>
                                //                 </View>
                                //             </TouchableWithoutFeedback>

                                //         </View>
                                //     </View>
                                // </View>
                            }
                            <View style={{ backgroundColor: this.state.pw ? '#9b9b9b' : '#fff', height: 1, marginTop: this.state.sns ? 10 : 2 }} />
                            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10, marginTop: 30 }}>
                                <View style={styles.companyInfoLineContainer}>
                                    <Image
                                        style={styles.logoImg}
                                        source={require('../../images/ic_company_logo.png')} />
                                    <Text style={styles.numberText}>{Translate('service_center')} 0502-777-7770</Text>
                                </View>
                                <View style={styles.companyInfoButtonContainer}>
                                    <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('terms_and_conditions'), aId: 1 }) }}>
                                            <Text style={styles.eventText}>{Translate('terms_and_conditions')} </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.eventText}>|</Text>
                                    <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('private_infomation'), aId: 2 }) }}>
                                            <Text style={styles.eventText}> {Translate('private_infomation')} </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.eventText}>|</Text>
                                    <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('location_service'), aId: 3 }) }}>
                                            <Text style={styles.eventText}> {Translate('location_service')} </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.eventText}>|</Text>
                                    <View style={{ width: SCREEN_WIDTH * 0.23, justifyContent: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => { this.props.navigation.navigate('AgreeInfo', { title: Translate('business_infomation'), aId: 4 }) }}>
                                            <Text style={styles.eventText}> {Translate('business_infomation')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={styles.copyText}>Copyright (c) nomadnote. All rights reserved.</Text>
                            </View>

                        </ScrollView>
                        {
                            this.state.isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
                                pointerEvents={'none'}>
                                <ActivityIndicator
                                    size='large'
                                    color={'#FF0000'}
                                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />
                            </View>
                        }

                    </View>
                    {
                        <Modal
                            disableOnBackPress={false}
                            open={this.state.isModal}
                            modalDidClose={() => this.setState({ isModal: false })}
                            modalStyle={{
                                boarderRadius: 2,
                                margin: 20,
                                padding: 10,
                                backgroundColor: '#F5F5F5',
                            }}

                        >
                            <View
                                style={styles.modalView}
                            >
                                <View >
                                    <Text
                                        style={styles.inputInfoTitleText}
                                    >{Translate('temp_code')}</Text>
                                    <Text
                                        style={styles.inputInfoSubTitleText}
                                    >{Translate('enter_code')}</Text>
                                </View>
                                <View>
                                    <TextInput
                                        style={styles.input}
                                        underlineColorAndroid="transparent"
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        onChangeText={(text) => this.setState({ place: text }, () => {
                                            console.log('check place name:', this.state.place)
                                        })}
                                        onChangeText={(text) => this.setState({ tempPassword: text })}
                                    >
                                    </TextInput>
                                    <View style={{ alignSelf: 'flex-end', justifyContent: 'center' }}>
                                        <Text style={{ color: '#FF0000', fontSize: normalize(13), textAlign: 'left' }}>{`${this.state.minutes}:${this.state.seconds < 10 ? '0' + this.state.seconds : this.state.seconds}`}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', height: SCREEN_HEIGHT * 0.08, fontSize: normalize(15) }}>
                                    <View style={{ marginTop: 8, width: "100%", flex: 1, marginRight: 10 }}>
                                        <NextButton
                                            title={Translate('confirm')}
                                            buttonColor={'#FF0000'}
                                            onPress={() => {
                                                if (tempCode === this.state.tempPassword) {
                                                    this.setState({ isModal: false, tempPW: '', email: '' })
                                                    this.props.navigation.navigate('EditPassword', {
                                                        email: this.state.emailString
                                                    })
                                                } else {
                                                    // Toast.show(`잘못된 입력 코드입니다.`, {
                                                    //     duration: 2000,
                                                    //     position: SCREEN_HEIGHT / 4
                                                    // })

                                                }

                                                this.setState({ isLoading: false }, () => {
                                                })
                                            }} />

                                    </View>
                                    <View style={{ marginTop: 8, width: "100%", flex: 1 }}>
                                        <NextButton
                                            title={Translate('cancel2')}
                                            buttonColor={'#FF0000'}
                                            onPress={() => {
                                                this.setState({ isModal: false, isLoading: false })
                                            }}
                                        />

                                    </View>
                                </View>
                            </View>
                        </Modal>
                    }
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
    imgContainer: {
        flex: 215.7,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    inputContainer: {
        flex: 129,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '3%'
    },
    btnContainer: {
        flex: 38,
        width: '77.78%',
        alignSelf: 'center',
    },
    agreeTextContainer: {
        flex: 43,
        alignContent: 'center',
    },
    companyInfoContainer: {
        flex: 161,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    companyInfoLineContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    companyInfoButtonContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        marginBottom: 2
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
        fontSize: normalize(25),
        color: '#779ba4',
        marginStart: '11.11%',
        marginBottom: '18%',
        fontWeight: '400'
    },
    middleView: {
        height: 70,
        marginLeft: 20,
        justifyContent: 'center',

    },
    middleText: {
        color: '#9B9B9B',
        fontSize: normalize(12),
        alignItems: 'center'

    },
    elem: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50
    },

    elemEmail: {
        marginLeft: SCREEN_WIDTH * 0.15 * 0.5,
        marginRight: SCREEN_WIDTH * 0.15 * 0.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50
    },

    elemSns: {
        marginTop: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    elemSetting: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textSetting: {
        width: SCREEN_WIDTH * 0.85,
        height: 40,
        fontSize: normalize(13),
        borderWidth: 1,
        borderRadius: 3,
        borderColor: '#878787',
        padding: 8,
        marginTop: 8,
        alignSelf: 'center'
    },
    emailSetting: {
        width: SCREEN_WIDTH * 0.85 * 0.3,
        height: 40,
        borderWidth: 1,
        borderRadius: 3,
        borderColor: '#878787',
        padding: 8,
        marginTop: 8,
        fontSize: normalize(13),
        alignSelf: 'center'
    },

    emailPicSetting: {
        marginLeft: 3,
        width: SCREEN_WIDTH * 0.85 * 0.32,
        height: 40,
        borderWidth: 1,
        borderRadius: 3,
        borderColor: '#878787',
        padding: 8,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'space-around',
        flexDirection: 'row',

    },
    sns: {
        height: 40
    },
    companyInfoLineContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    companyInfoButtonContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        marginBottom: 2,
    },
    logoImg: {
        width: '20%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-end',
        marginBottom: '2%'
    },
    numberText: {
        fontSize: normalize(9),
        fontWeight: '400',
        color: '#878787',
        alignSelf: 'flex-end',
        marginBottom: '1%',
        marginLeft: normalize(2)
    },
    eventText: {
        flexDirection: 'column',
        flexShrink: 1,
        fontSize: normalize(9),
        fontWeight: '400',
        color: '#878787',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        alignSelf: 'center'
    },
    copyText: {
        fontSize: normalize(9),
        fontWeight: '300',
        marginBottom: '6%',
        color: '#878787'
    },
    pickerIcon: {
        position: "absolute",
        bottom: 15,
        right: 10,
        fontSize: 20
    },
    input: {
        width: '100%',
        paddingVertical: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.009375 : SCREEN_HEIGHT * 0.00469,
        backgroundColor: '#fff',
        borderRadius: 0,
        fontSize: normalize(12),
        color: '#4a4a4a',
        fontWeight: '400',
        marginVertical: 10
    },
    inputInfoTitleText: {
        fontSize: normalize(12),
        color: '#878787',
        fontWeight: '400',
        marginLeft: SCREEN_WIDTH * 0.019,
        flexWrap: 'wrap',
        marginTop: 5,
        marginBottom: 2
    },
    inputInfoSubTitleText: {
        fontSize: normalize(14),
        color: '#878787',
        fontWeight: '500',
        marginLeft: SCREEN_WIDTH * 0.019,
        flexWrap: 'wrap',
        marginTop: 2,
        marginBottom: 5
    },
    modalView: {
        flexDirection: 'column',
        justifyContent: 'space-between'
    }
});

