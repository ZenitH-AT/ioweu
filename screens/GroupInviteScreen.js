import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
//import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

const { width: WIDTH } = Dimensions.get('window');

/*

TODO:

- invite users via username/email (send push notification to user)
- invites can be created to expire or never expire
- x/5 invites (+ create button blurs when full)
- delete button for each invite
- simple create invite modal with enableExpiryCooldowns(groupUid) option
- delete expired invites automatically

Design example: https://i.ibb.co/JsJVjvZ/unknown.png

*/

export default class GroupInviteScreen extends Component {
  static navigationOptions = {
    title: 'Invite users',
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
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.subtitle}>Invite users screen.</Text>
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
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
    marginBottom: 25,
    fontSize: 18,
    color: '#b5cad5',
  },
});