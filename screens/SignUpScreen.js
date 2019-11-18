import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Image, Text, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import SplashScreen from 'react-native-splash-screen';
import Validation from '../utils/validation.js';
import Storage from '../utils/storage.js';
import Communication from '../utils/communication.js';

import * as firebase from 'firebase';

const { width: WIDTH } = Dimensions.get('window');

export default class SignUpScreen extends Component {
  static navigationOptions = {
    title: 'Sign up',
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
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      image: null,

      passwordStrength: '',
      errorMessage: null,

      //Show/hide password button state
      showPass: true,
      press: false,
      showPassConfirm: true,
      pressConfirm: false,

      //The sign up button is disabled when pressed
      signUpButtonDisabled: false
    }
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  handleSignUp = async () => {
    this.setState({ signUpButtonDisabled: true });

    //Validating form
    var errorMessageText = '';

    if (!Validation.validateUsername(this.state.username)) {
      errorMessageText += 'Please enter a username between 5 and 30 characters.';
    } else if (await Validation.valueExists('users', 'usernameLower', this.state.username)) {
      errorMessageText += `A user with the username "${this.state.username}" already exists.`;
    }

    //Validating email here (because firebase only does it later)
    if (!Validation.validateEmail(this.state.email)) {
      errorMessageText += (errorMessageText.length > 0 ? '\n\n' : '') + 'Please enter a valid email address.';
    }

    if (!Validation.validatePassword(this.state.password)) {
      errorMessageText += (errorMessageText.length > 0 ? '\n\n' : '') + 'Password must be 8 characters long, contain at least one lowercase letter, at least one uppercase letter, at least one number and at least one symbol.';
    } else if (!Validation.comparePasswords(this.state.password, this.state.confirmPassword)) {
      errorMessageText += (errorMessageText.length > 0 ? '\n\n' : '') + 'Passwords do not match.';
    }

    if (errorMessageText.length > 0) {
      return this.setState({ errorMessage: errorMessageText, signUpButtonDisabled: false });
    } else {
      try {
        //Creating user
        const userCredentials = await firebase
          .auth()
          .createUserWithEmailAndPassword(this.state.email, this.state.password);

        let imageUrl = '';

        const db = firebase.database().ref(`users/${userCredentials.user.uid}`);

        if (this.state.image) {
          //Uploading image
          imageUrl = await Storage.uploadImage(this.state.image, `images/user-${userCredentials.user.uid}`);
        }

        const activationCode = await Math.floor(Math.random() * 90000) + 10000;

        //Inserting user record
        await db.set({
          active: false,
          activationCode: activationCode,
          email: this.state.email,
          imageUrl: imageUrl,
          username: this.state.username,
          usernameLower: this.state.username.toLowerCase() //Used for forgot password
        });

        //Sending activation email to user
        Communication.sendEmail(
          this.state.email,
          this.state.username,
          'Activate your I Owe U account',
          '<img src="https://i.ibb.co/Jq09HP7/logo-transparent.png" width="128" height="128"><br><br>' +
          `<h3>Hello, <strong>${this.state.username}</strong>. Your activation code is:</h3>` +
          `<h2>${activationCode}</h2><br>` +
          'If you did not request this, please ignore this email.'
        );

        return userCredentials.user.updateProfile({
          displayName: this.state.username
        });
      } catch (e) {
        this.setState({ errorMessage: e.message, signUpButtonDisabled: false });
      }
    }
  }

  updatePasswordStrength = () => {
    this.setState({ passwordStrength: Validation.scorePassword(this.state.password) });
  }

  showPass = () => {
    if (this.state.press == false) {
      this.setState({ showPass: false, press: true });
    } else {
      this.setState({ showPass: true, press: false });
    }
  }

  showPassConfirm = () => {
    if (this.state.pressConfirm == false) {
      this.setState({ showPassConfirm: false, pressConfirm: true });
    } else {
      this.setState({ showPassConfirm: true, pressConfirm: false });
    }
  }

