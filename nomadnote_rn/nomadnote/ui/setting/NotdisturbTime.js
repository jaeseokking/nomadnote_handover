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
    ActivityIndicator
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
import { Dialog } from 'react-native-simple-dialogs';
import {
    WheelPicker,
    TimePicker,
    DatePicker
} from "react-native-wheel-picker-android";
import { getItemFromAsync, setItemToAsync } from '../../utils/AsyncUtil';



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

const startTimeData = ["AM", "PM"];

const wheelPickerData = [
    "AM",
    "PM",
];
const startHour = [];
const startMin = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
const endPickerData = [
    "AM",
    "PM",
];
const endHour = [];
const endMin = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
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

export default class NotdisturbTime extends Component {
    constructor(props) {
        super(props);

        this.state = {
            startTimeSelected: 0,
            startHourSelected: 0,
            startMinSelected: 0,
            endTimeSelected: 0,
            endHourSelected: 0,
            endMinSelected: 0,
            startDisturb: 'AM 12 : 00',
            endDisturb: 'PM 12 : 00',
            setTime: false,
            setAllTime: false,
            userData: [],
            startAmPm: '',
            endAmPm: '',
            startH: '',
            startM: '',
            endH: '',
            endM: '',
            isLoading: true,
        };
    }

    componentDidMount() {
        RNLocalize.addEventListener('change', this.handleLocalizationChange);
        this.willFocusMount = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.getMyInfo()
            }
        );
    }

    componentWillUnmount() {
        RNLocalize.removeEventListener('change', this.handleLocalizationChange);
        this.willFocusMount.remove();
    }

    getMyInfo() {
        let url = global.server + '/api/member/my_info'
        var self = this

        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log("dataReturn1", response.data.member);
                console.log('endDisturb', response.data.usebytes)
                if (response.data.member.time_notpush_yn === 'Y') {
                    this.setState({ setTime: true })
                } else {
                    this.setState({ setTime: false })
                }

                if (response.data.member.push_block_yn === 'Y') {
                    this.setState({ setAllTime: true })
                } else {
                    this.setState({ setAllTime: false })
                }

                this.setState({
                    userData: response.data.member,
                    isLoading: false,
                }, () => console.log('check setTime = ', this.state.setTime))
                if (response.data.member.start_ampm === null) {
                    this.setState({
                        startDisturb: null
                    })
                } else {
                    this.setState({
                        startDisturb: response.data.member.start_ampm + ' ' + response.data.member.start_time
                    })
                }

                if (response.data.member.end_ampm === null) {
                    this.setState({
                        endDisturb: null
                    })
                } else {
                    this.setState({
                        endDisturb: response.data.member.end_ampm + ' ' + response.data.member.end_time,
                    })
                }

            }.bind(this))
            .catch(function (error) {
                if (error.response != null) {
                    console.log(error.response.data)
                    // Toast.show(error.response.data.message);
                    self.setState({ isLoading: false })

                }
                else {
                    console.log(error)
                    self.setState({ isLoading: false })

                }
            });
    }


    onItemSelected = selectedItem => {
        // this.setState({ selectedItem });
        this.setState({ startTimeSelected: selectedItem })
        console.log('selected', selectedItem)
    };

    onStartHour = sel => {
        this.setState({ startHourSelected: sel })
    }
    onStartMin = sel => {
        this.setState({ startMinSelected: sel })
    }
    onEndTime = sel => {
        this.setState({ endTimeSelected: sel })
    }
    onEndHour = sel => {
        this.setState({ endHourSelected: sel })
    }
    onEndMin = sel => {
        this.setState({ endMinSelected: sel })
    }

    openStartDialog = show => {
        this.setState({ showStartDialog: show });
    }
    openEndDialog = show => {
        this.setState({ showEndDialog: show });
    }

    saveTime(Type) {
        console.log('check start', this.state.endH, this.state.endM, this.state.endAmPm)
        this.setStartTimeEndTime(Type)
    }

    setTimeCheck = () => {
        this.setState(set => ({ setTime: !set.setTime }), () => {
            console.log('check1', this.state.setTime)
            this.allBlock('push')
        })
    }

    setAllTimeCheck = () => {
        this.setState(set => ({ setAllTime: !set.setAllTime }), () => {
            console.log('check2', this.state.setAllTime)
            this.allBlock('block')
        })
    }


   setStartTimeEndTime(AP) {
        console.log('check startDist', this.state.startDisturb)
        console.log('check endDist', this.state.endDisturb)
        var sModi = ''
        var eModi = ''
        var bodyFormData = new FormData();
        if (AP === 'AM') {
            var start = this.state.startDisturb
            sModi = start.split(' ')
            var self = this

            bodyFormData.append('member_id', global.user.id);
            bodyFormData.append('start_ampm', sModi[0]);
            bodyFormData.append('start_time', sModi[1]);
            if (sModi[0] === 'PM') {
                var calHour = sModi[1].split(':')
                let h = parseInt(calHour[0]) + 12
                bodyFormData.append('cal_starttime', h + ':' + calHour[1]);
                console.log('startH !@!@!@!@!' , h)
                setItemToAsync('startH', h);
                setItemToAsync('startM', calHour[1]);
                console.log(sModi)

            } else {
                var calHour = sModi[1].split(':')
                let h = parseInt(calHour[0])
                bodyFormData.append('cal_starttime', sModi[1]);
                setItemToAsync('startH', h);
                setItemToAsync('startM', calHour[1]);


            }
   

            let url = global.server + `/api/member/update_info`
            console.log(url)
            console.log('formdata: ', bodyFormData)

            axios.post(url, bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then(function (response) {
                    console.log('res =', response.data);

                    if (response.data.result === 'ok') {
                        Toast.show(`${Translate('changedInfo')}`)
                    } else {
                        Toast.show(`${Translate('occur_error')}`)
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
        } else {
            var end = this.state.endDisturb
            eModi = end.split(' ')
            bodyFormData.append('member_id', global.user.id);
            bodyFormData.append('end_ampm', eModi[0]);
            bodyFormData.append('end_time', eModi[1]);
            if (eModi[0] === 'PM') {
                var calHour = eModi[1].split(':')
                let h = parseInt(calHour[0]) + 12
                bodyFormData.append('cal_endtime', h + ':' + calHour[1]);
                setItemToAsync('endH', h);
                setItemToAsync('endM', calHour[1]);

            } else {
                var calHour = eModi[1].split(':')
                let h = parseInt(calHour[0])
                bodyFormData.append('cal_endtime', eModi[1]);
                setItemToAsync('endH', h);
                setItemToAsync('endM', calHour[1]);

            }


           


            let url = global.server + `/api/member/update_info`
            console.log(url)
            console.log('formdata: ', bodyFormData)

            axios.post(url, bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then(function (response) {
                    console.log('res =', response.data);

                    if (response.data.result === 'ok') {
                        Toast.show(`${Translate('changedInfo')}`)
                    } else {
                        Toast.show(`${Translate('occur_error')}`)
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


    allBlock(Type) {
        var YN = ''
        var pYN = ''
        if (this.state.setAllTime) {
            YN = 'Y'
        } else {
            YN = 'N'
        }

        if (this.state.setTime) {
            pYN = 'Y'
        } else {
            pYN = 'N'
        }

        var self = this
        var bodyFormData = new FormData();
        bodyFormData.append('member_id', global.user.id);
        console.log('Type : ', Type)
        if (Type === 'block') {
            console.log('???? 여기 ')
            bodyFormData.append('push_block_yn', YN);
        } else {
            bodyFormData.append('time_notpush_yn', pYN);
        }



        let url = global.server + `/api/member/update_info`
        console.log(url)
        console.log('formdata: ', bodyFormData)

        axios.post(url, bodyFormData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(function (response) {
                console.log('res =', response.data);

                if (response.data.result === 'ok') {
                    Toast.show(`${Translate('changedInfo')}`)
                } else {
                    Toast.show(`${Translate('occur_error')}`)
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
    
    makeHourArray() {
        if (startHour.length == 0) {
            var index = 1;

            while (index <= 12) {
                startHour.push(index + '');
                index++;
            }
        }
        return startHour;
    }

    makeHour1Array() {
        if (endHour.length == 0) {
            var index = 1;

            while (index <= 12) {
                endHour.push(index + '');
                index++;
            }
        }
        return endHour;
    }




    render() {
        const { navigation } = this.props;
        let now = new Date()
        console.log('this.state.startDisturb', this.state.startDisturb)
        console.log('this.state.endDisturb', this.state.endDisturb)


        return (
            <>
                <SafeAreaView style={styles.topSafeArea} />
                <SafeAreaView style={styles.bottomSafeArea}>
                    <AppStatusBar backgroundColor={THEME_COLOR} barStyle="light-content" />
                    <View style={styles.container}>
                        <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.textStyle}>{Translate('not_disturb')}</Text>
                                <TouchableOpacity onPress={() => {
                                    navigation.goBack()
                                    this.setState({ startDisturb: '', endDisturb: '' })
                                }} style={{ position: 'absolute', height: '100%' }}>
                                    <View style={{ height: '100%', justifyContent: 'center' }}>
                                        <Image style={{ width: 18, height: 16, marginLeft: 25, marginRight: 10 }} source={require('../../images/back_white.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        <View style={styles.contentView}>
                            <Text style={styles.titleText}>
                                {Translate('not_disturb2')}</Text>
                            <View style={{ marginTop: 1, flexDirection: "row", justifyContent: 'space-between' }}>
                                <Text style={styles.subText}>{Translate('refuse_time')}</Text>
                                <View style={{ marginTop: -15 }}>
                                    <TouchableWithoutFeedback onPress={() => this.setTimeCheck()}>
                                        <Image style={{ width: 40, height: 15, padding: 5, }}
                                            resizeMode={'contain'}
                                            source={this.state.setTime ? image_unCheck : image_check} />
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#e5e5e5', marginTop: SCREEN_HEIGHT * 0.023, }} />


                            <View style={{
                                flexDirection: 'row', marginTop: SCREEN_HEIGHT * 0.023, justifyContent: 'space-evenly'
                                , marginLeft: SCREEN_WIDTH * 0.06, marginRight: SCREEN_WIDTH * 0.06
                            }}>
                                {/* 시작타이머 */}
                                <View style={{ marginTop: 1, flexDirection: 'column', width: (SCREEN_WIDTH - (SCREEN_WIDTH * 0.08)) / 2 }}>
                                    <Text style={styles.titleText}>{Translate('start')}</Text>

                                    <TouchableOpacity
                                        onPress={() => this.openStartDialog(true)}
                                        style={{
                                            marginTop: 10,
                                            height: 30,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text
                                                style={{
                                                    flex: 1,
                                                    color: '#919191',
                                                    fontSize: normalize(16),
                                                    fontWeight: '300',
                                                }}
                                            >
                                                {this.state.startDisturb === null ? 'PM 12:00' : this.state.startDisturb}
                                            </Text>
                                            <Image
                                                resizeMode={'center'}
                                                style={{ width: 10, height: 10, marginEnd: 30 }}
                                                source={require('../../images/down_arrow.png')}>
                                            </Image>
                                        </View>
                                    </TouchableOpacity>

                                    <Dialog
                                        title={Translate('not_disturb')}
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
                                                selectedItem={this.state.startTimeSelected}
                                                data={wheelPickerData}
                                                onItemSelected={this.onItemSelected}
                                            />
                                            <WheelPicker
                                                style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                selectedItem={this.state.startHourSelected}
                                                data={this.makeHour1Array()}
                                                onItemSelected={this.onStartHour}
                                            />
                                            <WheelPicker
                                                style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                selectedItem={this.state.startMinSelected}
                                                data={endMin}
                                                onItemSelected={this.onStartMin}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (this.state.endDisturb === null && wheelPickerData[this.state.startTimeSelected] + ' ' + startHour[this.state.startHourSelected] + ':' + startMin[this.state.startMinSelected] === 'AM 12:00') {

                                                    Toast2.show(Translate('same_time'))

                                                } else if (this.state.endDisturb === wheelPickerData[this.state.startTimeSelected] + ' ' + startHour[this.state.startHourSelected] + ':' + startMin[this.state.startMinSelected]) {
                                                    // Toast.show(`${Translate('same_time')}`, {
                                                    //     duration: 2000,
                                                    //     position: SCREEN_HEIGHT / 4
                                                    // })
                                                    Toast2.show(Translate('same_time'))
                                                } else {
                                                    this.setState({
                                                        startDisturb: wheelPickerData[this.state.startTimeSelected] + ' ' + startHour[this.state.startHourSelected] + ':' + startMin[this.state.startMinSelected],
                                                        startH: startHour[this.state.startHourSelected],
                                                        startM: startMin[this.state.startMinSelected],
                                                        startAmPm: wheelPickerData[this.state.startTimeSelected]
                                                    }, () => {
                                                        this.saveTime('AM');
                                                    })
                                                    this.openStartDialog(false);
                                                }
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


                                {/* 종료타이머 */}
                                <View style={{ paddingLeft: 10, marginTop: 1, flexDirection: "column", width: (SCREEN_WIDTH - (SCREEN_WIDTH * 0.08)) / 2 }}>
                                    <Text style={styles.titleText}>{Translate('end')}</Text>
                                    <TouchableOpacity
                                        onPress={() => this.openEndDialog(true)}
                                        style={{
                                            marginTop: 10,
                                            height: 30,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text
                                                style={{
                                                    flex: 1,
                                                    color: '#919191',
                                                    fontSize: normalize(16),
                                                    fontWeight: '300',
                                                }}
                                            >
                                                {this.state.endDisturb === null ? 'AM 12:00' : this.state.endDisturb}
                                            </Text>
                                            <Image
                                                resizeMode={'center'}
                                                style={{ width: 10, height: 10 }}
                                                source={require('../../images/down_arrow.png')}>
                                            </Image>
                                        </View>
                                    </TouchableOpacity>
                                    <Dialog
                                        title={Translate('not_disturb')}
                                        animationType="fade"
                                        contentStyle={{
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#fff',
                                        }}
                                        titleStyle={{ textAlign: 'left', fontSize: 16 }}
                                        dialogStyle={{ backgroundColor: '#fff' }}
                                        onTouchOutside={() => this.openEndDialog(false)}
                                        visible={this.state.showEndDialog}
                                    >

                                        <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                                            <WheelPicker
                                                style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                selectedItem={this.state.endTimeSelected}
                                                data={endPickerData}
                                                onItemSelected={this.onEndTime}
                                            />
                                            <WheelPicker
                                                style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                selectedItem={this.state.endHourSelected}
                                                data={this.makeHourArray()}
                                                onItemSelected={this.onEndHour}
                                            />
                                            <WheelPicker
                                                style={Platform.OS === 'ios' ? { width: 100 } : { width: 100, height: 120 }}
                                                selectedItem={this.state.endMinSelected}
                                                data={startMin}
                                                onItemSelected={this.onEndMin}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (this.state.startDisturb === null && wheelPickerData[this.state.endTimeSelected] + ' ' + startHour[this.state.endHourSelected] + ':' + startMin[this.state.endMinSelected] === 'PM 12:00') {
                                                    Toast2.show(Translate('same_time'))

                                                } else if (this.state.startDisturb === endPickerData[this.state.endTimeSelected] + ' ' + endHour[this.state.endHourSelected] + ':' + endMin[this.state.endMinSelected]) {
                                                    // Toast.show(`${Translate('same_time')}`, {
                                                    //     duration: 2000,
                                                    //     position: SCREEN_HEIGHT / 4
                                                    // })
                                                    Toast2.show(Translate('same_time'))

                                                } else {
                                                    this.setState({
                                                        endDisturb: endPickerData[this.state.endTimeSelected] + ' ' + endHour[this.state.endHourSelected] + ':' + endMin[this.state.endMinSelected],
                                                        endH: endHour[this.state.endHourSelected],
                                                        endM: endMin[this.state.endMinSelected],
                                                        endAmPm: wheelPickerData[this.state.endTimeSelected]
                                                    }, () => {
                                                        this.saveTime('PM')
                                                        console.log('checkEndTime =', endPickerData[this.state.endTimeSelected] + endHour[this.state.endHourSelected] + ' : ' + endMin[this.state.endMinSelected]);
                                                    })
                                                    this.openEndDialog(false);
                                                }
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

                            <View style={{ height: 1, backgroundColor: '#e5e5e5', marginTop: SCREEN_HEIGHT * 0.023, }} />

                            <View style={{ flexDirection: 'row', marginTop: SCREEN_HEIGHT * 0.023, justifyContent: 'space-between' }}>
                                <Text style={styles.titleText}>
                                    {Translate('block_notifications')}</Text>
                                <TouchableWithoutFeedback onPress={() => this.setAllTimeCheck()}>
                                    <Image style={{ width: 40, height: 15, padding: 5, }}
                                        resizeMode={'contain'}
                                        source={this.state.setAllTime ? image_unCheck : image_check} />
                                </TouchableWithoutFeedback>
                            </View>

                            <View style={{ height: 1, backgroundColor: '#e5e5e5', marginTop: SCREEN_HEIGHT * 0.03, }} />
                        </View>
                        {
                            this.state.isLoading && <View style={{ position: 'absolute', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'transparent' }}
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
    contentView: {
        flex: 1,
        marginTop: SCREEN_HEIGHT * 0.078,
        width: SCREEN_WIDTH,
        paddingLeft: SCREEN_WIDTH * 0.06,
        paddingRight: SCREEN_WIDTH * 0.06,
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