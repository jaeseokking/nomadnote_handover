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
import AppStatusBar from '../../components/AppStatusBar';
import CustomHeaderText from '../../components/CustomHeaderText';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import Moment from 'moment';
import { isIphoneX } from 'react-native-iphone-x-helper'
import InsetShadow from 'react-native-inset-shadow'
import Toast from 'react-native-root-toast';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import WriteModal from '../../components/WriteModal';
import Geolocation from 'react-native-geolocation-service';
import { GEOCODING_API_KEY } from "@env"
import Geocoder from 'react-native-geocoding';
import { byteLength, stringToByte, convertLocalIdentifierToAssetLibrary } from '../../utils/Utils';
import RNFetchBlob from 'rn-fetch-blob';
import { normalize } from '../Splash';
import FastImage from 'react-native-fast-image';
import CameraRoll from "@react-native-community/cameraroll";
import { ProcessingManager } from 'react-native-video-processing';
import * as RNFS from 'react-native-fs';
import { setItemToAsync } from '../../utils/AsyncUtil';
import {PERMISSIONS, RESULTS, request} from 'react-native-permissions'

const THEME_COLOR = 'rgba(78, 109, 118, 1)'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
let count = 1;
const COLUMNS_NUMBER = 3;
let imgSize = 0;
let imgs = [];
let imgByte = [];

