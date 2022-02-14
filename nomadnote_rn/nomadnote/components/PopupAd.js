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
    Keyboard,
    FlatList,
    Linking
} from 'react-native';
import { setLang } from '../utils/Utils';

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
const IMAGE_WIDTH_RATIO = 0.8;
const IMAGE_HEIGHT_RATIO = 1.21;

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class PopupAd extends Component {
    static defaultProps = {
        adList: [],
        txtOk: '',
        txtTodayOk: '',
        lang: 'ko',
        onPressOk: () => null,
        onPressToday: () => null
    }

    constructor(props) {
        super(props);
        this.intervalPointer = null;
        this.onScroll = this.onScroll.bind(this)
        console.log('b2b: ', this.props.adList.length)
        this.state = {
            sliderIndex: 0,
            mSlider: this.props.adList.length - 1,
            adProgress: 0,
        };
    }

    componentDidMount() {
        this.timer();
    }

    componentWillUnmount() {
        if (this.intervalPointer) {
            clearInterval(this.intervalPointer)
        }
    }

    setRef = (c) => {
        this.listRef = c;
    }

    scrollToIndex = (index, animated) => {
        this.listRef && this.listRef.scrollToIndex({ index, animated })
    }

    onScroll(e) {
        // Get progress by dividing current FlatList X offset with full FlatList width
        const { mSlider } = this.state
        this.setState({ adProgress: e.nativeEvent.contentOffset.x / (mSlider * SCREEN_WIDTH * IMAGE_WIDTH_RATIO) })
    };

    timer() {
        this.intervalPointer = setInterval(function () {
            const { sliderIndex, mSlider } = this.state
            let nextIndex = 0

            if (sliderIndex < mSlider) {
                nextIndex = sliderIndex + 1
            }

            this.scrollToIndex(nextIndex, true)
            this.setState({ sliderIndex: nextIndex })
        }.bind(this), 4000)
    }

    render() {

        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                    activeOpacity={1}
                    onPress={this.props.modalHandler} />
                <View style={styles.modal}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}>
                        <View style={{ overflow: 'hidden', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                            <FlatList
                                ref={this.setRef}
                                horizontal
                                onScrollToIndexFailed={info => {
                                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                                    wait.then(() => {
                                        flatList.current?.scrollToIndex({ index: info.index, animated: true });
                                    });
                                }}
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                onScroll={this.onScroll}
                                keyExtractor={item => item._id}
                                onMomentumScrollEnd={(event) => {
                                    let sliderIndex = event.nativeEvent.contentOffset.x ? event.nativeEvent.contentOffset.x / (Platform.OS === 'ios' ? SCREEN_WIDTH * IMAGE_WIDTH_RATIO - 20 : SCREEN_WIDTH * IMAGE_WIDTH_RATIO) : 0
                                    this.setState({ sliderIndex })
                                }}
                                data={this.props.adList}
                                renderItem={({ item }) => (
                                    <View style={{
                                        backgroundColor: '#fff', width: SCREEN_WIDTH * IMAGE_WIDTH_RATIO,
                                    }} >
                                        <TouchableWithoutFeedback
                                            onPress={() => {
                                                Linking.openURL(item.link)
                                            }}>
                                            <Image
                                                style={{
                                                    width: SCREEN_WIDTH * IMAGE_WIDTH_RATIO, alignSelf: 'center', height: SCREEN_WIDTH * IMAGE_WIDTH_RATIO * IMAGE_HEIGHT_RATIO
                                                }}
                                                resizeMode='stretch'
                                                source={{ uri: global.server + item.image }}
                                            />
                                        </TouchableWithoutFeedback>
                                    </View>
                                )}
                            />
                        </View>
                    </ScrollView>
                    <View style={styles.btnContainer}>
                        <TouchableOpacity
                            onPress={this.props.onPressToday}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}>
                            <Text style={{
                                fontSize: normalize(13),
                                color: '#878787',
                                fontWeight: '600',
                                marginVertical: 15,
                                marginHorizontal: 10,
                                textAlign: 'center'
                            }}>{this.props.txtTodayOk}</Text>
                        </TouchableOpacity>
                        <View style={{ width: 1, height: '60%', backgroundColor: '#e0e0e0', alignSelf: 'center' }} />
                        <TouchableOpacity
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            onPress={this.props.onPressOk}>
                            <Text style={{
                                fontSize: normalize(13),
                                color: '#000',
                                fontWeight: '600',
                                marginVertical: 15,
                                marginHorizontal: 10,
                                textAlign: 'center'
                            }}>{this.props.txtOk}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center'
    },
    background: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        width: SCREEN_WIDTH * IMAGE_WIDTH_RATIO,
        borderRadius: 10,
        backgroundColor: '#b7d1da',
        shadowColor: '#000',
        marginBottom: Platform.OS === 'ios' ? '20%' : '10%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 4,
        alignItems: 'center'
    },
    btnContainer: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: 'white',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10
    },
});