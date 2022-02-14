import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

export default (ChildItem = ({
    item,
    style,
    onPress,
    index,
    imageKey,
    local,
    height
}) => {
    return (
        <TouchableWithoutFeedback
            style={styles.container}
            onPress={() => onPress(index)}>
            <Image
                style={[styles.image, style, { height: height }]}
                source={local ? item[imageKey] : { uri: item[imageKey] }}
            />
        </TouchableWithoutFeedback>
    );
});

const styles = StyleSheet.create({
    container: {},
    image: {
        height: 250,
        resizeMode: 'stretch',
    },
});