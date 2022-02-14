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
    FlatList
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
import { WebView } from 'react-native-webview';
import { translate } from 'i18n-js';
import { back } from 'react-native/Libraries/Animated/src/Easing';
import { Trans } from 'react-i18next';

const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
var networkCheck = null



export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class AgreeInfo extends Component {
    constructor(props) {
        super(props);
        const { params } = this.props.navigation.state
        this.state = {
            title: params.title != null ? params.title : '',
            aId: params.aId != null ? params.aId : 0,
            version: 0,
            content: '',
            checkNetwork: null
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
            'willFocus',
            () => {

                this.agreeVersionCheck()
                // this.agreeCheck()
                this.setText(this.state.title)
            }
        );
    }

    componentDidCatch(error, response) {
        console.log('componentDidCatch 11111:!!!!! ', error)
        console.log('componentDidCatch 22222:!!!!! ', response)
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.state.netwokrCheck = null
        this.willFocusMount.remove();
    }


    agreeVersionCheck() {
        var self = this

        let url = global.server + `/api/agrees`
        axios.get(url)
            .then(function (response) {
                if (response.data.result === 'ok') {
                    var versionInfo = response.data
                    if (this.state.aId == 1) {
                        this.setState({
                            version: versionInfo.data[0].version
                        })

                        if (global.lang == 'ko') {
                            this.setState({
                                content: versionInfo.data[0].contents
                            })
                        } else if (global.lang == 'ja') {
                            this.setState({
                                content: versionInfo.data[0].ja
                            })
                        } else if (global.lang == 'zh_rCN') {
                            this.setState({
                                content: versionInfo.data[0].zh_rCN
                            })
                        } else if (global.lang == 'zh_rTW') {
                            this.setState({
                                content: versionInfo.data[0].zh_rTW
                            })
                        } else if (global.lang == 'zh-Hant-MO') {
                            this.setState({
                                content: versionInfo.data[0].zh_rTW
                            })
                        } else {
                            this.setState({
                                content: versionInfo.data[0].en
                            })
                        }

                    } else if (this.state.aId == 2) {
                        this.setState({
                            version: versionInfo.data[1].version
                        })

                        if (global.lang == 'ko') {
                            this.setState({
                                content: versionInfo.data[1].contents
                            })
                        } else if (global.lang == 'ja') {
                            this.setState({
                                content: versionInfo.data[1].ja
                            })
                        } else if (global.lang == 'zh_rCN') {
                            this.setState({
                                content: versionInfo.data[1].zh_rCN
                            })
                        } else if (global.lang == 'zh_rTW') {
                            this.setState({
                                content: versionInfo.data[1].zh_rTW
                            })
                        } else if (global.lang == 'zh-Hant-MO') {
                            this.setState({
                                content: versionInfo.data[1].zh_rTW
                            })
                        } else {
                            this.setState({
                                content: versionInfo.data[1].en
                            })
                        }
                    } else if (this.state.aId == 3) {
                        this.setState({
                            version: versionInfo.data[2].version
                        })
                        if (global.lang == 'ko') {
                            this.setState({
                                content: versionInfo.data[2].contents
                            })
                        } else if (global.lang == 'ja') {
                            this.setState({
                                content: versionInfo.data[2].ja
                            })
                        } else if (global.lang == 'zh_rCN') {
                            this.setState({
                                content: versionInfo.data[2].zh_rCN
                            })
                        } else if (global.lang == 'zh_rTW') {
                            this.setState({
                                content: versionInfo.data[2].zh_rTW
                            })
                        } else if (global.lang == 'zh-Hant-MO') {
                            this.setState({
                                content: versionInfo.data[2].zh_rTW
                            })
                        } else {
                            this.setState({
                                content: versionInfo.data[2].en
                            })
                        }
                        networkCheck = true
                    }
                    console.log('version', this.state.version)
                } else {
                    Toast.show(`${Translate('occur_error')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('occur_error')}`)
                    networkCheck = false
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    networkCheck = false
                }
                else {
                    console.log(error)
                    networkCheck = false
                }
            });
    }

    async agree() {
        var self = this

        let url = global.server + '/api/agree/update'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('type', this.state.aId);
        bodyFormData.append('version', this.state.version);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn=", response.data);
                var res = response.data.result
                if (res === 'ok') {
                    this.props.navigation.goBack()
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
            });
    }


    setText(text) {
        text.split('\n').map((item, key) => {
            console.log('text: ', item)
        })
    }

    render() {
        const { navigation } = this.props;
        let companyInfo = 'https://www.ftc.go.kr/bizCommPop.do?wrkr_no=6295200343'
        console.log('checkID', this.state.aId)
        console.log('conetnet : ', this.state.content)

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <View style={{ height: 50, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: SCREEN_WIDTH }}>
                                <Text style={styles.textStyle}>{this.state.title}</Text>
                                <View style={{ position: 'absolute', left: 0, height: '100%' }}>
                                    <TouchableOpacity
                                        onPress={() => { navigation.goBack() }}>
                                        <View style={{ height: '100%', justifyContent: 'center' }}>
                                            <Image style={{ width: 19, height: 16, marginLeft: 25, marginRight: 10, marginVertical: 10 }} source={require('../../images/back.png')} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                {/* <TouchableOpacity
                                    onPress={() => { this.agree() }}
                                    style={{ padding: 17, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#779ba4', fontSize: normalize(13), fontWeight: 'bold' }}>{Translate('confirm')}</Text>
                                </TouchableOpacity> */}
                            </View>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#d7d7d7' }} />

                        <View style={{ flexDirection: 'column', marginLeft: SCREEN_WIDTH * 0.05, marginTop: SCREEN_HEIGHT * 0.045, }}>
                            {
                                this.state.aId === 4 ? <View style={{ flexDirection: 'row', marginBottom: 10 }}><Text style={{ color: '#000000', fontSize: normalize(14), fontWeight: 'bold' }}>{`출처`}</Text><Text style={{ color: '#878787', marginTop: '0.2%' }}> {' : 공정거래위원회(https://www.ftc.go.kr)'}</Text></View> : null
                            }
                            <Text style={{ color: '#000000', fontSize: normalize(14), fontWeight: 'bold' }}>{Translate('nomadnote')}</Text>

                            <Text style={{ color: '#000000', fontSize: normalize(14), fontWeight: 'bold' }}>{' '}</Text>
                            {/* {
                                this.state.title.split('\n').map((item, key) => {
                                    return (
                                        <Text
                                            style={{ color: '#000000', fontSize: normalize(14), fontWeight: 'bold' }}
                                            key={key}>{item}</Text>
                                    )
                                })
                            } */}
                        </View>
                        {this.state.checkNetwork !== false ? this.state.aId === 4 ?
                            <WebView
                                source={{ uri: 'https://www.ftc.go.kr/bizCommPop.do?wrkr_no=6295200343' }}
                                injectedJavaScript={`const meta = document.createElement('meta'); meta.setAttribute('content', 'width=width, initial-scale=0.5, maximum-scale=0.5, user-scalable=2.0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta); `}
                                scalesPageToFit={false}
                                onLoadEnd={this._onLoadEnd}
                                style={{ backgroundColor: '#f7f7f7', paddingTop: 0 }}
                                onError={(synthenticEvent) => {
                                    this.setState({
                                        checkNetwork: false
                                    })
                                }}
                            />
                            : networkCheck !== false && this.state.content !== '' ? <View style={styles.contentView}>
                                <ScrollView style={{ flex: 1 }}>
                                    <Text
                                        style={{ fontSize: normalize(13), marginBottom: 25, paddingBottom: 300, flex: 1, height: '100%' }}>
                                        {this.state.content}
                                    </Text>
                                </ScrollView>
                            </View> : <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', alignSelf: 'center' }}>
                                <Text style={{ color: 'black', fontSize: normalize(15), alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('network_error')}</Text>
                            </View>
                            :
                            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', alignSelf: 'center' }}>
                                <Text style={{ color: 'black', fontSize: normalize(15), alignSelf: 'center', textAlign: 'center', flexWrap: 'wrap' }}>{Translate('network_error')}</Text>
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

    textStyle: {
        flex: 1,
        fontSize: normalize(13),
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        justifyContent: 'center',
        position: 'absolute',
        alignItems: 'center'
    },
    contentView: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        marginLeft: SCREEN_WIDTH * 0.05,
        marginRight: SCREEN_WIDTH * 0.05,
        marginTop: SCREEN_WIDTH * 0.03,
        marginBottom: SCREEN_WIDTH * 0.08,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    contentText: {
        paddingTop: SCREEN_WIDTH * 0.06,
        color: '#000000',
        fontSize: normalize(12)
    },
    contentTextInput: {
        backgroundColor: '#ffffff',
    },
    titleText: {
        flex: 280,
        color: '#fff',
        fontSize: normalize(13),
        fontWeight: '400',
        textAlign: 'center',
    },
    backImg: {
        width: '38%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-end'
    },
    endText: {
        width: '47%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-start',
        marginLeft: '12%',
        marginTop: '5%'
    },



});