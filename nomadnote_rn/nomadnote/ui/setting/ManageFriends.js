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

import Toast from 'react-native-root-toast';
import axios from 'axios';
import Translate from '../../languages/Translate';
import SetI18nConfig from '../../languages/SetI18nConfig';
import * as RNLocalize from 'react-native-localize';
import AppStatusBar from '../../components/AppStatusBar';

import { translate } from 'i18n-js';
import { back } from 'react-native/Libraries/Animated/src/Easing';

const THEME_COLOR = '#375a64'
const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const win = Dimensions.get('window');
const { width, height } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class ManageFriends extends Component {
    constructor(props) {
        super(props);

        this.state = {
            friendsList: [],
            inputText: '',
            textIsEmpty: true,
            findFriend: []
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.getFriends()
            }
        );
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.willFocusMount.remove();
    }


    handleText = text => {
        if (text == '') {
            this.setState({ inputText: text })
            this.setState({ textIsEmpty: true })
        } else {
            this.setState({ inputText: text })
            this.setState({ textIsEmpty: false })
        }
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
            var bodyFormData = new FormData();
            bodyFormData.append('member_id', global.user.id);
            bodyFormData.append('search_type', 'name');
            bodyFormData.append('name', this.state.inputText);


            let url = global.server + `/api/member/search_member`

            axios.post(url, bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then(function (response) {
                    console.log('data =', response.data.result);
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
                            source={item.profile == null ? item.gender === 'F' ? require('../../images/ic_female.png') : require('../../images/ic_male.png') : { uri: global.server + item.member.profile }} />
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={styles.textStyle}>{Translate('view_my_friends')}</Text>
                                <TouchableOpacity
                                    style={{ position: 'absolute', height: '100%', left: 0 }}
                                    onPress={() => { navigation.goBack() }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 19, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                    </View>
                                </TouchableOpacity>
                                {/* <TouchableOpacity style={{ padding: 17, alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 24, height: 24, marginRight: 12, resizeMode: 'contain' }} source={require('../../images/group_5.png')} />
                                    </View>
                                </TouchableOpacity> */}
                            </View>
                        </LinearGradient>
                        <ScrollView>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    onChangeText={this.handleText}
                                    style={styles.input}
                                    underlineColorAndroid="transparent"
                                    placeholder={Translate('enteryourname')}
                                    textAlign={'center'}
                                    textAlignVertical={'center'}
                                    autoCapitalize="none"
                                    returnKeyType="done" />
                                <TouchableWithoutFeedback
                                    style={{ padding: 12 }}
                                    onPress={() => { this.findMyFriends() }}
                                >
                                    <Image
                                        style={styles.searchImg}
                                        source={require('../../images/search.png')} />
                                </TouchableWithoutFeedback>
                            </View>
                            {this.state.textIsEmpty ?
                                <FlatList
                                    style={{ flex: 1, marginTop: 36 }}
                                    data={this.state.friendsList}
                                    renderItem={this.findFriendRenderItem}
                                    keyExtractor={item => item.member.id}
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
                        </ScrollView>
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
        fontSize: normalize(13),
        color: '#b7b7b7',
        paddingVertical: Platform.OS === 'ios' ? 5 : 1,
    },
    searchImg: {
        width: SCREEN_WIDTH * 0.05,
        height: SCREEN_WIDTH * 0.05,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginRight: SCREEN_WIDTH * 0.025
    },
    listView: {
        height: 50,
        marginLeft: SCREEN_WIDTH * 0.05,
        marginRight: SCREEN_WIDTH * 0.05,
        justifyContent: 'space-between',
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center'
    },
    profileView: {
        width: SCREEN_WIDTH * 0.08,
        height: SCREEN_WIDTH * 0.08,
        borderRadius: (SCREEN_WIDTH * 0.08) / 2,
        padding: 3
    },
    addContainer: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        backgroundColor: '#f0f0f0',
        marginRight: SCREEN_WIDTH * 0.013,
        borderRadius: 2
    },

    delContainer: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        backgroundColor: '#f0f0f0',
        borderRadius: 2
    },

});