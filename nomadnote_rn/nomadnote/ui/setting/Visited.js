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
    PermissionsAndroid,
    TextInput,
    FlatList
} from 'react-native';
import axios from 'axios';
import Translate from '../../languages/Translate';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import AppStatusBar from '../../components/AppStatusBar';
import { translate } from 'i18n-js';
import { back } from 'react-native/Libraries/Animated/src/Easing';
import moment from 'moment-timezone';

const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const pin = require('../../images/pin.png');



export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class Visited extends Component {
    constructor(props) {
        super(props);

        this.state = {
            visited: [],
            lat: 0,
            lang: 0,
            LoadingEnd: false
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.getLocation()
                this.visitedCountry()
            }
        );
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.willFocusMount.remove();
    }

    hasLocationPermissionIOS = async () => {
        const openSetting = () => {
            Linking.openSettings().catch(() => {
                Alert.alert('Unable to open settings');
            });
        };
        const status = await Geolocation.requestAuthorization('whenInUse');

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
            Toast.show('Location permission denied by user.');
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Toast.show('Location permission revoked by user.');
        }

        return false;
    };



    getLocation = async () => {
        const hasLocationPermission = await this.hasLocationPermission();

        if (!hasLocationPermission) {
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => {
                global.lat = position.coords.latitude
                global.lon = position.coords.longitude

                let posi = { ...this.state.initial }

                posi.lat = position.coords.latitude
                posi.long = position.coords.longitude

                this.setState({
                    lat: position.coords.latitude,
                    long: position.coords.longitude,
                    LoadingEnd: true
                }, () => { console.log('lat, long', this.state.lat, this.state.long, this.state.LoadingEnd) })
            },
            (error) => {
                Alert.alert(`Code ${error.code}`, error.message);
                console.log(error);
            },
            {
                accuracy: {
                    android: 'high',
                    ios: 'best',
                },
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
                distanceFilter: 0,
            },
        );
    };

    visitedCountry() {
        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);


        let url = global.server + `/api/nation/getcountry`
        console.log(url)
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("response!", response.data);
                this.setState({
                    visited: response.data.countrys
                })
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

    handlePin = (marker) => {
        console.log('markerCheck', marker.country)
        return (
            <Image resizeMethod={'resize'}
                resizeMode={'contain'}
                style={{ width: 30, height: 35 }} source={require('../../images/marker_icon.png')} />
        )
    }


    renderItem = ({ item, index }) => {
        console.log('유정 언어  : ', global.user.language)
        const CARD_HEIGHT = SCREEN_WIDTH * 0.667;
        var countryName = ""
        if (global.user.language == "ko") {
            countryName = item.country
        } else if (global.user.language == "en") {
            countryName = item.en
        } else if (global.user.language == "ja") {
            countryName = item.ja
        } else if (global.user.language == "zh_rCN") {
            countryName = item.zh_rCN
        } else {
            countryName = item.zh_rTW
        }

        var date = item.recent_wrote_at
        // var subDate = date.substring(0, 10)
        var formDate = moment(date).format("YYYY-MM-DD")
        console.log('country id: ', item.id, countryName)
        return (
            <TouchableWithoutFeedback
                onPress={() => {
                    console.log('card click')
                    this.props.navigation.navigate('VisitedTimeline', { name: countryName, cid: item.id })
                }}>
                <View style={{
                    backgroundColor: '#65939b', width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.07, justifyContent: 'space-between',
                    marginTop: 2, flexDirection: 'row', alignItems: 'center'
                }} >
                    <Image style={{ marginLeft: 25, width: 40, height: 20, resizeMode: 'contain', alignItems: 'center', justifyContent: 'center' }} source={{ uri: global.server + item.image_uri }} />
                    <Text style={{ width: SCREEN_WIDTH * 0.22, marginLeft: 10, color: '#fff', fontSize: normalize(13) }}>{countryName}</Text>
                    <Text style={{ marginLeft: 10, color: '#fff', fontSize: normalize(12) }}>{formDate}</Text>
                    <Text style={{ marginLeft: 30, marginRight: 35, color: '#fff', fontSize: normalize(12) }}>{`${item.count} ${Translate('count')}`}</Text>
                </View>
            </TouchableWithoutFeedback>
        );
    };


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
                                <Text style={styles.textStyle}>{Translate('activity_visit_visited')}</Text>
                                <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ position: 'absolute', height: '100%' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 18, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        <View style={styles.tempView}>
                            {this.state.LoadingEnd ?
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{
                                        width: SCREEN_WIDTH,
                                        height: SCREEN_HEIGHT * 0.37,
                                    }}
                                    initialRegion={{
                                        latitude: this.state.lat,
                                        longitude: this.state.long,
                                        latitudeDelta: 22,
                                        longitudeDelta: 2,
                                    }}>

                                    {this && this.state && this.state.visited.map(
                                        (marker, i) => (
                                            <Marker
                                                key={i}
                                                coordinate={{ latitude: parseFloat(marker.lat), longitude: parseFloat(marker.lng) }}
                                            // onPress={() => this.markerClick(marker)}
                                            >
                                                {this.handlePin(marker)}
                                            </Marker>
                                        ))}

                                </MapView>
                                :
                                null
                            }

                        </View>
                        <FlatList
                            style={{ flex: 1 }}
                            data={this.state.visited}
                            renderItem={this.renderItem}
                            keyExtractor={(item, index) => index.toString()} >
                        </FlatList>
                        <Text style={styles.clickText}>{Translate('clickCountryFeed')}</Text>
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
    clickText: {
        flex: 1,
        fontSize: normalize(15),
        color: '#4a4a4a',
        textAlign: 'center',
    },
    tempView: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.37,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#e7eaed',
        borderWidth: 1
    },
    contentDetail: {
        flexDirection: 'row',
    },
    firstView: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.05,
        justifyContent: 'space-between',
        marginTop: 2,

    }


});