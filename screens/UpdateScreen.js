import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
//import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

const { width: WIDTH } = Dimensions.get('window');

/*
TODO:

- fields include:
> username
> old password
> new password
> confirm new password
- delete account button
> enter full email and password to confirm
> deletes user image if exists
> calls removeMember(userUid, [groupUids]), passing all the users groups if any
- username is only updated if the new one is different from the current one
- updating image should delete the old one
- updating payment info should ask the user to enter their password to continue then navigate to another screen 
- rate limit updating account, similar to the homescreen resend timer

NOTE: removeMember may not work correctly with multiple groups, still must be tested

*/

export default class UpdateScreen extends Component {
  static navigationOptions = {
    title: 'Update profile',
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
          <Text style={styles.subtitle}>Update profile screen.</Text>
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