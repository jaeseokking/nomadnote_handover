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
    ToastAndroid
} from 'react-native';

import AppStatusBar from '../../components/AppStatusBar';
import NextButton from '../../components/NextButton';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import DeviceInfo from 'react-native-device-info';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import axios from 'axios';
import Toast from 'react-native-root-toast'
import AgreeModal from '../../components/AgreeModal';
import { setDeviceLang } from '../../utils/Utils';
import { encryption } from '../../utils/Encryption';
import i18n from 'i18n-js';

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

export default class JoinStep1 extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();

        this.state = {
            email: '',
            pw: '',
            pwConfirm: '',
            lang: setDeviceLang(),
            checked: false,
            btnHeight: 0,
            visibleHeight: 0,
            isModal: false,
            isCheckedAgreement: false,
            isCheckedPersonalInfo: false,
            isCheckedLocationInfo: false,
            isCheckedTotal: false,
            isCheckEmail: false,
            isCheckPassword: false,
            isNetwork: false,
        };
    }

    async checkValidate() {
        if (this.state.email === '') {
            // Toast.show(`${Translate('enter_email')}`, Toast.SHORT, [
            //     'RCTModalHostViewController',
            // ]);

            // Toast.show(`${Translate('enter_email')}`);

            this.inputEmail.focus();
            console.log('Platform ?', Platform.OS)
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('enter_email')}`, {
                    duration: 2000,

                })
            } else {
                Toast.show(`${Translate('enter_email')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }


            return
        }
        if (!this.state.isCheckEmail) {
            this.inputEmail.focus();
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('error_email')}`, {
                    duration: 2000,
                });
            } else {
                Toast.show(`${Translate('error_email')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                });
            }
            this.setState({ isLoading: false })
            return
        }
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

        if (!this.state.checked) {
            Toast.show(`${Translate('info_check')}`, {
                duration: 5000,
                position: Toast.positions.CENTER
            });
            // Toast.show(`${Translate('info_check')}`)
            return
        }

        let uniqueId = DeviceInfo.getUniqueId();
        let url = global.server + `/api/join/check_email`
        console.log(url)

        const encryptedEmail = encryption(this.state.email)
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
                    setItemToAsync('join_type', 5);
                    this.props.navigation.navigate('JoinStep2',
                        {
                            email: this.state.email,
                            pw: this.state.pw,
                            joinType: 5,
                            deviceId: uniqueId,
                            userName: '',
                            userId: ''
                        });
                } else {
                    if (response.data.member !== null) {
                        if (Platform.OS === 'ios') {
                            Toast.show(`${Translate('already_email')}`, {
                                duration: 3000,
                            });
                        } else {
                            Toast.show(`${Translate('already_email')}`, {
                                duration: 3000,
                                position: 0
                            });
                        }
                        // Toast.show(`${Translate('already_email')}`)
                        this.inputEmail.focus();

                    } else {
                        Toast.show(`${Translate('already_joined')}`, {
                            duration: 3000,
                            position: 0
                        });
                        // Toast.show(`${Translate('already_joined')}`)
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

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        this.setState({ btnHeight: height })
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardDidShow);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    _keyboardDidShow(e) {
        console.log('keyboard Show')
    }

    _keyboardDidHide() {
        console.log('keyboard hidden')
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    toggleSettingModal() {
        this.setState({
            isModal: !this.state.isModal,
        })
    }

    setChecked() {
        if (!this.state.isCheckedAgreement) {
            Toast.show(`${Translate('message_areement')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            });
            // Toast.show(`${Translate('message_areement')}`)
            return
        } else if (!this.state.isCheckedPersonalInfo) {
            Toast.show(`${Translate('message_personal_info')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            });
            // Toast.show(`${Translate('message_personal_info')}`)
            return
        } else if (!this.state.isCheckedLocationInfo) {
            Toast.show(`${Translate('message_location_info')}`, {
                duration: 2000,
                position: SCREEN_HEIGHT / 3
            });
            // Toast.show(`${Translate('message_location_info')}`)
            return
        } else {
            this.toggleSettingModal()
            this.setState({
                checked: !this.state.checked,
            })
            setItemToAsync('isCheckedAgreement', this.state.isCheckedAgreement);
            setItemToAsync('isCheckedPersonalInfo', this.state.isCheckedPersonalInfo);
            setItemToAsync('isCheckedLocationInfo', this.state.isCheckedLocationInfo);
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

    setScrap = async (id) => {
        // const arrScrapId = await getItemFromAsync('other_scrap_id');
        // let scrapedId = []
        // if (arrScrapId === '' || arrScrapId === undefined || arrScrapId === null) {
        //     arrScrapId = ''
        // } else {
        //     scrapedId = arrScrapId.split(" ")
        // }

        let url = global.server + '/api/timeline/set_scrap'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('timeline_id', id)
        console.log('check bodyForm=', bodyFormData)
        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                // let scrapId

                // if (arrScrapId === '' || arrScrapId === null) {
                //     scrapId = `${id}`
                // } else {
                //     scrapedId.map((item) => {
                //         console.log('scrapId item: ', item, id)
                //         if (id !== item) {
                //             scrapId = `${arrScrapId} ${id}`
                //         }
                //     })
                // }
                global.isClickOtherScrap = true
                setItemToAsync('scrap_click', 'other')
                setItemToAsync('scrap_id', id)
                // setItemToAsync('other_scrap_id', scrapId)
                this.updateScrap();
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    // Toast.show(error.response.data.message);
                }
                else {
                    console.log(error)
                }
                self.setState({ isLoading: false })
            });
    }

    render() {
        const { navigation } = this.props;
        const { isModal } = this.state;

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <ScrollView
                            style={{ display: 'flex' }}
                            contentContainerStyle={{ flexGrow: 1 }}>
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
                                <Text style={styles.titleText}>{Translate('join_by_email')}</Text>
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={(input) => { this.inputEmail = input; }}
                                    onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}
                                    style={styles.input}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('emailET_hint')}
                                    placeholderTextColor="#878787"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="next"
                                    onChangeText={(text) => this.validateEmail(text)}
                                    onSubmitEditing={() => { this.inputPw.focus(); }}
                                />
                                <TextInput
                                    ref={(input) => { this.inputPw = input; }}
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
                                    style={styles.marginInput}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('pwdET_hint2')}
                                    placeholderTextColor="#878787"
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    onChangeText={(text) => this.setState({ pwConfirm: text })}
                                    returnKeyType="done" />
                            </View>
                            <View style={styles.checkContainer}>
                                <TouchableOpacity

                                    hitSlop={{ top: 5, right: 5, bottom: 5, left: 5 }}
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => {
                                        Keyboard.dismiss()
                                        this.setState({
                                            isModal: this.state.checked ? false : true,
                                            checked: false,
                                            isCheckedAgreement: false,
                                            isCheckedPersonalInfo: false,
                                            isCheckedLocationInfo: false,
                                            isCheckedTotal: false
                                        }, () => {
                                            setItemToAsync('isCheckedAgreement', this.state.isCheckedAgreement);
                                            setItemToAsync('isCheckedPersonalInfo', this.state.isCheckedPersonalInfo);
                                            setItemToAsync('isCheckedLocationInfo', this.state.isCheckedLocationInfo);
                                        })
                                        // this.state.checked ? this.setState({ checked: false }) : this.setState({ checked: true })
                                    }}>
                                    <Text style={styles.agreementText}>{Translate('chk_info')}</Text>
                                    <View style={{ width: SCREEN_WIDTH * 0.04167, height: SCREEN_WIDTH * 0.04167, marginLeft: SCREEN_WIDTH * 0.0139, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image
                                            style={styles.checkImg}
                                            source={require('../../images/ic_not_checked_bg.png')} />
                                        {
                                            this.state.checked && <Image
                                                style={styles.checkedImg}
                                                source={require('../../images/fill.png')} />
                                        }
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={{ width: '77.78%', marginTop: SCREEN_HEIGHT * 0.014, alignSelf: 'center', height: this.state.btnHeight }}>
                                <NextButton
                                    title={Translate('activity_login_signup')}
                                    buttonColor={'#779ba4'}
                                    onPress={() => {
                                        this.checkValidate();
                                    }} />
                            </View>
                            <View
                                style={{
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
                                        isCheckedTotal: false
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
                                necessity={`[${Translate('necessity')}]`}
                                //agreement={`[${Translate('necessity')}] ${Translate('agreement')}`}
                                agreement={`${Translate('agreement')}`}
                                personalInfo={`${Translate('agreement_personal_info')}`}
                                locationInfo={`${Translate('agreement_location_info')}`}
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
        marginTop: SCREEN_HEIGHT * 0.100,
    },
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    checkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SCREEN_HEIGHT * 0.042
    },
    companyInfoLineContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    companyInfoButtonContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        marginBottom: 2,
        justifyContent: 'center'
    },
    backImg: {
        width: '5.1%',
        resizeMode: 'contain',
        marginStart: '6.9%',
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
        marginBottom: SCREEN_HEIGHT * 0.09375,
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
    marginInputEn: {
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
        height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.0609 : null
    },
    agreementText: {
        fontSize: normalize(14),
        fontWeight: '300',
        color: '#878787',
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
    checkImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        position: 'absolute'
    },
    checkedImg: {
        width: '75%',
        height: '75%',
        resizeMode: 'contain',
    }
});