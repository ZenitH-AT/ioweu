import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, ActivityIndicator, TouchableOpacity as RNTouchableOpacity, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-community/async-storage';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import Modal from 'react-native-modal';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import communication from '../utils/communication';
import miscellaneous from '../utils/miscellaneous';
import validation from '../utils/validation';

import UserMenu from '../components/UserMenu';
import logo from '../assets/logo.png';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

export default class HomeScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Home',
      headerStyle: {
        backgroundColor: '#273238',
        borderBottomWidth: 1,
        borderBottomColor: '#496f82',
      },
      headerTintColor: '#b5cad5',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: () => (
        <UserMenu
          updateProfileClick={() => { navigation.navigate('UpdateScreen'); }}
          signOutClick={() => { firebase.auth().signOut(); }}
        />
      ),
    }
  }

  constructor() {
    super();

    this.state = {
      uid: '',
      active: null,
      email: '',
      username: '',
      loading: true,

      //Group data
      numGroups: 0,
      groupsData: null,
      numInvitations: 3, //TODO
      invitationsData: null, //TODO

      //For joining a group using an invite code
      modalVisible: false,
      joinInviteCode: '',
      modalErrorMessage: '',
      modalJoinButtonDisabled: false,
      modalHideDisabled: false,

      //For account activation
      activationCode: null,
      activationCodeInput: '',
      infoMessage: '',
      errorMessage: '',
      resendEmailCooldown: null,

      //For nested ScrollView functionality
      screenScrollEnabled: true,
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    const { uid, email } = firebase.auth().currentUser;

    await this.setState({ uid, email });

    //Retrieving additional user data
    firebase.database().ref(`users/${this.state.uid}`)
      .on('value', snap => this.setState({
        username: snap.child('username').val(),
        active: snap.child('active').val(),
        activationCode: snap.child('activationCode').val(),
      }));

    await this.getGroupsData();
    await this.enableResendCooldown();

    this.setState({ loading: false });

    //Recalculate groups data if the user navigated back from a newly created/deleted/joined/left group
    this.recalculate = this.props.navigation.addListener('willFocus', async () => {
      if (this.props.navigation.getParam('recalculateGroupsData')) {
        this.setState({ numGroups: 0, groupsData: null, loading: true });
        await this.getGroupsData();
        this.setState({ loading: false });
      }
    });
  }

  componentWillUnmount() {
    this.recalculate.remove();
  }

  async getGroupsData() {
    await firebase.database().ref(`members/${this.state.uid}`)
      .once('value', snap => {
        let numGroups = 0;
        const groupsData = {};

        snap.forEach(data => {
          numGroups++;

          //Getting group data
          firebase.database().ref(`groups/${data.key}`).on('value', async (snap) => {
            groupsData[data.key] = {
              'groupUid': data.key,
              'numMembers': (await miscellaneous.getMembers(data.key)).length,
              'groupName': snap.child('groupName').val(),
              'groupNameLower': snap.child('groupNameLower').val(),
              'imageUrl': snap.child('imageUrl').val(),
              'paymentOptions': snap.child('paymentOptions').val()
            };
          });
        });

        this.setState({ numGroups, groupsData });
      });
  }

  //TODO: getInvitationsData()
  //For displaying incoming invitation cards

  hideModal() {
    if (!this.state.hideModalDisabled) {
      this.setState({ modalVisible: false, modalErrorMessage: '' });
    }
  }

  async handleJoinGroup(inviteCode) {
    const { navigate } = this.props.navigation;

    this.setState({
      modalJoinButtonDisabled: true,
      modalHideDisabled: true
    });

    let modalErrorMessage;

    if (!validation.emptyOrWhitespace(inviteCode)) {
      const inviteExists = await validation.keyExists('invites', inviteCode);

      if (inviteExists) {
        let groupUid = await validation.inviteExpired(inviteCode); //Function returns groupUid if not expired

        if (groupUid != true) { //If invite has not expired
          //Checking if user is already in the group
          if (!await validation.keyExists(`members/${this.state.uid}`, groupUid)) {
            //Inserting member records (1: Admin; 0: Regular member)
            await miscellaneous.setMember(this.state.uid, groupUid, 0);
            await miscellaneous.useInvite(inviteCode, groupUid);

            this.setState({ modalVisible: false });
            return navigate('GroupScreens', { groupUid, groupName: await miscellaneous.getGroupName(groupUid), userUid: this.state.uid, newMember: true });
          } else {
            modalErrorMessage = 'You are already in this group.';
          }
        } else {
          modalErrorMessage = 'Invite code expired.';
        }
      } else {
        modalErrorMessage = 'Invite code does not exist.';
      }
    } else {
      modalErrorMessage = 'Please enter an invite code.';
    }

    return this.setState({
      modalErrorMessage,
      modalJoinButtonDisabled: false,
      modalHideDisabled: false
    });
  }

  //Countdown timer for resend code button (remaining time is remembered across reloads)
  async enableResendCooldown() {
    const storedTimeRemaining = await AsyncStorage.getItem('resendEmailCooldown');
    const timeRemaining = await isNaN(parseInt(storedTimeRemaining)) ? '0' : storedTimeRemaining;

    this.setState({ resendEmailCooldown: timeRemaining });

    this.intervalState = setInterval(() =>
      this.setState((prevState) =>
        ({ resendEmailCooldown: prevState.resendEmailCooldown == 0 ? 0 : prevState.resendEmailCooldown - 1 })), 1000);

    this.intervalStorage = setInterval(() =>
      AsyncStorage.setItem('resendEmailCooldown', `${this.state.resendEmailCooldown}`), 1000);
  }

  async activateAccount() {
    if (this.state.activationCodeInput == this.state.activationCode) {
      //Update activation status in firebase and return
      return await firebase.database().ref(`users/${this.state.uid}`).update({
        active: true
      });
    } else {
      this.setState({ infoMessage: '', errorMessage: 'Invalid activation code, please try again.' });
    }
  }

  async resendActivationCode() {
    //Temporarily disabling resend button for two minutes
    await AsyncStorage.setItem('resendEmailCooldown', '120');
    await this.setState({ resendEmailCooldown: '120' });

    const newActivationCode = await Math.floor(Math.random() * 90000) + 10000;

    //Update value in firebase and state
    await firebase.database().ref(`users/${this.state.uid}`).update({
      activationCode: newActivationCode
    });

    await this.setState({ activationCode: newActivationCode });

    //Send email containing new activation code
    communication.sendEmail(
      this.state.email,
      this.state.username,
      'Activate your I Owe U account',
      '<img src="https://i.ibb.co/Jq09HP7/logo-transparent.png" width="128" height="128"><br><br>' +
      `<h3>Hello, <strong>${this.state.username}</strong>. Your activation code is:</h3>` +
      `<h2>${this.state.activationCode}</h2><br>` +
      'If you did not request this, please ignore this email.'
    );

    this.setState({ infoMessage: 'Code resent. Please check your email.', errorMessage: '' });
  }

  render() {
    const { navigate } = this.props.navigation;

    if (this.state.loading) {
      return <ScrollView style={styles.scrollView}></ScrollView>;
    }

    return (
      <ScrollView style={styles.scrollView} scrollEnabled={this.state.screenScrollEnabled}>
        {this.state.active && ( //Home view
          <View style={styles.container}>
            <Text style={styles.title}>Your groups {(this.state.numGroups > 0) && <Text>({this.state.numGroups})</Text>}</Text>
            <ScrollView
              style={styles.sectionCards}
              onTouchStart={(ev) => {
                this.setState({ screenScrollEnabled: false });
              }}
              onMomentumScrollEnd={(e) => { this.setState({ screenScrollEnabled: true }); }}
              onScrollEndDrag={(e) => { this.setState({ screenScrollEnabled: true }); }}>
              {this.state.numGroups > 0 && (
                <View>
                  {Object.keys(this.state.groupsData).map((key, i) => {
                    const groupData = this.state.groupsData[key];
                    let cardStyle = styles.groupCard;

                    if (i === Object.keys(this.state.groupsData).length - 1) {
                      cardStyle = styles.lastGroupCard; //Last card has no bottom border
                    }

                    //Displaying group cards
                    return (
                      <TouchableOpacity
                        style={cardStyle}
                        delayPressIn={50}
                        onPress={() => navigate('GroupScreens', { groupUid: groupData.groupUid, groupName: groupData.groupName, userUid: this.state.uid })}>
                        <Image
                          style={styles.groupImage}
                          source={
                            groupData.imageUrl == '' ? require('../assets/group-default.png') : { uri: groupData.imageUrl }
                          }
                        />
                        <View>
                          <Text style={styles.groupName}>{groupData.groupName}</Text>
                          <Text style={styles.groupMembers}>{groupData.numMembers} {groupData.numMembers == 1 ? 'member' : 'members'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {this.state.numGroups == 0 && (<View><Text style={styles.noGroups}>No groups to display.</Text></View>)}
            </ScrollView>
            <TouchableOpacity delayPressIn={50}>
              <Text onPress={() => navigate('CreateGroupScreen', { userUid: this.state.uid })}
                style={styles.sectionButton}>
                <FontAwesome style={styles.toggleIcon} icon={parseIconFromClassName('fas fa-plus')} />  Create group
              </Text>
            </TouchableOpacity>
            <Text style={styles.title}>Group invitations {(this.state.numInvitations > 0) && <Text>({this.state.numInvitations})</Text>}</Text>
            <ScrollView style={styles.sectionCards}
              onTouchStart={(ev) => {
                this.setState({ screenScrollEnabled: false });
              }}
              onMomentumScrollEnd={(e) => { this.setState({ screenScrollEnabled: true }); }}
              onScrollEndDrag={(e) => { this.setState({ screenScrollEnabled: true }); }}>
              <View style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <Image
                    style={styles.groupImage}
                  />
                  <View>
                    <Text style={styles.inviteMessage}>
                      <Text style={{ fontWeight: 'bold' }}>Username</Text> has invited you to join <Text style={{ fontWeight: "bold" }}>Group Name</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.inviteFooter}>
                  <Text style={styles.groupMembers}>24 members</Text>
                  <View style={styles.inviteButtons}>
                    <TouchableOpacity delayPressIn={50}>
                      <Text style={styles.inviteButton}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity delayPressIn={50}>
                      <Text style={styles.inviteButton}>Ignore</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <Image
                    style={styles.groupImage}
                  />
                  <View>
                    <Text style={styles.inviteMessage}>
                      <Text style={{ fontWeight: 'bold' }}>Username</Text> has invited you to join <Text style={{ fontWeight: "bold" }}>Group Name</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.inviteFooter}>
                  <Text style={styles.groupMembers}>24 members</Text>
                  <View style={styles.inviteButtons}>
                    <TouchableOpacity delayPressIn={50}>
                      <Text style={styles.inviteButton}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity delayPressIn={50}>
                      <Text style={styles.inviteButton}>Ignore</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.lastInviteCard}>
                <View style={styles.inviteHeader}>
                  <Image
                    style={styles.groupImage}
                  />
                  <View>
                    <Text style={styles.inviteMessage}>
                      <Text style={{ fontWeight: 'bold' }}>Username</Text> has invited you to join <Text style={{ fontWeight: "bold" }}>Group Name</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.inviteFooter}>
                  <Text style={styles.groupMembers}>24 members</Text>
                  <View style={styles.inviteButtons}>
                    <TouchableOpacity delayPressIn={50}>
                      <Text style={styles.inviteButton}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity delayPressIn={50}>
                      <Text style={styles.inviteButton}>Ignore</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity
              delayPressIn={50}
              onPress={() => { this.setState({ modalVisible: true }) }}
            >
              <Text style={styles.sectionButton}><FontAwesome style={styles.toggleIcon} icon={parseIconFromClassName('fas fa-door-open')} />  Use invite code</Text>
            </TouchableOpacity>
            <Modal
              isVisible={this.state.modalVisible}
              onBackButtonPress={() => this.hideModal()}
              onBackdropPress={() => this.hideModal()}
              deviceWidth={WIDTH}
              deviceHeight={HEIGHT}
              backdropColor={'rgba(29, 36, 40, 0.5)'}
              style={{ marginBottom: HEIGHT / 5 }}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>Join group</Text>
                <View>
                  {this.state.modalErrorMessage != '' && <Text style={styles.modalErrorMessage}>{this.state.modalErrorMessage}</Text>}
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder={'Invite code'}
                  placeholderTextColor={'#b5cad5'}
                  underlineColorAndroid={'transparent'}
                  autoCapitalize={'none'}
                  maxLength={7}
                  onChangeText={joinInviteCode => this.setState({ joinInviteCode })}
                  value={this.state.joinInviteCode}
                />
                <View style={styles.modalButtons}>
                  <RNTouchableOpacity onPress={() => this.handleJoinGroup(this.state.joinInviteCode)}><Text style={styles.modalButton}>Join</Text></RNTouchableOpacity>
                  <RNTouchableOpacity onPress={() => this.hideModal()}><Text style={styles.modalButton}>Cancel</Text></RNTouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}
        {!this.state.active && ( //Activate account view
          <View style={styles.container}>
            <Image source={logo} style={styles.logoImage} />
            <Text style={styles.activateTitle}>Welcome to I Owe U, {this.state.username}!</Text>
            <Text style={styles.subtitle}>Before you can create or join a group, you must first enter the activation code sent to your email ({this.state.email}).</Text>
            <View>
              {this.state.infoMessage != '' && <Text style={styles.infoMessage}>{this.state.infoMessage}</Text>}
            </View>
            <View>
              {this.state.errorMessage != '' && <View><Text style={styles.errorMessage}>{this.state.errorMessage}</Text></View>}
            </View>
            <TextInput
              style={styles.input}
              placeholder={'Activation code'}
              placeholderTextColor={'#b5cad5'}
              underlineColorAndroid={'transparent'}
              keyboardType={'numeric'}
              maxLength={5}
              onChangeText={activationCodeInput => this.setState({ activationCodeInput })}
              value={`${this.state.activationCodeInput}`} //Using `${}` is important to avoid an invalid prop being supplied
            />
            <TouchableOpacity onPress={() => this.activateAccount()}>
              <Text style={styles.activateButton}>Activate account</Text>
            </TouchableOpacity>
            <View>
              {this.state.resendEmailCooldown == '0' &&
                <TouchableOpacity onPress={() => this.resendActivationCode()}>
                  <Text style={styles.resendEmailLink}>Resend code</Text>
                </TouchableOpacity>
              }
            </View>
            <View>
              {this.state.resendEmailCooldown != '0' &&
                <Text style={styles.resendEmailCooldown}>Please wait {this.state.resendEmailCooldown} seconds before requesting the code to be resent again.</Text>
              }
            </View>
          </View>
        )
        }
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
  infoMessage: {
    width: WIDTH - (WIDTH / 7),
    marginBottom: 25,
    color: '#30b0db',
    fontSize: 15,
    textAlign: 'center',
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
  sectionCards: {
    maxHeight: HEIGHT / 2.5,
    marginBottom: 20,
  },
  sectionButton: {
    minWidth: WIDTH / 2.5,
    padding: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#b5cad5',
    backgroundColor: '#496f82',
  },
  groupCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: WIDTH / 1.25,
    marginBottom: 20,
    backgroundColor: '#3a4449',
    borderRadius: 20,
    borderColor: '#566f7c'
  },
  lastGroupCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: WIDTH / 1.25,
    backgroundColor: '#3a4449',
    borderRadius: 20,
    borderColor: '#566f7c'
  },
  groupImage: {
    width: WIDTH / 7,
    height: WIDTH / 7,
    backgroundColor: '#566f7c',
    borderRadius: 20,
    marginRight: 20,
  },
  groupName: {
    fontSize: 22,
    color: '#b5cad5',
  },
  groupMembers: {
    fontSize: 14,
    color: '#b5cad5',
  },
  noGroups: {
    width: WIDTH - (WIDTH / 7),
    textAlign: 'center',
    fontSize: 18,
    color: '#b5cad5',
  },
  inviteCard: {
    flex: 1,
    width: WIDTH / 1.25,
    marginBottom: 25,
    backgroundColor: '#3a4449',
    borderRadius: 20,
    borderColor: '#566f7c'
  },
  lastInviteCard: {
    flex: 1,
    width: WIDTH / 1.25,
    backgroundColor: '#3a4449',
    borderRadius: 20,
    borderColor: '#566f7c'
  },
  inviteHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  inviteMessage: {
    width: (WIDTH / 1.25) - (WIDTH / 7) - 30,
    fontSize: 18,
    color: '#b5cad5',
  },
  inviteFooter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: WIDTH / 40,
    marginLeft: WIDTH / 30,
    marginRight: WIDTH / 30,
    alignItems: 'center'
  },
  inviteButtons: {
    flexDirection: 'row',
  },
  inviteButton: {
    minWidth: WIDTH / 6,
    marginLeft: WIDTH / 30,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 15,
    color: '#b5cad5',
    backgroundColor: '#496f82',
  },
  modal: {
    flex: 1,
    position: 'absolute',
    alignSelf: 'center',
    width: WIDTH / 1.4,
    padding: HEIGHT / 35,
    paddingLeft: WIDTH / 15,
    paddingRight: WIDTH / 15,
    backgroundColor: '#485c67',
    borderRadius: 20,
  },
  modalTitle: {
    marginBottom: 15,
    color: '#dde1e0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalErrorMessage: {
    marginBottom: 15,
    paddingBottom: 5,
    paddingTop: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(39, 50, 56, 0.8)',
    color: '#db3b30',
    fontSize: 15,
    textAlign: 'center',
  },
  modalInput: {
    height: 45,
    borderRadius: 25,
    fontSize: 18,
    paddingLeft: 25,
    backgroundColor: '#354249',
    marginBottom: 15,
    color: '#dde1e0',
  },
  modalButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: WIDTH / 15,
    marginRight: WIDTH / 15,
  },
  modalButton: {
    minWidth: WIDTH / 6,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#b5cad5',
    backgroundColor: '#496f82',
  },
  logoImage: {
    width: WIDTH - 220,
    height: WIDTH - 220,
  },
  activateTitle: {
    width: WIDTH - (WIDTH / 7),
    fontSize: 22,
    color: '#b5cad5',
    textAlign: 'center',
  },
  activateButton: {
    width: WIDTH - (WIDTH / 7),
    height: 45,
    borderRadius: 25,
    fontSize: 24,
    backgroundColor: '#496f82',
    textAlign: 'center',
    marginBottom: 15,
    color: '#b5cad5',
    lineHeight: 45,
  },
  resendEmailLink: {
    fontSize: 20,
    color: '#d0e2eb',
  },
  resendEmailCooldown: {
    width: WIDTH - (WIDTH / 7),
    fontSize: 16,
    color: '#d0e2eb',
  },
});