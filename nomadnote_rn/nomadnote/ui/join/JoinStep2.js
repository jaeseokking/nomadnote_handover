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
    Keyboard,
    PermissionsAndroid,
    ActivityIndicator
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import NextButton from '../../components/NextButton';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate'
import { getItemFromAsync, removeItemToAsync, setItemToAsync } from '../../utils/AsyncUtil';
import Toast from 'react-native-root-toast';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import DeviceInfo from 'react-native-device-info';
import { setDeviceLang } from '../../utils/Utils';
import AgreeModal from '../../components/AgreeModal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import CryptoJS from 'crypto-js';
import { decryption } from '../../utils/Decryption'
import { encryption } from '../../utils/Encryption'
import { validAge, validPhone } from '../../utils/Validation'
const THEME_COLOR = '#4a4a4a'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
// let imageWidth = Dimensions.get('window').width * 0.9;
// let imageHeight = 324 * imageWidth / 343;

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class JoinStep2 extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        const { params } = this.props.navigation.state
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
        this.state = {
            name: this.props.navigation.state.params.userName,
            age: '',
            phone: '',
            gender: '',
            mProfile: '',
            fProfile: '',
            filePath: '',
            fileData: '',
            fileUri: '',
            userId: this.props.navigation.state.params.userId,
            resizeFileUri: '',
            btnHeight: 0,
            isModal: false,
            isCheckedAgreement: false,
            isCheckedPersonalInfo: false,
            isCheckedLocationInfo: false,
            isCheckedTotal: false,
            isCheckEmail: false,
            lang: setDeviceLang(),
            checked: false,
            imgWidth: 0,
            imgHeight: 0,
            isLoading: false
        };
    }

    handleBackButtonClick() {
        // this.setState({ isCloseApp: !this.state.isCloseApp })
        if (this.props.navigation.state.params.joinType === 5) {
            this.props.navigation.goBack();
        } else {
            this.props.navigation.replace('Login');
        }
        return true;
    }

    async join() {
        const self = this;
        this.setState({ isLoading: true })

        if (this.state.gender === '') {
            Toast.show(`${Translate('chooseyourgender')}`, {
                duration: 3000,
                position: SCREEN_HEIGHT / 4
            })
            // Toast.show(`${Translate('chooseyourgender')}`)
            this.setState({ isLoading: false })
            return
        }

        if (this.state.name === '') {
            Toast.show(`${Translate('enteryourname')}`, {
                duration: 3000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('enteryourname')}`)
            this.inputName.focus();
            this.setState({ isLoading: false })
            return
        }

        if (this.state.age === '') {
            Toast.show(`${Translate('enteryourage')}`, {
                duration: 3000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('enteryourage')}`)
            this.inputAge.focus();
            this.setState({ isLoading: false })
            return
        }

        if (!validAge(this.state.age)) {
            Toast.show('숫자만 입력가능', {
                duration: 3000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show('숫자만 입력가능')
            this.inputAge.focus();
            this.setState({ isLoading: false })
            return
        }

        if (this.state.phone === '') {
            Toast.show(`${Translate('enter_phonenumber')}`, {
                duration: 3000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('enter_phonenumber')}`)
            this.inputPhone.focus();
            this.setState({ isLoading: false })
            return
        }

        if (!validPhone(this.state.phone)) {
            Toast.show('숫자만 입력가능', {
                duration: 3000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show('숫자만 입력가능')
            this.inputPhone.focus();
            this.setState({ isLoading: false })
            return
        }

        const snsKey = await getItemFromAsync('sns');
        const email = this.props.navigation.state.params.email
        const pw = this.props.navigation.state.params.pw
        const encryptedPW = CryptoJS.SHA256(pw).toString()
        const joinType = this.props.navigation.state.params.joinType
        const deviceId = this.props.navigation.state.params.deviceId
        const lang = global.lang
        const encryptedPhone = encryption(this.state.phone);
        const encryptedEmail = encryption(email)

        var bodyFormData = new FormData();
        bodyFormData.append('name', this.state.name);
        bodyFormData.append('email', encryptedEmail);
        bodyFormData.append('passwd', encryptedPW);
        bodyFormData.append('phone', encryptedPhone);
        // bodyFormData.append('email', email);
        // bodyFormData.append('passwd', pw);
        // bodyFormData.append('phone', this.state.phone);
        bodyFormData.append('join_type', joinType);
        bodyFormData.append('gender', this.state.gender);
        bodyFormData.append('age', this.state.age);
        bodyFormData.append('android_id', deviceId);
        bodyFormData.append('language', lang);
        bodyFormData.append('sns_key', snsKey);
        bodyFormData.append('device_type', Platform.OS === 'ios' ? 'ios' : 'android');

        if (this.state.resizeFileUri != '') {
            bodyFormData.append('photo', {
                uri: this.state.resizeFileUri,
                name: 'profile.jpg',
                type: 'image/jpg'
            });
        }

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
                    Toast.show(`${Translate('success_member')}`, {
                        duration: 1500,
                        position: 0
                    })
                    // Toast.show(`${Translate('success_member')}`)
                    setItemToAsync('email', email)
                    setItemToAsync('pw', pw)
                    setItemToAsync('join_type', joinType)
                    setItemToAsync('device_id', deviceId)
                    setItemToAsync('login_type', 'email')
                    setItemToAsync('sns', snsKey);

                    this.agreeVersionCheck();
                } else {
                    Toast.show(`${response.data.message}`, {
                        duration: 2000,
                        position: 0
                    })
                    // Toast.show(`${response.data.message}`)
                    this.setState({ isLoading: false })
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

    modiUserInfo() {
        var self = this

        const email = this.props.navigation.state.params.email
        const pw = this.props.navigation.state.params.pw
        const joinType = this.props.navigation.state.params.joinType
        const deviceId = this.props.navigation.state.params.deviceId
        const lang = global.lang

        if (this.state.gender === '') {
            Toast.show(`${Translate('chooseyourgender')}`)
            return
        }

        if (this.state.name === '') {
            Toast.show(`${Translate('enteryourname')}`)
            this.inputName.focus();
            return
        }

        if (this.state.age === '') {
            Toast.show(`${Translate('enteryourage')}`)
            this.inputAge.focus();
            return
        }

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', this.state.userId);
        bodyFormData.append('name', this.state.name);
        bodyFormData.append('age', this.state.age);
        bodyFormData.append('gender', this.state.gender);
        bodyFormData.append('phone', this.state.phone);
        bodyFormData.append('device_type', Platform.OS === 'ios' ? 'ios' : 'android');

        if (this.state.resizeFileUri != '') {
            bodyFormData.append('photo', {
                uri: this.state.resizeFileUri,
                name: 'profile.jpg',
                type: 'image/jpg'
            });
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
                console.log(response.data);
                if (response.data.result === 'ok') {
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
                    setItemToAsync('email', email)
                    setItemToAsync('pw', pw)
                    setItemToAsync('join_type', joinType)
                    setItemToAsync('device_id', deviceId)
                    setItemToAsync('login_type', 'sns')

                    this.agreeVersionCheck();
                } else {
                    Toast.show(`${Translate('occur_error')}`)
                }
                // this.setState({ isLoading: false })
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                // self.setState({ isLoading: false })
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
                    this.setState({ isLoading: false })
                    this.props.navigation.replace('TabHome')
                } else {
                    Toast.show(`${Translate('occur_error')}`)
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
                            this.modiUserInfo();
                        })
                    }
                } else {
                    Toast.show(`${Translate('occur_error')}`)
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
            });
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        this.setState({ btnHeight: height })
    }

    mLaunchImageLibrary = () => {
        let options = {
            mediaType: 'photo',
            includeBase64: true,
        }
        ImagePicker.launchImageLibrary(options, (response) => {
            // console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
                alert(response.customButton);
            } else {
                const source = { uri: response.uri };
                // console.log('response', JSON.stringify(response));

                this.setState({
                    filePath: response,
                    fileData: response.data,
                    fileUri: response.uri,
                    mProfile: { uri: 'data:image/jpeg;base64,' + response.base64 },
                    fProfile: '',
                    imgWidth: response.width,
                    imgHeight: response.height
                }, () => {
                    ImageResizer.createResizedImage(this.state.fileUri, this.state.imgWidth, this.state.imgHeight, 'JPEG', 100)
                        .then(response => {
                            // console.log(response.uri)
                            this.setState({ resizeFileUri: response.uri })
                            console.log('resize url: ', this.state.resizeFileUri)
                        })
                        .catch(err => {
                            console.log(err)
                        });
                });

                // this.resizeImage()
            }
        });
    }

    fLaunchImageLibrary = () => {
        let options = {
            mediaType: 'photo',
            includeBase64: true,
        }
        ImagePicker.launchImageLibrary(options, (response) => {
            // console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
                alert(response.customButton);
            } else {
                const source = { uri: response.uri };
                // console.log('response', JSON.stringify(response));

                this.setState({
                    filePath: response,
                    fileData: response.data,
                    fileUri: response.uri,
                    fProfile: { uri: 'data:image/jpeg;base64,' + response.base64 },
                    mProfile: '',
                    imgWidth: response.width,
                    imgHeight: response.height
                }, () => {
                    ImageResizer.createResizedImage(this.state.fileUri, this.state.imgWidth, this.state.imgHeight, 'JPEG', 100)
                        .then(response => {
                            // console.log(response.uri)
                            this.setState({ resizeFileUri: response.uri })
                            console.log('resize url: ', this.state.resizeFileUri)
                        })
                        .catch(err => {
                            console.log(err)
                        });
                });

                // this.resizeImage()
            }
        });
    }

    async hasAndroidPermission() {
        const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

        const hasPermission = await PermissionsAndroid.check(permission);
        if (hasPermission) {
            return true;
        }

        const status = await PermissionsAndroid.request(permission);
        if (status === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        }

        if (status === PermissionsAndroid.RESULTS.DENIED) {
            Toast.show('Image registration permission denied by user.', {
                duration: 3000,
                position: 0
            });
            // Toast.show('Image registration permission denied by user.')
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Toast.show('Image registration permission revoked by user.', {
                duration: 3000,
                position: 0
            });
            // Toast.show('Image registration permission revoked by user.')
        }

        return false;
    }

    async openPicker(navigation) {
        if (Platform.OS === 'android') {
            const hasAndroidPermission = await this.hasAndroidPermission();

            if (!hasAndroidPermission) {
                return;
            }
        }

        navigation.navigate('PhotoPicker', {
            onSelect: this.onSelect,
            gender: this.state.gender
        })
    }

    onSelect = data => {
        this.setState(data);
    };

    resizeImage() {
        console.log("here!")
    }

    toggleSettingModal() {
        if (this.state.gender === '') {
            Toast.show(`${Translate('chooseyourgender')}`)
            return
        }

        if (this.state.name === '') {
            Toast.show(`${Translate('enteryourname')}`)
            this.inputName.focus();
            return
        }

        if (this.state.age === '') {
            Toast.show(`${Translate('enteryourage')}`)
            this.inputAge.focus();
            return
        }

        if (this.state.phone === '') {
            Toast.show(`${Translate('enter_phonenumber')}`)
            this.inputPhone.focus();
            return
        }

        this.setState({
            isModal: !this.state.isModal,
        })
    }

    setChecked() {
        if (!this.state.isCheckedAgreement) {
            Toast.show(`${Translate('message_areement')}`);
            return
        } else if (!this.state.isCheckedPersonalInfo) {
            Toast.show(`${Translate('message_personal_info')}`);
            return
        } else if (!this.state.isCheckedLocationInfo) {
            Toast.show(`${Translate('message_location_info')}`);
            return
        } else {
            this.toggleSettingModal()
            this.setState({ checked: true })
            setItemToAsync('isCheckedAgreement', this.state.isCheckedAgreement);
            setItemToAsync('isCheckedPersonalInfo', this.state.isCheckedPersonalInfo);
            setItemToAsync('isCheckedLocationInfo', this.state.isCheckedLocationInfo);

            if (this.state.userId === '') {
                this.join();
            } else {
                this.modiUserInfo();
            }
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
        console.log('fprofile: ', this.state.fProfile)
        console.log('mprofile: ', this.state.mProfile)
        console.log('profile resizeFileUri: ', this.state.resizeFileUri)

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
                        <ScrollView
                            style={{ display: 'flex' }}
                            contentContainerStyle={{ flexGrow: 1 }}
                        >
                            <View style={styles.imgContainer}>
                                <Text style={styles.choiceGenderText}>{Translate('chooseyourgender')}</Text>
                                <Text style={styles.choiceProfileText}>{Translate('setprofile')}</Text>

                                <View style={styles.bothImgContainer}>
                                    <View style={styles.maleImgContainer}>
                                        {
                                            this.state.gender === 'M' ? <View style={styles.circle} /> : <View style={styles.unSelectedCircle} />
                                        }
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({
                                                    gender: 'M',
                                                    mProfile: this.state.mProfile === '' ? this.state.fProfile === '' ? '' : this.state.fProfile : this.state.mProfile,
                                                }, () => {
                                                    this.setState({
                                                        fProfile: ''
                                                    })
                                                })
                                            }}
                                            onLongPress={() => {
                                                this.setState({ gender: 'M' }, () => {
                                                    this.openPicker(navigation);
                                                })
                                            }}>
                                            <Image
                                                style={styles.genderImg}
                                                source={this.state.mProfile != '' ? { uri: this.state.mProfile } : require('../../images/ic_male.png')} />
                                            <Text style={styles.choiceGenderText}>{Translate('man')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.femaleImgContainer}>
                                        {
                                            this.state.gender === 'F' ? <View style={styles.circle} /> : <View style={styles.unSelectedCircle} />
                                        }
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({
                                                    gender: 'F',
                                                    fProfile: this.state.fProfile === '' ? this.state.mProfile === '' ? '' : this.state.mProfile : this.state.fProfile,
                                                }, () => {
                                                    this.setState({
                                                        mProfile: ''
                                                    })
                                                })
                                            }}
                                            onLongPress={() => {
                                                this.setState({ gender: 'F' }, () => {
                                                    this.openPicker(navigation);
                                                })
                                            }}>
                                            <Image
                                                style={styles.genderImg}
                                                source={this.state.fProfile != '' ? { uri: this.state.fProfile } : require('../../images/ic_female.png')} />
                                            <Text style={styles.choiceGenderText}>{Translate('woman')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* <Text style={styles.choiceGenderText}>{Translate('chooseyourgender')}</Text>
                                <Text style={styles.longTouchText}>{Translate('setprofile')}</Text> */}
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={(input) => { this.inputName = input; }}
                                    onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}
                                    style={styles.input}
                                    maxLength={15}
                                    value={this.state.name}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('enteryourname')}
                                    placeholderTextColor="#878787"
                                    autoCapitalize="none"
                                    onChangeText={(text) => this.setState({ name: text })}
                                    //onSubmitEditing={() => { this.inputAge.focus(); }}
                                    returnKeyType="done" />
                                <TextInput
                                    ref={(input) => { this.inputAge = input; }}
                                    style={styles.marginInput}
                                    maxLength={2}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('enteryourage')}
                                    placeholderTextColor="#878787"
                                    autoCapitalize="none"
                                    keyboardType="number-pad"
                                    onChangeText={(text) => this.setState({ age: text })}
                                    //onSubmitEditing={() => { this.inputPhone.focus(); }}
                                    returnKeyType="done" />
                                <TextInput
                                    ref={(input) => { this.inputPhone = input; }}
                                    style={styles.marginInput}
                                    maxLength={11}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('enteryouraddress')}
                                    placeholderTextColor="#878787"
                                    autoCapitalize="none"
                                    keyboardType="number-pad"
                                    onChangeText={(text) => this.setState({ phone: text })}
                                    returnKeyType="done" />
                            </View>

                            <View style={{ width: '77.78%', marginTop: SCREEN_HEIGHT * 0.014, alignSelf: 'center', height: this.state.btnHeight }}>
                                <NextButton
                                    title={Translate('start2')}
                                    buttonColor={'#779ba4'}
                                    onPress={() => {
                                        if (this.state.userId === '') {
                                            if (this.props.navigation.state.params.joinType === 5) {
                                                this.join();
                                            } else {
                                                if (this.state.checked) {
                                                    this.join();
                                                } else {
                                                    this.toggleSettingModal();
                                                }
                                            }
                                        } else {
                                            this.memberAgreeVersionCheck();
                                        }
                                    }} />
                            </View>
                            <View style={styles.agreeTextContainer}>
                                {/* <Text style={styles.agreementText}>{Translate('started_message')}</Text> */}
                            </View>
                            <View style={{
                                flex: 1,
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                position: 'absolute',
                                bottom: 0
                            }}>
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
                            isModal && <AgreeModal
                                modalHandler={() => {
                                    this.setState({
                                        isCheckedAgreement: false,
                                        isCheckedPersonalInfo: false,
                                        isCheckedLocationInfo: false,
                                        isCheckedTotal: false,
                                        checked: false
                                    }, () => {
                                        setItemToAsync('isCheckedAgreement', this.state.isCheckedAgreement);
                                        setItemToAsync('isCheckedPersonalInfo', this.state.isCheckedPersonalInfo);
                                        setItemToAsync('isCheckedLocationInfo', this.state.isCheckedLocationInfo);
                                        this.toggleSettingModal();
                                    })
                                }}
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
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: SCREEN_HEIGHT * 0.0156,
        height: 50,
        width: 60
    },
    imgContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: SCREEN_HEIGHT * 0.08,
    },
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    btnContainer: {
        width: '77.78%',
        alignSelf: 'center',
    },
    agreeTextContainer: {
        alignContent: 'center',
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
    maleImgContainer: {
        alignItems: 'center',
    },
    femaleImgContainer: {
        alignItems: 'center',
        marginLeft: '5.5%',
    },
    bothImgContainer: {
        width: '44.44%',
        flexDirection: 'row',
        marginBottom: '5%'
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
    },
    agreementText: {
        fontSize: normalize(10),
        fontWeight: '300',
        color: '#878787',
        alignSelf: 'center',
        textAlign: 'center',
        marginTop: '3%',
        marginHorizontal: 10,
    },
    logoImg: {
        width: '20%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-end',
        marginBottom: '2%'
    },
    copyText: {
        fontSize: normalize(9),
        fontWeight: '300',
        marginBottom: '6%',
        color: '#878787'
    },
    eventText: {
        textAlign: 'center',
        flexDirection: 'column',
        flexWrap: 'wrap',
        flexShrink: 1,
        fontSize: normalize(9),
        fontWeight: '400',
        color: '#878787',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center'
    },
    numberText: {
        fontSize: normalize(9),
        fontWeight: '400',
        color: '#878787',
        alignSelf: 'flex-end',
        marginBottom: '1%',
        marginLeft: normalize(2)
    },
    genderImg: {
        width: normalize(70),
        height: normalize(70),
        resizeMode: 'cover',
        borderRadius: normalize(70) / 2,
        overflow: "hidden",
    },
    circle: {
        width: 10,
        height: 10,
        borderRadius: 10 / 2,
        backgroundColor: '#f3b700',
        marginBottom: normalize(8)
    },
    unSelectedCircle: {
        width: 0,
        height: 10,
        borderRadius: 10 / 2,
        backgroundColor: '#f3b700',
        marginBottom: normalize(8)
    },
    choiceGenderText: {
        fontSize: normalize(13),
        fontWeight: '200',
        color: '#878787',
        marginTop: '14%',
        marginBottom: '1%',
        alignSelf: 'center'
    },
    choiceProfileText: {
        fontSize: normalize(13),
        fontWeight: '200',
        color: '#878787',
        marginBottom: '1%',
        alignSelf: 'center'
    },
    longTouchText: {
        fontSize: normalize(10),
        color: '#878787',
        fontWeight: '200',
        marginBottom: '5%'
    }
});