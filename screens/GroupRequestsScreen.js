import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, Picker, TouchableOpacity as RNTouchableOpacity, Dimensions } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';
import Modal from 'react-native-modal';
import DatePicker from 'react-native-datepicker';
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

      //Requests data
      numActiveRequests: 0,
      numGrantedRequests: 0,
      requestsData: null,

      //For managing requests
      loading: true,
      requestToDelete: '',
      deleteModalVisible: false,
      requestModalVisible: false,
      filteredRequestees: {},
      modalErrorMessage: '',
      modalButtonsDisabled: false,
      modalHideDisabled: false,
      requestedAmount: null,
      requestedRequestee: null,
      requestedDueTime: null,

      //For nested ScrollView functionality
      screenScrollEnabled: true
    }
  }

  async componentDidMount() {
    SplashScreen.hide();

    await this.getRequestsData();

    const filteredRequestees = {};

    //Excludes the signed in user from the list of member options
    Object.keys(this.state.membersData).forEach(key => {
      if (key !== this.state.userUid) {
        filteredRequestees[key] = this.state.membersData[key];
      }
    });

    this.setState({ filteredRequestees, loading: false });
  }

  async getRequestsData() {
    await firebase.database().ref(`groups/${this.state.groupUid}/requests`)
      .once('value', snap => {
        let numActiveRequests = 0;
        let numGrantedRequests = 0;
        const requestsData = { [true]: {}, [false]: {} };

        snap.forEach(data => {
          let active = data.child('active').val();
          active ? numActiveRequests++ : numGrantedRequests++;

          requestsData[active][data.key] = {
            'requestUid': data.key,
            'amount': parseFloat(data.child('amount').val()).toFixed(2),
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

  hideModal() {
    if (!this.state.hideModalDisabled) {
      this.setState({ requestModalVisible: false, modalErrorMessage: '' });
    }
  }

  handleDeleteRequest() {
    firebase.database().ref(`groups/${this.state.groupUid}/requests/${this.state.requestToDelete}`).remove();

    this.setState({ deleteModalVisible: false });
    //Recalculate data/reload tab
  }

  async handleRequestMoney(/*something here*/) {
    const dbRef = firebase.database().ref(`groups/${this.state.groupUid}/requests`);

    this.setState({
      modalButtonsDisabled: true,
      modalHideDisabled: true
    });

    let modalErrorMessage = '';

    //Validation here

    const requestUid = dbRef.push().key;

    dbRef.child(requestUid).set({
      active: true,
      amount: this.state.requestedAmount,
      dueTime: new Date((this.state.requestedDueTime + ':00').replace(/-/g, '/')).getTime() / 1000,
      grantTime: null,
      requestTime: new Date().getTime() / 1000,
      requestee: this.state.requestedRequestee,
      requester: this.state.userUid
    });

    //Refresh screen here

    return this.setState({
      modalErrorMessage,
      modalButtonsDisabled: false,
      modalHideDisabled: false,
      requestModalVisible: modalErrorMessage.length > 0 ? true : false
    });
  }

  render() {
    if (this.state.loading) {
      return <ScrollView style={styles.scrollView}></ScrollView>;
    }

    return (
      <ScrollView style={styles.scrollView} scrollEnabled={this.state.screenScrollEnabled}>
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

                  if (i === Object.keys(this.state.requestsData[true]).length - 1) {
                    cardStyle = styles.lastCard; //Last card has no bottom border
                  }

                  //Displaying request cards
                  return (
                    <View style={cardStyle}>
                      <View style={styles.cardHeader}>
                        <Image
                          style={styles.cardImage}
                          source={this.state.membersData[requestData.requester].imageUrl == '' ? require('../assets/user-default.png') : { uri: this.state.membersData[requestData.requester].imageUrl }}
                        />
                        <View>
                          <Text style={styles.cardMessage}>
                            <Text style={{ fontWeight: 'bold' }}>{this.state.membersData[requestData.requester].username}{' '}</Text>
                            requests{' '}
                            <Text style={{ fontWeight: "bold" }}>R{requestData.amount}</Text>{' '}
                            {requestData.requestee && (
                              <Text>from{' '}
                                <Text style={{ fontWeight: "bold" }}>{this.state.membersData[requestData.requestee].username}{' '}</Text>
                              </Text>
                            )}
                            by{' '}
                            <Text style={{ fontWeight: "bold" }}>{requestData.dueTime}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardSubtitle}>Requested:{'\n'}{requestData.requestTime}</Text>
                        <View style={styles.cardButtons}>
                          {(requestData.requestee == this.state.userUid || requestData.requestee == '') && (
                            <TouchableOpacity
                              delayPressIn={50}
                              onPress={() => alert('TODO')}>
                              <Text style={styles.cardButton}>Grant</Text>
                            </TouchableOpacity>
                          )}
                          {/*The requesting user or an admin can delete the request*/}
                          {(requestData.requester == this.state.userUid || membersData[this.state.userUid].type == 1) && (
                            <TouchableOpacity
                              delayPressIn={50}
                              onPress={() => this.setState({ requestToDelete: requestData.requestUid, deleteModalVisible: true })}>
                              <Text style={styles.cardButton}>Delete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {this.state.numActiveRequests == 0 && (<View><Text style={styles.noCards}>No requests to display.</Text></View>)}
          </ScrollView>
          <TouchableOpacity
            delayPressIn={50}
            onPress={() => { this.setState({ requestModalVisible: true }) }}>
            <Text style={styles.sectionButton}><FontAwesome icon={parseIconFromClassName('fas fa-plus')} />  Request money</Text>
          </TouchableOpacity>
          <Modal
            isVisible={this.state.deleteModalVisible}
            onBackButtonPress={() => this.setState({ deleteModalVisible: false })}
            onBackdropPress={() => this.setState({ deleteModalVisible: false })}
            deviceWidth={WIDTH}
            deviceHeight={HEIGHT}
            backdropColor={'rgba(29, 36, 40, 0.5)'}
            style={{ marginBottom: HEIGHT / 5 }}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Delete request</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to delete this request?</Text>
              <View style={styles.modalButtons}>
                <RNTouchableOpacity onPress={() => this.handleDeleteRequest()}><Text style={styles.modalButton}>Delete</Text></RNTouchableOpacity>
                <RNTouchableOpacity onPress={() => this.setState({ deleteModalVisible: false })}><Text style={styles.modalButton}>Cancel</Text></RNTouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            isVisible={this.state.requestModalVisible}
            onBackButtonPress={() => this.hideModal()}
            onBackdropPress={() => this.hideModal()}
            deviceWidth={WIDTH}
            deviceHeight={HEIGHT}
            backdropColor={'rgba(29, 36, 40, 0.5)'}
            style={{ marginBottom: HEIGHT / 5 }}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Request money</Text>
              <View>
                {this.state.modalErrorMessage != '' && <Text style={styles.modalErrorMessage}>{this.state.modalErrorMessage}</Text>}
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder={'Amount (R)'}
                placeholderTextColor={'#b5cad5'}
                underlineColorAndroid={'transparent'}
                keyboardType={'numeric'}
                onChangeText={requestedAmount => this.setState({ requestedAmount })}
                value={this.state.requestedAmount}
              />
              <Text style={styles.modalLabel}>Member:</Text>
              <Picker
                style={styles.modalPicker}
                prompt={'Request money from'}
                selectedValue={this.state.requestedRequestee}
                onValueChange={requestedRequestee => this.setState({ requestedRequestee })}>
                <Picker.Item label={'All members'} value={''} />
                {Object.keys(this.state.filteredRequestees).map((key, i) => {
                  const memberData = this.state.filteredRequestees[key];
                  return (<Picker.Item label={memberData.username} value={memberData.uid} />);
                })}
              </Picker>
              <Text style={styles.modalLabel}>Due date and time:</Text>
              <DatePicker
                style={styles.modalDatePicker}
                date={this.state.requestedDueTime}
                mode={'datetime'}
                showIcon={false}
                minDate={new Date()}
                placeholder={'Select date'}
                customStyles={{
                  dateInput: {
                    backgroundColor: '#354249',
                    borderColor: 'transparent'
                  },
                  placeholderText: {
                    fontSize: 18,
                    color: '#dde1e0'
                  },
                  dateText: {
                    fontSize: 18,
                    color: '#dde1e0'
                  }
                }}
                onDateChange={(requestedDueTime) => { this.setState({ requestedDueTime }) }}
              />
              <View style={styles.modalButtons}>
                <RNTouchableOpacity disabled={this.state.modalButtonsDisabled} onPress={() => this.handleRequestMoney()}><Text style={styles.modalButton}>Request</Text></RNTouchableOpacity>
                <RNTouchableOpacity disabled={this.state.modalButtonsDisabled} onPress={() => this.hideModal()}><Text style={styles.modalButton}>Cancel</Text></RNTouchableOpacity>
              </View>
            </View>
          </Modal>
          <Text style={styles.title}>Granted requests {(this.state.numGrantedRequests > 0) && <Text>({this.state.numGrantedRequests})</Text>}</Text>
          <ScrollView
            style={styles.sectionCards}

            //For nested scrolling
            onTouchStart={(e) => { this.setState({ screenScrollEnabled: false }); }}
            onMomentumScrollEnd={(e) => { this.setState({ screenScrollEnabled: true }); }}
            onScrollEndDrag={(e) => { this.setState({ screenScrollEnabled: true }); }}>
            {this.state.numGrantedRequests > 0 && (
              <View>
                {Object.keys(this.state.requestsData[false]).map((key, i) => {
                  const requestData = this.state.requestsData[false][key];
                  let cardStyle = styles.card;

                  if (i === Object.keys(this.state.requestsData[false]).length - 1) {
                    cardStyle = styles.lastCard; //Last card has no bottom border
                  }

                  //Displaying request cards
                  return (
                    <View style={cardStyle}>
                      <View style={styles.cardHeader}>
                        <Image
                          style={styles.cardImage}
                          source={this.state.membersData[requestData.requester].imageUrl == '' ? require('../assets/user-default.png') : { uri: this.state.membersData[requestData.requester].imageUrl }}
                        />
                        <View>
                          <Text style={styles.cardMessage}>
                            <Text style={{ fontWeight: 'bold' }}>{this.state.membersData[requestData.requester].username}{' '}</Text>
                            requested{' '}
                            <Text style={{ fontWeight: "bold" }}>R{requestData.amount}</Text>{' '}
                            {requestData.requestee && (
                              <Text>from{' '}
                                <Text style={{ fontWeight: "bold" }}>{this.state.membersData[requestData.requestee].username}{' '}</Text>
                              </Text>
                            )}
                            by{' '}
                            <Text style={{ fontWeight: "bold" }}>{requestData.dueTime}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardSubtitle}>Granted: {requestData.grantTime}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            {this.state.numGrantedRequests == 0 && (<View><Text style={styles.noCards}>No requests to display.</Text></View>)}
          </ScrollView>
        </View>
      </ScrollView >
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
  modalSubtitle: {
    marginBottom: 15,
    paddingBottom: 5,
    paddingTop: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(39, 50, 56, 0.8)',
    color: '#b5cad5',
    fontSize: 15,
    textAlign: 'center',
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
  modalLabel: {
    marginBottom: 5,
    color: '#b5cad5',
    fontSize: 15
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
  modalPicker: {
    height: 45,
    fontSize: 18,
    backgroundColor: '#354249',
    marginBottom: 15,
    color: '#dde1e0',
  },
  modalDatePicker: {
    width: 'auto',
    height: 45,
    marginBottom: 15
  },
  modalButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: WIDTH / 15,
    marginRight: WIDTH / 15,
  },
  modalButton: {
    minWidth: WIDTH / 5.5,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#b5cad5',
    backgroundColor: '#496f82',
  }
});