  render() {
    const { image } = this.state;

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.subtitle}>Please enter your details.</Text>
          <View>
            {this.state.errorMessage && <Text style={styles.errorMessage}>{this.state.errorMessage}</Text>}
          </View>
          <TextInput
            style={styles.input}
            placeholder={'Username'}
            placeholderTextColor={'#b5cad5'}
            underlineColorAndroid='transparent'
            autoCapitalize='none'
            onChangeText={username => this.setState({ username })}
            value={this.state.username}
          />
          <TextInput
            style={styles.input}
            placeholder={'Email address'}
            placeholderTextColor={'#b5cad5'}
            underlineColorAndroid='transparent'
            autoCapitalize='none'
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder={'Password'}
              secureTextEntry={this.state.showPass}
              placeholderTextColor={'#b5cad5'}
              underlineColorAndroid='transparent'
              autoCapitalize='none'
              onChangeText={password => { this.setState({ password }); this.updatePasswordStrength(); }}
              value={this.state.password}
            />
            <TouchableOpacity
              onPress={this.showPass.bind(this)}>
              <FontAwesome style={styles.toggleIcon} icon={this.state.press == false ? parseIconFromClassName('far fa-eye') : parseIconFromClassName('far fa-eye-slash')} />
            </TouchableOpacity>
          </View>
          <Text style={styles.strengthIndicator}>{this.state.passwordStrength}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder={'Confirm password'}
              secureTextEntry={this.state.showPassConfirm}
              placeholderTextColor={'#b5cad5'}
              underlineColorAndroid='transparent'
              autoCapitalize='none'
              onChangeText={confirmPassword => this.setState({ confirmPassword })}
              value={this.state.confirmPassword}
            />
            <TouchableOpacity
              onPress={this.showPassConfirm.bind(this)}>
              <FontAwesome style={styles.toggleIcon} icon={this.state.pressConfirm == false ? parseIconFromClassName('far fa-eye') : parseIconFromClassName('far fa-eye-slash')} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profilePictureSubtitle}>Profile picture (optional)</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity
              onPress={() => Storage.chooseImage(this)}>
              <Text style={styles.profilePictureButton}>Choose image</Text>
            </TouchableOpacity>
            {image && (
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
              />
            )}
            {!image && (
              <Image
                style={styles.imagePreview}
              />
            )}
          </View>
          <TouchableOpacity
            disabled={this.state.signUpButtonDisabled}
            onPress={this.handleSignUp}>
            <Text style={styles.signUpButton}>Sign up</Text>
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
  strengthIndicator: {
    marginTop: -20,
    marginBottom: 20,
    fontSize: 14,
    color: '#b5cad5',
    textAlign: 'left',
    width: WIDTH - 75,
    marginLeft: 25,
    marginRight: 25,
  },
  profilePictureSubtitle: {
    fontSize: 17,
    color: '#b5cad5',
    textAlign: 'left',
    width: WIDTH - 75,
    marginLeft: 25,
    marginRight: 25,
    marginBottom: 20,
  },
  profilePictureContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: WIDTH - (WIDTH / 7),
  },
  profilePicturePreview: {
    borderRadius: 50,
    fontSize: 18,
    paddingLeft: 25,
    backgroundColor: '#354249',
    marginBottom: 25,
    color: '#dde1e0',
  },
  profilePictureButton: {
    height: 45,
    borderRadius: 15,
    fontSize: 18,
    backgroundColor: '#496f82',
    textAlign: 'center',
    marginBottom: 25,
    color: '#b5cad5',
    lineHeight: 45,
    width: (WIDTH / 2),
  },
  imagePreview: {
    width: (WIDTH / 2) - 100,
    height: (WIDTH / 2) - 100,
    backgroundColor: '#566f7c',
    marginBottom: 25,
    borderRadius: 30,
  },
  signUpButton: {
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