import React, { Component } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';

export default class LoadingScreen extends Component {
  constructor() {
    super();

    this.state = {
      isMounted: false,
      isConnected: false
    }

    this.checkInternetConnection = this.checkInternetConnection.bind(this);
    this.handleFirstConnectivityChange = this.handleFirstConnectivityChange.bind(this);
  }

  async componentDidMount() {
    SplashScreen.hide();

    this.setState({ isMounted: true });

    firebase.auth().onAuthStateChanged(user => {
      this.props.navigation.navigate(this.state.isConnected == true ? (user ? 'AppStack' : 'AuthStack') : 'ErrorScreen');
    });

    NetInfo.isConnected.addEventListener(
      'connectionChange',
      this.handleFirstConnectivityChange
    );
  }

  componentWillUnmount() {
    this.state.isMounted && this.setState({ isMounted: false });

    NetInfo.removeEventListener(
      'connectionChange',
      this.handleFirstConnectivityChange
    );
  }

  checkInternetConnection() {
    fetch('https://httpbin.org/ip')
      .then(response => response.json())
      .then(responseJson => {
        this.state.isMounted && this.setState({ isConnected: true });
      }).catch(error => {
        this.props.navigation.navigate('ErrorScreen');
      })
  }

  handleFirstConnectivityChange(isConnected) {
    if (isConnected) {
      this.setState({ isConnected: true });
    } else {
      this.props.navigation.navigate('ErrorScreen');
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Loading...</Text>
        <ActivityIndicator size={'large'} color={'#496f82'}></ActivityIndicator>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#273238',
    alignItems: 'center',
    justifyContent: 'center'
  },
  subtitle: {
    marginBottom: 15,
    fontSize: 18,
    color: '#b5cad5'
  }
});