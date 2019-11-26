import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
//import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import miscellaneous from '../utils/miscellaneous';

const { width: WIDTH } = Dimensions.get('window');

/*
TODO:

- member cards should have view image, promote (use setMember()), kick (use removeMember()); recalculate on change 
- promote and kick buttons should not be shown for regular users
- promote button should not be shown on an admin user
- promote and kick buttons should not be shown on the member card for the member who is viewing the list
> i.e. a member cannot kick themselves
- indicator icons for admin members and online members

*/

export default class GroupMembersScreen extends Component {
  static navigationOptions = {
    title: 'View members',
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

  constructor(props) {
    super(props);

    this.state = {
      numMembers: 0,
      membersData: null,
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    await this.getMembersData();
  }

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
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
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
});