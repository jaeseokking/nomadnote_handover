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
    ImageBackground,
    FlatList,
    PermissionsAndroid,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
// import RNKakaoLink from 'react-native-kakao-links';
import axios from 'axios';
import SetI18nConfig from '../../languages/SetI18nConfig';
import { isIphoneX, getBottomSpace } from 'react-native-iphone-x-helper';
import * as RNLocalize from 'react-native-localize';
import Translate from '../../languages/Translate';
import Carousel from 'react-native-snap-carousel';
import Swiper from 'react-native-swiper';
import FlatListSlider from '../../components/FlatListSlider';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import AutoHeightImage from 'react-native-auto-height-image';
import Video from 'react-native-video';
import ProgressBar from 'react-native-progress/Bar';
import { setDeviceLang, setLang } from '../../utils/Utils';
import { ShareDialog } from 'react-native-fbsdk-next';
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';
import Toast from 'react-native-root-toast';
import Share from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import YouTube from 'react-native-youtube';
import { GEOCODING_API_KEY } from "@env"
import YouTubePlayer from "react-native-youtube-sdk";

const THEME_COLOR = 'rgba(78, 109, 118, 1)'
const FBSDK = require('react-native-fbsdk-next');
const {
    ShareApi,
} = FBSDK;
const fs = RNFetchBlob.fs;
let imagePath = null;


let statusbar_Height = 0;
if (Platform.OS === 'ios') {
    if (isIphoneX()) {
        statusbar_Height = 44;
    } else {
        statusbar_Height = 20;
    }
} else {
    statusbar_Height = StatusBar.currentHeight;
}

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
const timeBg = require('../../images/time_bg.png');


