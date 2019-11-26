import React, { Component } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import FontAwesome, { parseIconFromClassName } from 'react-native-fontawesome';

import * as firebase from 'firebase';
import miscellaneous from '../utils/miscellaneous';

const { height: HEIGHT } = Dimensions.get('window');

export default class RequestButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      requestButtonVisible: true,
      groupUid: this.props.groupUid
    }
  }

  async componentDidMount() {
    //TODO
    //miscellaneous.getMembers(this.state.uid);
    //In a loop similar to group members screen; get usernames for select menu
  }

  render() {
    return (
      <View>
        {this.state.requestButtonVisible && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => alert(this.state.groupUid)}>
            <FontAwesome style={styles.actionButtonIcon} icon={parseIconFromClassName('fas fa-exchange-alt')} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionButton: {
    position: 'absolute',
    top: (HEIGHT - 60) - 30,
    right: 30,
    height: 60,
    width: 60,
    backgroundColor: '#496f82',
    borderRadius: 50
  },
  actionButtonIcon: {
    color: '#b5cad5',
    fontSize: 25,
  }

  //Styles for text, modal, etc. here
});