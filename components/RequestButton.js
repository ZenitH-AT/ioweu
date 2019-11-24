import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ActionButton from 'react-native-action-button';

import * as firebase from 'firebase';
import miscellaneous from '../utils/miscellaneous';

export default class RequestButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      groupUid: '-LuOp02L3t7mCMm9Db2t' //TODO
    }
  }

  async componentDidMount() {
    //TODO
    //miscellaneous.getMembers(this.state.uid);
    //In a loop similar to group members screen; get usernames for select menu
  }

  render() {
    return (
      <ActionButton
        buttonColor='rgba(231,76,60,1)'
        onPress={() => { alert('hello!') }}
      />
    );
  }
}

const styles = StyleSheet.create({
  actionButton: {

  },
  actionButtonIcon: {

  }
});