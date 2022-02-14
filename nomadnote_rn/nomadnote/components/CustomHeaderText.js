import React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { Header } from 'react-native/Libraries/NewAppScreen';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Component } from 'react';
import { normalize } from '../ui/Splash';
import Translate from '../languages/Translate'

export default class CustomHeaderText extends Component {
  static defaultProps = {
    backWidth: '0%',
    backHeight: '0%',
    registrationWidth: '0%',
    registrationHeight: '0%',
    title: '',
    onBackPress: () => null,
    onRegiPress: () => null,
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <LinearGradient
        colors={['#638d96', '#507781']}
        style={styles.linearGradient}
      >
        <View style={styles.container}>
          <View style={styles.touchContainer}>
            <TouchableWithoutFeedback
              style={[
                { width: this.props.backWidth },
                { height: this.props.backHeight }
              ]}
              hitSlop={{ top: 0, right: 20, bottom: 0, left: 20 }}
              onPress={this.props.onBackPress}
            >
              <Image
                style={[styles.backImg]}
                source={require('../images/back_white.png')}
              />
            </TouchableWithoutFeedback>
          </View>
          <Text style={styles.titleText}>{this.props.title}</Text>
          <View style={{ flex: 70 }}>
            <TouchableWithoutFeedback
              style={[
                { width: this.props.registrationWidth },
                { height: this.props.registrationHeight },
                { flexDirection: 'row' }
              ]}
              hitSlop={{ top: 10, right: 20, bottom: 10, left: 30 }}
              onPress={this.props.onRegiPress}
            >
              <Text style={styles.saveText}>{`${Translate('save')}`}</Text>
              <Image
                style={styles.resiImg}
                source={require('../images/paper_air.png')}
              />
            </TouchableWithoutFeedback>
          </View>
        </View>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  linearGradient: {
    height: 50,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  touchContainer: {
    flex: 45,
  },
  titleText: {
    flex: 280,
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: normalize(13),
    fontWeight: '200',
    alignSelf: 'center',
    marginTop: '5%',

  },
  backImg: {
    width: 18,
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'flex-end',
    marginRight: 5
  },
  resiImg: {
    width: 20,
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'flex-start',
    marginLeft: 3,
    marginTop: '5%',
  },
});
