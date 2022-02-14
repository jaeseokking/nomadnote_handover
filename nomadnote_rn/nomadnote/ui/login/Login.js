import React, { Component } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    Image,
    Dimensions,
    Platform,
    PixelRatio,
    TouchableWithoutFeedback,
    TouchableOpacity,
    I18nManager,
    ActivityIndicator,
    BackHandler,
    Button,
    Alert
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import SetI18nConfig from '../../languages/SetI18nConfig';
import Translate from '../../languages/Translate';
import * as RNLocalize from 'react-native-localize';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import KakaoLogin from '@actbase/react-native-kakao-login';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from "react-native-fbsdk-next";
import DeviceInfo from 'react-native-device-info';
import { setDeviceLang } from '../../utils/Utils';
import Toast from 'react-native-root-toast';
import axios from 'axios';
import appleAuth, {
    AppleButton,
    AppleAuthRequestOperation,
    AppleAuthRequestScope,
    AppleAuthCredentialState,
    AppleAuthError,
} from '@invertase/react-native-apple-authentication';
import jwtDecode from 'jwt-decode';
import LineLogin from '@xmartlabs/react-native-line'
import AgreeModal from '../../components/AgreeModal';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { decryption } from '../../utils/Decryption';
import { encryption } from '../../utils/Encryption';
import RNSmtpMailer from 'react-native-smtp-mailer';





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

