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
    ActivityIndicator
} from 'react-native';

import Toast from 'react-native-root-toast';
import axios from 'axios';
import Translate from '../../languages/Translate';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import AppStatusBar from '../../components/AppStatusBar';

import { translate } from 'i18n-js';
import { back } from 'react-native/Libraries/Animated/src/Easing';
import { Dialog } from 'react-native-simple-dialogs';
import {
    WheelPicker,
    TimePicker,
    DatePicker
} from "react-native-wheel-picker-android";
import { setDeviceLang } from '../../utils/Utils';
import { setItemToAsync } from '../../utils/AsyncUtil';
import { encryption } from '../../utils/Encryption';


const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;

const codeArray = ["+82", "+376", "+971", "+93", "+355", "+374", "+599", "+244", "+672", "+54", "+43", "+61", "+297", "+994", "+387", "+880", "+32", "+226", "+359", "+973", "+257", "+229", "+590", "+673", "+591", "+55", "+975", "+267", "+375", "+501", "+1", "+61", "+243", "+236", "+242", "+41", "+225", "+682", "+56", "+237", "+86", "+57", "+506", "+53", "+238", "+61", "+357", "+420", "+49", "+253", "+45", "+213", "+593", "+372", "+20", "+291", "+34", "+251", "+358", "+679", "+500", "+691", "+298", "+33", "+241", "+44", "+995", "+233", "+350", "+299", "+220", "+224", "+240", "+30", "+502", "+245", "+592", "+852", "+504", "+385", "+509", "+36", "+62", "+353", "+972", "+44", "+91", "+964", "+98", "+39", "+962", "+81", "+254", "+996", "+855", "+686", "+269", "+850", "+965", "+7", "+856", "+961", "+423", "+94", "+231", "+266", "+370", "+352", "+371", "+218", "+212", "+377", "+373", "+382", "+261", "+692", "+389", "+223", "+95", "+976", "+853", "+222", "+356", "+230", "+960", "+265", "+52", "+60", "+258", "+264", "+687", "+227", "+234", "+505", "+31", "+47", "+977", "+674", "+683", "+64", "+968", "+507", "+51", "+689", "+675", "+63", "+92", "+48", "+508", "+870", "+1", "+351", "+680", "+595", "+974", "+40", "+381", "+7", "+250", "+966", "+677", "+248", "+249", "+46", "+65", "+290", "+386", "+421", "+232", "+378", "+221", "+252", "+597", "+239", "+503", "+963", "+268", "+235", "+228", "+66", "+992", "+690", "+670", "+993", "+216", "+676", "+90", "+688", "+886", "+255", "+380", "+256", "+1", "+598", "+998", "+39", "+58", "+84", "+678", "+681", "+685", "+967", "+262", "+27", "+260", "+263"]

const friendRenderItem = ({ item, index }) => {
    console.log('cantHere?', item.name)
    return (
        <View style={styles.listView}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={styles.profileView}>
                    <Image
                        style={{ resizeMode: 'contain', width: SCREEN_WIDTH * 0.08, height: SCREEN_WIDTH * 0.08, borderRadius: (SCREEN_WIDTH * 0.08) / 2, resizeMode: 'cover' }}
                        source={item.profile == '' ? item.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + item.profile }} />
                </View>
                <View style={{ width: SCREEN_WIDTH * 0.7 }}>
                    <Text style={{ fontSize: normalize(12), color: '#4a4a4a', paddingLeft: 10 }} >{item.name}</Text>
                </View>
                <View style={styles.addContainer}>
                    <TouchableWithoutFeedback onPress={() => {
                        console.log('답변 click')
                    }}>
                        <Image
                            style={{ resizeMode: 'contain', width: SCREEN_WIDTH * 0.05, height: SCREEN_WIDTH * 0.05 }}
                            source={require('../../images/icon_add.png')} />
                    </TouchableWithoutFeedback>
                </View>
            </View>
        </View>
    );
};



