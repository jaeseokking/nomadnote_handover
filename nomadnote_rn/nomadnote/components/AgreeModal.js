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
    Keyboard
} from 'react-native';
import { setLang } from '../utils/Utils';

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

export default class AgreeModal extends Component {
    static defaultProps = {
        content: '',
        confirmText: '',
        logo: '',
        lang: 'ko',
        necessity: '',
        agreement: '',
        personalInfo: '',
        locationInfo: '',
        viewText: '',
        totAgreement: '',
        totAgreementContent: '',
        isCheckedAgreement: false,
        isCheckedPersonalInfo: false,
        isCheckedLocationInfo: false,
        isCheckedTotal: false,
        isBackgroundTranparant: false,
        onPressOk: () => null,
        onPressAgreement: () => null,
        onPressAgreementView: () => null,
        onPressPersonalInfo: () => null,
        onPressPersonalInfoView: () => null,
        onPressLocationInfo: () => null,
        openLocationInfoView: () => null,
        onPressTotalAgreement: () => null
    }

    constructor(props) {
        super(props);
        console.log('modal: ', lang)
    }

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        backgroundColor: this.props.isBackgroundTranparant ? 'transparent' : 'rgba(0,0,0,0.5)'
                    }}
                    activeOpacity={1}
                    onPress={this.props.modalHandler} />
                <View style={styles.modal}>
                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                        <Image
                            style={{
                                width: SCREEN_WIDTH * 0.361,
                                height: SCREEN_WIDTH * 0.361 * 0.289,
                                resizeMode: 'contain',
                                marginBottom: 2
                            }}
                            source={require('../images/login_logo.png')} />
                        <View style={styles.textContainer}>
                            <Text style={styles.logoText}>{this.props.logo} </Text>
                        </View>
                    </View>
                    <Text style={this.props.lang == 'ja' ? styles.contentText_ja : styles.contentText}>{this.props.content}</Text>
                    <View style={styles.firstLine} />
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent:  'space-between', marginTop: 28,
                        alignSelf: 'flex-start', width: '100%', paddingHorizontal: this.props.lang === 'en' ? '3.45%' : 0
                    }}>
                        <TouchableOpacity
                            style={{ marginLeft: this.props.lang === 'en' ? '2.0%' : '6.9%' }}
                            onPress={this.props.onPressAgreement}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', width: this.props.lang === 'en' ? '87%' : '100%' }}>
                                <View style={{ alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                                    <Image
                                        style={{ position: 'absolute', resizeMode: 'contain', width: '100%', height: '100%' }}
                                        source={require('../images/ic_not_checked_bg.png')} />
                                    {
                                        this.props.isCheckedAgreement && <Image
                                            style={{ position: 'absolute', resizeMode: 'contain', width: '70%', height: '60%' }}
                                            source={require('../images/ic_not_checked_arrow.png')} />
                                    }
                                </View>
                                <View style={{ flexDirection: 'row', width: SCREEN_WIDTH * 0.42 }}>
                                    <Text style={styles.necessityText}>{this.props.necessity}</Text>
                                    <Text style={styles.agreeText}>{this.props.agreement}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableWithoutFeedback
                            hitSlop={{ top: 0, right: 0, bottom: 0, left: 10 }}
                            onPress={this.props.onPressAgreementView}>
                            <Text style={styles.viewText}>{this.props.viewText}</Text>
                        </TouchableWithoutFeedback>
                    </View>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15,
                        width: '100%', alignSelf: 'flex-start', paddingHorizontal: this.props.lang === 'en' ? '3.45%' : 0
                    }}>
                        <TouchableOpacity
                            style={{ marginLeft: this.props.lang === 'en' ? '2.0%' : '6.9%' }}
                            onPress={this.props.onPressPersonalInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', width: this.props.lang === 'en' ? '87%' : '100%' }}>
                                <View style={{ alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                                    <Image
                                        style={{ position: 'absolute', resizeMode: 'contain', width: '100%', height: '100%' }}
                                        source={require('../images/ic_not_checked_bg.png')} />
                                    {
                                        this.props.isCheckedPersonalInfo && <Image
                                            style={{ position: 'absolute', resizeMode: 'contain', width: '70%', height: '60%' }}
                                            source={require('../images/ic_not_checked_arrow.png')} />
                                    }
                                </View>
                                <View style={{ flexDirection: 'row', width: SCREEN_WIDTH * 0.42 }}>
                                    <Text style={styles.necessityText}>{this.props.necessity}</Text>
                                    <Text style={styles.agreeText}>{this.props.personalInfo}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableWithoutFeedback
                            hitSlop={{ top: 0, right: 0, bottom: 0, left: 10 }}
                            onPress={this.props.onPressPersonalInfoView}>
                            <Text style={styles.viewText}>{this.props.viewText}</Text>
                        </TouchableWithoutFeedback>
                    </View>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15,
                        width: '100%', alignSelf: 'flex-start', paddingHorizontal: this.props.lang === 'en' ? '3.45%' : 0
                    }}>
                        <TouchableOpacity
                            style={{ marginLeft: this.props.lang === 'en' ? '2.0%' : '6.9%' }}
                            onPress={this.props.onPressLocationInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', width: this.props.lang === 'en' ? '87%' : '100%' }}>
                                <View style={{ alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                                    <Image
                                        style={{ position: 'absolute', resizeMode: 'contain', width: '100%', height: '100%' }}
                                        source={require('../images/ic_not_checked_bg.png')} />
                                    {
                                        this.props.isCheckedLocationInfo && <Image
                                            style={{ position: 'absolute', resizeMode: 'contain', width: '70%', height: '60%' }}
                                            source={require('../images/ic_not_checked_arrow.png')} />
                                    }
                                </View>
                                <View style={{ flexDirection: 'row', width: SCREEN_WIDTH * 0.42 }}>
                                    <Text style={styles.necessityText}>{this.props.necessity}</Text>
                                    <Text style={styles.agreeText}>{this.props.locationInfo}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableWithoutFeedback
                            hitSlop={{ top: 0, right: 0, bottom: 0, left: 10 }}
                            onPress={this.props.openLocationInfoView}>
                            <Text style={styles.viewText}>{this.props.viewText}</Text>
                        </TouchableWithoutFeedback>
                    </View>
                    <View style={styles.lastLine} />
                    <TouchableOpacity
                        style={{ marginTop: 18, alignSelf: 'flex-start', marginLeft: '6.9%' }}
                        onPress={this.props.onPressTotalAgreement}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                            <View style={{ alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
                                <Image
                                    style={{ position: 'absolute', resizeMode: 'contain', width: '100%', height: '100%' }}
                                    source={this.props.isCheckedTotal ? require('../images/ic_checked_bg.png') : require('../images/ic_not_checked_bg.png')} />
                                {
                                    this.props.isCheckedTotal && <Image
                                        style={{ position: 'absolute', resizeMode: 'contain', width: '70%', height: '60%' }}
                                        source={require('../images/ic_checked_arrow.png')} />
                                }
                            </View>
                            <Text style={styles.totText}>{this.props.totAgreement}</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.totContentText}>{this.props.totAgreementContent}</Text>
                    <View style={styles.btnContainer}>
                        <TouchableOpacity
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            onPress={this.props.onPressOk}>
                            <View style={{ backgroundColor: '#779ba4', width: '100%', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <Text style={styles.confirmText}>{this.props.confirmText}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
    background: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        marginHorizontal: '9.7%',
        borderRadius: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        marginBottom: Platform.OS === 'ios' ? '20%' : '10%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 4,
        alignItems: 'center'
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    logoText: {
        color: '#5a686f',
        fontWeight: 'bold',
        fontSize: normalize(11)
    },
    btnContainer: {
        flexDirection: 'row',
        marginTop: 18,
        width: '86.2%',
        minHeight: 50,
        marginBottom: 20,
        borderRadius: 4,
        overflow: 'hidden'
    },
    confirmText: {
        color: '#fff',
        fontSize: normalize(14),
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    viewText: {
        fontSize: normalize(13),
        fontWeight: '500',
        color: '#ababab',
        alignSelf: 'center',
        textDecorationLine: 'underline',
        marginRight: '6.9%',
        marginLeft: '4.5%'
    },
    contentText: {
        fontSize: normalize(13),
        marginTop: 28,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
        marginHorizontal: '6.9%'
    },
    contentText_ja: {
        fontSize: normalize(10),
        marginTop: 28,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
        marginHorizontal: '3.0%'
    },

    necessityText: {
        fontSize: normalize(13),
        fontWeight: '500',
        color: '#000',
        marginLeft: 10,
    },
    agreeText: {
        fontSize: normalize(13),
        fontWeight: '500',
        color: '#000',
    },
    totText: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#000',
        marginLeft: 10
    },
    totContentText: {
        fontSize: normalize(13),
        marginTop: 2,
        fontWeight: '500',
        color: '#ababab',
        alignSelf: 'flex-start',
        marginLeft: '15.5%',
        marginRight: '6.9%'
    },
    firstLine: {
        marginTop: 12,
        backgroundColor: '#ebebeb',
        height: 1,
        width: '86.2%'
    },
    lastLine: {
        marginTop: 25,
        backgroundColor: '#ebebeb',
        height: 1,
        width: '86.2%'
    }
});