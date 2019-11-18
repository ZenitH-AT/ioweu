import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions } from 'react-native';
//import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

//const { width: WIDTH } = Dimensions.get('window');

export default class GroupMembersScreen extends Component {
  static navigationOptions = {
    title: 'Members',
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

  componentDidMount() {
    SplashScreen.hide();
  }

  render() {
    //const { navigate } = this.props.navigation;

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.subtitle}>Group members screen.</Text>
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
  },
  subtitle: {
    fontSize: 18,
    color: '#b5cad5',
    marginTop: 30,
    marginLeft: 25,
    marginRight: 25,
    marginBottom: 25,
  },
});