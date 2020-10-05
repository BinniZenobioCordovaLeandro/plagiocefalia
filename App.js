import React, { Component } from 'react'
import { View, Text } from 'react-native'
import CameraComponent from './components/CameraComponent'

export class App extends Component {
  render () {
    return (
      <View style={{ flex: 1 }}>
        <CameraComponent
          countDownSeconds={5}
          motionInterval={500}
          motionTolerance={1}
        />
      </View>
    )
  }
}

export default App
