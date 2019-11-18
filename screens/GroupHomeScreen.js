import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
import { HeaderBackButton } from 'react-navigation-stack';
//import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';

const { width: WIDTH } = Dimensions.get('window');

export default class GroupHomeScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('groupName'),
      headerStyle: {
        backgroundColor: '#273238',
        borderBottomWidth: 1,
        borderBottomColor: '#496f82',
      },
      headerTintColor: '#b5cad5',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerLeft: (<HeaderBackButton tintColor={'#b5cad5'} onPress={() => { navigation.navigate('HomeScreen') }} />),
    };
  }

  constructor() {
    super();

    this.state = {
      uid: '',
      email: '',
      username: '',
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    const { uid, email } = firebase.auth().currentUser;

    await this.setState({ uid, email });

    const db = firebase.database();

    //Retrieving additional user data
    db.ref(`users/${this.state.uid}`)
      .on('value', snap => this.setState({
        username: snap.child('username').val(),
      }));
  }

  render() {
    //const { navigate } = this.props.navigation;

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {this.props.navigation.getParam('inviteCode') &&
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeMessage}>Welcome to your new group, {this.state.username}. The group invite code is:</Text>
              <Text style={styles.welcomeCode}>{this.props.navigation.getParam('inviteCode')}</Text>
              <Text style={styles.welcomeMessage}>Share this code to other users so that they can join the group. You can generate new codes in the group menu.</Text>
            </View>
          }
          <Text style={styles.subtitle}>Group home screen. {this.props.navigation.getParam('groupUid')}</Text>
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
  },
  subtitle: {
    fontSize: 18,
    color: '#b5cad5',
    marginTop: 30,
    marginLeft: 25,
    marginRight: 25,
    marginBottom: 25,
  },
  welcomeContainer: {
    marginTop: 25,
    width: WIDTH - (WIDTH / 7),
  },
  welcomeMessage: {
    fontSize: 18,
    color: '#b5cad5',
    textAlign: 'center',
  },
  welcomeCode: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dde1e0',
    textAlign: 'center',
    margin: 15
  }
});