export default class Login extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        this.handleBackButton = this.handleBackButton.bind(this);
        this.state = {
            name: '',
            email: '',
            joinType: null,
            snsKey: '',
            gender: '',
            age: '',
            isCheckedAutoLogin: true,
            isModal: false,
            isCheckedAgreement: false,
            isCheckedPersonalInfo: false,
            isCheckedLocationInfo: false,
            isCheckedTotal: false,
            isCheckEmail: false,
            lang: setDeviceLang(),
            checked: false,
            isJoin: false,
            isLoading: false,
            validCloseWindow: false,
        };
    }

    componentDidMount = async () => {
        GoogleSignin.configure({});
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        const autoLogin = await getItemFromAsync('auto_login');
        console.log('auto Login: ', autoLogin)

        if (autoLogin === null || autoLogin === '') {
            this.setState({ isCheckedAutoLogin: true })
        } else {
            this.setState({ isCheckedAutoLogin: autoLogin })
        }

    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    }

    handleBackButton = () => {
        let index = this.props.navigation.dangerouslyGetParent().state.index;
        console.log('navigation: ', index)
        if (this.props.navigation.isFocused()) {
            if (this.state.validCloseWindow)
                return false;
            this.setState({ validCloseWindow: true })
            setTimeout(() => {
                this.setState({ validCloseWindow: false })
            }, 3000);
            Toast.show(`${Translate('back_message')}`, {
                duration: 3000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('back_message')}`, Toast.SHORT);
            return true;
        }
    };

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    handleFacebookButtonPress = async () => {
        var self = this
        LoginManager.logInWithPermissions(["public_profile", "email"]).then(
            function (result) {
                if (result.isCancelled) {
                    console.log("Login cancelled");
                    self.setState({ isLoading: false })
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
                self.setState({ isLoading: false })
            }
        );
    }

    getFaceBookInfo = async () => {
        const self = this
        const infoRequest = new GraphRequest(
            '/me?fields=id,name,email,gender',
            {
                httpMethod: 'POST'
            },
            (err, res) => {
                if (err) {
                    console.log('error?', err);
                    self.setState({ isLoading: false })
                } else {
                    console.log('facebookRes', res)
                    setItemToAsync('sns', res.id);
                    this.setState({
                        name: res.name,
                        joinType: 4,
                        snsKey: res.id,
                        email: res.email === '' || res.email === null || res.email === undefined ? '' : res.email
                    }, () => {
                        this.checkUserInfo()
                    })
                }
            },
        );
        new GraphRequestManager().addRequest(infoRequest).start();
    }

    kakaoLogin = () => {
        const self = this
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
                self.setState({ isLoading: false })
            });
    };

    getProfile = () => {
        const self = this
        KakaoLogin.getProfile()
            .then((result) => {
                console.log(`Login Finished getProfile:${JSON.stringify(result)}`);
                setItemToAsync('sns', result.id)
                this.setState({
                    name: result.kakao_account.profile.nickname,
                    joinType: 1,
                    snsKey: result.id,
                    gender: result.kakao_account.gender === '' ? '' : result.kakao_account.gender === 'MALE' ? 'M' : 'F',
                    email: result.kakao_account.is_email_valid ? result.kakao_account.email : ''
                }, () => {
                    this.checkUserInfo();
                })
            })
            .catch((err) => {
                console.log(`Get Profile Failed:${err.code} ${err.message}`);
                self.setState({ isLoading: false })
            });
    };


    //apple login
    async onAppleButtonPress() {
        // performs login request
        const self = this
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

                //sub -> snsKey , email -> email 
                setItemToAsync('sns', decode.sub);
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
            self.setState({ isLoading: false })
        }
    }

    lineLoginPress() {
        const self = this
        LineLogin.login()
            .then(user => {
                console.log('user', user.userProfile);
                const userInfo = user.userProfile
                console.log("Line Login User Info :::::::::::",user);
                setItemToAsync('sns', userInfo.userID);
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
                self.setState({ isLoading: false })
            });
    }

    //구글 로그인
    googleSignIn = async () => {
        const self = this
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            console.log('googleUserInfo =', userInfo)
            setItemToAsync('sns', userInfo.user.id);
            this.setState({
                name: userInfo.user.name,
                snsKey: userInfo.user.id,
                joinType: 3,
                email: (userInfo.user.email === '' || userInfo.user.email === null) ? '' : userInfo.user.email
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
            self.setState({ isLoading: false })
        }
    };

    updateInfo(id, snsKey) {
        console.log('cant here?')
        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);

        if (id === 1) {
            bodyFormData.append('kko_sns_key', snsKey);
        } else if (id === 2) {
            bodyFormData.append('naver_sns_key', snsKey);
        } else if (id === 3) {
            bodyFormData.append('google_sns_key', snsKey);
        } else if (id === 4) {
            bodyFormData.append('facebook_sns_key', snsKey);
        } else if (id === 8) {
            bodyFormData.append('apple_sns_key', snsKey);
        }


        let url = global.server + `/api/member/update_info`
        console.log(url)
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                if (response.data.result === 'ok') {
                    console.log('updateInfo = ', response.data);
                    this.props.navigation.replace('TabHome')
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
        console.log('bodyForm', bodyFormData)

        let url = global.server + `/api/login/valid_user`
        console.log(url)
        console.log('param', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('data =', response.data)
                if (response.data.result === 'ok') {
                    var vData = response.data.member
                    this.setState({ isJoin: true })
                    switch (joinType) {
                        case 1: { // 카카오
                            if (vData.length != 0) {
                                global.user = vData
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)
                                setItemToAsync('auto_login', this.state.isCheckedAutoLogin)
                                this.memberAgreeVersionCheck();
                                // if ((vData.age === null || vData.age === '') && (vData.gender === null || vData.gender === '')) {
                                //     this.props.navigation.replace('JoinStep2', {
                                //         email: '',
                                //         pw: '',
                                //         joinType: joinType,
                                //         deviceId: deviceId,
                                //         userName: this.state.name,
                                //         userId: vData.id
                                //     })
                                // } else {
                                //     this.setState({ age: vData.age, gender: vData.gender }, () => {
                                //         this.join();
                                //     })
                                // }
                            }
                            break;
                        }
                        case 2: { // 네이버 or 라인?
                            if (vData.length != 0) {
                                global.user = vData
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)
                                setItemToAsync('auto_login', this.state.isCheckedAutoLogin)
                                this.memberAgreeVersionCheck();
                                // if ((vData.age === null || vData.age === '') && (vData.gender === null || vData.gender === '')) {
                                //     this.props.navigation.replace('JoinStep2', {
                                //         email: '',
                                //         pw: '',
                                //         joinType: joinType,
                                //         deviceId: deviceId,
                                //         userName: this.state.name,
                                //         userId: vData.id
                                //     })
                                // } else {
                                //     this.props.navigation.replace('TabHome')
                                //     this.setState({ age: vData.age, gender: vData.gender }, () => {
                                //         this.join();
                                //     })
                                // }
                            }
                            break;
                        }
                        case 3: { // 구글
                            if (vData.length != 0) {
                                global.user = vData
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)
                                setItemToAsync('auto_login', this.state.isCheckedAutoLogin)
                                this.memberAgreeVersionCheck();
                                // if ((vData.age === null || vData.age === '') && (vData.gender === null || vData.gender === '')) {
                                //     this.props.navigation.replace('JoinStep2', {
                                //         email: '',
                                //         pw: '',
                                //         joinType: joinType,
                                //         deviceId: deviceId,
                                //         userName: this.state.name,
                                //         userId: vData.id
                                //     })
                                // } else {
                                //     this.props.navigation.replace('TabHome')
                                //     this.setState({ age: vData.age, gender: vData.gender }, () => {
                                //         this.join();
                                //     })
                                // }
                            }
                            break;
                        }
                        case 4: { // 페이스북
                            if (vData.length != 0) {
                                global.user = vData
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('auto_login', this.state.isCheckedAutoLogin)
                                setItemToAsync('device_id', deviceId)
                                this.memberAgreeVersionCheck();
                                // if ((vData.age === null || vData.age === '') && (vData.gender === null || vData.gender === '')) {
                                //     this.props.navigation.replace('JoinStep2', {
                                //         email: '',
                                //         pw: '',
                                //         joinType: joinType,
                                //         deviceId: deviceId,
                                //         userName: this.state.name,
                                //         userId: vData.id
                                //     })
                                // } else {
                                //     this.setState({ age: vData.age, gender: vData.gender }, () => {
                                //         this.join();
                                //     })
                                // }
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
                            if (vData.length != 0) {
                                global.user = vData
                                setItemToAsync('join_type', this.state.joinType)
                                setItemToAsync('device_id', deviceId)
                                setItemToAsync('auto_login', this.state.isCheckedAutoLogin)
                                this.memberAgreeVersionCheck();
                                // if ((vData.age === null || vData.age === '') && (vData.gender === null || vData.gender === '')) {
                                //     this.props.navigation.replace('JoinStep2', {
                                //         email: '',
                                //         pw: '',
                                //         joinType: joinType,
                                //         deviceId: deviceId,
                                //         userName: this.state.name,
                                //         userId: vData.id
                                //     })
                                // } else {
                                //     this.props.navigation.replace('TabHome')
                                //     this.setState({ age: vData.age, gender: vData.gender }, () => {
                                //         this.join();
                                //     })
                                // }
                            }
                            break;
                        }
                    }

                    global.token = response.data.member.token

                    // this.props.navigation.navigate('TabHome')
                } else {
                    console.log('no data!')
                    this.setState({ isJoin: false })
                    this.join();
                    // this.props.navigation.replace('JoinStep2', {
                    //     email: '',
                    //     pw: '',
                    //     joinType: joinType,
                    //     deviceId: deviceId,
                    //     userName: this.state.name,
                    //     userId: ''
                    // })
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    join() {
        let uniqueId = DeviceInfo.getUniqueId();
        const deviceId = uniqueId
        const lang = setDeviceLang();
        const self = this
        console.log('JOIN!!!!!!!')
        var bodyFormData = new FormData();
        bodyFormData.append('name', this.state.name);
        if (this.state.email === null || this.state.email === '') {
            bodyFormData.append('email', null)
        } else {
            const encryptedEmail = encryption(this.state.email);
            bodyFormData.append('email', encryptedEmail);
        }
        //bodyFormData.append('email', this.state.email);
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
                    }
                   

               
                    //global.user = { ...member, "phone": member.phone, "email": member.email };
                    setItemToAsync('join_type', this.state.joinType)
                    setItemToAsync('device_id', deviceId)
                    if (response.data.member.email === null || response.data.member.email === '') {
                        setItemToAsync('email', '')
                    } else {
                        setItemToAsync('email', response.data.member.email)
                    }
                    setItemToAsync('auto_login', this.state.isCheckedAutoLogin)

                    if (this.state.isJoin) { // 회원 있음.
                        self.setState({ isLoading: false })
                        this.props.navigation.replace('TabHome');
                    } else { // 회원가입
                        this.memberAgreeVersionCheck();
                    }
                } else {
                    // console.log("response.data.message :::: ",response.data.message)
                    Toast.show(`${Translate('already_join_email')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${response.data.message}`)
                    self.setState({ isLoading: false })
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    agreeVersionCheck() {
        var self = this

        let url = global.server + `/api/agrees`
        axios.get(url)
            .then(function (response) {
                if (response.data.result === 'ok') {
                    var versionInfo = response.data
                    console.log('version: ', versionInfo.data[0].version, global.user.agree1_version)
                    console.log('version: ', versionInfo.data[1].version, global.user.agree2_version)
                    console.log('version: ', versionInfo.data[2].version, global.user.agree3_version)

                    if (versionInfo.data[0].version !== global.user.agree1_version) {
                        this.setAgree(versionInfo.data[0].version);
                    }

                    if (versionInfo.data[1].version !== global.user.agree2_version) {
                        this.setPersonalInfo(versionInfo.data[1].version)
                    }

                    if (versionInfo.data[2].version !== global.user.agree3_version) {
                        this.setLocationInfo(versionInfo.data[2].version)
                    }

                    console.log('version', versionInfo.data[2].version, global.user.agree3_version)
                    self.setState({ isLoading: false })
                    this.props.navigation.replace('TabHome');
                    if (!this.state.isJoin) {
                        Toast.show(`${Translate('success_member')}`, {
                            duration: 1000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('success_member')}`);
                    }
                } else {
                    self.setState({ isLoading: false })
                    Toast.show(`${Translate('occur_error')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('occur_error')}`)
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    memberAgreeVersionCheck() {
        var self = this

        let url = global.server + `/api/agrees`
        axios.get(url)
            .then(function (response) {
                if (response.data.result === 'ok') {
                    var versionInfo = response.data
                    console.log('version: ', versionInfo.data[0].version, global.user.agree1_version)
                    console.log('version: ', versionInfo.data[1].version, global.user.agree2_version)
                    console.log('version: ', versionInfo.data[2].version, global.user.agree3_version)

                    if (versionInfo.data[0].version !== global.user.agree1_version || versionInfo.data[1].version !== global.user.agree2_version || versionInfo.data[2].version !== global.user.agree3_version) {
                        this.setState({ checked: false }, () => {
                            this.toggleSettingModal();
                        })
                    } else {
                        this.setState({ checked: true }, () => {
                            if (this.state.isJoin) {
                                this.join();
                            } else {
                                self.setState({ isLoading: false })
                                this.props.navigation.replace('TabHome');
                                Toast.show(`${Translate('success_member')}`, {
                                    duration: 1000,
                                    position: Toast.positions.CENTER
                                })
                                // Toast.show(`${Translate('success_member')}`);

                            }
                        })
                    }
                } else {
                    Toast.show(`${Translate('occur_error')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('occur_error')}`)
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    setAgree(version) {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 1);
        bodyFormData.append('version', version);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    setItemToAsync('isCheckedAgreement', false)
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    setPersonalInfo(version) {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 2);
        bodyFormData.append('version', version);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    setItemToAsync('isCheckedPersonalInfo', false)
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    setLocationInfo(version) {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', 3);
        bodyFormData.append('version', version);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    setItemToAsync('isCheckedLocationInfo', false)
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    toggleSettingModal() {
        this.setState({
            isModal: !this.state.isModal,
        })
    }

    setChecked() {
        if (!this.state.isCheckedAgreement) {
            Toast.show(`${Translate('message_areement')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('message_areement')}`);
            return
        } else if (!this.state.isCheckedPersonalInfo) {
            Toast.show(`${Translate('message_personal_info')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('message_personal_info')}`);
            return
        } else if (!this.state.isCheckedLocationInfo) {
            Toast.show(`${Translate('message_location_info')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('message_location_info')}`);
            return
        } else {
            this.toggleSettingModal()
            this.setState({ checked: true })
            setItemToAsync('isCheckedAgreement', this.state.isCheckedAgreement);
            setItemToAsync('isCheckedPersonalInfo', this.state.isCheckedPersonalInfo);
            setItemToAsync('isCheckedLocationInfo', this.state.isCheckedLocationInfo);

            this.agreeVersionCheck();
        }
    }

    checkAgreement() {
        this.setState({ isCheckedAgreement: !this.state.isCheckedAgreement })
    }

    checkPersonalInfo() {
        this.setState({ isCheckedPersonalInfo: !this.state.isCheckedPersonalInfo })
    }

    checkLocationInfo() {
        this.setState({ isCheckedLocationInfo: !this.state.isCheckedLocationInfo })
    }

    checkTotAgreement() {
        this.setState({
            isCheckedTotal: !this.state.isCheckedTotal
        }, () => {
            this.setState({
                isCheckedAgreement: this.state.isCheckedTotal,
                isCheckedPersonalInfo: this.state.isCheckedTotal,
                isCheckedLocationInfo: this.state.isCheckedTotal
            })
        })
    }

    openAgreementView() {
        this.props.navigation.navigate('AgreeInfo', { title: Translate('terms_and_conditions'), aId: 1 })
    }

    openPersonalInfoView() {
        this.props.navigation.navigate('AgreeInfo', { title: Translate('private_infomation'), aId: 2 })
    }

    openLocationInfoView() {
        this.props.navigation.navigate('AgreeInfo', { title: Translate('location_service'), aId: 3 })
    }



    render() {
        const { navigation } = this.props;
        const { isModal, isLoading } = this.state;

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <View style={styles.topContainer}>
                            <Image
                                style={styles.loginImage}
                                resizeMode={'contain'}
                                source={require('../../images/login_logo.png')} />
                            <View style={styles.textContainer}>
                                <Text style={styles.logoText}>{Translate('welcome')} </Text>
                                {/* <Text style={styles.logoText}>{Translate('nomadnote')}</Text> */}
                            </View>
                        </View>
                        <View style={styles.middleContainer}>

                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    this.setState({ isLoading: true }, () => {
                                        this.googleSignIn()
                                    })
                                }}
                            >
                                <View
                                    style={{
                                        height: '18.13%', width: '77.78%', backgroundColor: '#e3411f',
                                        flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 5, marginBottom: 4
                                    }}>
                                    <Image
                                        style={{ width: '8.2%', height: '58%', resizeMode: 'contain', alignSelf: 'center' }}
                                        source={require('../../images/ic_login_google.png')} />
                                    <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{'Sign in with Google'}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    this.setState({ isLoading: true }, () => {
                                        this.kakaoLogin();
                                    })

                                }}
                            >
                                <View
                                    style={{
                                        height: '18.13%', width: '77.78%', backgroundColor: '#ffde00',
                                        flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 5, marginBottom: 4
                                    }}>
                                    <Image
                                        style={{ width: '6.8%', height: '61.2%', resizeMode: 'contain', alignSelf: 'center' }}
                                        source={require('../../images/kakao.png')} />
                                    <Text style={{ fontSize: normalize(12), color: '#3c1d21', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{'Sign in with kakaoTalk'}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    this.setState({ isLoading: true }, () => {
                                        this.lineLoginPress()
                                    })

                                }}
                            >
                                <View
                                    style={{
                                        height: '18.13%', width: '77.78%', backgroundColor: '#00c300',
                                        flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 5, marginBottom: 4
                                    }}>
                                    <Image
                                        style={{ width: '6.4%', height: '58%', resizeMode: 'contain', alignSelf: 'center' }}
                                        source={require('../../images/ic_login_line.png')} />
                                    <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{'Sign in with Line'}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback
                                onPress={() => {
                                    this.setState({ isLoading: true }, () => {
                                        this.handleFacebookButtonPress()
                                    })
                                }}
                            >
                                <View
                                    style={{
                                        height: '18.13%', width: '77.78%', backgroundColor: '#3b5997',
                                        flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 5, marginBottom: Platform.OS === 'ios' ? 4 : 0
                                    }}>
                                    <Image
                                        style={{ width: '6.4%', height: '58%', resizeMode: 'contain', alignSelf: 'center' }}
                                        source={require('../../images/facebook.png')} />
                                    <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{'Sign in with Facebook'}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            {
                                Platform.OS === 'ios' ?

                                    <AppleButton
                                        buttonStyle={AppleButton.Style.BLACK}
                                        buttonType={AppleButton.Type.SIGN_IN}
                                        style={{
                                            width: '77.78%', // You must specify a width
                                            height: '18.13%', // You must specify a height
                                        }}
                                        onPress={() => {
                                            this.setState({ isLoading: true }, () => {
                                                this.onAppleButtonPress()
                                            })
                                        }}
                                    >
                                    </AppleButton>

                                    :
                                    null
                            }
                        </View>
                        <View style={{ marginTop: 10, width: '77.78%', alignSelf: 'center' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    this.setState({ isCheckedAutoLogin: !this.state.isCheckedAutoLogin }, () => {
                                        setItemToAsync('auto_login', this.state.isCheckedAutoLogin);
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
                        <View style={styles.bottomContainer}>
                            <View style={styles.loginContainer}>
                                <TouchableWithoutFeedback
                                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    onPress={() => {
                                        navigation.navigate('EmailLogin');

                                    }}>
                                    <Text style={styles.text}>{Translate('activity_login_login')} </Text>
                                </TouchableWithoutFeedback>
                                <Text style={styles.text}> / </Text>
                                <TouchableWithoutFeedback
                                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    onPress={() => {
                                        navigation.navigate('JoinStep1');
                                    }}>
                                    <Text style={styles.text}> {Translate('activity_login_signup')}</Text>
                                </TouchableWithoutFeedback>

                            </View>
                            <View style={styles.findContainer}>
                                <TouchableWithoutFeedback
                                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    onPress={() => {
                                        this.props.navigation.navigate('FindId', { id: true });
                                    }}>
                                    <Text style={styles.text}>{Translate('find_id')} </Text>
                                </TouchableWithoutFeedback>
                                <Text style={styles.text}> / </Text>

                                <TouchableWithoutFeedback
                                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    onPress={() => {
                                        this.props.navigation.navigate('FindId', { pw: true });
                                    }}>
                                    <Text style={styles.text}>{Translate('find_password')} </Text>
                                </TouchableWithoutFeedback>
                            </View>
                        </View>
                        {
                            isModal && <AgreeModal
                                content={Translate('message_agreement_content')}
                                confirmText={Translate('confirm')}
                                lang={this.state.lang}
                                isBackgroundTranparant={false}
                                logo={Translate('welcome')}
                                agreement={`[${Translate('necessity')}] ${Translate('agreement')}`}
                                personalInfo={`[${Translate('necessity')}] ${Translate('agreement_personal_info')}`}
                                locationInfo={`[${Translate('necessity')}] ${Translate('agreement_location_info')}`}
                                viewText={Translate('view')}
                                totAgreement={Translate('total_agreement')}
                                totAgreementContent={Translate('confirm_total_agreement')}
                                isCheckedAgreement={this.state.isCheckedAgreement}
                                isCheckedPersonalInfo={this.state.isCheckedPersonalInfo}
                                isCheckedLocationInfo={this.state.isCheckedLocationInfo}
                                isCheckedTotal={this.state.isCheckedTotal}
                                onPressOk={() => { this.setChecked() }}
                                onPressAgreement={() => { this.checkAgreement() }}
                                onPressAgreementView={() => { this.openAgreementView() }}
                                onPressPersonalInfo={() => { this.checkPersonalInfo() }}
                                onPressPersonalInfoView={() => { this.openPersonalInfoView() }}
                                onPressLocationInfo={() => { this.checkLocationInfo() }}
                                openLocationInfoView={() => { this.openLocationInfoView() }}
                                onPressTotalAgreement={() => { this.checkTotAgreement() }}
                            />
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
    topContainer: {
        flex: 248,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    middleContainer: {
        flex: 92,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    },
    buttonContainer: {
        flex: 171,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bottomContainer: {
        flex: 108,
    },
    loginImage: {
        width: SCREEN_WIDTH * 0.5278,
        height: SCREEN_WIDTH * 0.5278 * 0.2895,
        alignItems: 'center',
        marginBottom: 4
    },
    topSafeArea: {
        flex: 0,
        backgroundColor: THEME_COLOR
    },
    bottomSafeArea: {
        flex: 1,
        backgroundColor: THEME_COLOR
    },
    loginContainer: {
        flexDirection: 'row',
        marginTop: '6%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    findContainer: {
        flexDirection: 'row',
        marginTop: '3%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: normalize(12),
        color: '#779ba4'
    },
    kakaoText: {
        fontSize: normalize(12),
        color: '#3c1d21',
        fontWeight: '500',
        alignSelf: 'center',
        marginLeft: '2.5%'
    },
    logoText: {
        color: '#5a686f',
        fontWeight: 'bold',
        fontSize: Platform.OS === 'ios' ? normalize(15) : normalize(16),
        alignSelf: 'center'
    }
});



{/* <TouchableWithoutFeedback
onPress={() => {
    this.onAppleButtonPress()
}}
>
<View
    style={{
        height: '18.13%', width: '77.78%', backgroundColor: '#000',
        flexDirection: 'row', alignContent: 'center', justifyContent: 'center', borderRadius: 2
    }}>
    <Image
        style={{ width: '6.4%', height: '58%', resizeMode: 'contain', alignSelf: 'center' }}
        source={require('../../images/ic_apple_login.png')} />
    <Text style={{ fontSize: normalize(12), color: '#fff', fontWeight: '500', alignSelf: 'center', marginLeft: '2.5%' }}>{Translate('activity_login_apple')}</Text>
</View>
</TouchableWithoutFeedback>  */}