export default class Picker extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        const { params } = this.props.navigation.state

        this.handleBackButton = this.handleBackButton.bind(this);

        this.state = {
            // img: [{ id: 0, src: '' }],
            img: [],
            resizeFileUri: [],
            isLoading: true,
            numImg: 0,
            checkImg: [],
            selectedImg: [],
            lastCursor: null,
            noMore: false,
            fileUri: '',
            preResizeFileUri: [],
            preImg: [],
            videoHeight: SCREEN_HEIGHT,
            permissionIOS : '',
        };
    }


 

    async goBack() {
        this.setState({ isLoading: true })

        let compressVideo = [...this.state.resizeFileUri]
        console.log('compressVideo = ', this.state.resizeFileUri)
        for (var i = 0; i < compressVideo.length; i++) {
            if (compressVideo[i].isVideo) {
                const result = await ProcessingManager.compress(compressVideo[i].src, {
                    width: SCREEN_WIDTH,
                    height: this.state.videoHeight,
                    bitrateMultiplier: 7,
                    minimumBitrate: 300000
                });
                console.log('checkVideo =', result)

                //아이폰 압축 후 바로 src pass
                if (Platform.OS === 'ios') {
                    compressVideo[i].src = result
                } else {
                    await RNFetchBlob.fs.stat(result.source)
                        .then((stats) => {
                            console.log('stats', stats, stats.uri)
                            compressVideo[i].fileSize = stats.size
                            compressVideo[i].fileName = stats.filename
                            compressVideo[i].src = `file://${stats.path}`
                        })
                        .catch((err) => {
                            console.log('error =', err)
                        })
                }
            }
        }

        let preUri = [...this.state.preResizeFileUri]
        let preImg = [...this.state.preImg]
        let resultResizeUri
        let resultImgUri


        const { navigation } = this.props;
        console.log('PRE URL',preUri)
        console.log('PRE IMG', preImg)
        console.log('compressVideo', compressVideo )
        this.setState({
            resizeFileUri: compressVideo,
            isLoading: false
        }, () => {
            resultResizeUri = [...this.state.resizeFileUri]
            resultImgUri = [...this.state.selectedImg]

            if (preUri.length > 0) {
                for (var i = 0; i < resultResizeUri.length; i++) {
                    resultResizeUri[i].id += preUri.length
                }

                for (var i = 0; i < resultImgUri.length; i++) {
                    resultImgUri[i].checkNum += preImg.length
                }

                preUri = preUri.concat(resultResizeUri)
                preImg = preImg.concat(resultImgUri)

                navigation.state.params.onSelect({
                    resizeFileUri: preUri,
                    img: preImg,
                });
                    navigation.goBack();
            
                
            } else {
                navigation.state.params.onSelect({
                    resizeFileUri: this.state.resizeFileUri,
                    img: this.state.selectedImg
                });
                    navigation.goBack();
                }
        })

    }


    async componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        setItemToAsync('route_name', this.props.navigation.state.routeName);

        let resizeUri = [...this.props.navigation.state.params.resizeFileUri]
        let imgUri = [...this.props.navigation.state.params.img]
        console.log('picker img list: ', imgUri)
        this.setState({
            preResizeFileUri: resizeUri,
            preImg: imgUri
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
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    }

    handleBackButton = () => {
        console.log('route name: ', this.props.navigation.state.routeName)
        if (this.props.navigation.isFocused()) {
            count = 1
            imgSize = 0
            imgs = []
            imgByte = []
            this.props.navigation.goBack();
            return false;
        }
    };

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
        Toast.show(`${Translate('image_loading')}`, {
            duration: 1000,
            position: Toast.positions.CENTER
        })
        // Toast.show(`${Translate('no_image_data')}`)
        let fetchParams = {
            first: Platform.OS === 'ios' ? 60 : 10000,
            assetType: 'Photos',
        }
        console.log('lastCursor: ', this.state.lastCursor)
        if (this.state.lastCursor) {
            fetchParams.after = this.state.lastCursor;
        }

        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        // console.log('RESULT ::::: 3#@!#!',result)
        if(result === RESULTS.GRANTED){
            console.log('전체사진 가져오기')
        }else if(result === RESULTS.LIMITED){
            if(Platform.OS === 'ios'){
                this.setState({
                    permissionIOS : 'LIMITED'
                })
            }
            console.log('비허가!!@!@!')
        }
        await CameraRoll.getPhotos(fetchParams)
            .then((data) => {
                console.log('???');
                console.log("FDASFASFADSFDSA" , data)
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
        edges.map((item) => {
            imgs = [...imgs]
            if (Platform.OS === 'ios') {
                imgs = imgs.concat({
                    id: imgSize, src: convertLocalIdentifierToAssetLibrary(item.node.image.uri.replace('ph://', ''), item.node.type === 'image' ? 'jpg' : 'mov'),
                    isCheck: false, checkNum: 0, isVideo: (item.node.type === 'image') ? false : true, fileSize: item.node.image.fileSize, fileName: item.node.image.filename,
                    timelineId: '', isMain: false
                })
            } else {
                imgs = imgs.concat({
                    id: imgSize, src: item.node.image.uri, isCheck: false, checkNum: 0,
                    isVideo: (item.node.type.split('/')[0] === 'image') ? false : true, fileSize: item.node.image.fileSize, fileName: item.node.image.filename,
                    timelineId: '', isMain: false
                })
            }
            imgSize++
        })

        if (!data.page_info.has_next_page) {
            newState.noMore = true;

        }
       
            newState.lastCursor = data.page_info.end_cursor;
            newState.img = imgs
            newState.isLoading = false
            this.setState(newState)
        
    }

    checkNumber(item) {
        let number = [...this.state.img]
        let selectedItem = [...this.state.selectedImg]
        let reSelectedItem
        let isAdd = ''
        let clickPosition = 0
        let videoIndex = 0
        number[item.id].isCheck = !number[item.id].isCheck
        // console.log('Number : ', number)
        // console.log('SelectedItem : ', number)

        if (number[item.id].isCheck) {
            selectedItem.map((item) => {
                if (item.isVideo) {
                    videoIndex++
                }
            })

            if (videoIndex > 0) {
                if (!number[item.id].isVideo) {
                    Toast.show(`${Translate('video_photo_not_with')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('video_photo_not_with')}`)
                } else {
                    Toast.show(`${Translate('error_register_multiple_videos')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('error_register_multiple_videos')}`)
                }
                number[item.id].isCheck = !number[item.id].isCheck
            } else {
                if (selectedItem.length > 0) {
                    if (number[item.id].isVideo) {
                        Toast.show(`${Translate('video_photo_not_with')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('video_photo_not_with')}`)
                        number[item.id].isCheck = !number[item.id].isCheck
                    } else {
                        number[item.id].checkNum = count;
                        clickPosition = number[item.id].checkNum
                        if (count < 6) {
                            selectedItem = selectedItem.concat(number[item.id])
                        }
                        isAdd = 'add'
                        count++;
                    }
                } else {
                    number[item.id].checkNum = count;
                    clickPosition = number[item.id].checkNum
                    if (count < 11) {
                        selectedItem = selectedItem.concat(number[item.id])
                    }
                    isAdd = 'add'
                    count++;
                }
            }
        } else {
            isAdd = 'delete'
            let unSelectedNum = number[item.id].checkNum
            clickPosition = number[item.id].checkNum

            selectedItem = selectedItem.filter((item) => item.checkNum !== clickPosition)
            number[item.id].isMain = false
            number[item.id].checkNum = 0
            let i;
            for (i = 0; i < number.length; i++) {
                if (number[i].checkNum > unSelectedNum) {
                    number[i].checkNum = number[i].checkNum - 1
                }
            }
            this.setState({ videoHeight: 0 })
            count--;
        }

        if (count > 6) {
            isAdd = 'nothing'
            count--;
            number[item.id].isCheck = !number[item.id].isCheck
            number[item.id].checkNum = 0;
            Toast.show(`${Translate('photo_max_5')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(Translate('photo_max_5'))
        }

        if (this.state.preImg.length === 0 && selectedItem.length > 0) {
            selectedItem[0].isMain = true
        }

        this.setState({
            checkImg: number,
            numImg: count - 1,
            selectedImg: selectedItem,
            fileUri: number[item.id].src
        },
            () => this.resizeImage(clickPosition - 1, isAdd)
        )

    }

    resizeImage(count, isAdd) {
        this.setState({isLoading : true})
        let arrImg = [...this.state.selectedImg];
        console.log('arrImg: ', arrImg);

        if (isAdd === 'add') {
            console.log('클릭하여 선택됨')
            if (!arrImg[count].isVideo) {
                console.log('리사이즈 시작')
                ImageResizer.createResizedImage(arrImg[count].src, 1920, 1920, 'JPEG', 100)
                    .then(response => {
                        console.log('리사이즈 크기', response.size)
                        let arrResizeUri = [...this.state.resizeFileUri]
                        arrResizeUri = arrResizeUri.concat({ src: response.uri, fileSize: response.size, id: count, isVideo: false, fileName: response.name, timelineId: '', isMain: false })
                        if (this.state.preResizeFileUri.length === 0 && arrResizeUri.length > 0) {
                            arrResizeUri[0].isMain = true
                        }
                        this.setState({ resizeFileUri: arrResizeUri }, () => this.setState({isLoading : false}))
                        console.log('리사이즈 종료')
                    })
                    .catch(err => {
                        console.log(err)
                        this.setState({isLoading : false})
                    });
            } else {
                let arrResizeUri = [...this.state.resizeFileUri]
                arrResizeUri = arrResizeUri.concat({ src: arrImg[count].src, fileSize: arrImg[count].fileSize, id: count, isVideo: true, fileName: arrImg[count].fileName, timelineId: '', isMain: false })
                if (arrResizeUri.length > 0) {
                    Image.getSize(arrResizeUri[0].src, (width, height) => {
                        console.log('resize video: ', height)
                    })
                }
                if (this.state.preResizeFileUri.length === 0 && arrResizeUri.length > 0) {
                    arrResizeUri[0].isMain = true
                }
                this.setState({ resizeFileUri: arrResizeUri }, () => this.setState({isLoading : false}))
            }
        } else if (isAdd === 'delete') {
            console.log('재클릭하여 취소됨')
            let arrResizeUri = [...this.state.resizeFileUri]
            if (arrResizeUri[count] !== null && arrResizeUri[count] !== undefined) {
                arrResizeUri[count].isMain = false
            }
            arrResizeUri = arrResizeUri.filter((item) => item.id !== count)
            for (var i = 0; i < arrResizeUri.length; i++) {
                if (arrResizeUri[i].id > count) {
                    arrResizeUri[i].id = arrResizeUri[i].id - 1
                }
            }
            if (this.state.preResizeFileUri.length === 0 && arrResizeUri.length > 0) {
                arrResizeUri[0].isMain = true
            }
            console.log('arrResizeUri: ', arrResizeUri)
            this.setState({ resizeFileUri: arrResizeUri }, () => this.setState({isLoading : false}))
        }

        console.log(this.state.resizeFileUri);
    }

    AuthPhoto (){
        console.log("AuthPhoto")
        Linking.openURL('app-settings:photo')
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
                                            count = 1
                                            imgSize = 0
                                            imgs = []
                                            imgByte = []
                                            navigation.goBack();
                                        }}>
                                        <Image
                                            style={[styles.backImg]}
                                            source={require('../../images/back_white.png')} />
                                    </TouchableWithoutFeedback>
                                </View>
                                <View style={{ justifyContent: 'center', position: 'absolute', right: 0, height: '100%', alignItems: 'center' }} >
                                    <TouchableOpacity
                                        hitSlop={{ top: 10, right: 14, bottom: 10, left: 20 }}
                                        onPress={() => {
                                            console.log('IS LOADING', isLoading)
                                            if(isLoading == false){
                                                count = 1
                                                imgSize = 0
                                                imgs = []
                                                imgByte = []
                                                this.goBack();
                                            }else{
                                                Toast.show(`${Translate('image_loading')}`, {
                                                    duration: 1000,
                                                    position: Toast.positions.CENTER
                                                })                                                
                                                return
                                            }
                                        }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginRight: 14, alignItems: 'center' }}>
                                            <Text style={styles.choiceText}>{this.state.numImg} </Text>
                                            <Text style={styles.choiceText}>{Translate('choose_pic_done')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                            {this.state.permissionIOS === 'LIMITED' &&
                                <TouchableOpacity onPress={() => this.AuthPhoto()} style={{backgroundColor : 'rgb(246,245,249)'}}>
                                    <Text style={{fontWeight : '300', fontSize: normalize(12), margin : 7 , marginTop : 15}}>{Translate('more_photos')}</Text>
                                    <Text style={{fontSize: normalize(12), margin : 7, color : 'rgb(83,162,198)', fontWeight : '500'}}>{Translate('allow_photos')}</Text>
                                </TouchableOpacity>
                            }
                            {
                                <FlatList
                                    data={this.state.img}
                                    extraData={this.state.checkImg}
                                    onEndReached={() => this.getPhoto()}
                                    onEndReachedThreshold={0.1}
                                    renderItem={({ item }) => (
                                        <View style={{
                                            flex: 1,
                                            flexDirection: 'column',
                                            maxWidth: SCREEN_WIDTH / 3,
                                            marginLeft: (item.id % COLUMNS_NUMBER) === 0 ? 5 : 8,
                                            marginRight: (item.id % COLUMNS_NUMBER) === COLUMNS_NUMBER - 1 ? 5 : 0,
                                            marginVertical: 5,
                                        }}>
                                            <TouchableWithoutFeedback
                                                key={item.id}
                                                style={{ flex: 1 }}
                                                onPress={() => {
                                                    this.checkNumber(item)
                                                }}>
                                                <View style={{ flex: 1, height: 120 }}>
                                                    {
                                                        Platform.OS === 'ios' ? <Image
                                                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                                                            source={{ uri: item.src }} /> : <FastImage
                                                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                                                            source={{ uri: item.src }} />
                                                    }
                                                    <View style={{ width: '20%', height: '20%', position: 'absolute', right: 0, top: 0, marginRight: 4, marginTop: 4, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image style={{ position: 'absolute', width: '100%', height: '100%', resizeMode: 'contain' }}
                                                            source={require('../../images/btn_select_picture.png')} />
                                                        <Text style={{ fontSize: normalize(10), color: '#fff', fontWeight: '300' }}>{item.isCheck ? item.checkNum : ''}</Text>
                                                    </View>
                                                    {
                                                        item.isVideo && <Image style={{ width: '20%', height: '20%', resizeMode: 'contain', position: 'absolute', bottom: 0, left: 0, marginLeft: 5 }}
                                                            source={require('../../images/video.png')} />
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
        width: 18,
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
