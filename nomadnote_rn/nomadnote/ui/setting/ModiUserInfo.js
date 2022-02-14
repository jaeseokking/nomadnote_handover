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
    ActivityIndicator,
    Keyboard,
    Alert,
    PermissionsAndroid
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import NextButton from '../../components/NextButton';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate'
import CustomHeaderText from '../../components/CustomHeaderText';

import Toast from 'react-native-root-toast';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { setItemToAsync } from '../../utils/AsyncUtil';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import CameraRoll from "@react-native-community/cameraroll";
import { decryption } from '../../utils/Decryption';
import { encryption } from '../../utils/Encryption';

const THEME_COLOR = 'rgba(78, 109, 118, 1)'

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

export default class ModiUserInfo extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        this.state = {
            name: (global.user.name != '' || global.user.name != null) ? global.user.name : '',
            age: (global.user.age != '' || global.user.age != null) ? global.user.age : '',
            phone: (global.user.phone != '' || global.user.phone != null) ? global.user.phone : '',
            gender: (global.user.gender != '' || global.user.gender != null) ? global.user.gender : '',
            point: (global.user.point != '' || global.user.point != null) ? global.user.point : 0,
            btnHeight: 0,
            profile: (global.user.profile != '' || global.user.profile != null) ? global.user.profile : '',
            email: (global.user.email != '' || global.user.email != null) ? global.user.email : '',
            filePath: '',
            fileData: '',
            fileUri: '',
            resizeFileUri: '',
            isClickProfile: false,
            isLoading: true,
            isCheckEmail: false,
            imgWidth: 0,
            imgHeight: 0,
            noMore: false,
            lastCursor: null
        };
    }

    modiUserInfo() {
        var self = this

        if (this.state.name === '' || this.state.name === null) {
            this.setState({ isLoading: false })
            Toast.show(`${Translate('enteryourname')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            })
            // Toast.show(`${Translate('enteryourname')}`)
            this.inputName.focus();
            return
        }

        if (this.state.age === '' || this.state.age === null) {
            if (global.user.join_type === 6 || global.user.join_type === 7) {

            } else {
                this.setState({ isLoading: false })
                Toast.show(`${Translate('enteryourage')}`, {
                    duration: 2000,
                    position: SCREEN_HEIGHT / 3
                })
                // Toast.show(`${Translate('enteryourage')}`)
                this.inputAge.focus();
                return
            }
        }

        if (this.state.isClickProfile) {
            if (this.state.resizeFileUri === '' || this.state.resizeFileUri === null) {
                this.setState({ isLoading: false })
                if (Platform.OS === 'ios') {
                    Toast.show(`${Translate('message_wait')}`, {
                        duration: 2000
                    })
                } else {
                    Toast.show(`${Translate('message_wait')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                }
                // Toast.show(`${Translate('message_wait')}`)
                return
            }
        }

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('name', this.state.name);
        bodyFormData.append('age', (this.state.age === null || this.state.age === '') ? '' : this.state.age);
        if (global.user.gender === '' || global.user.gender === null) {
            if (this.state.gender === null || this.state.gender === '') {
                if (global.user.join_type === 6 || global.user.join_type === 7) {
                    bodyFormData.append('gender', '');
                } else {
                    this.setState({ isLoading: false })
                    Toast.show(`${Translate('chooseyourgender')}`, {
                        duration: 2000,
                        position: SCREEN_HEIGHT / 7
                    })
                    // Toast.show(`${Translate('chooseyourgender')}`)
                    return
                }
            } else {
                bodyFormData.append('gender', this.state.gender);
            }
        }

        const encryptedPhone = encryption(this.state.phone)
        bodyFormData.append('phone', (this.state.phone === null || this.state.phone === '') ? '' : encryptedPhone);
        if (global.user.email === '' || global.user.email === null) {
            if (this.state.email === null || this.state.email === '') {

            } else {
                if (this.state.isCheckEmail) {
                    const encryptedEmail = encryption(this.state.email)
                    bodyFormData.append('email', encryptedEmail);
                    // bodyFormData.append('email', this.state.email);
                } else {
                    this.setState({ isLoading: false })
                    if (Platform.OS === 'ios') {
                        Toast.show(`${Translate('error_email')}`, {
                            duration: 2000
                        })
                    } else {
                        Toast.show(`${Translate('error_email')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                    }
                    // Toast.show(`${Translate('error_email')}`)
                    this.inputEmail.focus();
                    return
                }
            }
        }
        console.log('modi resizeFileUri: ', this.state.resizeFileUri)
        if (this.state.resizeFileUri != '') {
            bodyFormData.append('photo', {
                uri: this.state.resizeFileUri,
                name: 'profile.jpg',
                type: 'image/jpg'
            });
            console.log({
                uri: this.state.resizeFileUri,
                name: 'profile.jpg',
                type: 'image/jpg'
            })
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
                    if ((member.phone === null || member.phone === '') && (member.email === null || member.email === '')) {
                        global.user = { ...member, "phone": '', "email": '' };
                    } else if (member.phone === null || member.phone === '') {
                        global.user = { ...member, "phone": '', "email": decryption(member.email) };
                    } else if (member.email === null || member.email === '') {
                        global.user = { ...member, "phone": decryption(member.phone), "email": '' };
                    } else {
                        global.user = { ...member, "phone": decryption(member.phone), "email": decryption(member.email) };
                    }
                    Toast.show(`${Translate('changedInfo')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('changedInfo')}`)
                    this.props.navigation.goBack();
                } else {
                    if (response.data.message === 'Duplicate email') {
                        Toast.show(`${Translate('already_email')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('already_email')}`);
                    } else if (response.data.message === 'Duplicate phone number') {
                        Toast.show(`${Translate('error_overlap_phone_number')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('error_overlap_phone_number')}`)
                    } else {
                        Toast.show(`${Translate('occur_error')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('occur_error')}`)
                    }
                }
                this.setState({ isLoading: false })
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

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        console.log('age: ', this.state.age);
        this.setState({ isLoading: false })
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
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
            quality: 0.99,
            rotation: 360
        }
        ImagePicker.launchImageLibrary(options, (response) => {
            // console.log('Response = ', response);
            const { error, uri, originalRotation } = response

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
                let rotation = 360

                if (originalRotation === 90) {
                    rotation = 90
                } else if (originalRotation === 270) {
                    rotation = -90
                }

                console.log('rotation: ', rotation, response)

                this.setState({
                    filePath: response,
                    fileData: response.data,
                    fileUri: response.uri,
                    profile: { uri: 'data:image/jpeg;base64,' + response.base64 },
                    isClickProfile: true,
                    isLoading: false,
                    imgWidth: response.width,
                    imgHeight: response.height
                }, () => {
                    // Exif.getExif(this.state.fileUri)
                    //     .then(msg => console.warn('OK: ' + JSON.stringify(msg)))
                    //     .catch(msg => console.warn('ERROR: ' + msg))
                    ImageResizer.createResizedImage(this.state.fileUri, this.state.imgWidth, this.state.imgHeight, 'JPEG', 99, 360)
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
            this.setState({ isLoading: false })
        });
    }

    fLaunchImageLibrary = () => {
        let options = {
            mediaType: 'photo',
            includeBase64: true,
            quality: 0.99
        }
        ImagePicker.launchImageLibrary(options, (response) => {
            // console.log('Response = ', response);
            const { error, uri, originalRotation } = response

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
                let rotation = 360

                if (originalRotation === 90) {
                    rotation = 90
                } else if (originalRotation === 270) {
                    rotation = -90
                }
                console.log('rotation: ', rotation, response)

                this.setState({
                    filePath: response,
                    fileData: response.data,
                    fileUri: response.uri,
                    profile: { uri: 'data:image/jpeg;base64,' + response.base64 },
                    isClickProfile: true,
                    imgWidth: response.width,
                    imgHeight: response.height
                }, () => {
                    // Exif.getExif(this.state.fileUri)
                    //     .then(msg => console.warn('OK: ' + JSON.stringify(msg)))
                    //     .catch(msg => console.warn('ERROR: ' + msg))

                    ImageResizer.createResizedImage(this.state.fileUri, this.state.imgWidth, this.state.imgHeight, 'JPEG', 99, 360)
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
            this.setState({ isLoading: false })
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
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Image registration permission denied by user.');
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Toast.show('Image registration permission revoked by user.', {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Image registration permission revoked by user.');
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

        this.setState({ isClickProfile: false })

        navigation.navigate('PhotoPicker', {
            onSelect: this.onSelect,
            gender: 'U'
        })
    }

    onSelect = data => {
        this.setState(data);
    };

    resizeImage() {
        console.log("here!")
    }

    setMSource() {
        if (this.state.profile != null) {
            if (this.state.gender === 'M') {
                if (Platform.OS === 'ios') {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                } else {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                }
            } else {
                return require('../../images/ic_male.png')
            }
        } else {
            return require('../../images/ic_male.png')
        }

        // return this.state.profile != null ? this.state.gender === 'M' ? Platform.OS === 'ios' ? this.state.profile : this.state.isClickProfile ? this.state.profile : { uri: `file://${this.state.profile}` } : require('../../images/ic_male.png') : require('../../images/ic_male.png')
    }

    setFSource() {
        if (this.state.profile != null) {
            if (this.state.gender === 'F') {
                if (Platform.OS === 'ios') {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                } else {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                }
            } else {
                return require('../../images/ic_female.png')
            }
        } else {
            return require('../../images/ic_female.png')
        }
    }

    setImgSource() {
        if (this.state.profile != null) {
            if (this.state.gender === 'F') {
                if (Platform.OS === 'ios') {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                } else {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                }
            } else {
                if (Platform.OS === 'ios') {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                } else {
                    if (this.state.isClickProfile) {
                        return { uri: this.state.profile }
                    } else {
                        return { uri: global.server + this.state.profile }
                    }
                }
            }
        } else {
            if (this.state.gender === 'F') {
                return require('../../images/ic_female.png')
            } else {
                return require('../../images/ic_male.png')
            }
        }
    }

    validate = (text) => {
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
        console.log('GENDER', this.state.gender);


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
                            <CustomHeaderText
                                backWidth={'100%'}
                                backHeight={'100%'}
                                registrationWidth={'0%'}
                                registrationHeight={'0%'}
                                title={Translate('setmyinfo2')}
                                onBackPress={() => { navigation.goBack(); }} />
                            <KeyboardAwareScrollView
                                keyboardShouldPersistTaps={'handled'}
                                style={{ display: 'flex' }}
                                resetScrollToCoords={{ x: 0, y: 0 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ flexGrow: 1 }}
                            >
                                <View style={styles.imgContainer}>
                                    {
                                        (global.user.gender === null || global.user.gender === '') ? (global.user.join_type === 6 || global.user.join_type === 7) ? <View style={styles.bothImgContainer}>
                                            <View style={styles.femaleImgContainer}>
                                                <TouchableOpacity
                                                    onLongPress={() => {
                                                        this.setState({ isLoading: true })
                                                        // this.fLaunchImageLibrary();
                                                        this.openPicker(navigation);
                                                    }}>
                                                    <Image
                                                        style={{
                                                            width: normalize(70),
                                                            height: normalize(70),
                                                            borderRadius: normalize(70) / 2,
                                                            overflow: "hidden",
                                                            resizeMode: 'cover',
                                                        }}
                                                        source={this.setImgSource()} />
                                                </TouchableOpacity>
                                            </View>
                                        </View> : <View style={styles.bothImgContainer}>
                                            <View style={styles.maleImgContainer}>
                                                {
                                                    this.state.gender === 'M' ? <View style={styles.circle} /> : <View style={styles.unSelectedCircle} />
                                                }
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({ gender: 'M' })
                                                    }}
                                                    onLongPress={() => {
                                                        this.setState({ gender: 'M', isLoading: true })
                                                        // this.mLaunchImageLibrary();
                                                        this.openPicker(navigation);
                                                    }}>
                                                    <Image
                                                        style={styles.genderImg}
                                                        source={
                                                            this.setMSource()
                                                        } />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.femaleImgContainer}>
                                                {
                                                    this.state.gender === 'F' ? <View style={styles.circle} /> : <View style={styles.unSelectedCircle} />
                                                }
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({ gender: 'F' })
                                                    }}
                                                    onLongPress={() => {
                                                        this.setState({ gender: 'F', isLoading: true })
                                                        // this.fLaunchImageLibrary();
                                                        this.openPicker(navigation);
                                                    }}>
                                                    <Image
                                                        style={styles.genderImg}
                                                        source={this.setFSource()} />
                                                </TouchableOpacity>
                                            </View>
                                        </View> : <View style={styles.bothImgContainer}>
                                            <View style={styles.femaleImgContainer}>
                                                <TouchableOpacity
                                                    onLongPress={() => {
                                                        this.setState({ isLoading: true })
                                                        // this.fLaunchImageLibrary();
                                                        this.openPicker(navigation);
                                                    }}>
                                                    <Image
                                                        style={{
                                                            width: normalize(70),
                                                            height: normalize(70),
                                                            borderRadius: normalize(70) / 2,
                                                            overflow: "hidden",
                                                            resizeMode: 'cover',
                                                            backgroundColor: '#e2e2e2'
                                                        }}
                                                        source={this.setImgSource()} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    }
                                    <Text style={styles.longTouchText}>{Translate('setprofile')}</Text>
                                    {
                                        this.state.gender !== 'M' && this.state.gender !== 'F' ? <Text style={styles.longTouchText}>{Translate('activity_choosegender')}</Text> : null

                                    }
                                    <Text style={styles.choiceGenderText}>{`${Translate('my_points')} : ${this.state.point}P`}</Text>
                                </View>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        ref={(input) => { this.inputEmail = input; }}
                                        onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}
                                        style={{
                                            width: '77.78%',
                                            borderColor: '#878787',
                                            borderRadius: 4,
                                            borderWidth: 1,
                                            paddingVertical: 11,
                                            fontSize: normalize(14),
                                            fontWeight: '400',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            color: '#4a4a4a',
                                            backgroundColor: global.user.email === null || global.user.email === '' ? '#fff' : '#f5f5f5'
                                        }}
                                        value={this.state.email}
                                        editable={global.user.email === null || global.user.email === ''}
                                        underlineColorAndroid="transparent"
                                        placeholder={Translate('emailET_hint')}
                                        placeholderTextColor="#878787"

                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        onChangeText={(text) => this.validate(text)}
                                        onSubmitEditing={() => { this.inputName.focus(); }}
                                        returnKeyType="next" />
                                    <TextInput
                                        ref={(input) => { this.inputName = input; }}
                                        style={styles.marginInput}
                                        value={this.state.name}
                                        maxLength={15}
                                        underlineColorAndroid="transparent"
                                        placeholder={Translate('enteryourname')}
                                        placeholderTextColor="#878787"
                                        autoCapitalize="none"
                                        onChangeText={(text) => this.setState({ name: text })}
                                        onSubmitEditing={() => { this.inputAge.focus(); }}
                                        returnKeyType="next" />
                                    <TextInput
                                        ref={(input) => { this.inputAge = input; }}
                                        style={styles.marginInput}
                                        value={this.state.age != null ? this.state.age.toString() : ''}
                                        underlineColorAndroid="transparent"
                                        placeholder={Translate('enteryourage')}
                                        placeholderTextColor="#878787"
                                        autoCapitalize="none"
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        onChangeText={(text) => this.setState({ age: text })}
                                        onSubmitEditing={() => { this.inputPhone.focus(); }}
                                        returnKeyType="next" />
                                    <TextInput
                                        ref={(input) => { this.inputPhone = input; }}
                                        style={styles.marginInput}
                                        value={this.state.phone != null ? this.state.phone.toString() : ''}
                                        underlineColorAndroid="transparent"
                                        placeholder={Translate('enteryouraddress')}
                                        placeholderTextColor="#878787"
                                        autoCapitalize="none"
                                        keyboardType="number-pad"
                                        maxLength={11}
                                        onChangeText={(text) => this.setState({ phone: text })}
                                        returnKeyType="done" />
                                </View>
                                <View style={{ width: '77.78%', marginTop: SCREEN_HEIGHT * 0.014, alignSelf: 'center', height: this.state.btnHeight }}>
                                    <NextButton
                                        title={Translate('setmyinfo')}
                                        buttonColor={'#779ba4'}
                                        onPress={() => {
                                            this.setState({ isLoading: true }, () => {
                                                this.modiUserInfo();
                                            })
                                        }} />
                                </View>
                                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', }}>
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
                            </KeyboardAwareScrollView>

                            {
                                isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
                                    pointerEvents={'none'}>
                                    <ActivityIndicator
                                        size="large"
                                        color={THEME_COLOR}
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
    imgContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SCREEN_HEIGHT * 0.1
    },
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    btnContainer: {

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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '5%',
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
        borderRadius: normalize(70) / 2,
        overflow: "hidden",
        resizeMode: 'cover'
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
        fontSize: normalize(11),
        fontWeight: '300',
        color: '#878787',
        marginBottom: '5%'
    },
    longTouchText: {
        fontSize: normalize(11),
        color: '#878787',
        fontWeight: '300',
        marginBottom: '1%'
    }
});