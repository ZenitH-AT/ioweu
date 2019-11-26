import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Image, Text, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import miscellaneous from '../utils/miscellaneous';
import validation from '../utils/validation';

import logo from '../assets/logo.png';

const { width: WIDTH } = Dimensions.get('window');

export default class SignInScreen extends Component {
  static navigationOptions = {
    title: 'Sign in',
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
      email: '',
      password: '',
      errorMessage: '',

      //Show/hide password button state
      showPass: true,
      press: false,

      //Buttons are disabled when the sign in button is pressed
      signInButtonDisabled: false,
      forgotButtonDisabled: false,
      signUpButtonDisabled: false
    }
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  async handleSignIn() {
    await miscellaneous.promisedSetState({
      //Disabling buttons
      signInButtonDisabled: true,
      forgotButtonDisabled: true,
      signUpButtonDisabled: true,

      //Removing whitespace from fields
      email: this.state.email.trim()
    }, this);

    var { email, password } = this.state;

    if (!validation.emptyOrWhitespace(email) && !validation.validateEmail(email)) { //Username was provided
      email = await miscellaneous.getEmailFromUsername(email.toLowerCase());

      if (!email) {
        return this.handleSignInError('Invalid username or password.');
      }
    }

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .catch(error => this.handleSignInError(error.message));
  }

  handleSignInError(errorMessage) {
    this.setState({
      errorMessage,
      signInButtonDisabled: false,
      forgotButtonDisabled: false,
      signUpButtonDisabled: false
    });
  }

  showPass() {
    if (this.state.press == false) {
      this.setState({ showPass: false, press: true });
    } else {
      this.setState({ showPass: true, press: false });
    }
  }

  render() {
    const { navigate } = this.props.navigation;

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logoImage} />
            <Text style={styles.logoText}>Welcome to I Owe U</Text>
          </View>
          <View>
            {this.props.navigation.getParam('infoMessage') && <Text style={styles.infoMessage}>{this.props.navigation.getParam('infoMessage')}</Text>}
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
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder={'Password'}
              secureTextEntry={this.state.showPass}
              placeholderTextColor={'#b5cad5'}
              underlineColorAndroid={'transparent'}
              autoCapitalize={'none'}
              onChangeText={password => this.setState({ password })}
              value={this.state.password}
            />
            <TouchableOpacity
              onPress={() => this.showPass()}>
              <FontAwesome style={styles.toggleIcon} icon={this.state.press == false ? parseIconFromClassName('far fa-eye') : parseIconFromClassName('far fa-eye-slash')} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            disabled={this.state.signInButtonDisabled}
            onPress={() => this.handleSignIn()}>
            <Text style={styles.signInButton}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={this.state.forgotButtonDisabled}
            onPress={() => navigate('ForgotScreen')}>
            <Text style={styles.forgotLink}>Forgot password</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>Dont have an account?</Text>
          <TouchableOpacity
            disabled={this.state.signUpButtonDisabled}
            onPress={() => navigate('SignUpScreen')}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView >
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
  },
  logoImage: {
    width: WIDTH - (WIDTH / 2),
    height: WIDTH - (WIDTH / 2),
  },
  logoText: {
    color: '#b5cad5',
    fontSize: 30,
  },
  infoMessage: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 25,
    color: '#30b0db',
    fontSize: 15,
    textAlign: 'center',
  },
  errorMessage: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 35,
    color: '#db3b30',
    fontSize: 15,
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
  passwordContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  inputPassword: {
    width: WIDTH - 95,
    height: 45,
    borderRadius: 25,
    fontSize: 18,
    paddingLeft: 25,
    backgroundColor: '#354249',
    marginBottom: 25,
    color: '#dde1e0',
  },
  toggleIcon: {
    width: 30,
    lineHeight: 45,
    marginLeft: 10,
    color: '#b5cad5',
    fontSize: 25,
  },
  subtitle: {
    fontSize: 18,
    color: '#b5cad5',
  },
  signInButton: {
    width: WIDTH / 3,
    height: 45,
    borderRadius: 25,
    fontSize: 26,
    backgroundColor: '#496f82',
    textAlign: 'center',
    marginBottom: 15,
    color: '#b5cad5',
    lineHeight: 45,
  },
  forgotLink: {
    fontSize: 20,
    color: '#d0e2eb',
    marginBottom: 25,
  },
  signUpLink: {
    fontSize: 24,
    color: '#d0e2eb',
  },
});