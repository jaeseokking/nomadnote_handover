import React, { Component, useState, useEffect } from 'react';
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
    DeviceEventEmitter,
    Keyboard,
    ActivityIndicator,
    Linking,
    Alert,
    PermissionsAndroid
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import AppStatusBar from './AppStatusBar';
import SetI18nConfig from '../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../languages/Translate';
import Moment from 'moment';
import { isIphoneX } from 'react-native-iphone-x-helper'
import InsetShadow from 'react-native-inset-shadow'
import Toast from 'react-native-root-toast';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import Geolocation from 'react-native-geolocation-service';
import { GEOCODING_API_KEY } from "@env"
import Geocoder from 'react-native-geocoding';
import { byteLength, stringToByte, convertLocalIdentifierToAssetLibrary } from '../utils/Utils';
import RNFetchBlob from 'rn-fetch-blob';
import { normalize } from '../ui/Splash';
import FastImage from 'react-native-fast-image';
import CameraRoll from "@react-native-community/cameraroll";
import { ProcessingManager } from 'react-native-video-processing';
import * as RNFS from 'react-native-fs';

const THEME_COLOR = 'rgba(78, 109, 118, 1)'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
let count = 0;
const COLUMNS_NUMBER = 3;
let imgSize = 0;
let imgs = [];
let imgByte = [];

