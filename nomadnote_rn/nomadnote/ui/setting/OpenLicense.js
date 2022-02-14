

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
    ActivityIndicator,
    SafeAreaViewBase,
} from 'react-native';
import axios from 'axios';
import Translate from '../../languages/Translate';
import Toast from 'react-native-root-toast';
import Toast2 from 'react-native-simple-toast';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import AppStatusBar from '../../components/AppStatusBar';
import { translate } from 'i18n-js';
import { WebView } from 'react-native-webview';



const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const image_check = require('../../images/check_on.png');
const image_unCheck = require('../../images/check_off.png');
const License = require('../setting/licenses.html');

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class OpenLisense extends Component {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);

    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
    }

    render() {
        console.log("Platform.OS",Platform.OS === 'ios')
        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* <Text style={styles.textStyle}>{Translate('not_disturb')}</Text> */}
                                <Text style={styles.textStyle}>{Translate('opensource')}</Text>
                                <TouchableOpacity onPress={() => {
                                    this.props.navigation.goBack()
                                }} style={{ position: 'absolute', height: '100%' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 18, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        <View style={styles.contentView}>
                            {
                                Platform.OS === 'ios' ?
                                    // <WebView source={{ baseUrl : '../setting/licenses.html'}} />
                                    <WebView style={{flex: 1,opacity:0.99, minHeight:1 }} originWhitelist={['*']} source={require('./licenses.html')} javaScriptEnabled={true} domStorageEnabled={true}/>
                                    :
                                    <WebView style={{flex: 1, opacity:0.99, minHeight:1}} originWhitelist={['*']} source={{ uri: 'file:///android_asset/licenses.html' }}  javaScriptEnabled={true} domStorageEnabled={true}/>
                            }

                            <View style={{ marginTop: -5 }}>

                            </View>
                        </View>
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
        marginTop: SCREEN_HEIGHT * 0.008,
        marginBottom: SCREEN_HEIGHT * 0.008,
        width: SCREEN_WIDTH,
        paddingLeft: SCREEN_WIDTH * 0.008,
        paddingRight: SCREEN_WIDTH * 0.008,
    },
    titleText: {
        fontSize: normalize(15),
        color: '#000000',
        fontWeight: 'bold',
    },
    subText: {
        flex: 1,
        fontSize: normalize(12),
        color: '#919191',
    },

});