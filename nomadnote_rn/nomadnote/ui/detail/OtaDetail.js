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
    Linking,
    FlatList
} from 'react-native';

import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import AppStatusBar from '../../components/AppStatusBar';
import NextButton from '../../components/NextButton';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import FlatGrid from 'react-native-super-grid';
import Translate from '../../languages/Translate'
import { strftime, translate } from 'i18n-js';
import LinearGradient from 'react-native-linear-gradient';
import { setDeviceLang, setLang } from '../../utils/Utils';
import Toast from 'react-native-root-toast'



const THEME_COLOR = 'rgba(78, 109, 118, 1)'
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


export default class OtaDetail extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();

        this.state = {
            otaData: [],
            otaList: [],
            lang: setDeviceLang()
        };
    }



    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocus = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.getOTA()
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

    getOTA() {
        var self = this
        let url = global.server + `/api/ota_advertise/adver_list`
        axios.get(url)
            .then(function (response) {
                if (response.data.result === 'ok') {
                    this.setState({ otaData: response.data.advers }, () => {
                        console.log('ota', this.state.otaData)
                    })

                    var imageA = response.data.advers
                    var mArr = []
                    var videoP = ''
                    if (imageA.length == 0 || imageA === undefined) {
                        this.setState({
                            noImage: true,
                        })
                        console.log('no Data')
                    } else {
                        let aImg = []
                        mArr = imageA.map((item) => {
                            aImg = aImg.concat({
                                image: global.server + item.image_uri,
                                link: item.link
                            })
                        })
                        console.log('list', aImg)
                        this.setState({ otaList: aImg })
                    }
                } else {
                    Toast.show(`${Translate('occur_error')}`, {
                        duration: 1500,
                        position: 0
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
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={this.state.lang === 'en' || this.state.lang === 'ja' ? styles.textStyleEn : styles.textStyle}>{Translate('OTA')}</Text>
                                <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ position: 'absolute', height: '100%' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 18, height: 18, marginLeft: 25, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        <View
                            style={styles.scrollContainer}
                        >
                            <FlatList
                                style={{ flex: 1 }}
                                data={this.state.otaList}
                                renderItem={({ item }) => (

                                    <TouchableWithoutFeedback
                                        onPress={() => {
                                            console.log('checkUri =', item.link)
                                            Linking.openURL(item.link)
                                        }}>
                                        <View style={styles.cardContainer}>
                                            <Image
                                                resizeMode={'contain'}
                                                style={{ height: SCREEN_WIDTH * 0.5, width: SCREEN_WIDTH * 0.9, alignSelf: 'center' }}
                                                source={{ uri: item.image }}
                                            />
                                        </View>
                                    </TouchableWithoutFeedback>
                                )}
                                keyExtractor={(item, index) => index.toString()} />
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
        backgroundColor: '#fff'
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
    cardContainer: {
        height: SCREEN_WIDTH * 0.5,
        width: SCREEN_WIDTH * 0.97,
        marginTop: 8,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: THEME_COLOR,
        justifyContent: 'flex-end',
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.33,
        shadowRadius: 4,
        elevation: 4,
        marginBottom: 10
    },
    textStyle: {
        flex: 1,
        fontSize: normalize(12),
        color: '#ffffff',
        textAlign: 'center',
    },
    textStyleEn: {
        flex: 1,
        fontSize: normalize(11),
        color: '#ffffff',
        textAlign: 'center',
        marginLeft: 30
    },
    scrollContainer: {
        flex: 1,
        alignItems: 'center'
    },
});
