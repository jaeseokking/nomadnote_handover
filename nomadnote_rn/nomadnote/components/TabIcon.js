import React from 'react'
import { Image, TouchableHighlight } from 'react-native'
import { TabImage } from '../model/TabImage'

const TabIcon = ({ name, style, size }) => {
  const icon = TabImage[name]
  return (
    <Image
      source={icon}
      style={[{ width: size, height: size }, style]}
      resizeMode='contain'
    />
  )
}

export default TabIcon