export default class PhotoPicker extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        const { params } = this.props.navigation.state

        this.state = {
            // img: [{ id: 0, src: '' }],
            img: [],
            resizeFileUri: [],
            isLoading: true,
            numImg: 0,
            checkImg: [],
            selectedImg: '',
            lastCursor: null,
            noMore: false,
            fileUri: '',
            imgWidth: SCREEN_WIDTH,
            imgHeight: SCREEN_HEIGHT,
            gender: ''
        };
    }

    goBack() {
        this.setState({ isLoading: true })
        this.resizeImage();
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.setState({ gender: this.props.navigation.state.params.gender }, () => {
            console.log('gender: ', this.state.gender)
        })
        if (Platform.OS === 'ios') {
            this.getPhoto();
        } else {
            if (this.hasAndroidPermission()) {
                this.getPhoto();
            }
        }
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

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

        return false;
    }

    getPhoto = async () => {
        if (this.state.noMore) {
            Toast.show(`${Translate('no_image_data')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('no_image_data')}`)
            return
        }
        let fetchParams = {
            first: Platform.OS === 'ios' ? 60 : 100000,
            assetType: 'All',
        }
        console.log('lastCursor: ', this.state.lastCursor)
        if (this.state.lastCursor) {
            fetchParams.after = this.state.lastCursor;
        }
        await CameraRoll.getPhotos(fetchParams)
            .then((data) => {
                console.log('DATA :::::::!@!@:!:@:!:', data)
                this._appendAssets(data);
            })
            .catch((err) => {
                console.log('not Permission?', err);
                var stringErr = String(err)
                if (stringErr.includes('denied')) {
                    console.log('error with denied')
                    Alert.alert('Photo permission denied');
                    this.props.navigation.goBack()
                }
            });
    }

    _appendAssets(data) {
        let newState = {};
        let edges = data.edges;
        let imgAry = [...this.state.img]
        edges.map((item) => {
            if (Platform.OS === 'ios') {
                imgAry = imgAry.concat({
                    src: convertLocalIdentifierToAssetLibrary(item.node.image.uri.replace('ph://', ''), item.node.type === 'image' ? 'jpg' : 'mov'),
                    width: item.node.image.width, height: item.node.image.height, number: count
                })
            } else {
                imgAry = imgAry.concat({
                    src: item.node.image.uri, width: item.node.image.width, height: item.node.image.height, number: count
                })
            }
            count++
        })

        if (!data.page_info.has_next_page) {
            newState.noMore = true;
        }
        if (imgAry.length > 0) {
            newState.lastCursor = data.page_info.end_cursor;
            newState.img = imgAry
            newState.isLoading = false
            this.setState(newState)
        }
    }

    resizeImage() {
        const { navigation } = this.props;

        ImageResizer.createResizedImage(this.state.selectedImg, this.state.imgWidth, this.state.imgHeight, 'JPEG', 100)
            .then(response => {
                if (this.state.gender === 'F') {
                    navigation.state.params.onSelect({
                        resizeFileUri: response.uri,
                        fProfile: this.state.selectedImg,
                        isLoading: false
                    });
                } else if (this.state.gender === 'M') {
                    navigation.state.params.onSelect({
                        resizeFileUri: response.uri,
                        mProfile: this.state.selectedImg,
                        isLoading: false
                    });
                } else {
                    navigation.state.params.onSelect({
                        resizeFileUri: response.uri,
                        profile: this.state.selectedImg,
                        isClickProfile: true,
                        isLoading: false
                    });
                }
                count = 0;
                navigation.goBack();
            })
            .catch(err => {
                console.log(err)
            });
    }

    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;

        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.titleText}>{Translate('choose_pic_title')}</Text>
                                <View style={styles.touchContainer}>
                                    <TouchableWithoutFeedback
                                        style={[{ width: '100%' }, { height: '100%' }]}
                                        hitSlop={{ top: 0, right: 20, bottom: 0, left: 20 }}
                                        onPress={() => {
                                            count = 0;
                                            navigation.state.params.onSelect({
                                                isClickProfile: false,
                                                isLoading: false
                                            });
                                            navigation.goBack();
                                        }}>
                                        <Image
                                            style={[styles.backImg]}
                                            source={require('../images/back_white.png')} />
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </LinearGradient>
                        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                            {
                                <FlatList
                                    data={this.state.img}
                                    onEndReached={() => this.getPhoto()}
                                    onEndReachedThreshold={0.1}
                                    renderItem={({ item }) => (
                                        <View style={{
                                            flex: 1,
                                            flexDirection: 'column',
                                            maxWidth: (SCREEN_WIDTH - (10 + 16)) / 3,
                                            marginLeft: (item.number % COLUMNS_NUMBER) === 0 ? 5 : 8,
                                            marginRight: (item.number % COLUMNS_NUMBER) === COLUMNS_NUMBER - 1 ? 5 : 0,
                                            marginTop: 8,
                                        }}>
                                            <TouchableWithoutFeedback
                                                key={item.id}
                                                style={{ flex: 1 }}
                                                onPress={() => {
                                                    this.setState({
                                                        selectedImg: item.src,
                                                        imgWidth: (item.width === '' || item.width === null) ? SCREEN_WIDTH : item.width,
                                                        imgHeight: (item.height === '' || item.height === null) ? SCREEN_HEIGHT : item.height,
                                                    }, () => {
                                                        this.goBack();
                                                    })
                                                }}>
                                                <View style={{ flex: 1, height: 120 }}>
                                                    {
                                                        Platform.OS === 'ios' ? <Image
                                                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                                                            source={{ uri: item.src }} /> : <FastImage
                                                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                                                            source={{ uri: item.src }} />
                                                    }
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    )}
                                    numColumns={COLUMNS_NUMBER}
                                    keyExtractor={(item, index) => index.toString()} />
                            }
                        </View>
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
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    touchContainer: {
        position: 'absolute',
        left: 0,
        width: SCREEN_WIDTH * 0.1389,
        height: '100%',
    },
    titleText: {
        flex: 1,
        color: '#fff',
        fontSize: normalize(15),
        fontWeight: '400',
        textAlign: 'center',
        alignSelf: 'center'
    },
    choiceText: {
        flex: 1,
        color: '#fff',
        fontSize: normalize(12),
        fontWeight: '400',
    },
    backImg: {
        width: '34.5%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-end',
        marginRight: 10
    },
    resiImg: {
        width: '47%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-start',
        marginLeft: '12%',
        marginTop: '5%'
    },
    imageStyle: {
        height: 120,
        width: '100%',
    }
});