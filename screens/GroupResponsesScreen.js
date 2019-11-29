import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
//import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

const { width: WIDTH } = Dimensions.get('window');

export default class GroupLedgerScreen extends Component {
  componentDidMount() {
    SplashScreen.hide();
  }

  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Active responses (4)</Text>
          <Text style={styles.title}>Resolved responses (11)</Text>
          <Text style={styles.subtitle}>Responses screen.</Text>
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
  title: {
    marginTop: 25,
    marginBottom: 20,
    color: '#dde1e0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
    marginBottom: 25,
    fontSize: 18,
    color: '#b5cad5',
  },
});