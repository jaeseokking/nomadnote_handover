import React, { Component } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
    Platform,
    PixelRatio,
    View,
} from 'react-native';

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;

export function normalize(size) {
    const newSize = size * scale
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize))
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
    }
}

export default class WriteModal extends Component {
    static defaultProps = {
        content: '',
        yes: 'Yes',
        no: 'No',
        onPressOk: () => null,
        onPressNo: () => null
    }

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.background}
                    activeOpacity={1}
                    onPress={this.props.modalHandler} />
                <View style={styles.modal}>
                    <Text style={styles.contentText}>{this.props.content}</Text>
                    <View style={styles.btnContainer}>
                        <TouchableOpacity
                            onPress={this.props.onPressNo}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}>
                            <Text style={styles.noText}>{this.props.no}</Text>
                        </TouchableOpacity>
                        <View style={{ width: 1, height: '100%', backgroundColor: '#aaaaaa', }} />
                        <TouchableOpacity
                            hitSlop={{ top: 10, right: 0, bottom: 10, left: 0 }}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            onPress={this.props.onPressOk}>
                            <Text style={styles.yesText}>{this.props.yes}</Text>
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
        justifyContent: 'center'
    },
    background: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modal: {
        marginHorizontal: 20,
        borderRadius: 4,
        backgroundColor: 'white',
        shadowColor: '#000',
        marginBottom: '20%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 4,
    },
    btnContainer: {
        flexDirection: 'row',
        marginTop: 25,
        borderTopWidth: 1,
        borderTopColor: '#aaaaaa',
        width: '100%',
    },
    yesText: {
        width: '100%',
        color: '#557f89',
        fontSize: normalize(13),
        marginVertical: 25,
        marginLeft: 20,
        marginRight: 30,
        textAlign: 'center',
        justifyContent: 'center'
    },
    noText: {
        width: '100%',
        color: '#000',
        fontSize: normalize(13),
        marginVertical: 25,
        marginHorizontal: 20,
        textAlign: 'center',
        justifyContent: 'center'
    },
    contentText: {
        fontSize: normalize(12),
        marginLeft: SCREEN_WIDTH * 0.034,
        marginRight: SCREEN_WIDTH * 0.034,
        marginTop: 25,
        textAlign: 'center',
    }
});