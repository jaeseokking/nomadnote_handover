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
    NextButton
} from 'react-native';
import Moment from 'moment';
import axios from 'axios';
import Translate from '../../languages/Translate';
import Toast from 'react-native-root-toast';
import SetI18nConfig from '../../languages/SetI18nConfig';
import CustomHeaderText from '../../components/CustomHeaderText';
import * as RNLocalize from 'react-native-localize';
import DeviceInfo from 'react-native-device-info';
import AppStatusBar from '../../components/AppStatusBar';

import { translate } from 'i18n-js';
import { back } from 'react-native/Libraries/Animated/src/Easing';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import { encryption } from '../../utils/Encryption';




const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;



export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class Question extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            content: '',
            email: ''
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
            'willFocus',
            () => {

            }
        );
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.willFocusMount.remove();
    }

    inquireRegister() {

        if (this.state.title === '') {
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('enter_question_title')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('enter_question_title')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('enter_question_title')}`)
            this.titleInput.focus();
            return
        }
        if (this.state.content === '') {
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('entertext')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('entertext')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('entertext')}`)
            this.contentInput.focus();
            return
        }

        if (this.state.email === '') {
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('enter_email')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('enter_email')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('enter_email')}`)
            this.emailInput.focus();
            return
        }

        // const encryptedEmail = encryption(this.state.email);

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('title', this.state.title);
        bodyFormData.append('content', this.state.content);
        // bodyFormData.append('email', encryptedEmail)
        bodyFormData.append('email', this.state.email)
        console.log('bodyForm', bodyFormData)
        let url = global.server + '/api/question/question'
        // console.log(url)
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                if (response.data.result === 'ok') {
                    console.log(response.data);
                    Toast.show(`${Translate('registered')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('registered')}`)
                    this.props.navigation.goBack()
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    Toast.show(error.response.data.message, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(error.response.data.message);
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
                        <CustomHeaderText
                            backWidth={'100%'}
                            backHeight={'100%'}
                            registrationWidth={'0%'}
                            registrationHeight={'0%'}
                            title={Translate('inquire')}
                            onBackPress={() => { navigation.goBack() }}
                            onRegiPress={() => {
                                this.inquireRegister()
                            }} />
                        <KeyboardAwareScrollView
                            keyboardShouldPersistTaps={'handled'}
                            style={{ flex: 1 }}
                            resetScrollToCoords={{ x: 0, y: 0 }}
                            showsVerticalScrollIndicator={false}

                        >
                            <View style={styles.contentView}>
                                {/* <Text style={styles.contentText}>{`${Translate('activity_write_note')}: ${Moment(this.state.currentTime).format('YYYY.MM.DD Ahh:mm')}`}</Text> */}
                                <Text style={{ color: '#000000', fontSize: normalize(14), paddingTop: SCREEN_HEIGHT * 0.02, fontWeight: 'bold' }}>{Translate('title')}</Text>
                                <View
                                    style={{ marginTop: 5 }}>
                                    <TextInput
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: 4,
                                            height: SCREEN_HEIGHT * 0.0625,
                                            paddingVertical: 10,
                                            paddingHorizontal: 15,
                                            borderWidth: 1,
                                            borderColor: '#e0e0e0',
                                            fontSize: normalize(14)
                                        }}
                                        fontSize={normalize(14)}
                                        placeholder={Translate('enter_question_title')}
                                        placeholderTextColor={'#a3a3a3'}
                                        ref={(input) => { this.titleInput = input; }}
                                        onSubmitEditing={(e) => { this.contentInput.focus(); }}
                                        value={this.state.title}
                                        onChangeText={(text) => this.setState({ title: text })}
                                        returnKeyType="next"
                                    >
                                    </TextInput>
                                </View>
                                <View
                                    style={{ marginTop: 25, }}>
                                    <Text style={{ color: '#000000', fontSize: normalize(14), paddingTop: SCREEN_HEIGHT * 0.02, fontWeight: 'bold' }}>{Translate('Inquiries')}</Text>
                                    <View
                                        style={{ marginTop: 5 }} />
                                    <TextInput
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: 4,
                                            height: SCREEN_HEIGHT * 0.3,
                                            textAlignVertical: 'top',
                                            paddingTop: 10,
                                            paddingLeft: 10,
                                            paddingRight: 10,
                                            paddingBottom: 0,
                                            borderWidth: 1,
                                            borderColor: '#e0e0e0',
                                        }}
                                        fontSize={normalize(14)}
                                        //placeholder={Translate('enter_question_contents')}
                                        placeholderTextColor={'#999999'}
                                        multiline={true}
                                        ref={(input) => { this.contentInput = input; }}
                                        value={this.state.content}
                                        onChangeText={(text) => this.setState({ content: text })}
                                        returnKeyType="done"
                                    >
                                    </TextInput>
                                </View>


                                <View
                                    style={{ marginTop: 25 }}>
                                    <Text style={{ color: '#000000', fontSize: normalize(14), paddingTop: SCREEN_HEIGHT * 0.02, fontWeight: 'bold' }}>{Translate('email')}</Text>
                                    <View
                                        style={{ marginTop: 5 }} />
                                    <TextInput
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: 4,
                                            height: SCREEN_HEIGHT * 0.0625,
                                            paddingVertical: 10,
                                            paddingHorizontal: 15,
                                            borderWidth: 1,
                                            borderColor: '#e0e0e0',
                                            fontSize: normalize(14)
                                        }}
                                        keyboardType={'email-address'}
                                        fontSize={normalize(14)}
                                        ref={(input) => { this.emailInput = input; }}
                                        placeholder={Translate('enter_email')}
                                        placeholderTextColor={'#a3a3a3'}
                                        // onSubmitEditing={(e) => { this.emailInput.focus(); }}
                                        value={this.state.email}
                                        autoCapitalize="none"
                                        onChangeText={(text) => this.setState({ email: text })}
                                        returnKeyType="next"
                                    >
                                    </TextInput>
                                    <View
                                        style={{ marginTop: 10 }} />
                                    <Text style={{ color: '#7f7f7f', fontSize: normalize(12) }}>{Translate('contact_email')}</Text>
                                </View>

                                <View style={{ paddingVertical: 10, paddingHorizontal: 15, height: 45, backgroundColor: '#779ba4', borderRadius: 4, marginTop: 60, marginBottom: 20 }}>
                                    <TouchableOpacity
                                        onPress={() => { this.inquireRegister() }}
                                        style={{
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}  >
                                        <Text
                                            style={{ fontSize: normalize(14), fontWeight: 'bold', color: '#ffffff' }}
                                        >
                                            {Translate('inquire')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>


                            </View>
                        </KeyboardAwareScrollView>
                    </View>

                </SafeAreaView>

            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    linearGradient: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center'
    },
    textStyle: {
        flex: 1,
        fontSize: normalize(15),
        color: '#ffffff',
        textAlign: 'center',
    },
    contentView: {
        flex: 1,
        width: SCREEN_WIDTH,
        backgroundColor: '#fff',
        flexDirection: 'column',
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: SCREEN_WIDTH * 0.06,
    },
    contentText: {
        paddingTop: SCREEN_WIDTH * 0.0,
        color: '#000000',
        fontSize: normalize(14)

    },
    contentTextInput: {
        backgroundColor: '#ffffff',
    },



});