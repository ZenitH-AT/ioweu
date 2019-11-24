import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import generation from '../utils/generation';
import storage from '../utils/storage';
import validation from '../utils/validation';

const { width: WIDTH } = Dimensions.get('window');

export default class GroupHomeScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      uid: this.props.navigation.getParam('userUid'),
      username: '',

      //For initial invite code (after group creation)
      expiryCountdown: null,
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    const db = firebase.database();

    //Retrieving additional user data
    db.ref(`users/${this.state.uid}`)
      .on('value', snap => this.setState({
        username: snap.child('username').val(),
      }));

    if (this.props.navigation.getParam('inviteCode')) {
      await this.enableExpiryCountdown(this.props.navigation.getParam('inviteCode'));
    }
  }

  async enableExpiryCountdown(inviteCode) {
    const currentTime = await Math.round(new Date().getTime() / 1000);

    firebase.database().ref(`invites/${inviteCode}`)
      .on('value', snap => this.setState({
        expiryCountdown: parseInt(snap.child('expireTime').val() - currentTime)
      }));

    this.intervalState = setInterval(() => {
      this.setState((prevState) =>
        ({ expiryCountdown: prevState.expiryCountdown == 0 ? 0 : prevState.expiryCountdown - 1 }));

      //Delete invite code once expired (by validating it)
      if (this.state.expiryCountdown == 0) {
        validation.inviteValid(inviteCode);
      }
    }, 1000);
  }

  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {this.props.navigation.getParam('inviteCode') &&
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeMessage}>Welcome to your new group, {this.state.username}.{'\n'}The group invite code is:</Text>
              {this.state.expiryCountdown > 0 &&
                <View>
                  <View style={styles.codeContainer}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                      <Text style={styles.welcomeCode}>{this.props.navigation.getParam('inviteCode')}</Text>
                      <TouchableOpacity
                        onPress={() => storage.copyText(this.props.navigation.getParam('inviteCode'), 'Code copied!')}>
                        <FontAwesome style={styles.copyCodeIcon} icon={parseIconFromClassName('far fa-copy')} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.codeCountdown}>Expires in: {generation.secondsToTime(this.state.expiryCountdown)}</Text>
                  </View>
                  <Text style={styles.welcomeMessage}>Share this code to other users so that they can join the group. You can generate new codes via the group menu.</Text>
                </View>
              }
              {this.state.expiryCountdown == 0 &&
                <View>
                  <Text style={styles.codeExpired}>Invite code expired. Please generate a new code via the group menu.</Text>
                </View>
              }
            </View>
          }
          <View>
            <Text style={styles.title}>Transaction requests (7)</Text>
            <Text style={styles.subtitle}>Group home screen.{'\n'}Group UID: {this.props.navigation.getParam('groupUid')}</Text>
          </View>
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
  welcomeContainer: {
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
  },
  welcomeMessage: {
    fontSize: 18,
    color: '#b5cad5',
    textAlign: 'center',
  },
  codeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  welcomeCode: {
    color: '#dde1e0',
    fontSize: 22,
    fontWeight: 'bold',
  },
  copyCodeIcon: {
    marginLeft: 20,
    color: '#b5cad5',
    fontSize: 22,
  },
  codeCountdown: {
    color: '#b5cad5',
    fontSize: 16,
    textAlign: 'center',
  },
  codeExpired: {
    color: '#b5cad5',
    fontSize: 16,
    textAlign: 'center',
    margin: 15
  }
});