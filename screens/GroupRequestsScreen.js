import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';

import generation from '../utils/generation';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

export default class GroupRequestsScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userUid: this.props.navigation.getParam('userUid'),
      groupUid: this.props.navigation.getParam('groupUid'),
      membersData: this.props.navigation.getParam('membersData'),

      numActiveRequests: 0,
      numGrantedRequests: 0,
      requestsData: null
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    await this.getRequestsData();
  }

  getRequestsData() {
    firebase.database().ref(`groups/${this.state.groupUid}/requests`)
      .once('value', snap => {
        let numActiveRequests = 0;
        let numGrantedRequests = 0;
        const requestsData = { [true]: {}, [false]: {} };

        snap.forEach(data => {
          let active = data.child('active').val();
          active ? numActiveRequests++ : numGrantedRequests++;

          requestsData[active][data.key] = {
            'requestUid': data.key,
            'amount': data.child('amount').val(),
            'dueTime': generation.secondsToDateTime(data.child('dueTime').val()),
            'grantTime': generation.secondsToDateTime(data.child('grantTime').val()),
            'requestTime': generation.secondsToDateTime(data.child('requestTime').val()),
            'requestee': data.child('requestee').val(),
            'requester': data.child('requester').val()
          }
        });

        this.setState({ numActiveRequests, numGrantedRequests, requestsData });
      });
  }

  render() {
    return (
      <ScrollView style={styles.scrollView} >
        <View style={styles.container}>
          <Text style={styles.title}>Active requests {(this.state.numActiveRequests > 0) && <Text>({this.state.numActiveRequests})</Text>}</Text>
          <ScrollView
            style={styles.sectionCards}

            //For nested scrolling
            onTouchStart={(e) => { this.setState({ screenScrollEnabled: false }); }}
            onMomentumScrollEnd={(e) => { this.setState({ screenScrollEnabled: true }); }}
            onScrollEndDrag={(e) => { this.setState({ screenScrollEnabled: true }); }}>
            {this.state.numActiveRequests > 0 && (
              <View>
                {Object.keys(this.state.requestsData[true]).map((key, i) => {
                  const requestData = this.state.requestsData[true][key];
                  let cardStyle = styles.card;

                  if (i === Object.keys(this.state.requestsData[true].length - 1)) {
                    cardStyle = styles.lastCard; //Last card has no bottom border
                  }

                  //Displaying request cards
                  return (
                    <View style={cardStyle}>
                      <View style={styles.cardHeader}>
                        <Image
                          style={styles.cardImage}
                        />
                        <View>
                          <Text style={styles.cardMessage}>
                            <Text style={{ fontWeight: 'bold' }}>{requestData.requester}</Text> requests <Text style={{ fontWeight: "bold" }}>R{requestData.amount}</Text> from <Text style={{ fontWeight: "bold" }}>{requestData.requestee}</Text> by <Text style={{ fontWeight: "bold" }}>{requestData.dueTime}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardSubtitle}>Requested:{'\n'}{requestData.requestTime}</Text>
                        <View style={styles.cardButtons}>
                          <TouchableOpacity delayPressIn={50}>
                            <Text style={styles.cardButton}>Grant</Text>
                          </TouchableOpacity>
                          <TouchableOpacity delayPressIn={50}>
                            <Text style={styles.cardButton}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    // <TouchableOpacity
                    //   style={cardStyle}
                    //   delayPressIn={50}
                    //   onPress={() => null}>
                    //   <Image
                    //     style={styles.groupImage}
                    //     source={
                    //       groupData.imageUrl == '' ? require('../assets/group-default.png') : { uri: groupData.imageUrl }
                    //     }
                    //   />
                    //   <View>
                    //     <Text style={styles.groupName}>{requestData.groupName}</Text>
                    //     <Text style={styles.groupMembers}>{requestData.numMembers} {groupData.numMembers == 1 ? 'member' : 'members'}</Text>
                    //   </View>
                    // </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {this.state.numActiveRequests == 0 && (<View><Text style={styles.noCards}>No requests to display.</Text></View>)}
          </ScrollView>
          <TouchableOpacity delayPressIn={50}>
            <Text onPress={() => /*open modal*/ alert('hello')}
              style={styles.sectionButton}>
              <FontAwesome icon={parseIconFromClassName('fas fa-plus')} />  Request money
              </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Granted requests {(this.state.numGrantedRequests > 0) && <Text>({this.state.numGrantedRequests})</Text>}</Text>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#273238'
  },
  container: {
    flex: 1,
    backgroundColor: '#273238',
    alignItems: 'center',
    marginBottom: 25
  },
  title: {
    marginTop: 25,
    marginBottom: 20,
    color: '#dde1e0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold'
  },
  subtitle: {
    width: WIDTH - (WIDTH / 7),
    marginTop: 25,
    marginBottom: 25,
    fontSize: 18,
    color: '#b5cad5'
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
  card: {
    flex: 1,
    width: WIDTH / 1.25,
    marginBottom: 25,
    backgroundColor: '#3a4449',
    borderRadius: 20,
    borderColor: '#566f7c'
  },
  lastCard: {
    flex: 1,
    width: WIDTH / 1.25,
    backgroundColor: '#3a4449',
    borderRadius: 20,
    borderColor: '#566f7c'
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardImage: {
    width: WIDTH / 7,
    height: WIDTH / 7,
    backgroundColor: '#566f7c',
    borderRadius: 20,
    marginRight: 20,
  },
  cardMessage: {
    width: (WIDTH / 1.25) - (WIDTH / 7) - 30,
    fontSize: 18,
    color: '#b5cad5',
  },
  cardFooter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: WIDTH / 40,
    marginLeft: WIDTH / 30,
    marginRight: WIDTH / 30,
    alignItems: 'center'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#b5cad5',
  },
  cardButtons: {
    flexDirection: 'row',
  },
  cardButton: {
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
  noCards: {
    width: WIDTH - (WIDTH / 7),
    textAlign: 'center',
    fontSize: 18,
    color: '#b5cad5',
  },
});