import React, { Component, useState } from 'react'; //useRef required for ActionTip
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
import { HeaderBackButton } from 'react-navigation-stack';
import { TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import generation from '../utils/generation';
import storage from '../utils/storage';
import validation from '../utils/validation';
import miscellaneous from '../utils/miscellaneous';

import GroupMenu from '../components/GroupMenu';

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
      headerLeft: () => (
        <HeaderBackButton tintColor={'#b5cad5'} onPress={() => {
          navigation.navigate('HomeScreen', {
            //To recalculate groups data on pressing the back button (if newly created/joined group)
            recalculateGroupsData: navigation.getParam('inviteCode') ? true : navigation.getParam('newMember') ? true : false
          });
        }} />
      ),
      headerRight: () => (
        <GroupMenu
          groupUid={() => { return navigation.getParam('groupUid'); }}
          groupName={() => { return navigation.getParam('groupName'); }}
          inviteUsersClick={() => { navigation.navigate('GroupInviteScreen'); }}
          viewMembersClick={() => { navigation.navigate('GroupMembersScreen'); }}
          updateGroupClick={() => { navigation.navigate('GroupUpdateScreen'); }}
          leaveGroup={() => { navigation.navigate('HomeScreen', { recalculateGroupsData: true }) }}
        />
      ),
    };
  }

  constructor() {
    super();

    this.state = {
      uid: '',
      email: '',
      username: '',
      loading: true,

      //For initial invite code (after group creation)
      expiryCountdown: null,

      //Members data (temporary, for testing)
      numMembers: 0,
      membersData: null,
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

    if (this.props.navigation.getParam('inviteCode')) {
      await this.enableExpiryCountdown(this.props.navigation.getParam('inviteCode'));
    }

    //Temporary, for testing
    await this.getMembersData();

    this.setState({ loading: false });
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

  //Temporary, for testing
  async getMembersData() {
    //Getting the uids and types of all members, and number of members
    const members = await miscellaneous.getMembers(this.props.navigation.getParam('groupUid'));
    const numMembers = members.length;

    const membersData = {};

    Object.keys(members).map((key, i) => {
      const member = members[key];

      //Getting member data
      firebase.database().ref(`users/${member.uid}`).on('value', snap => {
        membersData[member.uid] = {
          'uid': member.uid,
          'username': snap.child('username').val(),
          'imageUrl': snap.child('imageUrl').val(),
          'type': member.type,
        };

        this.setState({ numMembers, membersData });
      });
    });
  }

  render() {
    //const { navigate } = this.props.navigation;

    if (this.state.loading) {
      return <ScrollView style={styles.scrollView}></ScrollView>;
    }

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
          <Text style={styles.subtitle}>Group home screen.{'\n'}Group UID: {this.props.navigation.getParam('groupUid')}</Text>
          <View>
            <Text style={styles.title}>Group members {(this.state.numMembers > 0) && <Text>({this.state.numMembers})</Text>}</Text>
            <ScrollView
              /*style={styles.sectionCards}
              onTouchStart={(ev) => {
                this.setState({ screenScrollEnabled: false });
              }}
              onMomentumScrollEnd={(e) => { this.setState({ screenScrollEnabled: true }); }}
              onScrollEndDrag={(e) => { this.setState({ screenScrollEnabled: true }); }}*/>
              {this.state.numMembers > 0 && (
                <View>
                  {Object.keys(this.state.membersData).map((key, i) => {
                    const memberData = this.state.membersData[key];
                    // let cardStyle = styles.memberCard;

                    // if (i === Object.keys(this.state.membersData).length - 1) {
                    //   cardStyle = styles.lastMemberCard; //Last card has no bottom border
                    // }

                    //Displaying member cards
                    return (
                      // <TouchableOpacity
                      //   style={cardStyle}
                      //   delayPressIn={50}
                      //   onPress={() => { /* view member image */ }}>
                      //   <Image
                      //     style={styles.memberImage}
                      //     source={
                      //       memberData.imageUrl == '' ? require('../assets/user-default.png') : { uri: memberData.imageUrl }
                      //     }
                      //   />
                      // </TouchableOpacity>
                      <View>
                        <Text style={{ color: 'white' }}>{memberData.uid}</Text>
                        <Text style={{ color: 'white' }}>{memberData.username}</Text>
                        <Text style={{ color: 'white' }}>{memberData.imageUrl}</Text>
                        <Text style={{ color: 'white', marginBottom: 10 }}>{memberData.type == 1 ? 'Admin' : ''}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
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