import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions, SafeAreaView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import { GiftedChat, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';
import communication from '../utils/communication';
import generation from '../utils/generation';
import storage from '../utils/storage';
import validation from '../utils/validation';

const { width: WIDTH } = Dimensions.get('window');

export default class GroupMessagesScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userUid: this.props.navigation.getParam('userUid'),
      groupUid: this.props.navigation.getParam('groupUid'),
      membersData: this.props.navigation.getParam('membersData'),

      //For initial invite code (after group creation)
      expiryCountdown: null,

      messages: []
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    if (this.props.navigation.getParam('inviteCode')) {
      await this.enableExpiryCountdown(this.props.navigation.getParam('inviteCode'));
    }

    communication.getMesssages(this.state.groupUid, message =>
      this.setState(previous => ({
        messages: GiftedChat.append(previous.messages, message)
      }))
    );
  }

  componentWillUnmount() {
    communication.offMessages(this.state.groupUid);
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

  render() {
    return (
      <SafeAreaView behavior={'height'} style={styles.safeAreaView}>
        {this.props.navigation.getParam('inviteCode') &&
          <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
              <View>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeMessage}>Welcome to your new group, {this.state.membersData[this.state.userUid].username}.{'\n'}The group invite code is:</Text>
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
                <View style={styles.welcomeLine} />
              </View>
            </View>
          </ScrollView>
        }
        <GiftedChat
          renderInputToolbar={(toolbarProps) => (<InputToolbar {...toolbarProps} containerStyle={{ backgroundColor: '#273238', }} />)}
          renderComposer={(composerProps) => (<Composer {...composerProps} textInputStyle={{ color: '#dde1e0' }} />)}
          renderSend={(sendProps) => (<Send {...sendProps}><TouchableOpacity style={{ height: 44, justifyContent: 'center', marginRight: 10 }}><Text style={styles.sendButton}>Send</Text></TouchableOpacity></Send>)}
          messages={this.state.messages}
          onSend={(messages) => communication.sendMessages(this.state.groupUid, messages)}
          user={{
            _id: this.state.userUid,
            name: this.state.membersData[this.state.userUid].username,
            avatar: this.state.membersData[this.state.userUid].imageUrl
          }}
        />
      </SafeAreaView >
    );
  }
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: '#273238',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
    backgroundColor: '#273238'
  },
  container: {
    flex: 1,
    backgroundColor: '#273238',
    alignItems: 'center'
  },
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
    marginBottom: 25,
    fontSize: 18,
    color: '#b5cad5'
  },
  welcomeContainer: {
    alignSelf: 'center',
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
    marginBottom: 25
  },
  welcomeLine: {
    width: WIDTH,
    borderBottomWidth: 1,
    borderBottomColor: '#496f82'
  },
  welcomeMessage: {
    fontSize: 18,
    color: '#b5cad5',
    textAlign: 'center'
  },
  codeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 15
  },
  welcomeCode: {
    color: '#dde1e0',
    fontSize: 22,
    fontWeight: 'bold'
  },
  copyCodeIcon: {
    marginLeft: 20,
    color: '#b5cad5',
    fontSize: 22
  },
  codeCountdown: {
    color: '#b5cad5',
    fontSize: 16,
    textAlign: 'center'
  },
  codeExpired: {
    color: '#b5cad5',
    fontSize: 16,
    textAlign: 'center',
    margin: 15
  },
  sendButton: {
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
  }
});