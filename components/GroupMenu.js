import React, { Component } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import Menu, { MenuItem } from 'react-native-material-menu';

import * as firebase from 'firebase';
import miscellaneous from '../utils/miscellaneous';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

export default class GroupMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      groupUid: this.props.groupUid(),
      groupName: this.props.groupName(),
      imageUrl: require('../assets/group-default.png'),
      modalVisible: false
    }
  }

  async componentDidMount() {
    firebase.database().ref(`groups/${this.state.groupUid}/imageUrl`)
      .on('value', snap => this.setState({
        imageUrl: snap.val() == '' ? this.state.imageUrl : { uri: snap.val() },
      }));
  }

  _menu = null;

  setMenuRef = (ref) => {
    this._menu = ref;
  }

  showMenu = () => {
    this._menu.show();
  }

  hideMenu = () => {
    this._menu.hide();
  }

  inviteUsersClick = () => {
    this._menu.hide();
    this.props.inviteUsersClick();
  }

  viewMembersClick = () => {
    this._menu.hide();
    this.props.viewMembersClick();
  }

  updateGroupClick = () => {
    this._menu.hide();
    this.props.updateGroupClick();
  }

  leaveGroupClick = () => {
    this._menu.hide();
    this.setState({ modalVisible: true });
  }

  async handleLeaveGroup() {
    miscellaneous.removeMember(firebase.auth().currentUser.uid, [this.state.groupUid]);

    this.setState({ modalVisible: false });
    this.props.leaveGroup();
  }

  render() {
    return (
      <View style={styles.headerBar}>
        <Menu
          style={styles.menu}
          ref={this.setMenuRef}
          button={
            <TouchableOpacity onPress={this.showMenu}>
              <Image source={this.state.imageUrl} style={styles.menuButton} />
            </TouchableOpacity>
          }
        >
          <MenuItem onPress={this.inviteUsersClick}><Text style={styles.menuItem}>Invite users</Text></MenuItem>
          <MenuItem onPress={this.viewMembersClick}><Text style={styles.menuItem}>View members</Text></MenuItem>
          <MenuItem onPress={this.updateGroupClick}><Text style={styles.menuItem}>Update group</Text></MenuItem>
          <MenuItem onPress={this.leaveGroupClick}><Text style={styles.menuItem}>Leave group</Text></MenuItem>
        </Menu>
        <Modal
          isVisible={this.state.modalVisible}
          onBackButtonPress={() => this.setState({ modalVisible: false })}
          onBackdropPress={() => this.setState({ modalVisible: false })}
          deviceWidth={WIDTH}
          deviceHeight={HEIGHT}
          backdropColor={'rgba(29, 36, 40, 0.5)'}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Leave group</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to leave <Text style={{ fontWeight: 'bold' }}>{this.state.groupName}</Text>?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => this.handleLeaveGroup()}><Text style={styles.modalButton}>Leave</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => this.setState({ modalVisible: false })}><Text style={styles.modalButton}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  menu: {
    marginTop: 20,
    backgroundColor: '#485c67',
  },
  menuButton: {
    marginRight: 13,
    backgroundColor: '#344047',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#b5cad5',
    width: 30,
    height: 30
  },
  menuItem: {
    color: '#b5cad5',
    fontSize: 16
  },
  modal: {
    flex: 1,
    position: 'absolute',
    alignSelf: 'center',
    width: WIDTH / 1.4,
    marginBottom: HEIGHT / 5,
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
  }
});