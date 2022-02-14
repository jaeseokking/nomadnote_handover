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
    FlatList,
    DeviceEventEmitter,
    Keyboard,
    ActivityIndicator,
    Linking,
    Alert,
    PermissionsAndroid,
    LogBox,
    Button,
    KeyboardAvoidingView
} from 'react-native';

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
import { byteLength, setTransLang, stringToByte } from '../../utils/Utils';
import ActionSheet from '@alessiocancian/react-native-actionsheet'
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import { ProcessingManager } from 'react-native-video-processing';
import RNFetchBlob from 'rn-fetch-blob';
import Video from 'react-native-video';
import Share from 'react-native-share'
import RNFS from 'react-native-fs';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';
import { Dialog } from 'react-native-simple-dialogs';
import {
    WheelPicker,
    TimePicker,
    DatePicker
} from "react-native-wheel-picker-android";


const THEME_COLOR = 'rgba(78, 109, 118, 1)'

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('screen');

const scale = SCREEN_WIDTH / 320;
let imgByte = [];
let selectIndex = 0;
const MAXIMUM_VIDEO = 52428800;
const wheelPickerData = [
    "AM",
    "PM",
];

const Hour = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const Min = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];


export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class Write extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        if (Platform.OS === 'android') {
            AndroidKeyboardAdjust.setAdjustPan();
        }

        this.handleBackButton = this.handleBackButton.bind(this);

        const { params } = this.props.navigation.state
        const { navigation } = this.props;


        this.state = {
            currentTime: new Date(),
            place: '',
            spendMoney: params.cost !== null && params.cost !== '' && params.cost !== undefined ? parseInt(params.cost) : 0,
            travelStyle: 1,
            time: Moment(new Date()).format('hh:mm'),
            content: '',
            isLock: false,
            visibleHeight: SCREEN_WIDTH * 0.275 * 0.95,
            img: [],
            filePath: '',
            fileData: '',
            fileUri: '',
            resizeFileUri: [],
            isClickImg: false,
            isLoading: true,
            isModal: false,
            isLocation: false,
            location: '',
            country: '',
            countryCode: '',
            adminArea: '',
            timelineData: '',
            videoList: '',
            qnaId: params.qnaId,
            address: '',
            modiId: '',
            modiData: params.modiData,
            modiImg: params.modiImages,
            isModi: params.isModi,
            isReply: params.isReply,
            isFirstLoading: true,
            modiDeleteId: [],
            isModiVideo: false,
            isSettingVideo: false,
            paused: false,
            progress: 0,
            duration: 0,
            isRegistrationOk: false,
            contentHeight: '100%',
            initContentHeight: 0,
            contentHideHeight: 0,
            androidInitContentHeight: 0,
            contentPaddingTop: SCREEN_HEIGHT * 0.028,
            contentPaddingBottom: SCREEN_WIDTH * 0.2,
            originalPaddingBottom: null,
            isFirstContent: true,
            isUserInfo: (global.user.gender === null || global.user.gender === '') && (global.user.age === null || global.user.age === ''),
            isUserInfoModal: false,
            isMoveScreen: false,
            isAdmin: (global.user.join_type === 6 || global.user.join_type === 7) ? true : false,
            focus: false,
            hourSelected: 0,
            minSelected: 0,
            userData: [],
            HH: '',
            MM: '',
            koCountry: ''
        };
    }


    getMyInfo() {
        console.log('Disk Memory ActiveAsync')
        let url = global.server + '/api/member/my_info'

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                if (response.data.result === 'ok') {
                    global.disk = response.data.disk
                    global.useByte = response.data.usebytes
                    console.log('userInfo: ', response.data)
                }
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    // Toast.show(error.response.data.message);
                }
                else {
                    console.log(error)
                }
            });
    }


    registration() {
        console.log('registration');

        if (this.state.place === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })

            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('area_required')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('area_required')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('area_required')}`)
            this.inputPlace.focus();
            return
        }
        if (this.state.time === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })


            Toast.show(`${Translate('time_required')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('time_required')}`)

            this.inputCurrentTime.focus();
            return
        }
        if (this.state.spendMoney === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('amount_required')}`, {
                    duration: 3000
                })
            } else {
                Toast.show(`${Translate('amount_required')}`, {
                    duration: 3000,
                    position: Toast.positions.CENTER
                })
            }
            this.inputSpendMoney.focus();
            // Toast.show(`${Translate('amount_required')}`)
            return
            //this.state.spenMoney = 0
        }
        if (this.state.content === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })

            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('content_required')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('content_required')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('content_required')}`)
            this.inputContent.focus();
            return
        }

        var moneyReplace
        try {
            moneyReplace = this.state.spendMoney.replace(/(^0+)/, "")
            const reg = /^[\.]/
            if (reg.test(moneyReplace)) {
                moneyReplace = '0' + moneyReplace
            }

            if (moneyReplace === null || moneyReplace === undefined || moneyReplace === "") {
                moneyReplace = 0
            }
        } catch (error) {
            moneyReplace = 0
        }

        var moneyReplace2
        //쉼표 추가
        if (moneyReplace >= 1000) {
            moneyReplace2 = moneyReplace.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            moneyReplace2 = moneyReplace
        }

        // 소비금액 + 단위 문자열
        let costStr
        if (global.lang === 'en' || global.lang === 'ja') {
            costStr = `${Translate('unit')}${moneyReplace2}`
        } else {
            costStr = `${moneyReplace2}${Translate('unit')}`
        }

        console.log('MoneyReplace2', moneyReplace2)
        console.log('MoneyReplace1', moneyReplace);
        console.log('CostStr', costStr)
        const currentTime = new Date();

        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('place_name', this.state.place);
        bodyFormData.append('duration', this.state.time);
        bodyFormData.append('cost', moneyReplace);
        bodyFormData.append('contents', this.state.content);
        bodyFormData.append('place_id', '1');
        bodyFormData.append('country_id', '1');
        bodyFormData.append('style_id', this.state.travelStyle);
        bodyFormData.append('token', global.user.token);
        bodyFormData.append('block_yn', this.state.isLock ? 'Y' : 'N');
        bodyFormData.append('country', this.state.country);
        //bodyFormData.append('code', this.state.countryCode);
        //bodyFormData.append('code', '');
        bodyFormData.append('admin_area_kr', this.state.adminArea);
        bodyFormData.append('latitude', this.state.location.coords.latitude);
        bodyFormData.append('longitude', this.state.location.coords.longitude);
        bodyFormData.append('money_unit', Translate('unit'));
        bodyFormData.append('cost_str', costStr);
        bodyFormData.append('created_at', Moment(currentTime).format('yyyy-MM-DD HH:mm:ss'));
        bodyFormData.append('timelineData', '');
        bodyFormData.append('qnas_id', this.state.qnaId);
        console.log('qnas_id', this.state.qnaId)
        let totUseByte
        console.log('Global.Disk : ', global.disk)
        console.log('Global.UseByte : ', global.useByte)
        const totUserByte = global.disk - global.useByte
        let imgSize = 0
        let image = [...this.state.resizeFileUri].filter(item => !item.isVideo)
        let video = [...this.state.resizeFileUri].filter(item => item.isVideo)

        console.log('image: ', image)
        console.log('video: ', video)

        if (video.length > 1) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('error_register_multiple_videos')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('error_register_multiple_videos')}`)
            return
        }

        if (video.length > 0 && image.length > 0) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('video_photo_not_with')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('video_photo_not_with')}`)
            return
        }

        if (image.length > 5) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('photo_max_5')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('photo_max_5')}`)
            return
        }

        // 이미지, 영상 파라미터
        if (this.state.resizeFileUri.length > 0) {
            image.map((img, index) => {
                console.log('image', index);
                bodyFormData.append(`files[${index}]`, {
                    uri: img.src,
                    name: img.fileName,
                    type: 'image/jpg'
                });
                if (img.isMain) {
                    bodyFormData.append('position', index + 1)
                }
                imgSize += img.fileSize
            })
            video.map((video, index) => {
                if (video.fileSize > MAXIMUM_VIDEO) {
                    this.setState({ isLoading: false, isRegistrationOk: false })
                    Toast.show(`${Translate('error_maximum_video')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('error_maximum_video')}`)
                    return
                }
                console.log('video : ', index)
                bodyFormData.append(`videos[${index}]`, {
                    uri: video.src,
                    name: video.fileName,
                    type: 'video/mp4'
                });
                console.log('video formdata: ', video.src, video.fileName)
                if (video.isMain) {
                    bodyFormData.append('position', index + 1)
                }
                imgSize += video.fileSize
            })
        }
        console.log('videocheck =', video)

        const byteTxt = byteLength(this.state.content)
        console.log(imgSize);
        totUseByte = imgSize + byteTxt

        // 사용 디스크 파라미터
        console.log('totalUserByte : ', totUserByte);
        console.log('totUseByte : ', totUseByte)
        if (totUserByte < totUseByte) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('over_free_space')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('over_free_space')}`)
            return
        } else {
            bodyFormData.append('disk_data', totUseByte);
        }


        console.log('byte: ', byteTxt)

        let url = global.server + `/api/timeline/addtimeline`
        console.log(url)
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log(response.data);
                this.toggleSettingModal()
                if (response.data.result === 'ok') {
                    this.getMyInfo();
                    global.otherScrapList = response.data
                    Toast.show(`${Translate('registered')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('registered')}`)
                    setItemToAsync('write', 'registration')
                    setItemToAsync('scrap_write', 'registration')
                    setItemToAsync('my_timeline_write', 'registration')
                    setItemToAsync('visit_write', 'registration')
                    setItemToAsync('map_write', 'registration')
                    setItemToAsync('createTimeLine', true)
                    this.props.navigation.goBack()
                } else {
                    // Toast.show(`${Translate('error')}`, {
                    //     duration: 2000,
                    //     position: Toast.positions.CENTER
                    // })
                    Toast.show(`${Translate('error')}`)
                }
                this.setState({ isLoading: false, isRegistrationOk: false })
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('errorCheck', error.response.data)
                }
                else {
                    console.log('error1', error)
                }
                self.toggleSettingModal()
                self.setState({ isLoading: false, isRegistrationOk: false })
            });
    }

    modification() {
        console.log('modi')

        if (this.state.place === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('area_required')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('area_required')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('area_required')}`)
            this.inputPlace.focus();
            return
        }
        if (this.state.time === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('time_required')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('time_required')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('time_required')}`)
            this.inputCurrentTime.focus();
            return
        }

        if (this.state.spendMoney === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('amount_required')}`, {
                    duration: 3000
                })
            } else {
                Toast.show(`${Translate('amount_required')}`, {
                    duration: 3000,
                    position: Toast.positions.CENTER
                })
            }
            this.inputSpendMoney.focus();
            // Toast.show(`${Translate('amount_required')}`)
            return
            //this.state.spenMoney = 0
        }
        if (this.state.content === '') {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            if (Platform.OS === 'ios') {
                Toast.show(`${Translate('content_required')}`, {
                    duration: 2000
                })
            } else {
                Toast.show(`${Translate('content_required')}`, {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
            }
            // Toast.show(`${Translate('content_required')}`)
            this.inputContent.focus();
            return
        }



        var moneyReplace
        try {
            moneyReplace = String(this.state.spendMoney)
            moneyReplace = moneyReplace.replace(/(^0+)/, "")
            const reg = /^[\.]/
            if (reg.test(moneyReplace)) {
                moneyReplace = '0' + moneyReplace
            }

            if (moneyReplace === null || moneyReplace === undefined || moneyReplace === "") {
                moneyReplace = 0
            }
        } catch (error) {
            console.log(error)
            moneyReplace = 0
        }



        var moneyReplace2
        //쉼표 추가
        if (moneyReplace >= 1000) {
            moneyReplace2 = moneyReplace.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            moneyReplace2 = moneyReplace
        }

        // 소비금액 + 단위 문자열
        let costStr
        if (global.lang === 'en' || global.lang === 'ja') {
            costStr = `${Translate('unit')}${moneyReplace2}`
        } else {
            costStr = `${moneyReplace2}${Translate('unit')}`
        }

        console.log('MoneyReplace2', moneyReplace2)
        console.log('MoneyReplace1', moneyReplace);
        console.log('CostStr', costStr)


        const currentTime = new Date();

        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('timeline_id', this.state.modiData.id);
        bodyFormData.append('place_name', this.state.place);
        bodyFormData.append('duration', this.state.time);
        bodyFormData.append('cost', moneyReplace);
        bodyFormData.append('contents', this.state.content);
        bodyFormData.append('place_id', '1');
        bodyFormData.append('country_id', '1');
        bodyFormData.append('style_id', this.state.travelStyle);
        bodyFormData.append('block_yn', this.state.isLock ? 'Y' : 'N');
        bodyFormData.append('latitude', this.state.location.coords.latitude);
        bodyFormData.append('longitude', this.state.location.coords.longitude);
        bodyFormData.append('money_unit', Translate('unit'));
        bodyFormData.append('cost_str', costStr);

        let numVideo = 0
        let numPhoto = 0
        this.state.resizeFileUri.map(item => {
            if (item.isMain) {
                if (item.timelineId !== '') {
                    console.log('timelineId: ', item.timelineId)
                    bodyFormData.append('position_timeline_file_id', item.timelineId)
                }
            }

            if (item.isVideo) {
                numVideo++
            } else {
                numPhoto++
            }
        })

        if (numVideo > 1) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('error_register_multiple_videos')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('error_register_multiple_videos')}`)
            return
        }

        if (numVideo > 0 && numPhoto > 0) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('video_photo_not_with')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('video_photo_not_with')}`)
            return
        }

        if (numPhoto > 5) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('photo_max_5')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('photo_max_5')}`)
            return
        }

        let totUseByte
        const totUserByte = global.disk - global.useByte
        let imgSize = 0

        let image = [...this.state.resizeFileUri].filter(item => !item.isVideo).filter(item => item.timelineId === '')
        let video = [...this.state.resizeFileUri].filter(item => item.isVideo).filter(item => item.timelineId === '')

        console.log('image: ', image)
        console.log('video: ', video)

        // 이미지, 영상 파라미터
        if (this.state.resizeFileUri.length > 0) {
            image.map((img, index) => {
                bodyFormData.append(`files[${index}]`, {
                    uri: img.src,
                    name: img.fileName,
                    type: 'image/jpg'
                });
                if (img.isMain) {
                    bodyFormData.append('position', index + 1)
                    console.log('timelineId video: ', index + 1)
                }
                imgSize += img.fileSize
            })
            video.map((video, index) => {
                bodyFormData.append(`videos[${index}]`, {
                    uri: video.src,
                    name: video.fileName,
                    type: 'video/mp4'
                });
                if (video.isMain) {
                    bodyFormData.append('position', index + 1)
                }
                imgSize += video.fileSize
            })
        }

        let deleteIndex = 0
        this.state.modiDeleteId.map(item => {
            bodyFormData.append(`timeline_file_ids[${deleteIndex}]`, item.id)
            deleteIndex++
        })

        console.log('videocheck =', video)

        let byteTxt
        if (this.state.content === this.state.modiData.contents) {
            byteTxt = 0
        } else {
            byteTxt = byteLength(this.state.content)
        }
        console.log(imgSize);
        totUseByte = imgSize + byteTxt

        // 사용 디스크 파라미터
        if (totUserByte < totUseByte) {
            this.toggleSettingModal()
            this.setState({ isLoading: false, isRegistrationOk: false })
            Toast.show(`${Translate('over_free_space')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('over_free_space')}`)
            return
        } else {
            bodyFormData.append('disk_data', totUseByte);
        }

        this.setState({ modiId: this.state.modiData.id })

        console.log('byte: ', byteTxt)

        let url = global.server + `/api/timeline/update_timeline`
        console.log(url)
        console.log('formdata: ', bodyFormData._parts[14])
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log(response.data);
                this.toggleSettingModal()
                if (response.data.result === 'ok') {
                    this.getMyInfo();
                    Toast.show(`${Translate('changedInfo')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('changedInfo')}`)
                    this.setModiAsync(false)
                    setItemToAsync('createTimeLine', true)
                    this.props.navigation.goBack();
                } else {
                    Toast.show(`${Translate('error')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('error')}`)
                }
                this.setState({ isLoading: false, isRegistrationOk: false })
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log('errorCheck', error.response.data)
                }
                else {
                    console.log('error1', error)
                }
                self.toggleSettingModal()
                self.setState({ isLoading: false, isRegistrationOk: false })
            });
    }

    hasLocationPermissionIOS = async () => {
        const openSetting = () => {
            Linking.openSettings().catch(() => {
                Alert.alert('Unable to open settings');
            });
        };
        const status = await Geolocation.requestAuthorization('whenInUse');
        console.log(status)

        if (status === 'granted') {
            return true;
        }

        if (status === 'denied') {
            Alert.alert('Location permission denied');
        }

        if (status === 'disabled') {
            Alert.alert(
                `Turn on Location Services to allow nomadnote to determine your location.`,
                '',
                [
                    { text: 'Go to Settings', onPress: openSetting },
                    { text: "Don't Use Location", onPress: () => { } },
                ],
            );
        }

        return false;
    };

    hasLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            const hasPermission = await this.hasLocationPermissionIOS();
            return hasPermission;
        }

        if (Platform.OS === 'android' && Platform.Version < 23) {
            return true;
        }

        const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasPermission) {
            return true;
        }

        const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (status === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        }

        if (status === PermissionsAndroid.RESULTS.DENIED) {
            Toast.show(`${Translate('Location permission denied by user.')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Location permission denied by user.');
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Toast.show(`${Translate('Location permission revoked by user.')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Location permission revoked by user.');
        }

        return false;
    };

    getLocationModi = async () => {
        const hasLocationPermission = await this.hasLocationPermission();

        if (!hasLocationPermission) {
            this.setState({
                place: ''
            })
            return;
        }

        let modiImg = []
        let imgId = 0
        let isModiVideo

        this.setState({
            isLoading: true,
            place: this.state.modiData.place_name,
            spendMoney: this.state.modiData.cost,
            time: this.state.modiData.duration,
            content: this.state.modiData.contents,
            isLock: this.state.modiData.block_yn === 'Y' ? true : false,
            travelStyle: this.state.modiData.style_id,
        }, () => {
            let checkIndex = 1
            if (this.state.isFirstLoading) {
                if (this.state.modiData.images.length === 0) {
                    isModiVideo = false
                    this.setState({ isSettingVideo: true })
                }
                this.state.modiData.images.forEach(item => {
                    console.log('uri: ', item)
                    modiImg.push({
                        id: 'modi_' + imgId, src: item.video_path !== null ? global.server + item.video_path : global.server + item.image_uri, isCheck: true, checkNum: checkIndex,
                        isVideo: item.video_path !== null ? true : false, fileSize: '', fileName: '', timelineId: item.id, isMain: imgId === 0 ? true : false
                    })
                    isModiVideo = item.video_path !== null ? true : false
                    imgId++
                    checkIndex++
                });
                this.setState({
                    img: modiImg,
                    isModiVideo: isModiVideo
                }, () => { this.resizeImage() })
            }
            Geolocation.getCurrentPosition(
                (position) => {
                    console.log("위치정보 반환값 :  ", position);
                    global.lat = position.coords.latitude
                    global.lon = position.coords.longitude
                    console.log('location: ', this.state.isFirstLoading)
                    this.setState({
                        location: position,
                        adminArea: this.state.modiData.place_name,
                        country: this.state.modiData.country,
                        isLoading: !this.state.isFirstLoading ? false : this.state.isSettingVideo ? false : true,
                        isFirstLoading: false,
                        isLocation: true
                    });
                },
                (error) => {
                    this.setState({ isLoading: false, isLocation: false });
                    Alert.alert(`Code ${error.code}`, error.message);
                    console.log(error);
                },
                {
                    accuracy: {
                        android: 'high',
                        ios: 'best',
                    },
                    enableHighAccuracy: this.state.highAccuracy,
                    timeout: 15000,
                    maximumAge: 10000,
                    distanceFilter: 0,
                    forceRequestLocation: this.state.forceLocation,
                    showLocationDialog: this.state.showLocationDialog,
                },
            );
        });
    };

    getLocation = async () => {
        const hasLocationPermission = await this.hasLocationPermission();

        if (!hasLocationPermission) {
            this.setState({
                isLoading: false,
                place: ''
            })
            return;
        }

        this.setState({ isLoading: true }, () => {
            Geolocation.getCurrentPosition(
                (position) => {
                    console.log('current position=', position);
                    global.lat = position.coords.latitude
                    global.lon = position.coords.longitude
                    this.setState({ location: position, isLocation: true });
                    if (!this.state.isModi) {
                        this.getCountry();
                    }
                },
                (error) => {
                    this.setState({ isLoading: false, isLocation: false });
                    this.inputPlace.focus()
                    Toast.show(`${Translate('write_your_place_info')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('write_your_place_info')}`)
                    // Alert.alert(`Code ${error.code}`, error.message);
                    console.log(error);
                },
                {
                    accuracy: {
                        android: 'high',
                        ios: 'best',
                    },
                    enableHighAccuracy: this.state.highAccuracy,
                    timeout: 10000,
                    maximumAge: 10000,
                    distanceFilter: 0,
                    forceRequestLocation: this.state.forceLocation,
                    showLocationDialog: this.state.showLocationDialog,
                },
            );
        });
    }
    getCountry() {
        // console.log('Set TransLang', setTransLang())
        Geocoder.init(GEOCODING_API_KEY, { language: setTransLang() })
        //Geocoder.init(GEOCODING_API_KEY, { language: 'ko' })
        Geocoder.from(this.state.location.coords.latitude, this.state.location.coords.longitude)
            .then(json => {
                console.log('country: ', json.results[0].address_components)
                this.setState({
                    address: json.results[0].address_components,
                }, () => {
                    Geocoder.init(GEOCODING_API_KEY, { language: 'ko' })
                    Geocoder.from(this.state.location.coords.latitude, this.state.location.coords.longitude)
                        .then(json => {
                            this.setState({
                                koCountry: json.results[0].address_components,
                            }, () => {
                                this.setPlace()
                            })
                        })
                        .catch(error => {
                            this.setState({ isLoading: false })
                            if (this.state.place === '') {
                                this.inputPlace.focus()
                                if (Platform.OS === 'ios') {
                                    Toast.show(`${Translate('write_your_place_info')}`, {
                                        duration: 2000
                                    })
                                } else {
                                    Toast.show(`${Translate('write_your_place_info')}`, {
                                        duration: 2000,
                                        position: Toast.positions.CENTER
                                    })
                                }
                                // Toast.show(`${Translate('write_your_place_info')}`)
                            }
                            console.warn(error);
                        });
                })
            })
            .catch(error => {
                this.setState({ isLoading: false })
                if (this.state.place === '') {
                    this.inputPlace.focus()
                    if (Platform.OS === 'ios') {
                        Toast.show(`${Translate('write_your_place_info')}`, {
                            duration: 2000
                        })
                    } else {
                        Toast.show(`${Translate('write_your_place_info')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                    }
                    // Toast.show(`${Translate('write_your_place_info')}`)
                }
                console.warn(error);
            });


    }

    setPlace() {
        var country = this.state.koCountry.filter(x => x.types.filter(t => t == 'country').length > 0)[0].long_name;
        var countryCode = this.state.koCountry.filter(x => x.types.filter(t => t == 'country').length > 0)[0].short_name;
        let isLocal = false
        let city
        if (this.state.address) {
            this.state.address.map((item) => {
                item.types.map((type) => {
                    // console.log('type: ', type)
                    if (type === 'locality') {
                        isLocal = true
                    }
                })
            })
            if (isLocal) {
                city = this.state.address.filter(x => x.types.filter(t => t === 'locality').length > 0)[0].long_name
            } else {
                city = this.state.address.filter(x => x.types.filter(t => t === 'administrative_area_level_1').length > 0)[0].long_name
            }
        } else {
            city = ''
        }
        console.log('real place @@@@@@@@@@@@@@ : ', city, country, countryCode);

        this.setState({
            country: country,
            countryCode: countryCode
        }, () => {
            this.checkLanguage(city)
        })
    }

    checkLanguage(city) {
        let API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}`;
        this.URL += `&q=${city}`;
        const lang = setTransLang();

        axios.post(this.URL)
            .then(function (response) {
                let data = response.data.data.detections[0]
                let checkLang = data[0].language
                console.log('checkLang =', checkLang, lang)

                if (checkLang === 'und') {
                    this.setState({
                        place: city,
                        adminArea: city,
                        isLoading: false
                    })
                } else if (global.lang == checkLang) {
                    this.setState({
                        place: city,
                        adminArea: city,
                        isLoading: false
                    })
                } else {
                    this.translate(lang, '&q=' + city, checkLang)
                }


            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                this.setState({
                    place: city,
                    adminArea: city,
                    isLoading: false
                })
            });
    }

    translate = (setLang, string_to_translate, fromLang) => {
        // if (global.lang === 'zh_rCN') {
        //     this.userLanguage = 'zh'
        // } else if (global.lang == 'zh_rTW') {
        //     this.userLanguage = 'zh-TW'
        // } else if (global.lang == 'zh-Hant-MO') {
        //     this.userLanguage = 'zh-TW'
        // } else {
        //     this.userLanguage = global.lang
        // }
        console.log('check userlang = ', setLang, fromLang)
        this.API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`;
        this.URL += `&source=${fromLang}`;
        this.URL += `&target=${setLang}`
        fetch(this.URL + string_to_translate)
            .then(res => res.json())
            .then(
                (res) => {
                    let text = res.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                    console.log('check Data', text)

                    this.setState({
                        place: text,
                        adminArea: text,
                        isLoading: false
                    })
                    console.log('check', text)
                }
            ).catch(
                (error) => {
                    this.setState({
                        place: string_to_translate,
                        adminArea: string_to_translate,
                        isLoading: false
                    })
                    console.log("There was an error: ", error);
                }
            )
    }

    componentDidMount() {
        console.log('gblang', global.lang)
        global.qId = ''
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        setItemToAsync('route_name', this.props.navigation.state.routeName)

        if (Platform.OS === 'ios') {
            this.keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => this._keyboardWillShow(e));
            this.keyboardWillHide = Keyboard.addListener('keyboardWillHide', (e) => this._keyboardWillHide(e));
        } else {
            this.keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => this._keyboardWillShow(e));
            this.keyboardDidHide = Keyboard.addListener('keyboardDidHide', (e) => this._keyboardWillHide(e));
        }
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        this.willFocusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
                if (this.state.isUserInfo) {
                    if (!this.state.isAdmin) {
                        this.setState({ isLoading: false }, () => {
                            this.toggleUserInfoModal();
                        })
                    }
                } else {
                    if (this.state.isModi) {
                        console.log('modi true')
                        if(this.state.country === ''){
                            this.getLocationModi()
                        }
                    } else {
                        console.log('modi false')
                        if(this.state.country === ''){
                            this.getLocation()
                        }
                        
                    }
                }
            }
        );
    }

    componentWillMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => { this.setState({ focus: true }) });
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { this.setState({ focus: false }) });
    }


    componentWillUnmount() {

        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();

        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        if (Platform.OS === 'ios') {
            this.keyboardWillShow.remove();
            this.keyboardWillHide.remove();
        } else {
            this.keyboardDidShow.remove();
            this.keyboardDidHide.remove();
        }

        this.willFocusSubscription.remove();
    }

    handleBackButton = async () => {
        const routeName = getItemFromAsync('route_name')
        console.log('route name: ', this.props.navigation.state.routeName)
        if (this.props.navigation.isFocused()) {
            if (this.state.isMoveScreen) {
                console.log('not move')
                this.setState({ isMoveScreen: false })
                return true
            } else {
                console.log('move')
                this.setModiAsync(true)
                this.props.navigation.goBack();
                this.setState({
                    title: false
                })
                return false;
            }
        }
    };

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    _keyboardWillShow(e) {
        let newSize
        let newInputSize
        console.log('androidInitContentHeight: ', this.state.androidInitContentHeight);
        // if (Platform.OS === 'ios') {
        //     newSize = this.state.visibleHeight + e.endCoordinates.height - (isIphoneX() ? 35 : 15);
        //     newInputSize = this.state.initContentHeight - (this.state.visibleHeight + e.endCoordinates.height + (SCREEN_HEIGHT * 0.008 * 2) - (isIphoneX() ? 35 : 15));
        // } else {
        //     newSize = this.state.visibleHeight
        //     newInputSize = this.state.initContentHeight - (this.state.visibleHeight + e.endCoordinates.height + (SCREEN_HEIGHT * 0.008 * 2) + 35)
        // }
        if (Platform.OS === 'ios') {
            newSize = this.state.visibleHeight
            newInputSize = (this.state.initContentHeight - (e.endCoordinates.height) + (isIphoneX() ? 35 - SCREEN_HEIGHT * 0.03 : 15 - SCREEN_HEIGHT * 0.05));
        } else {
            newSize = this.state.visibleHeight
            newInputSize = (this.state.initContentHeight - (e.endCoordinates.height)) - SCREEN_HEIGHT * 0.03
        }
        console.log('visibleHeight: ', newSize, newInputSize)
        this.setState({
            visibleHeight: newSize, contentHeight: newInputSize,
            contentHideHeight: this.state.visibleHeight + (SCREEN_HEIGHT * 0.008 * 2),
            contentPaddingTop: 10,
            contentPaddingBottom: 10
        });
    }

    _keyboardWillHide(e) {
        let hideKeyboardContentHeight
        // if (Platform.OS === 'ios') {
        //     hideKeyboardContentHeight = this.state.initContentHeight - this.state.contentHideHeight;
        // } else {
        //     hideKeyboardContentHeight = this.state.androidInitContentHeight - this.state.contentHideHeight
        // }
        if (Platform.OS === 'ios') {
            hideKeyboardContentHeight = this.state.initContentHeight - this.state.contentHideHeight;
        } else {
            hideKeyboardContentHeight = this.state.androidInitContentHeight - this.state.contentHideHeight
        }

        console.log('hide keyboard height: ', hideKeyboardContentHeight);
        this.setState({
            visibleHeight: SCREEN_WIDTH * 0.275 * 0.95, contentHeight: hideKeyboardContentHeight,
            contentPaddingTop: SCREEN_HEIGHT * 0.028, contentPaddingBottom: SCREEN_WIDTH * 0.2
        });
    }

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        console.log('contentInput: ', height)
        if (Platform.OS === 'ios') {
            this.setState({ initContentHeight: height })
        } else {
            if (this.state.isFirstContent) {
                this.setState({ isFirstContent: false, androidInitContentHeight: height, initContentHeight: height })
            } else {
                this.setState({ initContentHeight: height })
            }
        }
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
            Toast.show(`${Translate('Image registration permission denied by user.')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('Image registration permission denied by user.');
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Toast.show(`${Translate('Image registration permission revoked by user.')}`, {
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
        this.setState({ isMoveScreen: true })
        navigation.navigate('Picker', {
            onSelect: this.onSelect,
            resizeFileUri: this.state.resizeFileUri,
            img: this.state.img
        })
    }

    setModiAsync(isBack) {
        if (this.state.isModi) {
            if (isBack) {
                setItemToAsync('write', 'back')
                setItemToAsync('scrap_write', 'back')
                setItemToAsync('my_timeline_write', 'back')
                setItemToAsync('visit_write', 'back')
                setItemToAsync('map_write', 'back')
                setItemToAsync('route_name', this.props.navigation.state.routeName)
            } else {
                setItemToAsync('write', 'modi')
                setItemToAsync('scrap_write', 'modi')
                setItemToAsync('my_timeline_write', 'modi')
                setItemToAsync('visit_write', 'modi')
                setItemToAsync('map_write', 'modi')
                setItemToAsync('modi_id', this.state.modiId)
                setItemToAsync('route_name', this.props.navigation.state.routeName)
            }
        }
    }

    onSelect = data => {
        this.setState(data);
    };

    // launchImageLibrary = (index) => {
    //     let options = {
    //         mediaType: 'photo',
    //         includeBase64: true,
    //         videoQuality: 'high',
    //     }

    //     ImagePicker.launchImageLibrary(options, (response) => {
    //         console.log('Response = ', response);

    //         if (response.didCancel) {
    //             console.log('User cancelled image picker');
    //             this.setState({ isLoading: false })
    //         } else if (response.error) {
    //             console.log('ImagePicker Error: ', response.error);
    //             this.setState({ isLoading: false })
    //         } else if (response.customButton) {
    //             console.log('User tapped custom button: ', response.customButton);
    //             alert(response.customButton);
    //             this.setState({ isLoading: false })
    //         } else {
    //             // const source = { uri: response.uri };

    //             // let imgUri
    //             let arrImg = [...this.state.img]
    //             if (index === 0) {
    //                 // imgUri = this.state.img.concat({ url: { uri: 'data:image/jpeg;base64,' + response.base64 }, id: this.state.img.length })
    //                 arrImg = this.state.img.concat({ url: { uri: 'data:image/jpeg;base64,' + response.base64 }, id: this.state.img.length })
    //             } else {
    //                 // imgUri = this.state.img.map((img) => {
    //                 //     img.id === index ? { ...img, url: { uri: 'data:image/jpeg;base64,' + response.base64 } } : img
    //                 // })
    //                 arrImg[index].url = { uri: 'data:image/jpeg;base64,' + response.base64 }
    //             }
    //             this.setState({
    //                 filePath: response,
    //                 fileData: response.data,
    //                 fileUri: response.uri,
    //                 img: arrImg,
    //                 isClickImg: true,
    //                 isLoading: false
    //             });

    //             this.resizeImage(index)
    //         }
    //     });
    // }

    async resizeImage() {
        let index = 0
        let arrResizeUri = [...this.state.resizeFileUri]
        let imgVideo = [...this.state.img]
        console.log('imgVideo =',)
        for (const item of this.state.img) {
            if (!item.isVideo) {
                await ImageResizer.createResizedImage(item.src, 1920, 1920, 'JPEG', 100)
                    .then(response => {
                        arrResizeUri = arrResizeUri.concat({ src: response.uri, fileSize: response.size, id: index, isVideo: false, fileName: response.name, timelineId: item.timelineId, isMain: index === 0 ? true : false })
                        this.setState({
                            resizeFileUri: arrResizeUri,
                        }, () => {
                            if (index === this.state.img.length - 1) {
                                this.setState({ isLoading: false, isSettingVideo: true })
                            }
                        })
                        index++
                    })
                    .catch(err => {
                        console.log(err)
                        this.setState({ isLoading: false, isSettingVideo: true })
                    });
            } else {
                const fileName = item.src.split('/').pop()
                const destPath = RNFetchBlob.fs.dirs.DocumentDir + '/' + fileName;
                console.log('destPath: ', destPath)
                const config = {
                    fileCache: true,
                    path: destPath,
                };
                await RNFetchBlob.config(config)
                    .fetch('GET', item.src)
                    .then((res) => {
                        console.log('res: ', res.path())
                        this.setState({ videoList: res.path() }, async () => {
                            await RNFetchBlob.fs.stat(this.state.videoList)
                                .then(async (stats) => {
                                    console.log('stats', stats, this.state.isLoading)
                                    for (var i = 0; i < imgVideo.length; i++) {
                                        if (imgVideo[i].timelineId === item.timelineId) {
                                            if (Platform.OS === 'ios') {
                                                // const result = await ProcessingManager.compress(`file://${stats.path}`, {
                                                //     width: SCREEN_WIDTH,
                                                //     height: SCREEN_HEIGHT,
                                                //     bitrateMultiplier: 7,
                                                //     minimumBitrate: 300000
                                                // });
                                                // console.log('compress result: ', result.split('file://').pop())

                                                // imgVideo[i].src = stats.path.split('file://').pop()
                                                arrResizeUri = arrResizeUri.concat({ src: `file://${stats.path}`, fileSize: stats.size, id: index, isVideo: true, fileName: stats.filename, timelineId: item.timelineId, isMain: index === 0 ? true : false })
                                                this.setState({
                                                    resizeFileUri: arrResizeUri,
                                                    img: imgVideo,
                                                    isSettingVideo: true
                                                }, this.setState({
                                                    isLoading: false
                                                }))
                                                index++
                                            } else {
                                                imgVideo[i].src = `file://${stats.path}`
                                                arrResizeUri = arrResizeUri.concat({ src: `file://${stats.path}`, fileSize: stats.size, id: index, isVideo: true, fileName: stats.filename, timelineId: item.timelineId, isMain: index === 0 ? true : false })
                                                this.setState({
                                                    resizeFileUri: arrResizeUri,
                                                    img: imgVideo,
                                                    isSettingVideo: true
                                                }, this.setState({
                                                    isLoading: false
                                                }))
                                                index++
                                            }
                                        }
                                    }

                                })
                                .catch((err) => {
                                    console.log('error =', err)
                                    this.setState({ isLoading: false, isSettingVideo: true })
                                })
                        })
                    })
            }
        }
    }

    handleLoad = (meta) => {
        this.setState({
            duration: meta.duration
        }, () => {
            console.log('du?', this.state.duration)
        })
    }
    handleProgress = (progress) => {
        var pg = parseFloat(progress.currentTime / this.state.duration)
        if (pg > 0.92) {
            pg = 1
        }

        this.setState({
            progress: pg
        }, () => {
            console.log('check', this.state.progress)
        });
    }

    handleEnd = () => {
        this.setState({ paused: true }, () => this.player.seek(0))
    }

    toggleSettingModal() {
        this.setState({
            isModal: !this.state.isModal
        })
    }

    toggleUserInfoModal() {
        this.setState({
            isUserInfoModal: !this.state.isUserInfoModal
        })
    }

    showActionSheet = () => {
        this.ActionSheet.show();
    }

    deleteImg() {
        let deleteResizeFile = [...this.state.resizeFileUri]
        let deleteFile = [...this.state.img]
        let deleteId = [...this.state.modiDeleteId]
        let deleteResizeMain
        let deleteMain

        if (deleteResizeFile[selectIndex].timelineId !== '') {
            deleteId = deleteId.concat({ id: deleteResizeFile[selectIndex].timelineId })
            this.setState({ modiDeleteId: deleteId })
        }

        deleteResizeMain = deleteResizeFile.filter(item => item.id === selectIndex)[0].isMain
        deleteMain = deleteFile.filter(item => item.checkNum === selectIndex + 1)[0].isMain
        deleteResizeFile = deleteResizeFile.filter(item => item.id !== selectIndex)
        deleteFile = deleteFile.filter(item => item.checkNum !== selectIndex + 1)

        console.log('delete main: ', deleteResizeMain, deleteMain)

        for (var i = 0; i < deleteResizeFile.length; i++) {
            if (deleteResizeFile[i].id > selectIndex) {
                deleteResizeFile[i].id = deleteResizeFile[i].id - 1
            }
            if (deleteResizeMain) {
                if (i === 0) {
                    deleteResizeFile[i].isMain = true
                }
            }
        }

        for (var i = 0; i < deleteFile.length; i++) {
            if (deleteFile[i].checkNum > selectIndex + 1) {
                deleteFile[i].checkNum = deleteFile[i].checkNum - 1
            }
            if (deleteMain) {
                if (i === 0) {
                    deleteFile[i].isMain = true
                }
            }
        }

        this.setState({
            resizeFileUri: deleteResizeFile,
            img: deleteFile,
        })
    }

    changeMainImg() {
        let changeResizeFile = [...this.state.resizeFileUri]
        let changeFile = [...this.state.img]
        let changeId = [...this.state.modiDeleteId]

        for (var i = 0; i < changeResizeFile.length; i++) {
            changeResizeFile[i].isMain = false
        }

        for (var i = 0; i < changeFile.length; i++) {
            changeFile[i].isMain = false
        }

        changeResizeFile[selectIndex].isMain = true
        changeFile[selectIndex].isMain = true

        this.setState({
            resizeFileUri: changeResizeFile,
            img: changeFile,
        })
    }

    readyToGoPicker() {
        if (this.state.img.length === this.state.resizeFileUri.length) {
            return true
        } else {
            Toast.show(`파일 로딩 중 입니다.`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`파일 로딩 중 입니다.`);
            return false
        }
    }

    // contentInputFocused() {
    //     //do your stuff here. scroll screen up
    //     const scrollResponder = this.writeScroll.getScrollResponder();
    //     const inputHandle = React.findNodeHandle(this.inputContent)

    //     scrollResponder.scrollResponderScrollNativeHandleToKeyboard(
    //         inputHandle, // The TextInput node handle
    //         0, // The scroll view's bottom "contentInset" (default 0)
    //         true // Prevent negative scrolling
    //     );
    // }

    handleFocus = () => {
        this.setState({
            focus: true
        })

    }
    onHour = sel => {
        console.log('SEL !!!!!!!!!', sel)
        this.setState({ hourSelected: sel })
    }
    onMin = sel => {
        this.setState({ minSelected: sel })
    }


    openStartDialog = show => {
        this.setState({ showStartDialog: show });
    }




    saveTime(Type) {
        console.log('check start', this.state.endH, this.state.endM)
        this.setStartTimeEndTime(Type)
    }

    setTime(hour, min) {
        hour = hour + 1
        if (hour < 10) {
            if (min < 10) {
                this.setState({
                    time: '0' + hour + ':' + '0' + min
                })
            } else {
                this.setState({
                    time: '0' + hour + ':' + min
                })
            }
        } else {
            if (min < 10) {
                this.setState({
                    time: hour + ':' + '0' + min
                })
            } else {
                this.setState({
                    time: hour + ':' + min
                })
            }
        }
    }




    render() {
        console.log('IMG LENGTH ::: ',this.state.img.length)
        console.log('RESIZEFILEURL LENGTH ::: ',this.state.resizeFileUri.length)
        // console.log('RESIZEFILE URL ::::' , this.state.resizeFileUri)

        const { navigation } = this.props;
        const { isLoading, isModal, isUserInfoModal } = this.state;
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
                                registrationWidth={'100%'}
                                registrationHeight={'100%'}
                                title={this.state.isReply ? Translate('reply') : Translate('createnote')}
                                onBackPress={() => {
                                    this.setModiAsync(true)
                                    navigation.goBack();
                                    this.setState({
                                        title: false
                                    })
                                }}
                                onRegiPress={() => {
                                    this.toggleSettingModal();
                                }} />
                            <ScrollView
                                style={{ display: 'flex' }}
                                horizontal={false}
                                ref={(scroll) => { this.writeScroll = scroll; }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ flexGrow: 1 }}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={styles.settingContainer}>
                                        <View style={styles.settingTimeContainer}>
                                            {
                                                global.lang === 'ko' ?
                                                    <Text style={styles.writeTimeText}>{`${Translate('activity_write_note')}: ${Moment(this.state.currentTime).format('YYYY.MM.DD A hh:mm')}`}</Text>
                                                    :
                                                    <Text style={styles.writeTimeText}>{`${Translate('activity_write_note')}: ${Moment(this.state.currentTime).format('YYYY.MM.DD hh:mm A')}`}</Text>
                                            }
                                            <TouchableWithoutFeedback
                                                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                                onPress={() => {
                                                    this.state.isLock ? this.setState({ isLock: false }) : this.setState({ isLock: true })
                                                }}>
                                                <Image
                                                    style={styles.lockImg}
                                                    source={this.state.isLock ? require('../../images/lock_icon.png') : require('../../images/shield.png')} />
                                            </TouchableWithoutFeedback>
                                        </View>
                                        <View style={styles.inputInfoContainer}>
                                            <View style={{ flex: 210, flexDirection: 'row', alignItems: 'flex-end' }}>
                                                <View style={styles.placeContainer}>
                                                    <View style={{ flex: 1 }}>
                                                    </View>
                                                    <Text style={styles.inputInfoTitleText}>{Translate('activity_write_location')}</Text>
                                                    <View style={{ marginTop: 4, width: '100%', borderRadius: 2, justifyContent: 'flex-end', alignItems: 'stretch', overflow: 'hidden', flex: 0.01 }}>
                                                        <InsetShadow
                                                            shadowRadius={2}>
                                                            <TextInput
                                                                ref={(input) => { this.inputPlace = input; }}
                                                                style={styles.input}
                                                                value={this.state.place}
                                                                underlineColorAndroid="transparent"
                                                                autoCapitalize="none"
                                                                returnKeyType="next"
                                                                onChangeText={(text) => this.setState({ place: text }, () => {
                                                                    console.log('check place name:', this.state.place)
                                                                })}
                                                                onSubmitEditing={() => { this.inputCurrentTime.focus(); }} />
                                                        </InsetShadow>
                                                    </View>
                                                    <View></View>
                                                </View>
                                                <View style={styles.spendTimeContainer}>
                                                    <View style={{ flex: 1 }}>

                                                    </View>
                                                    <Text style={styles.inputInfoTitleText}>{Translate('activity_write_time')}</Text>
                                                    {/* <View style={{ marginTop: 4, width: '100%', borderRadius: 2, justifyContent: 'flex-end', alignItems: 'stretch', overflow: 'hidden', flex: 0.01 }}>
                                                        <InsetShadow
                                                            shadowRadius={2}>
                                                            <TextInput
                                                                ref={(input) => { this.inputCurrentTime = input; }}
                                                                style={styles.input}
                                                                value={this.state.time}
                                                                underlineColorAndroid="transparent"
                                                                keyboardType={'numbers-and-punctuation'}
                                                                autoCapitalize="none"
                                                                onChangeText={(text) => this.setState({ time: text })}
                                                                onSubmitEditing={() => { this.inputSpendMoney.focus(); }} />
                                                        </InsetShadow>
                                                    </View> */}
                                                    <View style={{ marginTop: 4, width: '100%', borderRadius: 2, overflow: 'hidden', flex: 0.01 }}>
                                                        <TouchableOpacity
                                                            onPress={() =>
                                                                this.openStartDialog(true)
                                                            }
                                                        >
                                                            <View style={{}}>
                                                                <InsetShadow
                                                                    shadowRadius={2}
                                                                >
                                                                    {Platform.OS === 'ios' ?
                                                                        <Text
                                                                            ref={(input) => { this.inputCurrentTime = input }}
                                                                            style={styles.timeText}
                                                                            autoCapitalize="none"
                                                                        >
                                                                            {this.state.time}
                                                                        </Text>
                                                                        :
                                                                        <TextInput
                                                                            ref={(input) => { this.inputCurrentTime = input }}
                                                                            style={styles.timeText}
                                                                            autoCapitalize="none"
                                                                            editable={false}
                                                                        >
                                                                            {this.state.time}
                                                                        </TextInput>
                                                                    }
                                                                    <Image
                                                                        style={{ width: 10, height: 10, position: 'absolute', right: SCREEN_WIDTH * 0.0211, top: SCREEN_HEIGHT * 0.015 }}
                                                                        source={require('../../images/down_arrow.png')}>
                                                                    </Image>
                                                                </InsetShadow>
                                                            </View>
                                                        </TouchableOpacity>
                                                        <Dialog
                                                            title={Translate('activity_write_time')}
                                                            animationType="fade"
                                                            contentStyle={{
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#fff',
                                                            }}
                                                            titleStyle={{ textAlign: 'left', fontSize: 16 }}
                                                            dialogStyle={{ backgroundColor: '#fff' }}
                                                            onTouchOutside={() => this.openStartDialog(false)}
                                                            visible={this.state.showStartDialog}
                                                        >
                                                            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                                                                <WheelPicker
                                                                    style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                                    selectedItem={this.state.hourSelected}
                                                                    data={Hour}
                                                                    onItemSelected={this.onHour}
                                                                />
                                                                <WheelPicker
                                                                    style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                                    selectedItem={this.state.minSelected}
                                                                    data={Min}
                                                                    onItemSelected={this.onMin}
                                                                />
                                                            </View>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    this.setTime(this.state.hourSelected, this.state.minSelected)
                                                                    this.openStartDialog(false);
                                                                }}
                                                                style={{
                                                                    marginTop: 10,
                                                                    marginLeft: 28,
                                                                    marginRight: 27,
                                                                    width: 220,
                                                                    height: 48,
                                                                    borderRadius: 5,
                                                                    backgroundColor: '#ff5d46',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Text style={{ fontSize: 16, color: '#fff' }}>{Translate('confirm')}</Text>
                                                            </TouchableOpacity>
                                                        </Dialog>
                                                    </View>

                                                </View>
                                                <View style={styles.spendMoneyContainer}>
                                                    <Text
                                                        adjustsFontSizeToFit
                                                        style={styles.inputInfoTitleText}>{Translate('activity_write_spent')}</Text>
                                                    <View style={{ marginTop: 4, width: '100%', borderRadius: 2, justifyContent: 'flex-end', alignItems: 'stretch', overflow: 'hidden', flex: 0.01 }}>
                                                        <InsetShadow
                                                            shadowRadius={2}>
                                                            <View style={{ justifyContent: 'center', position: 'relative', flex: 1, }}>
                                                                <TextInput
                                                                    ref={(input) => { this.inputSpendMoney = input; }}
                                                                    style={styles.spendMoneyInput}
                                                                    underlineColorAndroid="transparent"
                                                                    autoCapitalize="none"
                                                                    keyboardType={'number-pad'}
                                                                    returnKeyType="done"
                                                                    placeholder='0'
                                                                    maxLength={9}
                                                                    value={this.state.spendMoney.toString()}
                                                                    onChangeText={(text) => this.setState({ spendMoney: text })} />
                                                                <View style={{ position: 'absolute', alignSelf: 'flex-end' }}>
                                                                    <Text style={styles.unit}>{Translate('unit')}</Text>
                                                                </View>
                                                            </View>
                                                        </InsetShadow>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.typeButtonContainer}>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ travelStyle: 1 })
                                                }}>
                                                <View style={this.state.travelStyle === 1 ? styles.selectedView : styles.typeView}>
                                                    <Text style={this.state.travelStyle === 1 ? styles.selectedTypeButton : styles.typeButton}
                                                        adjustsFontSizeToFit
                                                        numberOfLines={2}>{Translate('activity_write_healing')}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ travelStyle: 2 })
                                                }}>
                                                <View style={this.state.travelStyle === 2 ? styles.selectedMarginView : styles.typeMarginView}>
                                                    <Text style={this.state.travelStyle === 2 ? styles.selectedTypeButton : styles.typeButton}
                                                        adjustsFontSizeToFit
                                                        numberOfLines={2}>{Translate('activity_write_hotplace')}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ travelStyle: 3 })
                                                }}>
                                                <View style={this.state.travelStyle === 3 ? styles.selectedMarginView : styles.typeMarginView}>
                                                    <Text style={this.state.travelStyle === 3 ? styles.enSelectedTypeButton : styles.enTypeButton}
                                                        adjustsFontSizeToFit
                                                        numberOfLines={2}>{Translate('traditional_market')}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ travelStyle: 4 })
                                                }}>
                                                <View style={this.state.travelStyle === 4 ? styles.selectedMarginView : styles.typeMarginView}>
                                                    <Text style={this.state.travelStyle === 4 ? styles.selectedTypeButton : styles.typeButton}
                                                        adjustsFontSizeToFit
                                                        numberOfLines={2}>{Translate('historicalstyle')}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ travelStyle: 5 })
                                                }}>
                                                <View style={this.state.travelStyle === 5 ? styles.selectedMarginView : styles.typeMarginView}>
                                                    <Text style={this.state.travelStyle === 5 ? styles.selectedTypeButton : styles.typeButton}
                                                        adjustsFontSizeToFit
                                                        numberOfLines={3}>{Translate('museumstyle')}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                            <TouchableWithoutFeedback
                                                onPress={() => {
                                                    this.setState({ travelStyle: 6 })
                                                }}>
                                                <View style={this.state.travelStyle === 6 ? styles.selectedMarginView : styles.typeMarginView}>
                                                    <Text style={this.state.travelStyle === 6 ? styles.selectedTypeButton : styles.typeButton}
                                                        adjustsFontSizeToFit
                                                        numberOfLines={3}>{Translate('artmuseumstyle')}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>

                                    <View
                                        style={styles.inputTextContainer}
                                        onLayout={event => { this.find_dimesions(event.nativeEvent.layout) }}>
                                        <TextInput
                                            ref={(input) => { this.inputContent = input; }}
                                            style={{
                                                width: '100%',
                                                textAlignVertical: 'top',
                                                paddingHorizontal: SCREEN_WIDTH * 0.0556,
                                                paddingTop: this.state.contentPaddingTop,
                                                paddingBottom: this.state.contentPaddingBottom,
                                                color: '#000',
                                                fontSize: normalize(12),
                                                height: this.state.contentHeight,
                                            }}
                                            underlineColorAndroid="transparent"
                                            autoCapitalize="none"
                                            returnKeyType="default"
                                            placeholder={Translate('entertext')}
                                            placeholderTextColor="#878787"
                                            multiline={true}
                                            value={this.state.content}
                                            textAlignVertical="top"
                                            onChangeText={(text) => this.setState({ content: text })} >
                                        </TextInput>
                                        {
                                            this.state.focus === true && <KeyboardAvoidingView style={styles.downbackground} >
                                                <Image
                                                    style={styles.downImg}
                                                    source={require('../../images/keyboard_down.png')}
                                                />
                                            </KeyboardAvoidingView>
                                        }
                                    </View>
                                </View>
                            </ScrollView>

                            <ScrollView style={{
                                position: 'absolute',
                                bottom: 0,
                                alignSelf: 'flex-start',
                            }}
                                horizontal={true}
                                contentContainerStyle={{ flexGrow: 1 }}>
                                <View style={{
                                    flexDirection: 'row',
                                    marginBottom: SCREEN_HEIGHT * 0.008,
                                    height: this.state.visibleHeight,
                                }}>
                                    < TouchableWithoutFeedback
                                        onPress={() => {
                                            // this.setState({ isLoading: true })
                                            // this.launchImageLibrary(index);
                                            if (this.readyToGoPicker()) {
                                                this.openPicker(navigation);
                                            }
                                        }}>
                                        <Image style={{
                                            width: SCREEN_WIDTH * 0.275,
                                            height: SCREEN_WIDTH * 0.275 * 0.95,
                                            borderRadius: 4,
                                            overflow: "hidden",
                                            resizeMode: 'stretch',
                                            marginLeft: SCREEN_WIDTH * 0.01389,
                                        }}
                                            source={require('../../images/imgcopy.png')} />
                                    </TouchableWithoutFeedback>
                                    {
                                        this.state.img.map((img, index) => {
                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => {
                                                        selectIndex = index;
                                                        this.showActionSheet();
                                                    }}>
                                                    {
                                                        (img.timelineId !== '' && Platform.OS === 'ios') ?
                                                            <View style={index === (this.state.img.length - 1) ? styles.viewLastContainer : styles.viewContainer}>
                                                                {
                                                                    img.isVideo ?
                                                                        <Video source={{ uri: img.src }}
                                                                            ref={(ref) => {
                                                                                this.player = ref
                                                                            }}
                                                                            muted={true}
                                                                            onBuffer={this.onBuffer}
                                                                            paused={true}
                                                                            resizeMode='cover'
                                                                            onError={this.videoError}
                                                                            style={{ width: '100%', height: '100%' }} />
                                                                        : <Image style={styles.imgLastContainer}
                                                                            source={{ uri: img.src }} />
                                                                }

                                                                {
                                                                    img.isVideo && <Image style={{ width: '20%', height: '20%', resizeMode: 'contain', position: 'absolute', bottom: 0, left: 0, marginLeft: 4, marginBottom: 1 }}
                                                                        source={require('../../images/video.png')} />
                                                                }
                                                                {
                                                                    img.isMain && <Text style={{
                                                                        fontSize: normalize(8), padding: 2, color: '#fff', backgroundColor: '#638d96', position: 'absolute',
                                                                        top: 0, left: 0, marginLeft: 3, marginTop: 3, borderRadius: 2
                                                                    }}>{Translate('item_mainimage')}</Text>
                                                                }
                                                            </View> :
                                                            <View style={index === (this.state.img.length - 1) ? styles.viewLastContainer : styles.viewContainer}>
                                                                <Image style={styles.imgLastContainer}
                                                                    source={{ uri: img.src }} />
                                                                {
                                                                    img.isVideo && <Image style={{ width: '20%', height: '20%', resizeMode: 'contain', position: 'absolute', bottom: 0, left: 0, marginLeft: 4, marginBottom: 1 }}
                                                                        source={require('../../images/video.png')} />
                                                                }
                                                                {
                                                                    img.isMain && <Text style={{
                                                                        fontSize: normalize(8), padding: 2, color: '#fff', backgroundColor: '#638d96', position: 'absolute',
                                                                        top: 0, left: 0, marginLeft: 3, marginTop: 3, borderRadius: 2
                                                                    }}>{Translate('item_mainimage')}</Text>
                                                                }
                                                            </View>
                                                    }
                                                    {/* <View style={index === (this.state.img.length - 1) ? styles.viewLastContainer : styles.viewContainer}>
                                                    <Image style={styles.imgLastContainer}
                                                        source={{ uri: img.src }} />
                                                    {
                                                        img.isVideo && <Image style={{ width: '20%', height: '20%', resizeMode: 'contain', position: 'absolute', bottom: 0, left: 0, marginLeft: 4, marginBottom: 1 }}
                                                            source={require('../../images/video.png')} />
                                                    }
                                                    {
                                                        (index === 0) && <Text style={{
                                                            fontSize: normalize(8), padding: 2, color: '#fff', backgroundColor: '#638d96', position: 'absolute',
                                                            top: 0, left: 0, marginLeft: 3, marginTop: 3, borderRadius: 2
                                                        }}>{Translate('item_mainimage')}</Text>
                                                    }
                                                </View> */}
                                                </TouchableOpacity>
                                            );
                                        })
                                    }
                                </View>
                            </ScrollView>
                            {
                                isModal && <WriteModal
                                    modalHandler={() => this.toggleSettingModal()}
                                    content={Translate('builderwanttopost')}
                                    yes={Translate('builderyes')}
                                    no={Translate('builderno')}
                                    onPressOk={() => {
                                        if (!this.state.isLocation) {
                                            Toast.show(`${Translate('message_receive_location')}`, {
                                                duration: 2000,
                                                position: Toast.positions.CENTER
                                            })
                                            // Toast.show(`${Translate('message_receive_location')}`)
                                            this.getLocation();
                                        } else {
                                            if (this.state.isRegistrationOk) {
                                                Toast.show(`${Translate('registering')}`, {
                                                    duration: 2000,
                                                    position: Toast.positions.CENTER
                                                })
                                                // Toast.show(`${Translate('registering')}`)
                                                return
                                            } else {
                                                this.setState({ isLoading: true, isRegistrationOk: true }, () => {
                                                    this.state.isModi ? this.modification() : this.registration();
                                                })
                                            }
                                        }
                                    }}
                                    onPressNo={() => { this.toggleSettingModal() }}
                                />
                            }
                            {
                                isUserInfoModal && <WriteModal
                                    modalHandler={() => {
                                        this.toggleUserInfoModal();
                                        navigation.goBack();
                                    }}
                                    content={Translate('message_modi_user_info')}
                                    yes={Translate('builderyes')}
                                    no={Translate('builderno')}
                                    onPressOk={() => {
                                        navigation.replace('ModiUserInfo');
                                    }}
                                    onPressNo={() => {
                                        this.toggleUserInfoModal();
                                        navigation.goBack();
                                    }}
                                />
                            }
                            <ActionSheet
                                ref={o => (this.ActionSheet = o)}
                                options={[Translate('change_mainimage'), Translate('delete_message'), Translate('cancel')]}
                                cancelButtonIndex={2}
                                destructiveButtonIndex={2}
                                onPress={index => {
                                    if (this.readyToGoPicker()) {
                                        if (index == 0) {
                                            if (this.state.img.length)
                                                this.changeMainImg();
                                        } else if (index == 1) {
                                            this.deleteImg();
                                        }
                                    }
                                }} />
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
    topSafeArea: {
        flex: 0,
        backgroundColor: THEME_COLOR
    },
    bottomSafeArea: {
        flex: 1,
        backgroundColor: THEME_COLOR
    },
    settingContainer: {
        backgroundColor: 'rgba(222, 230, 232, 1)'
    },
    settingTimeContainer: {
        flexDirection: 'row',
        marginHorizontal: SCREEN_WIDTH * 0.05,
        marginTop: SCREEN_HEIGHT * 0.03125,
        marginBottom: SCREEN_HEIGHT * 0.0172,
        justifyContent: 'space-between',
    },
    inputTextContainer: {
        backgroundColor: '#fff',
        flex: 1,
        flexDirection: 'column'

    },
    inputInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
        flex: 1,
        marginHorizontal: SCREEN_WIDTH * 0.05,
        marginBottom: SCREEN_HEIGHT * 0.0078,
    },
    typeButtonContainer: {
        flex: 1,
        bottom: 0,
        marginHorizontal: SCREEN_WIDTH * 0.05,
        marginBottom: SCREEN_HEIGHT * 0.019,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    imgButtonContainer: {
        position: 'absolute',
        alignSelf: 'flex-start',
        bottom: 0,
        flexDirection: 'row',
        marginBottom: SCREEN_HEIGHT * 0.00781,
        marginLeft: SCREEN_WIDTH * 0.01389
    },
    placeContainer: {
        flex: 130,
        alignItems: 'flex-start',
        justifyContent: 'flex-end'
    },
    spendTimeContainer: {
        flex: 80,
        alignItems: 'flex-start',
        marginLeft: SCREEN_WIDTH * 0.015,
        justifyContent: 'flex-end'
    },
    spendMoneyContainer: {
        flex: 103,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        marginLeft: SCREEN_WIDTH * 0.015,
        justifyContent: 'flex-end',
    },
    viewContainer: {
        width: SCREEN_WIDTH * 0.275,
        height: SCREEN_WIDTH * 0.275 * 0.95,
        borderRadius: 4,
        marginLeft: SCREEN_WIDTH * 0.01389,
    },
    viewLastContainer: {
        width: SCREEN_WIDTH * 0.275,
        height: SCREEN_WIDTH * 0.275 * 0.95,
        marginLeft: SCREEN_WIDTH * 0.01389,
        marginRight: SCREEN_WIDTH * 0.01389,
        borderRadius: 4,
        overflow: "hidden",
    },
    imgContainer: {
        width: 110,
        height: 120,
        borderRadius: 4,
        overflow: "hidden",
        resizeMode: 'stretch',
        marginLeft: SCREEN_WIDTH * 0.01389,
    },
    imgLastContainer: {
        width: '100%',
        height: '100%',
        borderRadius: Platform.OS === 'ios' ? 6 : 8,
        resizeMode: 'cover',
        position: 'absolute'
    },
    writeTimeText: {
        fontSize: normalize(11),
        color: '#4a4a4a',
        fontWeight: 'bold',
        textAlign: 'left'
    },
    lockImg: {
        width: SCREEN_WIDTH * 0.039,
        height: SCREEN_HEIGHT * 0.02,
        resizeMode: 'contain'
    },
    downImg: {
        width: SCREEN_WIDTH * 0.03,
        height: SCREEN_HEIGHT * 0.03,
        resizeMode: 'contain',
        borderColor: '#fff',
        alignItems: 'center',
    },
    downbackground: {
        backgroundColor: 'rgba(222, 230, 232, 1)',
        justifyContent: 'center',
        alignItems: 'center',
        height: SCREEN_HEIGHT * 0.03,
        borderTopLeftRadius: SCREEN_HEIGHT * 0.02,
        borderTopRightRadius: SCREEN_HEIGHT * 0.02,
        paddingBottom: 0
    },
    inputInfoTitleText: {
        fontSize: normalize(10),
        color: '#878787',
        fontWeight: '400',
        marginLeft: SCREEN_WIDTH * 0.019,
        flexWrap: 'wrap',
    },
    input: {
        width: '100%',
        paddingVertical: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.009375 : SCREEN_HEIGHT * 0.00469,
        paddingLeft: SCREEN_WIDTH * 0.0194,
        paddingRight: SCREEN_WIDTH * 0.062,
        marginRight: SCREEN_WIDTH * 0.0111,
        backgroundColor: '#fff',
        borderRadius: 0,
        fontSize: normalize(12),
        color: '#4a4a4a',
        fontWeight: '400',
    },
    timeText: {
        width: '100%',
        paddingVertical: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.009375 : SCREEN_HEIGHT * 0.00469,
        paddingLeft: SCREEN_WIDTH * 0.0194,
        paddingRight: SCREEN_WIDTH * 0.062,
        marginRight: SCREEN_WIDTH * 0.0111,
        backgroundColor: '#fff',
        borderRadius: 0,
        fontSize: normalize(12),
        color: '#4a4a4a',
        fontWeight: '400',
    },

    spendMoneyInput: {
        width: '100%',
        paddingVertical: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.0092 : SCREEN_HEIGHT * 0.00469,
        paddingLeft: SCREEN_WIDTH * 0.0194,
        paddingRight: SCREEN_WIDTH * 0.062,
        marginRight: SCREEN_WIDTH * 0.0111,
        backgroundColor: '#fff',
        borderRadius: 0,
        fontSize: normalize(12),
        color: '#4a4a4a',
        fontWeight: '400',
    },
    typeView: {
        flex: 1,
        borderRadius: 2,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0,
        shadowRadius: 2,
        elevation: 1,
    },
    typeButton: {
        color: '#878787',
        fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10),
        marginVertical: SCREEN_WIDTH * 0.0194,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    selectedView: {
        flex: 1,
        backgroundColor: '#557f89',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 2,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedTypeButton: {
        color: '#fff',
        fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10),
        textAlign: 'center',
        textAlignVertical: 'center',
        marginVertical: SCREEN_WIDTH * 0.0194,
    },
    enSelectedTypeButton: {
        color: '#fff',
        fontSize: Platform.OS === 'ios' ? normalize(8) : normalize(10),
        textAlign: 'center',
        textAlignVertical: 'center',
        marginVertical: SCREEN_WIDTH * 0.0194,
    },
    enTypeButton: {
        color: '#878787',
        fontSize: Platform.OS === 'ios' ? normalize(8) : normalize(10),
        marginVertical: SCREEN_WIDTH * 0.0194,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    typeMarginView: {
        flex: 1,
        borderRadius: 2,
        backgroundColor: '#fff',
        marginLeft: SCREEN_WIDTH * 0.01389,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        borderBottomWidth: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedMarginView: {
        flex: 1,
        backgroundColor: '#557f89',
        marginLeft: SCREEN_WIDTH * 0.01389,
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 2,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 1,
    },
    contentInput: {
        flex: 1,
        width: '100%',
        textAlignVertical: 'top',
        paddingHorizontal: SCREEN_WIDTH * 0.0556,
        paddingTop: SCREEN_HEIGHT * 0.028,
        paddingBottom: SCREEN_WIDTH * 0.2,
        color: '#000',
        fontSize: normalize(12)
    },
    unit: {
        fontSize: normalize(12),
        color: '#4a4a4a',
        fontWeight: '400',
        marginRight: SCREEN_WIDTH * 0.018
    }
});