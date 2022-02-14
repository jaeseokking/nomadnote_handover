import React, { Component } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
    Platform,
    PixelRatio,
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

export default class NextButton extends Component {
    static defaultProps = {
        title: 'untitled',
        buttonColor: '#fff',
        titleColor: '#fff',
        textPaddingVertical: 0,
        onPress: () => null,
    }

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TouchableOpacity style={[styles.button, { backgroundColor: this.props.buttonColor }]}
                onPress={this.props.onPress}>
                <Text style={[styles.title, { color: this.props.titleColor }]}>{this.props.title}</Text>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    button: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        alignSelf: 'center',
        borderRadius: 4,
    },
    title: {
        fontSize: normalize(12),
        fontWeight: 'bold',
    },
});