export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class CardDetail extends Component {
    constructor(props) {
        super(props);
        SetI18nConfig();
        const { params } = this.props.navigation.state
        // this.handleBackButton = this.handleBackButton.bind(this);
        this.state = {
            index: 0,
            imgHeight: SCREEN_HEIGHT * 0.3,
            indicatorMarginTop: global.indicatorMarginTop,
            id: params.id != null ? params.id : 0,
            userCheck: false,
            detailData: '',
            memberData: [],
            date: '',
            private: '',
            changeP: '',
            videoPath: '',
            isVideo: false,
            noImage: false,
            paused: false,
            progress: 0,
            duration: 0,
            timeImage: [],
            imageArrayCheck: false,
            base64file: '',
            firstImgURl: '',
            data: [
                {
                    image: 'https://images.unsplash.com/photo-1567226475328-9d6baaf565cf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60'
                },
            ],
            translatedText: '',
            isHeight: false,
            isLoading: true,
            otaData: [],
            otaImageUri: [],
            isYouTube: false,
            youtubeId: '',
            translationPlaceText: '',
            isTrans: false,
            lang: setDeviceLang(),
        };
    }

    async findFilePath(uriComponents) {
        // if (url.startsWith('content://')) {
        //  const uriComponents = url.split('/')
        //  const fileNameAndExtension = urlComponents[uriComponents.length - 1]
        //  const destPath = `${RNFS.TemporaryDirectoryPath}/${fileNameAndExtension}`
        //  console.log('destPath',destPath)
        // await RNFS.copyFile(uri, destPath)
        // }else {
        // const fileNameAndExtension = urlComponents[uriComponents.length - 1]
        const destPath = `${RNFS.TemporaryDirectoryPath}/${uriComponents}`
        console.log('destPath', destPath)
        await RNFS.copyFile(uri, destPath)
        // }
    }

    find_dimesions(layout) {
        const { x, y, width, height } = layout;
        console.log('img height: ', height)
        // this.setState({ imgHeight: height });
    }

    componentDidMount() {
        console.log('componentDidMount')
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        // BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        this.didFocusListener = this.props.navigation.addListener(
            'didFocus',
            async () => {
                const isModi = await getItemFromAsync('write')
                // if (isModi === 'back') {
                //     if (this.state.isVideo) {
                //         this.setState({paused: false})
                //     }
                //     setItemToAsync('write', '')
                //     setItemToAsync('scrap_write', '')
                //     setItemToAsync('visit_write', '')
                //     setItemToAsync('map_write', '')
                    
                // } else {
                

                    this.getTimeLineDetail()
                    this.getOTA()
                // }
            }
        );

        this.didFocusListener = this.props.navigation.addListener(
            'didBlur',
            () => {

            },
        );
    }

    // handleBackButton = () => {
    //     if (this.props.navigation.isFocused()) {
    //         this.props.navigation.goBack();
    //         return false;
    //     }
    // }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        // BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    }

    handleLocalizationChange = () => {
        SetI18nConfig();
        this.forceUpdate();
    };

    getMyInfo() {
        console.log('Disk Memory ActiveSync')
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

    async getTimeLineDetail() {
        let url = global.server + '/api/timeline/detail_timeline'
        const actionType = await getItemFromAsync('write');
        const myActionType = await getItemFromAsync('my_timeline_write');
        const scrapActionType = await getItemFromAsync('scrap_write');

        var bodyFormData = new FormData();
        bodyFormData.append('timeline_id', this.state.id);

        const self = this;

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn", response.data.timeline);
                if (actionType === 'modi' || myActionType === 'modi' || scrapActionType === 'modi') {
                    global.detailTimeline = response.data.timeline
                }
                this.setState({
                    detailData: response.data.timeline,
                    memberData: response.data.timeline.member,
                    private: response.data.timeline.block_yn,
                })

                var stringData = response.data.timeline.created_at
                var subDate = stringData.substring(0, 10)
                var AmPm = stringData.substring(11, 13)
                if (AmPm >= 12) {
                    AmPm = 'PM'
                } else {
                    AmPm = 'AM'
                }
                var subTime = stringData.substring(11, 16)
                console.log('sub ==', subTime)
                var totalTime
                if (global.lang === 'ko') {
                    totalTime = subDate + ' ' + AmPm + ' ' + subTime
                } else {
                    totalTime = subDate + ' ' + subTime + ' ' + AmPm
                }


                this.setState({ date: totalTime }, () => {
                });

                var imageA = response.data.timeline.images
                var mArr = []
                var videoP = ''
                if (imageA.length == 0 || imageA === undefined) {
                    this.setState({
                        noImage: true,
                    })
                    console.log('no Data')
                } else {
                    if (imageA[0].video_path != null) {
                        console.log('videoP', imageA[0].video_path)
                        this.setState({ isVideo: true })
                        this.getVideoHeight(global.server + imageA[0].video_path)
                        // this.setState({
                        //     isVideo: true,
                        //     videoPath: global.server + imageA[0].video_path,
                        //     paused: this.state.paused ? !this.state.paused : this.state.paused
                        // }, () => { this.findFilePath(imageA[0].video_path) })
                    } else {
                        mArr = imageA.map(item => global.server + item.image_uri);
                        this.setState({
                            isVideo: false,
                            firstImgURl: global.server + imageA[0].image_uri
                        })
                    }
                }

                let aImg = []
                let imgHeight = this.state.imgHeight
                let imgWidth = this.state.imgWidth
                let tempHeight = 0
                let tempWidth = 0
                let isHeight = false
                mArr.map((data) => {
                    aImg = aImg.concat({ image: data })
                    Image.getSize(data, (width, height) => {
                        console.log('img height: ', height)
                        if (tempHeight < height) {
                            tempHeight = height
                            console.log('img ratio height: ', height / SCREEN_HEIGHT, SCREEN_HEIGHT, height)
                            if (tempHeight > SCREEN_HEIGHT * 0.6) {
                                isHeight = true
                                tempHeight = SCREEN_HEIGHT * 0.6
                            } else if (tempHeight < SCREEN_HEIGHT * 0.28) {
                                tempHeight = SCREEN_HEIGHT * 0.28
                                isHeight = true
                            }
                            this.setState({ imgHeight: tempHeight, isHeight: isHeight })
                        }
                    })
                })

                // this.setState({ timeImage: aImg }, () => {
                //     console.log('time', this.state.timeImage.length)
                // });

                if (response.data.timeline.youtube === null) {
                    this.setState({ isYouTube: false })
                } else {
                    const youtubeId = this.getYoutubeId(response.data.timeline.youtube)
                    console.log('youtube id: ', youtubeId)
                    this.setState({ isYouTube: true, youtubeId: youtubeId })
                }

                console.log('data length api: ', this.state.detailData !== '')
                if (global.user.id === response.data.timeline.member.id) {
                    this.setState({ userCheck: true, timeImage: aImg }, () => {
                        if (!this.state.isVideo) {
                            this.setState({ isLoading: false })
                        }
                    });
                } else {
                    this.setState({ userCheck: false, timeImage: aImg }, () => {
                        if (!this.state.isVideo) {
                            this.setState({ isLoading: false })
                        }
                    });
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
                self.setState({ isLoading: false })
            });
    }

    getYoutubeId(url) {
        const videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
        if (videoid != null) {
            console.log("video id = ", videoid[1]);
        } else {
            console.log("The youtube url is not valid.");
        }
        return videoid[1]
    }

    async getVideoHeight(url) {
        const fileName = url.split('/').pop()
        const destPath = RNFetchBlob.fs.dirs.DocumentDir + '/' + fileName;
        console.log('destPath: ', destPath)
        const config = {
            fileCache: true,
            path: destPath,
        };
        await RNFetchBlob.config(config)
            .fetch('GET', url)
            .then(async (res) => {
                console.log('res: ', res.path())
                await RNFetchBlob.fs.stat(res.path())
                    .then(async (stats) => {
                        console.log('stats', stats, this.state.isLoading)
                        if (Platform.OS === 'ios') {
                            let tempHeight = 0
                            let isHeight = false
                            Image.getSize(`file://${stats.path}`, (width, height) => {
                                if (tempHeight < height) {
                                    tempHeight = height
                                    console.log('ratio height: ', height / SCREEN_HEIGHT, SCREEN_HEIGHT, height)
                                    if (tempHeight > SCREEN_HEIGHT * 0.6) {
                                        isHeight = true
                                        tempHeight = SCREEN_HEIGHT * 0.6
                                    }

                                }
                                this.setState({
                                    imgHeight: tempHeight,
                                    isHeight: isHeight,
                                    videoPath: url,
                                    paused: this.state.paused ? !this.state.paused : this.state.paused,
                                }, () => {
                                    this.findFilePath(url)
                                })
                            })
                        } else {
                            let tempHeight = 0
                            let isHeight = false
                            Image.getSize(`file://${stats.path}`, (width, height) => {
                                if (tempHeight < height) {
                                    tempHeight = height
                                    console.log('ratio height: ', height / SCREEN_HEIGHT, SCREEN_HEIGHT, height)
                                    if (tempHeight > SCREEN_HEIGHT * 0.6) {
                                        isHeight = true
                                        tempHeight = SCREEN_HEIGHT * 0.6
                                    }
                                }
                                this.setState({
                                    imgHeight: tempHeight,
                                    isHeight: isHeight,
                                    isVideo: true,
                                    videoPath: url,
                                    paused: this.state.paused ? !this.state.paused : this.state.paused,
                                }, () => {
                                    this.findFilePath(url)
                                })
                            })
                        }

                    })
                    .catch((err) => {
                        console.log('error =', err)
                        this.setState({ isLoading: false, isSettingVideo: true })
                    })
            })
    }

    deleteTimeline() {
        let url = global.server + '/api/timeline/delete_timeline'

        var bodyFormData = new FormData();
        bodyFormData.append('timeline_id', this.state.id);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("response", response.data);
                this.getMyInfo();
                setItemToAsync('write', 'remove')
                setItemToAsync('scrap_write', 'remove')
                setItemToAsync('my_timeline_write', 'remove')
                setItemToAsync('visit_write', 'remove')
                setItemToAsync('map_write', 'remove')
                setItemToAsync('remove_id', this.state.id)
                setItemToAsync('createTimeLine', true)

                this.props.navigation.goBack();
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

    privateTimeline = (yn) => {
        let url = global.server + '/api/timeline/change_block'

        console.log('url = ', url)
        var bodyFormData = new FormData();
        bodyFormData.append('timeline_id', this.state.id);
        bodyFormData.append('block_yn', yn);
        console.log('bodyForm', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("response", response.data);
                if (response.data.result === 'ok') {
                    this.setState({
                        private : this.state.private == 'Y' ? 'N' : 'Y'
                    })
                    // this.getTimeLineDetail()
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


    deleteAlert = () =>
        Alert.alert(
            '',
            Translate('builderdelete'),
            [
                {
                    text: Translate('builderno'),
                    onPress: () => console.log('No Pressed'),
                    style: 'default'

                },
                {
                    text: Translate('builderyes'),
                    onPress: () => this.deleteTimeline(),
                    style: 'default'
                },
            ],
            { cancelable: true },
        );

    // 비디오 영상쪽    
    handleLoad = (meta) => {
        // console.log('loading: ', meta)
        let tempHeight = 0
        let isHeight = false
        if (tempHeight < meta.naturalSize.height) {
            tempHeight = meta.naturalSize.height
            if (tempHeight > SCREEN_HEIGHT * 0.6) {
                isHeight = true
                tempHeight = SCREEN_HEIGHT * 0.6
            }
            console.log('video height: ', tempHeight, SCREEN_HEIGHT * 0.6)
            if (Platform.OS === 'ios') {
                this.setState({ imgHeight: tempHeight, isHeight: isHeight, isLoading: false })
            } else {
                this.setState({ isLoading: false })
            }
        }
        this.setState({
            duration: meta.duration,
        }, () => {
            // console.log('du?', this.state.duration)
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
            console.log('check1', this.state.progress)
        });
    }

    handleEnd = () => {
        this.setState({ paused: true }, () => this.player.seek(0))
    }

    //번역

    // trans(, lang) {
    //     if (global.lang == lang) {
    //         this.setState({ translatedText: textString })
    //     } else {
    //         this.translate('key', '&q=' + encodeURI(textString), lang)
    //     }
    // }

    translate = (key, stringToTranslate, stringToTransPlace, fromLang, fromLangPlace) => {
        const self = this
        if (global.lang === 'zh_rCN') {
            this.userLanguage = 'zh'
        } else if (global.lang == 'zh_rTW') {
            this.userLanguage = 'zh-TW'
        } else if (global.lang == 'zh-Hant-MO') {
            this.userLanguage = 'zh-TW'
        } else {
            this.userLanguage = global.lang
        }
        console.log('check userlang = ', global.lang)
        this.API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`;
        this.URL += `&source=${fromLang}`;
        this.URL += `&target=${this.userLanguage}`

        const placeUrl = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}&source=${fromLangPlace}&target=${this.userLanguage}`;

        axios.all([axios.post(placeUrl + stringToTransPlace), axios.post(this.URL + stringToTranslate)])
            .then(axios.spread((firstResponse, secondResponse) => {
                let placeText = firstResponse.data.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                let contentText = secondResponse.data.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                console.log('check', placeText, contentText)

                this.setState({ translatedText: `${placeText}\n\n${contentText}` })
            }).bind(this))
            .catch(function (error) {
                self.setState({ translatedText: '' });
                console.log("There was an error: ", error);
            });
    }

    translateText = (key, string_to_translate, notTranslateText, fromLang) => {
        if (global.lang === 'zh_rCN') {
            this.userLanguage = 'zh'
        } else if (global.lang == 'zh_rTW') {
            this.userLanguage = 'zh-TW'
        } else if (global.lang == 'zh-Hant-MO') {
            this.userLanguage = 'zh-TW'
        } else {
            this.userLanguage = global.lang
        }
        console.log('check userlang = ', global.lang)
        this.API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`;
        this.URL += `&source=${fromLang}`;
        this.URL += `&target=${this.userLanguage}`

        fetch(this.URL + string_to_translate)
            .then(res => res.json())
            .then(
                (res) => {
                    let text = res.data.translations[0].translatedText.replace(/(&quot\;)/g, "\"")
                    console.log('check Data', text)
                    if (key === 'content') {
                        this.setState({ translatedText: `${notTranslateText}\n\n${text}` })
                    } else {
                        this.setState({ translatedText: `${text}\n\n${notTranslateText}` })
                    }
                }
            ).catch(
                (error) => {
                    this.setState({ translatedText: '' })
                    console.log("There was an error: ", error);
                }
            )
    }

    checkLanguage(item) {
        let reg = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        if ((reg.test(item.contents) === true || reg.test(item.place_name) === true) && (this.state.lang === 'ko')) {
            Toast.show(`${Translate('cant_korean_translate')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('cant_korean_translate')}`)
        }

        let API_KEY = GEOCODING_API_KEY;
        this.URL = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}`;
        this.URL += `&q=${item.contents}`;
        // const contentUrl = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}&q=${item.contents}`;
        const placeUrl = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}&q=${item.place_name}`;

        console.log('url: ', this.URL, placeUrl)

        axios.all([axios.post(placeUrl), axios.post(this.URL)])
            .then(axios.spread((firstResponse, secondResponse) => {
                let placeData = firstResponse.data.data.detections[0]
                let placeCheckLang = placeData[0].language

                let contentData = secondResponse.data.data.detections[0]
                let contentCheckLang = contentData[0].language
                console.log('content checkLang =', contentCheckLang, placeCheckLang)

                if (placeCheckLang === 'und' && contentCheckLang === 'und') {
                    this.setState({ translatedText: '', translationPlaceText: item.place_name })
                } else if (placeCheckLang === 'und') {
                    if (global.lang === contentCheckLang) {
                        this.setState({ translatedText: '', translationPlaceText: item.place_name })
                    } else {
                        this.translateText('content', '&q=' + encodeURI(item.contents), item.place_name, contentCheckLang)
                    }
                } else if (contentCheckLang === 'und') {
                    if (global.lang === placeCheckLang) {
                        this.setState({ translatedText: '', translationPlaceText: item.place_name })
                    } else {
                        this.translateText('place', `&q=${item.place_name}`, item.contents, placeCheckLang)
                    }
                } else if (global.lang === placeCheckLang && global.lang === contentCheckLang) {
                    this.setState({ translatedText: '', translationPlaceText: item.place_name })
                } else if (global.lang === placeCheckLang) {
                    this.translateText('content', '&q=' + encodeURI(item.contents), item.place_name, contentCheckLang)
                } else if (global.lang === contentCheckLang) {
                    this.translateText('place', `&q=${item.place_name}`, item.contents, placeCheckLang)
                } else {
                    this.translate('key', '&q=' + encodeURI(item.contents), `&q=${item.place_name}`, contentCheckLang, placeCheckLang)
                }
            }).bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
            });
    }

    shareNaverBlog() {

        var encodeUrl = encodeURI(this.state.firstImgURl);
        var encodeTitle = encodeURI("[nomadnote]" + this.state.detailData.contents);
        var link = 'https://share.naver.com/web/shareView.nhn?url=' + encodeUrl + "&title=" + encodeTitle
        Linking.openURL(link)
    }

    // kakaoLinkScrap = async () => {
    //         try{
    //           const options = {
    //             objectType:'scrap',//required
    //             url:'https://developers.kakao.com',//required
    //           };
    //           const response = await RNKakaoLink.link(options);
    //           console.log(response);
    //         }catch(e){
    //           console.log('error',e)
    //         }
    //       }


    //share
    async facebookShare() {

        if (this.state.noImage) {
            Toast.show(`${Translate('no_image_data')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(Translate('no_image_data'))
            return
        }

        var fetchURl = ''
        if (this.state.isVideo) {
            Toast.show('비디오는 공유할 수 없습니다.', {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('비디오는 공유할 수 없습니다.')
            return
        } else {
            fetchURl = this.state.firstImgURl
        }

        RNFetchBlob.config({
            fileCache: true
        })
            .fetch("GET", fetchURl)
            .then(resp => {
                // the image path you can use it directly with Image component
                imagePath = resp.path();
                return resp.readFile("base64");
            })
            .then(async base64Data => {
                var initB = base64Data
                var base64Data = `data:image/png;base64,` + base64Data;
                console.log('initb', initB)
                // here's base64 encoded image
                if (Platform.OS === 'ios') {
                    const shareOptions = {
                        title: 'nomadnote',
                        type: "image/jpeg",
                        url: base64Data,
                        subject: "",
                        message: "",
                        failOnCancel: false,
                        method: Share.Social.FACEBOOK,
                        backgroundImage: base64Data,
                        social: Share.Social.FACEBOOK,
                    };
                    try {
                        const ShareResponse = await Share.shareSingle(shareOptions);
                        console.log("response after share", JSON.stringify(ShareResponse, null, 2));
                    } catch (error) {
                        console.log('Error =>', error);
                    }
                } else {
                    const shareOptions1 = {
                        social: Share.Social.FACEBOOK,
                        url: base64Data,
                        forceDialog: true,
                    };
                    try {

                        const ShareResponse = await Share.open(shareOptions1)
                        console.log("response after share", JSON.stringify(ShareResponse, null, 2));
                    } catch (error) {
                        console.log('Error =>', error);
                    }

                }

                return RNFetchBlob.fs.unlink(imagePath);
            });
    }


    instagramShare = async () => {
        if (this.state.noImage) {
            Toast.show(`${Translate('no_image_data')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(Translate('no_image_data'))
            return
        }

        var fetchURl = ''
        if (this.state.isVideo) {
            Toast.show('비디오는 공유할 수 없습니다.', {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('비디오는 공유할 수 없습니다.')
            return
        } else {
            fetchURl = this.state.firstImgURl
        }
        RNFetchBlob.config({
            fileCache: true
        })
            .fetch("GET", fetchURl)
            .then(resp => {
                // the image path you can use it directly with Image component
                imagePath = resp.path();
                return resp.readFile("base64");
            })
            .then(async base64Data => {
                var initB = base64Data
                var base64Data = `data:image/png;base64,` + base64Data;
                // here's base64 encoded image
                if (Platform.OS === 'ios') {
                    const shareOptions = {
                        title: 'nomadnote',
                        type: "image/jpeg",
                        url: base64Data,
                        subject: "",
                        message: "",
                        failOnCancel: false,
                        //method: Share.Social.INSTAGRAM,
                        backgroundImage: base64Data,
                        social: Share.Social.INSTAGRAM,
                    };
                    try {
                        const ShareResponse = await Share.shareSingle(shareOptions);
                        console.log("response after share", JSON.stringify(ShareResponse, null, 2));
                    } catch (error) {
                        console.log('Error =>', error);
                    }
                } else {
                    const shareOptions1 = {
                        social: Share.Social.INSTAGRAM,
                        url: `data:image/jpeg;base64,${initB}`,
                        forceDialog: true,
                    };
                    try {
                        //처음엔 open으로 앱 지정 경로를 알려줘야되나?
                        const ShareResponse = await Share.open(shareOptions1);
                        console.log("response after share", JSON.stringify(ShareResponse, null, 2));
                    } catch (error) {
                        console.log('Error =>', error);
                    }
                }
                return RNFetchBlob.fs.unlink(imagePath);
            });
    }

    snsShare = async () => {
        if (this.state.noImage) {
            Toast.show(`${Translate('no_image_data')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(Translate('no_image_data'))
            return
        }

        var fetchURl = ''
        if (this.state.isVideo) {
            Toast.show('비디오는 공유할 수 없습니다', {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show('비디오는 공유할 수 없습니다.')
            return
        } else {
            fetchURl = this.state.firstImgURl
        }

        RNFetchBlob.config({
            fileCache: true
        })
            .fetch("GET", fetchURl)
            .then(resp => {
                // the image path you can use it directly with Image component
                imagePath = resp.path();
                return resp.readFile("base64");
            })
            .then(async base64Data => {
                var initB = base64Data
                var base64Data = `data:image/png;base64,` + base64Data;
                // here's base64 encoded image
                const shareOptions = {
                    title: 'nomadnote',
                    type: "image/jpeg",
                    url: base64Data,
                    message: "share via nomadnote",
                    failOnCancel: false,
                };
                try {
                    const ShareResponse = await Share.open(shareOptions);
                    console.log("response after share", JSON.stringify(ShareResponse, null, 2));
                } catch (error) {
                    console.log('Error =>', error);
                }
                return RNFetchBlob.fs.unlink(imagePath);
            });
    }

    //OTA광고
    getOTA() {
        var self = this
        let url = global.server + `/api/ota_advertise/adver_list`

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);

        axios.get(url)
            .then(function (response) {
                if (response.data.result === 'ok') {
                    this.setState({ otaData: response.data.advers }, () => {
                        console.log('check b2b', this.state.otaData)
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
                            aImg = aImg.concat({ image: global.server + item.image_uri })
                        })
                        this.setState({ otaImageUri: aImg })
                    }
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

    // linkScrap = async () => {
    //     try{
    //         // const options = {
    //         //     objectType: "text", //required
    //         //     text: "텍스트 입력", //required
    //         //     link: linkObject, //required
    //         //     // buttonTitle:'',//optional buttons랑 사용 불가.
    //         //     buttons: [buttonObject] //optional
    //         //   };
    //       const response = await RNKakaoLink.link(contentObject);
    //       console.log(response);
    //     }catch(e){
    //       console.log(e);
    //     }
    //   }



    render() {
        const { navigation } = this.props;
        const { isLoading } = this.state;
        var detailAge = this.state.memberData.age
        if (detailAge != null) {

        } else {
            detailAge = ''
        }
        // console.log('data length: ', this.state.detailData !== '')
        // console.log('SCRAP : ', this.state.scrap)

        // console.log('언어 : ', this.state.lang)

        // console.log('video path !!!! ', this.state.videoPath)

        console.log("PRIVATE",this.state.private);
        return (
            <>
                {/* <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="dark-content" /> */}
                <View style={styles.container}>
                    <ScrollView
                        style={{ display: 'flex' }}
                        horizontal={false}
                        showsVerticalScrollIndicator={false} >
                        <View style={styles.scrollContainer}>
                            <View style={styles.topContainer}>
                                <View style={{
                                    position: 'absolute', backgroundColor: '#fff',
                                    //borderWidth: 0, borderBottomColor: '#779ba4',  borderBottomWidth : 5
                                }}
                                    onLayout={(event) => { this.find_dimesions(event.nativeEvent.layout) }}>
                                    {this.state.isVideo ?
                                        <View style={{ width: SCREEN_WIDTH, height: this.state.imgHeight }}>
                                            <Video source={{ uri: this.state.videoPath }}
                                                ref={(ref) => {
                                                    this.player = ref
                                                }}
                                                // muted={true}
                                                onBuffer={this.onBuffer}
                                                paused={this.state.paused}
                                                onLoad={this.handleLoad}
                                                //    repeat={this.state.paused ? true : false}
                                                onProgress={this.handleProgress}
                                                onEnd={this.handleEnd}
                                                resizeMode='cover'
                                                onError={this.videoError}
                                                style={{ width: SCREEN_WIDTH, height: '100%' }} />
                                            <ProgressBar
                                                progress={this.state.progress}
                                                width={SCREEN_WIDTH}
                                                height={5}
                                                color='rgba(12, 110, 135, 1)'
                                                borderWidth={0}
                                                borderRadius={0}
                                                unfilledColor='rgba(229, 229, 229, 1)'
                                            />

                                        </View>
                                        : this.state.isYouTube
                                            ? Platform.OS === 'ios' ? <View>
                                                <View style={{ backgroundColor: THEME_COLOR, width: SCREEN_WIDTH, height: statusbar_Height }} />
                                                <YouTube
                                                    videoId={this.state.youtubeId}
                                                    apiKey={GEOCODING_API_KEY}
                                                    play={true}
                                                    fullscreen={false}
                                                    loop={false}
                                                    onReady={(e) => console.log('onReady')}
                                                    onChangeState={(e) => console.log('onChangeState:', e.state)}
                                                    onChangeQuality={(e) => console.log('onChangeQuality: ', e.quality)}
                                                    onError={(e) => console.log('onError: ', e)}
                                                    style={{ width: SCREEN_WIDTH, height: this.state.imgHeight }}
                                                />
                                            </View>
                                                : <View>
                                                    <YouTubePlayer
                                                        ref={ref => (this.youTubePlayer = ref)}
                                                        videoId={this.state.youtubeId}
                                                        autoPlay={true}
                                                        fullscreen={false}
                                                        showFullScreenButton={true}
                                                        showSeekBar={true}
                                                        showPlayPauseButton={true}
                                                        startTime={0}
                                                        style={{ width: SCREEN_WIDTH, height: this.state.imgHeight }}
                                                        onReady={e => console.log("onReady", e.type)}
                                                        onError={e => console.log("onError", e.error)}
                                                        onChangeState={e => console.log("onChangeState", e.state)}
                                                        onChangeFullscreen={e => console.log("onChangeFullscreen", e.isFullscreen)}
                                                    />
                                                </View>
                                            : this.state.timeImage.length === 0 ? this.state.detailData !== '' && <Image
                                                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, resizeMode: 'contain' }}
                                                source={timeBg}
                                            />
                                                :
                                                <SwiperFlatList
                                                    index={0}
                                                    showPagination
                                                    paginationDefaultColor={'#d8d8d8'}
                                                    paginationActiveColor={'#557F89'}
                                                    paginationStyleItem={{ width: 5, height: 5, marginTop: SCREEN_WIDTH * 0.228, marginHorizontal: 2 }}
                                                    data={this.state.timeImage.length === 0 ? this.state.data : this.state.timeImage}
                                                    renderItem={({ item }) => (
                                                        <View>
                                                            <Image
                                                                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, resizeMode: 'contain' }}
                                                                source={{ uri: item.image }}
                                                            />
                                                        </View>
                                                        // <AutoHeightImage
                                                        //     width={SCREEN_WIDTH}
                                                        //     source={{ uri: item.image }} />
                                                    )}
                                                />
                                    }
                                    {this.state.isVideo ? this.state.paused ?
                                        <TouchableWithoutFeedback
                                            onPress={() => {
                                                this.setState({
                                                    paused: false,
                                                    //   duration:0,
                                                    //   progress:0
                                                })
                                            }}
                                        >
                                            <Image
                                                style={{
                                                    resizeMode: 'contain', width: SCREEN_WIDTH * 0.08, height: SCREEN_WIDTH * 0.08, left: 0, top: 0,
                                                    marginTop: (SCREEN_WIDTH * 0.5) - 5, marginLeft: (SCREEN_WIDTH * 0.5) - 15, position: 'absolute'
                                                }}
                                                source={require('../../images/play.png')}
                                            />
                                        </TouchableWithoutFeedback>
                                        :
                                        null
                                        :
                                        null
                                    }

                                </View>
                                <View style={{
                                    width: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    marginTop: (Platform.OS === 'ios') ? statusbar_Height : 0,
                                    position: 'absolute',
                                }}
                                    pointerEvents={'none'}>
                                    {/* <Image
                                        style={{
                                            width: 95,
                                            height: 95 * 0.29,
                                            resizeMode: 'contain',
                                            marginTop: 12,
                                        }}
                                        source={require('../../images/login_logo.png')} /> */}
                                </View>
                                <View style={{
                                    height: 50,
                                    width: SCREEN_WIDTH * 0.16,
                                    marginTop: (Platform.OS === 'ios') ? statusbar_Height : 0,
                                    position: 'absolute'
                                }}>
                                    <TouchableWithoutFeedback
                                        hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                        onPress={() => {
                                            navigation.goBack();
                                        }}>
                                        <Image
                                            style={{
                                                width: 20,
                                                height: 18,
                                                resizeMode: 'contain',
                                                alignSelf: 'flex-end',
                                                marginTop: 20,
                                                paddingLeft: SCREEN_WIDTH * 0.07,
                                                marginRight: 10,
                                            }}
                                            source={require('../../images/back_theme_color.png')} />
                                    </TouchableWithoutFeedback>
                                </View>
                                <View style={{ marginTop: ((this.state.isYouTube || this.state.isVideo ? this.state.imgHeight : SCREEN_WIDTH) + ((this.state.isYouTube && Platform.OS) === 'ios' ? statusbar_Height : 0) - ((SCREEN_WIDTH * 0.15) / 2)), width: '100%', alignItems: 'center', backgroundColor: 'transparent', }}
                                    pointerEvents={'none'}>
                                    {
                                        this.state.detailData !== '' && <Image
                                            style={{ width: SCREEN_WIDTH * 0.15, height: SCREEN_WIDTH * 0.15, resizeMode: 'cover', borderRadius: (SCREEN_WIDTH * 0.15) / 2 }}
                                            source={this.state.memberData.profile == null ? this.state.memberData.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + this.state.memberData.profile }} />
                                    }
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={styles.userNameText}>{this.state.memberData.name}</Text>
                                        {
                                            detailAge !== '' && <View style={{ flexDirection: 'row' }}>
                                                <Text style={styles.userNameText}>{(this.state.memberData.join_type === 6 || this.state.memberData.join_type === 7) ? '' : ' / '}</Text>
                                                <Text style={styles.userNameText}>{(this.state.memberData.join_type === 6 || this.state.memberData.join_type === 7) ? '' : detailAge}</Text>
                                                {
                                                    this.state.lang === 'en' && <Text style={styles.userNameText}>{' '}</Text>
                                                }
                                                <Text style={styles.userNameText}>{(this.state.memberData.join_type === 6 || this.state.memberData.join_type === 7) ? '' : Translate('age')}</Text>
                                            </View>
                                        }

                                    </View>

                                </View>
                            </View>
                            {
                                this.state.detailData !== '' && <View
                                    style={{ marginTop: -15, alignItems: 'flex-end', backgroundColor: 'transparent', height: 15 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({ translatedText: Translate('transtrating') })
                                            this.checkLanguage(this.state.detailData)
                                        }}>
                                        {/* {
                                            <Image
                                                style={{ resizeMode: 'contain', height: 15 }}
                                                source={require(`../../images/test_translation.png`)}
                                            />
                                        } */}
                                        {
                                            this.state.lang === 'en' && <Image
                                                style={{ resizeMode: 'contain', height: 22 }}
                                                source={require(`../../images/translation2/en_translation.png`)}
                                            />
                                        }
                                        {
                                            this.state.lang === 'ko' && <Image
                                                style={{ resizeMode: 'contain', height: 15 }}
                                                source={require(`../../images/translation2/ko_translation.png`)}
                                            />
                                        }
                                        {
                                            this.state.lang === 'ja' && <Image
                                                style={{ resizeMode: 'contain', height: 15 }}
                                                source={require(`../../images/translation2/ja_translation.png`)}
                                            />
                                        }
                                        {
                                            this.state.lang === 'zh_rCN' && <Image
                                                style={{ resizeMode: 'contain', height: 15 }}
                                                source={require(`../../images/translation2/rCN_translation.png`)}
                                            />
                                        }
                                        {
                                            this.state.lang === 'zh_rTW' && <Image
                                                style={{ resizeMode: 'contain', height: 15 }}
                                                source={require(`../../images/translation2/rTW_translation.png`)}
                                            />
                                        }
                                        {
                                            this.state.lang === 'zh-Hant-MO' && <Image
                                                style={{ resizeMode: 'contain', height: 15 }}
                                                source={require(`../../images/translation2/rTW_translation.png`)}
                                            />
                                        }


                                    </TouchableOpacity>
                                </View>
                            }

                            {
                                this.state.detailData !== '' && <View style={styles.contentContainer}>
                                    {/* <FlatList
                                   style={{ flex: 1 }}
                                   data={this.state.detailData}
                                   renderItem={this.detailRenderItem}
                                   keyExtractor={item => item.id}>
                               </FlatList> */}
                                    <View>
                                        <Text style={styles.placeText}>{this.state.detailData.place_name + ', ' + this.state.detailData.cost_str}</Text>
                                        <Text style={styles.timeText}>{this.state.date}</Text>
                                    </View>
                                    <Text style={styles.contentText}>{this.state.detailData.contents}</Text>
                                    <Text style={styles.contentText}>{this.state.translatedText}</Text>
                                </View>
                            }

                            {
                                this.state.detailData !== '' && <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    paddingHorizontal: this.state.lang === 'en' ? SCREEN_WIDTH * 0.04 : SCREEN_WIDTH * 0.02,
                                    marginTop: SCREEN_HEIGHT * 0.0156,
                                }}>
                                    {/* <View style={{ backgroundColor: this.state.detailData.style_id === 1 ? '#557f89' : 'transparent', borderRadius: 2 }}>
                                    
                                </View> */}
                                    <Text style={{
                                        color: this.state.detailData.style_id === 1 ? '#fff' : '#878787', fontSize: this.state.lang === 'ja' ? normalize(8) : this.state.lang === 'en' ? normalize(9) : normalize(10),
                                        fontWeight: '400', flexWrap: 'wrap', backgroundColor: this.state.detailData.style_id === 1 ? '#557f89' : 'transparent',
                                        paddingHorizontal: 2, paddingVertical: 4, textAlign: 'center', overflow: 'hidden', borderRadius: 2, flex: 1 / 6
                                    }}>{Translate('activity_write_healing')}</Text>
                                    <Text style={{
                                        color: this.state.detailData.style_id === 2 ? '#fff' : '#878787', fontSize: this.state.lang === 'ja' ? normalize(8) : this.state.lang === 'en' ? normalize(9) : normalize(10),
                                        fontWeight: '400', flexWrap: 'wrap', backgroundColor: this.state.detailData.style_id === 2 ? '#557f89' : 'transparent',
                                        paddingHorizontal: 2, paddingVertical: 4, textAlign: 'center', overflow: 'hidden', marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                    }}>{Translate('activity_write_hotplace')}</Text>
                                    <Text style={{
                                        color: this.state.detailData.style_id === 3 ? '#fff' : '#878787', fontSize: this.state.lang === 'en' ? normalize(8) : normalize(10),
                                        fontWeight: '400', flexWrap: 'wrap', backgroundColor: this.state.detailData.style_id === 3 ? '#557f89' : 'transparent',
                                        paddingHorizontal: 2, paddingVertical: 4, textAlign: 'center', overflow: 'hidden', marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                    }}>{Translate('traditional_market')}</Text><Text style={{
                                        color: this.state.detailData.style_id === 4 ? '#fff' : '#878787', fontSize: this.state.lang === 'en' ? normalize(8) : normalize(10),
                                        fontWeight: '400', flexWrap: 'wrap', backgroundColor: this.state.detailData.style_id === 4 ? '#557f89' : 'transparent',
                                        paddingHorizontal: 2, paddingVertical: 4, textAlign: 'center', overflow: 'hidden', marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                    }}>{Translate('historicalstyle')}</Text>
                                    <Text style={{
                                        color: this.state.detailData.style_id === 5 ? '#fff' : '#878787', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10),
                                        fontWeight: '400', flexWrap: 'wrap', backgroundColor: this.state.detailData.style_id === 5 ? '#557f89' : 'transparent',
                                        paddingHorizontal: 2, paddingVertical: 4, textAlign: 'center', overflow: 'hidden', marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                    }}>{Translate('museumstyle')}</Text>
                                    <Text style={{
                                        color: this.state.detailData.style_id === 6 ? '#fff' : '#878787', fontSize: this.state.lang === 'en' ? normalize(9) : normalize(10),
                                        fontWeight: '400', flexWrap: 'wrap', backgroundColor: this.state.detailData.style_id === 6 ? '#557f89' : 'transparent',
                                        paddingHorizontal: 2, paddingVertical: 4, textAlign: 'center', overflow: 'hidden', marginLeft: this.state.lang === 'en' ? 1 : 5, borderRadius: 2, flex: 1 / 6,
                                    }}>{Translate('artmuseumstyle')}</Text>
                                    {/* <View style={{ backgroundColor: this.state.detailData.style_id === 2 ? '#557f89' : 'transparent', borderRadius: 2, marginLeft: 2 }}>
                                    <Text style={{ color: this.state.detailData.style_id === 2 ? '#fff' : '#878787', marginHorizontal: 4, marginVertical: 4, fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10), fontWeight: '400', flexWrap: 'wrap' }}>{Translate('activity_write_hotplace')}</Text>
                                </View>
                                <View style={{ backgroundColor: this.state.detailData.style_id === 3 ? '#557f89' : 'transparent', borderRadius: 2, marginLeft: 2 }}>
                                    <Text style={{ color: this.state.detailData.style_id === 3 ? '#fff' : '#878787', marginHorizontal: 4, marginVertical: 4, fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10), fontWeight: '400', flexWrap: 'wrap' }}>{Translate('traditional_market')}</Text>
                                </View>
                                <View style={{ backgroundColor: this.state.detailData.style_id === 4 ? '#557f89' : 'transparent', borderRadius: 2, marginLeft: 2 }}>
                                    <Text style={{ color: this.state.detailData.style_id === 4 ? '#fff' : '#878787', marginHorizontal: 4, marginVertical: 4, fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10), fontWeight: '400', flexWrap: 'wrap' }}>{Translate('historicalstyle')}</Text>
                                </View>
                                <View style={{ backgroundColor: this.state.detailData.style_id === 5 ? '#557f89' : 'transparent', borderRadius: 2, marginLeft: 2 }}>
                                    <Text style={{ color: this.state.detailData.style_id === 5 ? '#fff' : '#878787', marginHorizontal: 4, marginVertical: 4, fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10), fontWeight: '400', flexWrap: 'wrap' }}>{Translate('museumstyle')}</Text>
                                </View>
                                <View style={{ backgroundColor: this.state.detailData.style_id === 6 ? '#557f89' : 'transparent', borderRadius: 2, marginLeft: 2 }}>
                                    <Text style={{ color: this.state.detailData.style_id === 6 ? '#fff' : '#878787', marginHorizontal: 4, marginVertical: 4, fontSize: Platform.OS === 'ios' ? normalize(9) : normalize(10), fontWeight: '400', flexWrap: 'wrap' }}>{Translate('artmuseumstyle')}</Text>
                                </View> */}
                                </View>
                            }
                            <View style={styles.sharingContainer}>


                                <View style={{
                                    marginTop: 10,
                                    width: SCREEN_WIDTH,
                                    height: this.state.userCheck ? 1 : 0,
                                    backgroundColor: '#d8d8d8'
                                }} />

                                {
                                    this.state.userCheck ?
                                        <View style={styles.sharingBtnContainer}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.setState({ 
                                                        paused: true,
                                                        index: 0,
                                                        imgHeight: SCREEN_HEIGHT * 0.3,
                                                        indicatorMarginTop: global.indicatorMarginTop,
                                                        userCheck: false,
                                                        detailData: '',
                                                        memberData: [],
                                                        date: '',
                                                        private: '',
                                                        changeP: '',
                                                        videoPath: '',
                                                        isVideo: false,
                                                        noImage: false,
                                                        paused: false,
                                                        progress: 0,
                                                        duration: 0,
                                                        timeImage: [],
                                                        imageArrayCheck: false,
                                                        base64file: '',
                                                        firstImgURl: '',
                                                        data: [
                                                            {
                                                                image: 'https://images.unsplash.com/photo-1567226475328-9d6baaf565cf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60'
                                                            },
                                                        ],
                                                        translatedText: '',
                                                        isHeight: false,
                                                        isLoading: true,
                                                        otaData: [],
                                                        otaImageUri: [],
                                                        isYouTube: false,
                                                        youtubeId: '',
                                                        translationPlaceText: '',
                                                        isTrans: false,
                                                        lang: setDeviceLang(), 
                                                    })
                                                    navigation.navigate('Write', {
                                                        modiImages: this.state.timeImage,
                                                        modiData: this.state.detailData,
                                                        isModi: true,
                                                        qnaId: '',

                                                    })
                                                }}>
                                                <Image style={styles.editImg} source={require('../../images/pen.png')} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (this.state.private == 'Y') {
                                                        this.setState({ changeP: 'N' })
                                                        this.privateTimeline('N')
                                                    } else {
                                                        this.setState({ changeP: 'Y' })
                                                        this.privateTimeline('Y')
                                                    }
                                                }}
                                            >
                                                <Image style={styles.lockImg} source={this.state.private == 'Y' ? require('../../images/lock.png') : require('../../images/shiels_r.png')} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.deleteAlert()
                                                }}>
                                                <Image style={styles.deleImg} source={require('../../images/deletebt.png')} />
                                            </TouchableOpacity>
                                        </View>

                                        : null
                                }

                                {global.user.id == this.state.memberData.id ?

                                    <View>


                                        <View style={{
                                            width: SCREEN_WIDTH,
                                            height: 1,
                                            backgroundColor: '#d8d8d8',
                                        }} />

                                        <View style={{ marginTop: 11 }}>
                                            <Text style={{ color: '#878787', alignSelf: 'center' }}>{Translate('fra_setting_experien')}</Text>
                                            <View style={{ marginTop: 10, justifyContent: 'space-between', flexDirection: 'row', marginLeft: '16%', marginRight: '17%' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        // this.convert64base()
                                                        this.instagramShare()
                                                    }}
                                                    style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Image style={styles.SnsImage} source={require('../../images/insta_bg.png')} />
                                                    <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_insta')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.snsShare()
                                                    }}
                                                    style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Image style={styles.SnsImage} source={require('../../images/kakao_bg.png')} />
                                                    <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_kakao')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        // this.shareNaverBlog()
                                                        this.snsShare()
                                                    }}
                                                    style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Image style={styles.SnsImage} source={require('../../images/ic_line.png')} />
                                                    <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_line')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.facebookShare()
                                                    }}
                                                    style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Image style={styles.SnsImage} source={require('../../images/face_bg.png')} />
                                                    <Text style={{ marginTop: 5, textAlign: 'center', color: '#878787', fontSize: normalize(9) }}>{Translate('fra_setting_facebook')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={styles.line} />
                                    </View>
                                    : null
                                }

                                {
                                    this.state.detailData !== '' && <View>
                                        <Text style={styles.otaText}>{Translate('OTA')}</Text>
                                        <SwiperFlatList
                                            autoplayDelay={2}
                                            autoplayLoop
                                            style={{ marginBottom: 20 }}
                                            index={0}
                                            data={this.state.otaData.length === 0 ? null : this.state.otaImageUri}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        navigation.navigate('OtaDetail');
                                                    }}>
                                                    <Image
                                                        resizeMode={'contain'}
                                                        style={{ width: SCREEN_WIDTH, height: this.state.otaImageUri.length === 0 ? 0 : SCREEN_HEIGHT * 0.2, marginBottom: 20, alignSelf: 'center' }}
                                                        source={{ uri: item.image }}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                }

                            </View>
                        </View>
                    </ScrollView>
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
                {/* </SafeAreaView> */}
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollContainer: {
        flex: 1,
        justifyContent: 'flex-start'
    },
    touchContainer: {
        width: SCREEN_WIDTH * 0.11,
        marginTop: (Platform.OS === 'ios') ? statusbar_Height : 0,
        position: 'absolute',
        backgroundColor: 'red'
    },
    transContainer: {
        height: 15,
        marginTop: 12,
        marginRight: 12,
        justifyContent: 'flex-end'
    },
    topContainer: {
        justifyContent: 'flex-start'
    },
    headerContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: (Platform.OS === 'ios') ? statusbar_Height : 0,
        position: 'absolute',
    },
    contentContainer: {
        justifyContent: 'flex-start',
        marginTop: SCREEN_HEIGHT * 0.08,
        paddingHorizontal: SCREEN_WIDTH * 0.0639
    },
    sharingContainer: {
        flex: 1,
        marginTop: SCREEN_HEIGHT * 0.0344,
        justifyContent: 'space-between'
    },
    tagContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: SCREEN_WIDTH * 0.02,
        marginTop: SCREEN_HEIGHT * 0.0156,
    },
    sharingBtnContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    line: {
        marginTop: 10,
        width: SCREEN_WIDTH,
        height: 1,
        backgroundColor: '#d8d8d8',
        marginBottom: 15
    },
    backImg: {
        width: 18,
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-start',
        marginVertical: SCREEN_HEIGHT * 0.024,
        marginLeft: SCREEN_WIDTH * 0.07,
        marginRight: 5
    },
    titleImg: {
        width: SCREEN_WIDTH * 0.2278,
        height: SCREEN_HEIGHT * 0.0369,
        resizeMode: 'contain',
        marginTop: SCREEN_HEIGHT * 0.015,
    },
    userNameText: {
        fontSize: normalize(12),
        color: '#878787',
        fontWeight: 'bold',
        marginTop: SCREEN_WIDTH * 0.019
    },
    placeText: {
        width: '100%',
        fontSize: normalize(11),
        fontWeight: '300',
        color: '#878787'
    },
    timeText: {
        width: '100%',
        fontSize: normalize(11),
        fontWeight: '300',
        color: '#878787',
        marginTop: 2
    },
    contentText: {
        width: '100%',
        fontSize: normalize(12),
        fontWeight: '400',
        color: '#878787',
        marginTop: SCREEN_HEIGHT * 0.0156
    },
    editImg: {
        width: SCREEN_WIDTH * 0.04,
        height: SCREEN_WIDTH * 0.04,
        resizeMode: 'contain',
        marginVertical: SCREEN_HEIGHT * 0.014,
        marginRight: SCREEN_WIDTH * 0.04
    },
    lockImg: {
        width: SCREEN_WIDTH * 0.04,
        height: SCREEN_WIDTH * 0.04,
        resizeMode: 'contain',
        marginVertical: SCREEN_HEIGHT * 0.014,
        marginLeft: SCREEN_WIDTH * 0.04,
        marginRight: SCREEN_WIDTH * 0.04
    },
    deleImg: {
        width: SCREEN_WIDTH * 0.04,
        height: SCREEN_WIDTH * 0.04,
        resizeMode: 'contain',
        marginVertical: SCREEN_HEIGHT * 0.014,
        marginLeft: SCREEN_WIDTH * 0.04
    },
    SnsImage: {
        height: 44,
        width: 44,
        marginRight: '7%'
    },
    otaText: {
        marginLeft: SCREEN_WIDTH * 0.04,
        fontSize: normalize(12),
        color: '#878787'
    }
});