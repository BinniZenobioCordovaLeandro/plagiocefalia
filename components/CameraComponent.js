import React, { useState, useEffect } from 'react'
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native'
import { DeviceMotion } from 'expo-sensors'
import { Camera } from 'expo-camera'
import * as FaceDetector from 'expo-face-detector'

export default class CameraExample extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      hasCameraPermission: null,
      faceDetecting: false, // when true, we look for faces
      faceDetected: false, // when true, we've found a face
      countDownSeconds: 5, // current available seconds before photo is taken
      countDownStarted: false, // starts when face detected
      pictureTaken: false, // true when photo has been taken
      motion: null, // captures the device motion object
      detectMotion: false // when true we attempt to determine if device is still
    }
    this.countDownTimer = null
    this.detectMotion = this.detectMotion.bind(this)
    this.onDeviceMotion = this.onDeviceMotion.bind(this)
    this.detectFaces = this.detectFaces.bind(this)
    this.handleFaceDetectionError = this.handleFaceDetectionError.bind(this)
    this.handleFacesDetected = this.handleFacesDetected.bind(this)
    this.initCountDown = this.initCountDown.bind(this)
    this.cancelCountDown = this.cancelCountDown.bind(this)
    this.handleCountDownTime = this.handleCountDownTime.bind(this)
    this.takePicture = this.takePicture.bind(this)
    this.onPictureSaved = this.onPictureSaved.bind(this)
  }

  componentDidMount () {
    Camera.requestPermissionsAsync().then(({ status }) => this.setState({ hasCameraPermission: status === 'granted' }))
    this.motionListener = DeviceMotion.addListener((rotation) => this.onDeviceMotion(rotation))
    setTimeout(() => this.detectMotion(true), 1000)
  }

  componentDidUpdate (nextProps, nextState) {
    if (this.state.detectMotion && nextState.motion && this.state.motion) {
      if (
        Math.abs(nextState.motion.x - this.state.motion.x) < this.props.motionTolerance &&
        Math.abs(nextState.motion.y - this.state.motion.y) < this.props.motionTolerance &&
        Math.abs(nextState.motion.z - this.state.motion.z) < this.props.motionTolerance
      ) {
        // still
        this.detectFaces(true)
        this.detectMotion(false)
      } else {
        // moving
      }
    }
  }

  detectMotion (doDetect) {
    this.setState({
      detectMotion: doDetect
    })
    if (doDetect) {
      DeviceMotion.setUpdateInterval(this.props.motionInterval)
    } else if (!doDetect && this.state.faceDetecting) {
      this.motionListener.remove()
    }
  }

  onDeviceMotion (rotation) {
    this.setState({ motion: rotation.accelerationIncludingGravity })
  }

  detectFaces (doDetect) {
    this.setState({ faceDetecting: doDetect })
  }

  handleFaceDetectionError () {
    //
  }

  handleFacesDetected ({ faces }) {
    if (faces.length === 1) {
      this.setState({
        faceDetected: true
      })
      if (!this.state.faceDetected && !this.state.countDownStarted) {
        this.initCountDown()
      }
    } else {
      this.setState({ faceDetected: false })
      this.cancelCountDown()
    }
  }

  initCountDown () {
    this.setState({
      countDownStarted: true
    })
    this.countDownTimer = setInterval(this.handleCountDownTime, 1000)
  }

  cancelCountDown () {
    clearInterval(this.countDownTimer)
    this.setState({
      countDownSeconds: this.props.countDownSeconds,
      countDownStarted: false
    })
  }

  handleCountDownTime () {
    if (this.state.countDownSeconds > 0) {
      const newSeconds = this.state.countDownSeconds - 1
      this.setState({
        countDownSeconds: newSeconds
      })
    } else {
      this.cancelCountDown()
      this.takePicture()
    }
  }

  takePicture () {
    this.setState({
      pictureTaken: true
    })
    if (this.camera) {
      console.log('take picture')
      this.camera.takePictureAsync({ onPictureSaved: this.onPictureSaved })
    }
  }

  onPictureSaved () {
    this.detectFaces(false)
  }

  render () {
    const { hasCameraPermission } = this.state
    if (hasCameraPermission === null) {
      return <View />
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera
            style={{ flex: 1 }}
            type={Camera.Constants.Type.front}
            onFacesDetected={(object) => (this.state.faceDetecting ? this.handleFacesDetected(object) : undefined)}
            onFaceDetectionError={() => this.handleFaceDetectionError()}
            faceDetectorSettings={{
              mode: FaceDetector.Constants.Mode.fast,
              detectLandmarks: FaceDetector.Constants.Mode.none,
              runClassifications: FaceDetector.Constants.Mode.none
            }}
            ref={ref => {
              this.camera = ref
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
                position: 'absolute',
                bottom: 0
              }}
            >
              <Text
                style={styles.textStandard}
              >
                {this.state.faceDetected ? 'Face Detected' : 'No Face Detected'}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                display: this.state.faceDetected && !this.state.pictureTaken ? 'flex' : 'none'
              }}
            >
              <Text
                style={styles.countdown}
              >
                {this.state.countDownSeconds}
              </Text>
            </View>
          </Camera>
        </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textStandard: {
    fontSize: 18,
    marginBottom: 10,
    color: 'white'
  },
  countdown: {
    fontSize: 40,
    color: 'white'
  }
})
