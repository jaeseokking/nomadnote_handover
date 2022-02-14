import React from 'react';
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
    TouchableOpacity,
    TextInput,
    ImageBackground,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { getStatusBarHeight } from "react-native-status-bar-height";
import { Header } from 'react-native/Libraries/NewAppScreen';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Component } from 'react';
import { BannerAd, BannerAdSize, TestIds } from '@react-native-firebase/admob';

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

export default class CloseAppAdMob extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <>
                <View style={styles.container}>
                    <View
                        style={{ width: SCREEN_WIDTH, height: '50%' }}>
                        <BannerAd
                            unitId={TestIds.BANNER}
                            size={BannerAdSize.MEDIUM_RECTANGLE}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: true,
                            }}
                            onAdLoaded={() => {
                                console.log('Advert loaded');
                            }}
                            onAdFailedToLoad={(error) => {
                                console.error('Advert failed to load: ', error);
                            }}
                        />
                    </View>
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#fff',
        position: 'absolute',
        borderRadius: 10
    },
    touchContainer: {
        flex: 40,
    },
    titleImg: {
        flex: 280,
        height: '47.3%',
        resizeMode: 'contain',
        marginTop: '3%',
    },
    backImg: {
        width: '38%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'flex-end'
    },
});