import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Image, Text, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import generation from '../utils/generation';
import miscellaneous from '../utils/miscellaneous';
import storage from '../utils/storage';
import validation from '../utils/validation';

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

      //Buttons are disabled when the create group button is pressed
      chooseButtonDisabled: false,
      createGroupButtonDisabled: false
    }
  }

  async componentDidMount() {
    SplashScreen.hide();
  }

  handleCreateGroup = async () => {
    const { navigate } = this.props.navigation;

    this.setState({
      //Disabling buttons
      chooseButtonDisabled: true,
      createGroupButtonDisabled: true,

      //Removing whitespace from fields
      groupName: this.state.groupName.trim(),
      paymentOptions: this.state.paymentOptions.trim()
    });

    //Validating form
    var errorMessageText = '';

    if (!validation.validateName(this.state.groupName)) {
      errorMessageText += 'Please enter a group name between 5 and 30 characters.';
    } else if (await validation.valueExists('groups', 'groupNameLower', this.state.groupName.toLowerCase())) {
      errorMessageText += `A group with the name "${this.state.groupName}" already exists.`;
    }

    if (validation.emptyOrWhitespace(this.state.paymentOptions)) {
      errorMessageText += (errorMessageText.length > 0 ? '\n\n' : '') + 'Please provide payment options.';
    }

    if (errorMessageText.length > 0) {
      return this.setState({ errorMessage: errorMessageText, createGroupButtonDisabled: false });
    } else {
      try {
        //Creating group
        const groupUid = firebase.database().ref('groups').push().key; //Group UID

        let imageUrl = '';

        if (this.state.image) {
          //Uploading image
          imageUrl = await storage.uploadImage(this.state.image, `images/group-${groupUid}`);
        }

        const db = firebase.database();

        //Inserting group record
        await db.ref(`groups/${groupUid}`).set({
          groupName: this.state.groupName,
          groupNameLower: this.state.groupName.toLowerCase(), //Used for create group validation
          imageUrl: imageUrl,
          paymentOptions: this.state.paymentOptions
        });

        //Inserting member records (1: Admin; 0: Regular member)
        await miscellaneous.setMember(this.props.navigation.getParam('userUid'), groupUid, 1);

        let inviteCode;
        let inviteExists = true;

        //Checking that the invite code is not present in the database
        if (inviteExists) {
          inviteCode = await generation.generateRandomString(7);
          inviteExists = await validation.keyExists('invites', inviteCode);
        }

        //Inserting invite records
        await miscellaneous.setInvite(inviteCode, groupUid);

        //Initial invite code is passed as a prop
        return navigate('GroupHomeScreen', { groupUid: groupUid, groupName: this.state.groupName, inviteCode: inviteCode });
      } catch (e) {
        this.setState({
          errorMessage: e.message,
          chooseButtonDisabled: true,
          createGroupButtonDisabled: true
        });
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
            underlineColorAndroid={'transparent'}
            onChangeText={groupName => this.setState({ groupName })}
            value={this.state.groupName}
          />
          <Text style={styles.groupPictureSubtitle}>Group picture (optional)</Text>
          <View style={styles.groupPictureContainer}>
            <TouchableOpacity
              disabled={this.state.chooseButtonDisabled}
              onPress={() => storage.chooseImage(this)}>
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
            underlineColorAndroid={'transparent'}
            autoCapitalize={'none'}
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
    marginTop: 25,
    marginBottom: 25,
  },
  errorMessage: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 25,
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
  groupPictureSubtitle: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 20,
    fontSize: 17,
    color: '#b5cad5',
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