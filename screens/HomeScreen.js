import React, { Component } from 'react';
import {
  AppState,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import SplashScreen from 'react-native-splash-screen';
import Communication from '../utils/communication.js';

import * as firebase from 'firebase';

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
          updateProfileClick={() => { navigation.navigate('ProfileScreen'); }}
          signOutClick={() => { firebase.auth().signOut(); }}
        />
      ),
    };
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
      numInvitations: 3,
      invitationsData: null, //TODO

      //For joining a group using an invite code
      joinModalVisible: false,
      joinInviteCode: '',
      modalErrorMessage: 'Invalid invite code.',

      //For account activation
      activationCode: null,
      activationCodeInput: '',
      infoMessage: '',
      errorMessage: '',
      resendButtonTimer: null,

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
    await this.enableResendTimer();

    this.setState({ loading: false });

    //Recalculate data if the user navigated back from a newly-created group
    this.recalculate = this.props.navigation.addListener('willFocus', async () => {
      if (this.props.navigation.getParam('newGroup')) {
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

        snap.forEach(child => {
          numGroups++;

          //Calculating number of group members
          let numMembers = 0;

          firebase.database().ref('members').on('value', async (membersSnap) => {
            await membersSnap.forEach(async membersChild => {
              if (membersChild.child(child.key)) {
                numMembers++;
              }
            });
          });

          //Getting group data
          firebase.database().ref(`groups/${child.key}`).on('value', groupSnap => {
            groupsData[child.key] = {
              'groupUid': child.key,
              'numMembers': numMembers,
              'groupName': groupSnap.child('groupName').val(),
              'groupNameLower': groupSnap.child('groupNameLower').val(),
              'imageUrl': groupSnap.child('imageUrl').val(),
              'paymentOptions': groupSnap.child('paymentOptions').val()
            };
          });
        });

        this.setState({ numGroups, groupsData });
      });
  }

  //getInvitesData

  //Countdown timer for resend code button (remaining time is remembered across reloads)
  async enableResendTimer() {
    const storedTimeRemaining = await AsyncStorage.getItem('resendButtonTimer');
    const timeRemaining = await isNaN(parseInt(storedTimeRemaining)) ? '0' : storedTimeRemaining;

    this.setState({ resendButtonTimer: timeRemaining });

    this.intervalState = setInterval(() =>
      this.setState((prevState) =>
        ({ resendButtonTimer: prevState.resendButtonTimer == 0 ? 0 : prevState.resendButtonTimer - 1 })), 1000);

    this.intervalStorage = setInterval(() =>
      AsyncStorage.setItem('resendButtonTimer', `${this.state.resendButtonTimer}`), 1000);
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
    //Temporarily disabling resend button for two minutes (by setting the button timer)
    await AsyncStorage.setItem('resendButtonTimer', '120');
    await this.setState({ resendButtonTimer: '120' });

    const newActivationCode = await Math.floor(Math.random() * 90000) + 10000;

    //Update value in firebase and state
    await firebase.database().ref(`users/${this.state.uid}`).update({
      activationCode: newActivationCode
    });

    await this.setState({ activationCode: newActivationCode });

    //Send email containing new activation code
    Communication.sendEmail(
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
            <Text style={styles.sectionTitle}>Your groups {(this.state.numGroups > 0) && <Text>({this.state.numGroups})</Text>}</Text>
            <ScrollView
              style={styles.sectionCards}
              onTouchStart={(ev) => {
                this.setState({ screenScrollEnabled: false });
              }}
              onMomentumScrollEnd={(e) => { this.setState({ screenScrollEnabled: true }); }}
              onScrollEndDrag={(e) => { this.setState({ screenScrollEnabled: true }); }}>
              {Object.keys(this.state.groupsData).map(key => {
                const groupData = this.state.groupsData[key];

                //Displaying group cards
                return (
                  <TouchableOpacity
                    style={styles.groupCard}
                    delayPressIn={50}
                    onPress={() => navigate('GroupHomeScreen', { groupUid: groupData.groupUid, groupName: groupData.groupName })}>
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
            </ScrollView>
            <TouchableOpacity delayPressIn={50}>
              <Text onPress={() => navigate('CreateGroupScreen', { userUid: this.state.uid })}
                style={styles.sectionButton}>
                <FontAwesome style={styles.toggleIcon} icon={parseIconFromClassName('fas fa-plus')} />  Create group
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Group invitations {(this.state.numInvitations > 0) && <Text>({this.state.numInvitations})</Text>}</Text>
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
            </ScrollView>
            <TouchableOpacity
              delayPressIn={50}
              onPress={() => { this.setState({ joinModalVisible: !this.state.joinModalVisible }) }}
            >
              <Text style={styles.sectionButton}><FontAwesome style={styles.toggleIcon} icon={parseIconFromClassName('fas fa-door-open')} />  Use invite code</Text>
            </TouchableOpacity>

            <Modal
              style={styles.modal}
              animationType='slide'
              transparent={true}
              style={styles.modal}
              visible={this.state.joinModalVisible}
            >
              <View style={styles.modalBackground}>
                <TouchableWithoutFeedback onPress={() => {
                  this.setState({
                    joinModalVisible: !this.state.joinModalVisible,
                    modalErrorMessage: ''
                  })
                }}>
                  <View style={styles.modalOuter}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                      <View style={styles.modalInner}>
                        <Text style={styles.modalTitle}>Join group</Text>
                        <View>
                          {this.state.modalErrorMessage != '' && <Text style={styles.modalErrorMessage}>{this.state.modalErrorMessage}</Text>}
                        </View>
                        <TextInput
                          style={styles.modalInput}
                          placeholder={'Invite code'}
                          placeholderTextColor={'#b5cad5'}
                          underlineColorAndroid='transparent'
                          maxLength={7}
                          onChangeText={joinInviteCode => this.setState({ joinInviteCode })}
                          value={this.state.joinInviteCode}
                        />
                        <View style={styles.modalButtons}>
                          <TouchableOpacity>
                            <Text style={styles.modalButton}>Join</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { this.setState({ joinModalVisible: !this.state.joinModalVisible }) }}>
                            <Text style={styles.modalButton}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </Modal>
          </View>
        )}
        {!this.state.active && ( //Activate account view
          <View style={styles.container}>
            <Image source={logo} style={styles.logoImage} />
            <Text style={styles.title}>Welcome to I Owe U, {this.state.username}!</Text>
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
              underlineColorAndroid='transparent'
              keyboardType='numeric'
              maxLength={5}
              onChangeText={activationCodeInput => this.setState({ activationCodeInput })}
              value={`${this.state.activationCodeInput}`} //Using `${}` is important to avoid an invalid prop being supplied
            />
            <TouchableOpacity onPress={this.activateAccount.bind(this)}>
              <Text style={styles.activateButton}>Activate account</Text>
            </TouchableOpacity>
            <View>
              {this.state.resendButtonTimer == '0' &&
                <TouchableOpacity onPress={this.resendActivationCode.bind(this)}>
                  <Text style={styles.resendEmailLink}>Resend code</Text>
                </TouchableOpacity>
              }
            </View>
            <View>
              {this.state.resendButtonTimer != '0' &&
                <Text style={styles.resendEmailTimer}>Please wait {this.state.resendButtonTimer} seconds before requesting the code to be resent again.</Text>
              }
            </View>
          </View>
        )}
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
    justifyContent: 'center',
    marginBottom: 25,
  },
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    fontSize: 18,
    color: '#b5cad5',
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
  sectionTitle: {
    marginTop: 25,
    fontSize: 22,
    color: '#dde1e0',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionCards: {
    maxHeight: HEIGHT / 2.5,
    marginBottom: 20
  },
  sectionButton: {
    marginBottom: 20,
    padding: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 15,
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
  inviteCard: {
    flex: 1,
    width: WIDTH / 1.25,
    marginBottom: 25,
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
    marginLeft: WIDTH / 30,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
    fontSize: 15,
    color: '#b5cad5',
    backgroundColor: '#496f82',
  },
  modal: {
    width: WIDTH,
    height: HEIGHT,
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 36, 40, 0.3)'
  },
  modalOuter: {
    flex: 1,
  },
  modalInner: {
    width: WIDTH / 1.4,
    marginTop: HEIGHT / 4,
    padding: HEIGHT / 30,
    paddingLeft: WIDTH / 15,
    paddingRight: WIDTH / 15,
    backgroundColor: '#485c67',
    borderRadius: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#dde1e0',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalErrorMessage: {
    marginBottom: 15,
    color: '#db3b30',
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
    textShadowColor: 'rgba(39, 50, 56, 0.9)',
    textShadowRadius: 10
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
    marginBottom: 25,
  },
  modalButton: {
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
    fontSize: 16,
    color: '#b5cad5',
    backgroundColor: '#496f82',
  },
  logoImage: {
    width: WIDTH - 220,
    height: WIDTH - 220,
  },
  title: {
    width: WIDTH - (WIDTH / 7),
    fontSize: 22,
    color: '#b5cad5',
    marginBottom: 25,
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
  resendEmailTimer: {
    width: WIDTH - (WIDTH / 7),
    fontSize: 16,
    color: '#d0e2eb',
  },
});