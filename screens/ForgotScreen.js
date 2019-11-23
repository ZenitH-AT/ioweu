import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import miscellaneous from '../utils/miscellaneous.js';
import validation from '../utils/validation.js';

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
      infoMessage: '',
      errorMessage: '',
      forgotButtonDisabled: false
    }
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  async forgotPassword() {
    this.setState({ forgotButtonDisabled: true, email: this.state.email.trim() });

    const { navigate } = this.props.navigation;
    var email = await this.state.email != null ? this.state.email : 'N/A';

    let child = 'email';

    if (!validation.validateEmail(email)) { //Username was provided
      child = 'usernameLower';
      email = email.toLowerCase();
    }

    //Searching database
    if (await validation.valueExists('users', child, email)) {
      //Retrieving email from username
      if (child == 'usernameLower') {
        email = await miscellaneous.getEmailFromUsername(email);

        if (!email) {
          return this.handleForgotPasswordError('Invalid username or password.');
        }
        this.handleForgotPasswordError('An error occurred, please try again.');
      }

      try { //Sending password reset email to user
        await firebase.auth().sendPasswordResetEmail(email);
        navigate('SignInScreen', { infoMessage: 'Please check your email for the password reset link.' });
      } catch (error) {
        this.handleForgotPasswordError('An error occurred, please try again.');
      }
    } else {
      this.handleForgotPasswordError('No registered account was found with the provided username or email.');
    }
  }

  handleForgotPasswordError(errorMessage) {
    this.setState({
      infoMessage: '',
      errorMessage,
      forgotButtonDisabled: false
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
            underlineColorAndroid={'transparent'}
            autoCapitalize={'none'}
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
    marginTop: 25,
    marginBottom: 25,
    fontSize: 18,
    color: '#b5cad5',
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