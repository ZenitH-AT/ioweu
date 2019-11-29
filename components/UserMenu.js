import React, { Component } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import Menu, { MenuItem } from 'react-native-material-menu';

import * as firebase from 'firebase';

export default class UserMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      uid: '',
      username: '',
      imageUrl: require('../assets/user-default.png')
    }
  }

  async componentDidMount() {
    const { uid } = firebase.auth().currentUser;

    await this.setState({ uid });

    firebase.database().ref(`users/${this.state.uid}`)
      .on('value', snap => this.setState({
        username: snap.child('username').val(),
        imageUrl: snap.child('imageUrl').val() == '' ? this.state.imageUrl : { uri: snap.child('imageUrl').val() }
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

  updateProfileClick = () => {
    this._menu.hide();
    this.props.updateProfileClick();
  }

  signOutClick = () => {
    this._menu.hide();
    this.props.signOutClick();
  }

  render() {
    return (
      <View style={styles.headerBar}>
        <Text style={styles.headerBarText}>{this.state.username}</Text>
        <Menu
          style={styles.menu}
          ref={this.setMenuRef}
          button={
            <TouchableOpacity onPress={this.showMenu}>
              <Image source={this.state.imageUrl} style={styles.menuButton} />
            </TouchableOpacity>
          }
        >
          <MenuItem onPress={this.updateProfileClick}><Text style={styles.menuItem}>Update profile</Text></MenuItem>
          <MenuItem onPress={this.signOutClick}><Text style={styles.menuItem}>Sign out</Text></MenuItem>
        </Menu>
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
  headerBarText: {
    marginRight: 10,
    fontSize: 18,
    color: '#b5cad5'
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
});