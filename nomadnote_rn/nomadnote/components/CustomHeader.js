import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { getStatusBarHeight } from "react-native-status-bar-height";
import { Header } from 'react-native/Libraries/NewAppScreen';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Component } from 'react';

export default class CustomHeader extends Component {
    static defaultProps = {
        backWidth: '0%',
        backHeight: '0%',
        onPress: () => null,
    }

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <LinearGradient colors={['#638d96', '#507781']} style={styles.linearGradient}>
                <View style={styles.container}>
                    <View style={styles.touchContainer}>
                        <TouchableWithoutFeedback
                            style={[{ width: this.props.backWidth }, { height: this.props.backHeight }]}
                            hitSlop={{ top: 0, right: 20, bottom: 0, left: 20 }}
                            onPress={this.props.onPress}>
                            <Image
                                style={[styles.backImg]}
                                source={require('../images/back_white.png')} />
                        </TouchableWithoutFeedback>
                    </View>
                    <Image
                        style={styles.titleImg}
                        source={require('../images/login_white_logo.png')} />
                    <View style={{ flex: 40 }} />
                </View>
            </LinearGradient>
        );
    }
}

const styles = StyleSheet.create({
    linearGradient: {
        height: '8%',
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
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