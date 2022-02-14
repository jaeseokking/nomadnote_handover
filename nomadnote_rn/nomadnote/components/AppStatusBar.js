import React from 'react';
import { StyleSheet, StatusBar, View, Platform } from 'react-native';
import { getStatusBarHeight } from "react-native-status-bar-height";

const AppStatusBar = ({ backgroundColor, ...props }) => {
    return (
        <View style={[styles.statusBar, backgroundColor]}>
            <StatusBar backgroundColor={backgroundColor} {...props} />
        </View>
    );
};

const BAR_HEIGHT = 0;

const styles = StyleSheet.create({
    statusBar: {
        height: BAR_HEIGHT
    },
});

export default AppStatusBar;