export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class AddFriend extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: this.props.navigation.state.params.email,
            phone: this.props.navigation.state.params.phone,
            manageFriends: this.props.navigation.state.params.manageFriends,
            textIsNull: true,
            dataLoadingDone: false,
            inputText: '',
            type: '',
            friends: '',
            name: '',
            code: '+82',
            codeSelected: 0,
            isLoading: false,
            dataNothing: false,
            lang: setDeviceLang(),
            friendsList: [],
            textIsEmpty: true,
            findFriend: [],
        };
    }

    selectedPhone() {
        this.setState({ phone: true, email: false, manageFriends: false, friends: '' });
    }

    selectedEmail() {
        this.setState({ phone: false, email: true, manageFriends: false, friends: '' });
    }

    selectedManageFriends() {
        this.setState({ phone: false, email: false, manageFriends: true, friends: '' }, () => {
            this.getFriends()
        });
    }

    handleText = text => {
        this.setState({ inputText: text, type: 'name' })
    }

    handleEmailText = text => {
        this.setState({ inputText: text, type: 'id' })
    }

    handleFriends = text => {
        if (text == '') {
            this.setState({ inputText: text })
            this.setState({ textIsEmpty: true })
        } else {
            this.setState({ inputText: text })
            this.setState({ textIsEmpty: false })
        }
    }

    openCode = show => {
        this.setState({ showCode: show });
    }

    handleNameText = text => {
        this.setState({ type: 'name' })
        this.setState({ name: text }, () => {
            console.log('name:', text)
        })

    }

    onItemSelected = selectedItem => {
        this.setState({ codeSelected: selectedItem })
    };


    findFriends() {
        var self = this
        if (this.state.type == 'name') {
            if (this.state.name === '') {
                if (Platform.OS === 'ios') {
                    Toast.show(`${Translate('enteryourname')}`, {
                        duration: 2000
                    })
                } else {
                    Toast.show(`${Translate('enteryourname')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                }
                // Toast.show(`${Translate('enteryourname')}`)
                this.phone.focus();
                return
            }
            if (this.state.inputText === '') {
                if (this.state.phone) {
                    if (Platform.OS === 'ios') {
                        Toast.show(`${Translate('enteryouraddress')}`, {
                            duration: 2000
                        })
                    } else {
                        Toast.show(`${Translate('enteryouraddress')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                    }
                    // Toast.show(`${Translate('enteryouraddress')}`)
                    this.txtPhone.focus();
                } else {
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
                    this.txtEmail.focus();
                }
                return
            } else if (this.state.inputText === global.user.phone) {
                Toast.show('자기 자신은 추가 할 수 없습니다.', {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
                // Toast.show('자기 자신은 추가 할 수 없습니다.')
                console.log('자기 자신 추가 안됨.')
            } else {
                const encryptedPhone = encryption(this.state.inputText);
                var bodyFormData = new FormData();
                bodyFormData.append('member_id', global.user.id);
                bodyFormData.append('phone', encryptedPhone);
                // bodyFormData.append('phone', this.state.inputText);
                bodyFormData.append('name', this.state.name);
                bodyFormData.append('search_type', 'phone');
                console.log('add formdata: ', bodyFormData)

                let url = global.server + `/api/member/search_member`
                console.log(url)

                axios.post(url, bodyFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                    .then(function (response) {
                        console.log('friend: ', response.data)
                        if (response.data.result === 'ok') {
                            if (response.data.member != null && response.data.member != '') {
                                console.log('is friend')
                                this.setState({ friends: response.data.member, dataNothing: true, dataLoadingDone: true }, () => {
                                });
                            } else {
                                console.log('is not friend')
                                Toast.show(`${Translate('add_friends_empty')}`, {
                                    duration: 2000,
                                    position: Toast.positions.CENTER
                                })
                                // Toast.show(`${Translate('add_friends_empty')}`)
                                this.setState({ friends: '', dataNothing: false }, () => {
                                });
                            }
                        } else {
                            Toast.show(`${Translate('add_friends_empty')}`, {
                                duration: 2000,
                                position: Toast.positions.CENTER
                            })
                            // Toast.show(`${Translate('add_friends_empty')}`)
                            this.setState({ friends: '' }, () => {
                            });
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
        } else {
            if (this.state.inputText === '') {
                if (this.state.phone) {
                    if (Platform.OS === 'ios') {
                        Toast.show(`${Translate('enteryouraddress')}`, {
                            duration: 2000
                        })
                    } else {
                        Toast.show(`${Translate('enteryouraddress')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                    }
                    // Toast.show(`${Translate('enteryouraddress')}`)
                    this.txtPhone.focus();
                } else {
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
                    this.txtEmail.focus();
                }
                return
            } else if (this.state.inputText === global.user.email) {
                Toast.show('자기 자신은 추가 할 수 없습니다.', {
                    duration: 2000,
                    position: Toast.positions.CENTER
                })
                // Toast.show('자기 자신은 추가 할 수 없습니다.')
                console.log('자기 자신 추가 안됨.!!!')
            } else {
                const encryptedEmail = encryption(this.state.inputText);
                var bodyFormData = new FormData();
                bodyFormData.append('member_id', global.user.id);
                bodyFormData.append('search_type', this.state.type);
                bodyFormData.append('email', encryptedEmail);
                // bodyFormData.append('email', this.state.inputText);


                let url = global.server + `/api/member/search_member`
                console.log(url)
                console.log('formdata: ', bodyFormData)

                axios.post(url, bodyFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                    .then(function (response) {
                        console.log('data =', response.data);

                        if (response.data.result === 'ok') {
                            this.setState({ friends: response.data.member }, () => {
                            });
                            this.setState({ dataLoadingDone: true })
                        } else {
                            Toast.show(`${Translate('add_friends_empty')}`, {
                                duration: 2000,
                                position: Toast.positions.CENTER
                            })
                            // Toast.show(`${Translate('add_friends_empty')}`)
                            this.setState({ friends: '', dataLoadingDone: true }, () => {
                            });
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
        }
    }

    addFiends() {

        var bodyFormData = new FormData();
        bodyFormData.append('pem_id', this.state.friends.id);
        bodyFormData.append('member_id', global.user.id);

        let url = global.server + `/api/member/add_friend`
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('addData =', response.data);

                if (response.data.result === 'ok') {
                    Toast.show(`${Translate('add_friends')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('add_friends')}`)
                } else {
                    Toast.show(`${Translate('add_friends_already')}`, {
                        duration: 2000,
                        position: Toast.positions.CENTER
                    })
                    // Toast.show(`${Translate('add_friends_already')}`)
                }
                this.setState({ isLoading: false })
            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                }
                else {
                    console.log(error)
                }
                this.setState({ isLoading: false })
            });
    }

    getFriends() {
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);

        let url = global.server + `/api/member/my_friend`
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('getFriendsData =', response.data);

                if (response.data.result === 'ok') {
                    this.setState({ friendsList: response.data.friend });
                } else {

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

    delFriends = (pid) => {
        console.log('pid =', pid)
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        bodyFormData.append('pem_id', pid);


        let url = global.server + `/api/member/del_friend`
        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('delData =', response.data);

                if (response.data.result === 'ok') {
                    setItemToAsync('friends', 'delete');
                    this.getFriends()
                } else {
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

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
            'willFocus',
            () => {
                if (this.state.manageFriends) {
                    this.getFriends()
                }
            }
        );
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.willFocusMount.remove();
    }

    findMyFriends() {
        var self = this
        if (this.state.inputText === '') {
            Toast.show(`${Translate('enteryourname')}`, {
                duration: 2000,
                position: Toast.positions.CENTER
            })
            // Toast.show(`${Translate('enteryourname')}`)
        } else if (this.state.inputText === global.user.name) {
            console.log('자기 자신')
        } else {
            let search_type
            let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
            if (reg.test(this.state.inputText)) {
                search_type = 'email'
            } else {
                search_type = 'name'
            }
            console.log('email?', reg.test(this.state.inputText))
            console.log('SearchType : ', search_type)

            var bodyFormData = new FormData();
            bodyFormData.append('member_id', global.user.id);
            bodyFormData.append('search_type', search_type);
            bodyFormData.append('name', this.state.inputText);

            console.log('findFriend formdata: ', bodyFormData)

            let url = global.server + `/api/member/search_member`

            axios.post(url, bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then(function (response) {
                    console.log('data =', response.data);
                    let dataReturn = response.data.result
                    if (dataReturn === 'ok') {
                        let data = response.data.member
                        data = data.filter((item) => item.id != global.user.id && item.friend_yn == 'Y')
                        console.log('filtering =', data);

                        if (data.length == 0) {
                            Toast.show(`${Translate('add_friends_empty')}`, {
                                duration: 2000,
                                position: Toast.positions.CENTER
                            })
                            // Toast.show(`${Translate('add_friends_empty')}`)
                        } else {
                            console.log('가공 데이터  =', data);
                            this.setState({ findFriend: data }, () => {

                            });
                        }
                    } else {
                        Toast.show(`${Translate('add_friends_empty')}`, {
                            duration: 2000,
                            position: Toast.positions.CENTER
                        })
                        // Toast.show(`${Translate('add_friends_empty')}`)
                    }
                }.bind(this))
                .catch(function (error) {
                    if (error.response != null) {
                        console.log('error =', error.response.data)
                    }
                    else {
                        console.log(error)
                    }
                });
        }
    }



    friendMyRenderItem = ({ item, index }) => {
        console.log('item??', item)
        return (
            <View style={styles.listView}>
                <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                    <View style={styles.profileView}>
                        <Image
                            style={{ width: SCREEN_WIDTH * 0.08, height: SCREEN_WIDTH * 0.08, borderRadius: (SCREEN_WIDTH * 0.08) / 2, resizeMode: 'cover', }}
                            source={item.profile == null ? item.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + item.profile }} />
                    </View>
                    <View style={{ paddingLeft: SCREEN_WIDTH * 0.028 }}>
                        <Text style={{ fontSize: normalize(13), color: '#000000' }} >{item.name}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8 }}>
                    <View style={styles.delContainer}>
                        <TouchableWithoutFeedback onPress={() => {
                            this.delFriends(item.id)
                        }}>
                            <Text style={{ fontSize: normalize(13), color: '#dd2326', fontWeight: 'bold' }}>{Translate('delete_message')}</Text>
                        </TouchableWithoutFeedback>
                    </View>
                </View>
            </View>
        );
    };

    findFriendRenderItem = ({ item, index }) => {
        console.log('check Item', item)
        if (item.member !== null) {
            return (
                <View style={styles.listView}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <View style={styles.profileView}>
                            <Image
                                style={{ width: SCREEN_WIDTH * 0.08, height: SCREEN_WIDTH * 0.08, borderRadius: (SCREEN_WIDTH * 0.08) / 2, resizeMode: 'cover', }}
                                source={item.member.profile === null ? item.member.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + item.member.profile }} />
                        </View>
                        <View style={{ paddingLeft: SCREEN_WIDTH * 0.028 }}>
                            <Text style={{ fontSize: normalize(13), color: '#000000' }} >{item.member.name}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8 }}>
                        {/* <View style={styles.addContainer}>
                        <TouchableWithoutFeedback onPress={() => {
                                console.log('답변 click')
                            }}>
                                <Text style={{ fontSize: normalize(13), color: '#4a4a4a', fontWeight: 'bold'}}>{Translate('share')}</Text>
                            </TouchableWithoutFeedback>
                            </View> */}
                        <View style={styles.delContainer}>
                            <TouchableWithoutFeedback onPress={() => {
                                this.delFriends(item.member.id)
                            }}>
                                <Text style={{ fontSize: normalize(13), color: '#dd2326', fontWeight: 'bold' }}>{Translate('delete_message')}</Text>
                            </TouchableWithoutFeedback>
                        </View>
                    </View>
                </View>
            );
        } else {
            return null
        }

    };

    render() {
        const { isLoading } = this.state;
        const { navigation } = this.props;
        console.log('button type: ', this.state.manageFriends)
        console.log('Platform Width&Height : ', SCREEN_WIDTH, '&', SCREEN_HEIGHT)
        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.textStyle}>{Translate('addusersettings')}</Text>
                                <TouchableOpacity onPress={() => { navigation.goBack() }} style={{ position: 'absolute', height: '100%' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 18, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        {/* 스크롤뷰 수정 */}
                        <ScrollView
                            keyboardShouldPersistTaps='handled'
                        >
                            <View style={{ flexDirection: 'row', marginTop: 0 }}>
                                <TouchableOpacity
                                    onPress={this.selectedPhone.bind(this)}
                                    style={{
                                        width: SCREEN_WIDTH * 1 / 3,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: normalize(13),
                                            color: this.state.phone ? '#000000' : '#9B9B9B',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {Translate('searchphone')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={this.selectedEmail.bind(this)}
                                    style={{
                                        width: SCREEN_WIDTH * 1 / 3,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: normalize(13),
                                            color: this.state.email ? '#000000' : '#9B9B9B',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {Translate('search_id')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={this.selectedManageFriends.bind(this)}
                                    style={{
                                        width: SCREEN_WIDTH * 1 / 3,
                                        height: 48,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: normalize(13),
                                            color: this.state.manageFriends ? '#000000' : '#9B9B9B',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {Translate('view_my_friends')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', marginTop: 7.5 }}>
                                <View style={{ backgroundColor: this.state.phone ? '#000000' : '#fff', height: 3, width: SCREEN_WIDTH * 1 / 3 }} />
                                <View style={{ backgroundColor: this.state.email ? '#000000' : '#fff', height: 3, width: SCREEN_WIDTH * 1 / 3 }} />
                                <View style={{ backgroundColor: this.state.manageFriends ? '#000000' : '#fff', height: 3, width: SCREEN_WIDTH * 1 / 3 }} />
                            </View>
                            <View style={{ backgroundColor: '#e1e1e1', height: 1 }} />

                            {this.state.phone ?
                                <View style={styles.searchContainer}>
                                    <TextInput
                                        onChangeText={this.handleNameText}
                                        style={{
                                            flex: 1,
                                            fontWeight: '500',
                                            fontSize: SCREEN_HEIGHT / SCREEN_WIDTH > 2 ? normalize(11.5) : normalize(12),
                                            color: '#b7b7b7',
                                            paddingVertical: Platform.OS === 'ios' ? 5 : 1,
                                        }}
                                        ref={(ref) => {
                                            this.phone = ref
                                        }}
                                        underlineColorAndroid="transparent"
                                        placeholder={Translate('enteryourname')}
                                        textAlign={'center'}
                                        textAlignVertical={'center'}
                                        autoCorrect={false}
                                        placeholderTextColor="#878787"
                                        autoCapitalize='none'
                                        returnKeyType='done'
                                    />
                                </View>

                                :
                                null
                            }
                            {
                                !this.state.manageFriends && <View style={{
                                    height: SCREEN_HEIGHT * 0.05,
                                    alignSelf: 'center',
                                    backgroundColor: 'transparent',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    borderRadius: 17.5,
                                    borderColor: '#d1d1d1',
                                    borderWidth: 1,
                                    marginTop: this.state.phone ? SCREEN_HEIGHT * 0.01 : SCREEN_HEIGHT * 0.05,
                                    marginLeft: SCREEN_WIDTH * 0.05,
                                    marginRight: SCREEN_WIDTH * 0.05
                                }}>


                                    {this.state.phone && <View style={{ height: SCREEN_HEIGHT * 0.05 }}>
                                        <TouchableOpacity
                                            onPress={() => this.openCode(true)}>
                                            <View
                                                style={{
                                                    width: 70,
                                                    alignItems: 'center',
                                                    paddingLeft: 4,
                                                    marginTop: SCREEN_HEIGHT / SCREEN_WIDTH > 2 ? 9 : 4,
                                                    justifyContent: 'space-between',
                                                    flexDirection: 'row',
                                                }}>
                                                <Text
                                                    style={{
                                                        flex: 1,
                                                        color: '#000000',
                                                        fontSize: SCREEN_HEIGHT / SCREEN_WIDTH > 2 ? normalize(12.5) : normalize(13),
                                                        fontWeight: '300',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {this.state.code}
                                                </Text>
                                                <Image
                                                    resizeMode={'center'}
                                                    style={{ width: 10, height: 10, marginEnd: 7, alignItems: 'center' }}
                                                    source={require('../../images/down_arrow.png')}>
                                                </Image>
                                                <View style={{ height: '100%', width: 1, marginLeft: 2, backgroundColor: '#bcbcbc' }} />
                                            </View>

                                        </TouchableOpacity>

                                        <Dialog
                                            animationType="fade"
                                            contentStyle={{
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#fff',
                                            }}
                                            dialogStyle={{ backgroundColor: '#fff' }}
                                            onTouchOutside={() => this.openCode(false)}
                                            visible={this.state.showCode}
                                        >
                                            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                                                <WheelPicker
                                                    style={Platform.OS === 'ios' ? { width: 200 } : { width: 200, height: 80 }}
                                                    selectedItem={this.state.codeSelected}
                                                    data={codeArray}
                                                    onItemSelected={this.onItemSelected}
                                                />
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.setState({ code: codeArray[this.state.codeSelected] })
                                                    this.openCode(false);
                                                }}
                                                style={{
                                                    marginTop: 10,
                                                    marginLeft: 28,
                                                    marginRight: 27,
                                                    width: 200,
                                                    height: 48,
                                                    borderRadius: 5,
                                                    backgroundColor: '#FF0000',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, color: '#fff' }}>{Translate('confirm')}</Text>
                                            </TouchableOpacity>
                                        </Dialog>


                                    </View>

                                    }

                                    {
                                        this.state.phone && <TextInput
                                            onChangeText={this.handleText}
                                            ref={(ref) => {
                                                this.txtPhone = ref
                                            }}
                                            style={{
                                                flex: 1,
                                                fontWeight: '500',
                                                fontSize: SCREEN_HEIGHT / SCREEN_WIDTH > 2 ? normalize(11.5) : normalize(12),
                                                color: '#b7b7b7',
                                                paddingVertical: Platform.OS === 'ios' ? 5 : 1,
                                            }}
                                            underlineColorAndroid="transparent"
                                            keyboardType={'numeric'}
                                            placeholder={Translate('enteryouraddress')}
                                            textAlign={'center'}
                                            placeholderTextColor="#878787"
                                            textAlignVertical={'center'}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType='done' />
                                    }

                                    {
                                        this.state.email && <TextInput
                                            placeholderTextColor="#878787"
                                            keyboardType="email-address"
                                            onChangeText={this.handleEmailText}
                                            ref={(ref) => {
                                                this.txtEmail = ref
                                            }}
                                            style={{
                                                flex: 1,
                                                fontWeight: '500',
                                                fontSize: SCREEN_HEIGHT / SCREEN_WIDTH > 2.1 ? normalize(11.5) : normalize(12),
                                                color: '#b7b7b7',
                                                paddingVertical: Platform.OS === 'ios' ? 5 : 1,
                                            }}
                                            underlineColorAndroid="transparent"
                                            placeholder={Translate('enter_email')}
                                            textAlign={'center'}
                                            textAlignVertical={'center'}
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            autoCapitalize="none" />
                                    }
                                    {
                                        this.state.manageFriends ? null : <TouchableWithoutFeedback
                                            style={{ padding: 13 }}
                                            onPress={() => {
                                                this.findFriends()
                                            }}>
                                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <Image
                                                    style={styles.searchImg}
                                                    source={require('../../images/search.png')} />
                                            </View>
                                        </TouchableWithoutFeedback>

                                    }

                                </View>
                            }

                            {
                                (this.state.friends === '' || this.state.friends === null) ? !this.state.manageFriends && <View style={{ flex: 1, marginTop: SCREEN_HEIGHT * 0.22, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 }}>
                                    {
                                        this.state.phone ?
                                            <Text style={{ fontSize: this.state.lang === 'en' ? SCREEN_WIDTH / 26 : normalize(15), fontWeight: '400', color: '#0c6e87', textAlign: 'center' }}>{Translate('searchphonenumber')}</Text>
                                            : <Text style={{ fontSize: this.state.lang === 'en' ? SCREEN_WIDTH / 26 : normalize(15), fontWeight: '400', color: '#0c6e87', textAlign: 'center' }}>{Translate('newfriendid')}</Text>
                                    }
                                    {
                                        this.state.phone ?
                                            this.state.lang === 'ko' || this.state.lang === 'ja' ?
                                                <View>
                                                    <Text style={{ fontSize: this.state.lang === 'en' ? SCREEN_WIDTH / 34 : normalize(13), fontWeight: '400', color: '#999999', textAlign: 'center', marginTop: this.state.lang === 'en' || this.state.lang === 'ko' ? 0 : 4 }}>{Translate('addphonenumber')}</Text>
                                                    <Text style={{ fontSize: this.state.lang === 'en' ? SCREEN_WIDTH / 34 : normalize(13), fontWeight: '400', color: '#999999', textAlign: 'center', marginTop: this.state.lang === 'en' || this.state.lang === 'ko' ? 0 : 4 }}>{Translate('phonenumber_zero')}</Text>
                                                </View>
                                                :
                                                <Text style={{ fontSize: this.state.lang === 'en' ? SCREEN_WIDTH / 34 : normalize(13), fontWeight: '400', color: '#999999', textAlign: 'center', marginTop: this.state.lang === 'en' || this.state.lang === 'ko' ? 0 : 4 }}>{Translate('addphonenumber')}</Text>

                                            : <Text style={{ fontSize: this.state.lang === 'en' ? SCREEN_WIDTH / 34 : normalize(13), fontWeight: '400', color: '#999999', textAlign: 'center', marginTop: this.state.lang === 'en' || this.state.lang === 'ko' ? 0 : 4 }}>{Translate('addenterid')}</Text>

                                    }
                                </View> : !this.state.manageFriends && <View style={styles.listView}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={styles.profileView}>
                                            <Image
                                                style={{ resizeMode: 'cover', width: SCREEN_WIDTH * 0.08, height: SCREEN_WIDTH * 0.08, borderRadius: (SCREEN_WIDTH * 0.08) / 2, }}
                                                source={(this.state.friends.profile === null || this.state.friends.profile === '') ? this.state.friends.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + this.state.friends.profile }} />
                                        </View>
                                        <View style={{ width: SCREEN_WIDTH * 0.7 }}>
                                            <Text style={{ fontSize: normalize(12), color: '#4a4a4a', paddingLeft: 10 }} >{this.state.friends.name}</Text>
                                        </View>
                                        <View style={styles.addContainer}>
                                            <TouchableWithoutFeedback onPress={() => {
                                                this.setState({ isLoading: true })
                                                this.addFiends();
                                            }}>
                                                <Image
                                                    style={{ resizeMode: 'contain', width: SCREEN_WIDTH * 0.08, height: SCREEN_WIDTH * 0.05 }}
                                                    source={require('../../images/icon_add.png')} />
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                this.state.manageFriends && <View>
                                    <View style={styles.searchContainer}>
                                        <TextInput
                                            onChangeText={this.handleFriends}
                                            style={styles.input}
                                            placeholderTextColor="#878787"
                                            underlineColorAndroid="transparent"
                                            placeholder={Translate('enter_email_or_name')}
                                            textAlign={'center'}
                                            autoCorrect={false}
                                            textAlignVertical={'center'}
                                            autoCapitalize="none"
                                            returnKeyType="done" />
                                        <TouchableWithoutFeedback
                                            onPress={() => {
                                                if (this.state.inputText === '') {
                                                    this.getFriends()
                                                } else {
                                                    this.findMyFriends()
                                                }
                                            }}
                                        >
                                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <Image
                                                    style={styles.searchImg}
                                                    source={require('../../images/search.png')} />
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </View>
                                    {this.state.textIsEmpty ?
                                        <FlatList
                                            style={{ flex: 1, marginTop: 36 }}
                                            data={this.state.friendsList}
                                            renderItem={this.findFriendRenderItem}
                                            keyExtractor={item => item.id}
                                        >
                                        </FlatList>
                                        :
                                        <FlatList
                                            style={{ flex: 1, marginTop: 36 }}
                                            data={this.state.findFriend}
                                            renderItem={this.friendMyRenderItem}
                                            keyExtractor={item => item.id}
                                        >
                                        </FlatList>
                                    }
                                </View>
                            }
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
    searchContainer: {
        height: SCREEN_HEIGHT * 0.05,
        alignSelf: 'center',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 17.5,
        borderColor: '#d1d1d1',
        borderWidth: 1,
        marginTop: SCREEN_HEIGHT * 0.05,
        marginLeft: SCREEN_WIDTH * 0.05,
        marginRight: SCREEN_WIDTH * 0.05
    },
    input: {
        flex: 1,
        fontWeight: '500',
        fontSize: SCREEN_HEIGHT / SCREEN_WIDTH > 2 ? normalize(11.5) : normalize(12),
        color: '#b7b7b7',
        paddingVertical: Platform.OS === 'ios' ? 5 : 1,
    },
    searchImg: {
        width: SCREEN_WIDTH * 0.05,
        height: SCREEN_WIDTH * 0.05,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginRight: SCREEN_WIDTH * 0.025,
        marginLeft: SCREEN_WIDTH * 0.025,
    },
    listView: {
        height: 50,
        marginLeft: SCREEN_WIDTH * 0.05,
        marginRight: SCREEN_WIDTH * 0.05,
        justifyContent: 'space-between',
        marginTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center'
    },
    profileView: {
        width: SCREEN_WIDTH * 0.08,
        height: SCREEN_WIDTH * 0.08,
        borderRadius: (SCREEN_WIDTH * 0.08) / 2,
        marginLeft: 3,
    },
    addContainer: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        backgroundColor: '#f0f0f0',
    },

});