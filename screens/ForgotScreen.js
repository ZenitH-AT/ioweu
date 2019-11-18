import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';
import Validation from '../utils/validation.js';

import * as firebase from 'firebase';

const { width: WIDTH } = Dimensions.get('window');

export default class ForgotScreen extends Component {
  static navigationOptions = {
    title: 'Forgot password',
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

  constructor() {
    super();

    this.state = {
      email: null,
      emailFromUsername: null,
      infoMessage: '',
      errorMessage: '',
      forgotButtonDisabled: false
    }
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  async forgotPassword() {
    this.setState({ forgotButtonDisabled: true });

    const { navigate } = this.props.navigation;
    var email = await this.state.email != null ? this.state.email : 'N/A';

    let child = 'email';

    if (!Validation.validateEmail(email)) { //Username was provided
      child = 'usernameLower';
    }

    //Searching database
    if (await Validation.valueExists('users', child, email)) {
      //Retrieving email from username
      if (child == 'usernameLower') {
        await this.getEmailFromUsername(email.toLowerCase());
        email = this.state.emailFromUsername;
      }

      try { //Sending password reset email to user
        await firebase.auth().sendPasswordResetEmail(email);
        navigate('SignInScreen', { infoMessage: 'Please check your email for the password reset link.' });
      } catch (error) {
        this.setState({ infoMessage: '', errorMessage: 'An error occurred, please try again.', forgotButtonDisabled: false });
      }
    } else {
      this.setState({ infoMessage: '', errorMessage: 'No registered account was found with the provided username or email.', forgotButtonDisabled: false });
    }
  }

  async getEmailFromUsername(username) {
    await firebase.database().ref('users').orderByChild('usernameLower').equalTo(username).limitToFirst(1).once('value', snap => {
      snap.forEach(data => {
        this.setState({ emailFromUsername: data.child('email').val() });
      });
    });
  }

  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.subtitle}>Enter your details and we will send you an email to reset your password.</Text>
          <View>
            {this.state.infoMessage != '' && <Text style={styles.infoMessage}>{this.state.infoMessage}</Text>}
          </View>
          <View>
            {this.state.errorMessage != '' && <Text style={styles.errorMessage}>{this.state.errorMessage}</Text>}
          </View>
          <TextInput
            style={styles.input}
            placeholder={'Username or email'}
            placeholderTextColor={'#b5cad5'}
            underlineColorAndroid='transparent'
            autoCapitalize='none'
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
          <TouchableOpacity
            disabled={this.state.forgotButtonDisabled}
            onPress={this.forgotPassword.bind(this)}>
            <Text style={styles.forgotButton}>Forgot password</Text>
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
  },
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    fontSize: 18,
    color: '#b5cad5',
    marginTop: 30,
    marginBottom: 25,
  },
  infoMessage: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 25,
    color: '#30b0db',
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
  },
  errorMessage: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 25,
    color: '#db3b30',
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
  },
  input: {
    width: WIDTH - (WIDTH / 7),
    height: 45,
    borderRadius: 25,
    fontSize: 18,
    paddingLeft: 25,
    backgroundColor: '#354249',
    marginBottom: 25,
    color: '#dde1e0',
  },
  forgotButton: {
    width: WIDTH - (WIDTH / 7),
    height: 45,
    borderRadius: 25,
    fontSize: 22,
    backgroundColor: '#496f82',
    textAlign: 'center',
    marginBottom: 15,
    color: '#b5cad5',
    lineHeight: 45,
  },
});