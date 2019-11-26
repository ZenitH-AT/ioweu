import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import logo from '../assets/logo.png';

const { width: WIDTH } = Dimensions.get('window');

export default class ErrorScreen extends Component {
  static navigationOptions = {
    title: 'No connection',
    headerStyle: {
      backgroundColor: '#273238',
      borderBottomWidth: 1,
      borderBottomColor: '#496f82',
    },
    headerTintColor: '#b5cad5',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  render() {
    const { navigate } = this.props.navigation;

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Image source={logo} style={styles.logoImage} />
          <Text style={styles.subtitle}>Could not connect to I Owe U. Please ensure you are connected to the Internet.</Text>
          <TouchableOpacity
            onPress={() => navigate('LoadingScreen')}>
            <Text style={styles.retryButton}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#273238',
  },
  container: {
    flex: 1,
    backgroundColor: '#273238',
    alignItems: 'center',
    marginBottom: 25,
  },
  logoImage: {
    width: WIDTH - (WIDTH / 2),
    height: WIDTH - (WIDTH / 2),
  },
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
    marginBottom: 25,
    fontSize: 18,
    color: '#b5cad5',
  },
  retryButton: {
    width: WIDTH / 3,
    height: 45,
    borderRadius: 25,
    fontSize: 26,
    backgroundColor: '#496f82',
    textAlign: 'center',
    color: '#b5cad5',
    lineHeight: 45
  }
});