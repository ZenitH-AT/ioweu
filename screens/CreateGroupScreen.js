import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Image, Text, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';
import Generation from '../utils/generation.js';
import Storage from '../utils/storage.js';
import Validation from '../utils/validation.js';

import * as firebase from 'firebase';

const { width: WIDTH } = Dimensions.get('window');

export default class CreateGroupScreen extends Component {
  static navigationOptions = {
    title: 'Create group',
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
      groupName: '',
      paymentOptions: '',
      image: null,
      errorMessage: null,
      createGroupButtonDisabled: false
    }
  }

  async componentDidMount() {
    SplashScreen.hide();
  }

  handleCreateGroup = async () => {
    const { navigate } = this.props.navigation;

    this.setState({ createGroupButtonDisabled: true });

    //Validating form
    var errorMessageText = '';

    if (!Validation.validateUsername(this.state.groupName)) {
      errorMessageText += 'Please enter a username between 5 and 30 characters.';
    } else if (await Validation.valueExists('groups', 'groupNameLower', this.state.groupName)) {
      errorMessageText += `A group with the name "${this.state.groupName}" already exists.`;
    }

    if (this.state.paymentOptions === '') {
      errorMessageText += (errorMessageText.length > 0 ? '\n\n' : '') + 'Please provide payment options.';
    }

    if (errorMessageText.length > 0) {
      return this.setState({ errorMessage: errorMessageText, createGroupButtonDisabled: false });
    } else {
      try {
        //Creating group
        const groupUid = firebase.database().ref().child('groups').push().key; //Group UID

        let imageUrl = '';

        if (this.state.image) {
          //Uploading image
          imageUrl = await Storage.uploadImage(this.state.image, `images/group-${groupUid}`);
        }

        const db = firebase.database();

        //Inserting group record
        await db.ref(`groups/${groupUid}`).set({
          groupName: this.state.groupName,
          groupNameLower: this.state.groupName.toLowerCase(), //Used for create group validation
          imageUrl: imageUrl,
          paymentOptions: this.state.paymentOptions
        });

        //Inserting member record
        await db.ref(`members/${this.props.navigation.getParam('userUid')}/${groupUid}`)
          .set(1); //1: Admin; 0: Regular member

        let inviteCode;
        let inviteExists = true;

        //Checking that the invite code is not present in the database
        if (inviteExists) {
          inviteCode = await Generation.generateRandomString(7);
          inviteExists = await Validation.childExists('invites', inviteCode);
        }

        //Inserting invite record
        await db.ref(`invites/${inviteCode}`).set({
          expireTime: new Date().getTime() + 24 * 60 * 60, //Current UNIX timestamp + 24 hours
          groupUid: groupUid
        });

        //Initial invite code is passed as a prop
        return navigate('GroupHomeScreen', { groupUid: groupUid, groupName: this.state.groupName, inviteCode: inviteCode });
      } catch (e) {
        this.setState({ errorMessage: e.message, createGroupButtonDisabled: false });
      }
    }
  }

  render() {
    const { image } = this.state;

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.subtitle}>Please enter group details.</Text>
          <View>
            {this.state.errorMessage && <Text style={styles.errorMessage}>{this.state.errorMessage}</Text>}
          </View>
          <TextInput
            style={styles.input}
            placeholder={'Group name'}
            placeholderTextColor={'#b5cad5'}
            underlineColorAndroid='transparent'
            autoCapitalize='none'
            onChangeText={groupName => this.setState({ groupName })}
            value={this.state.groupName}
          />
          <Text style={styles.groupPictureSubtitle}>Group picture (optional)</Text>
          <View style={styles.groupPictureContainer}>
            <TouchableOpacity
              onPress={() => Storage.chooseImage(this)}>
              <Text style={styles.groupPictureButton}>Choose image</Text>
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
          <TextInput
            style={styles.input}
            placeholder={'Payment options'}
            placeholderTextColor={'#b5cad5'}
            underlineColorAndroid='transparent'
            autoCapitalize='none'
            onChangeText={paymentOptions => this.setState({ paymentOptions })}
            value={this.state.paymentOptions}
          />
          <TouchableOpacity
            disabled={this.state.createGroupButtonDisabled}
            onPress={this.handleCreateGroup}>
            <Text style={styles.createGroupButton}>Create group</Text>
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
  groupPictureSubtitle: {
    fontSize: 17,
    color: '#b5cad5',
    textAlign: 'left',
    width: WIDTH - 75,
    marginLeft: 25,
    marginRight: 25,
    marginBottom: 20,
  },
  groupPictureContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: WIDTH - (WIDTH / 7),
  },
  groupPicturePreview: {
    borderRadius: 50,
    fontSize: 18,
    paddingLeft: 25,
    backgroundColor: '#354249',
    marginBottom: 25,
    color: '#dde1e0',
  },
  groupPictureButton: {
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
  createGroupButton: {
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