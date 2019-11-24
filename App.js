const config = require('./config.json');

import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import LoadingScreen from './screens/LoadingScreen';
import SignInScreen from './screens/SignInScreen';
import ForgotScreen from './screens/ForgotScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import UpdateScreen from './screens/UpdateScreen';
import GroupScreens from './components/GroupScreens';
import GroupInviteScreen from './screens/GroupInviteScreen';
import GroupMembersScreen from './screens/GroupMembersScreen';
import GroupUpdateScreen from './screens/GroupUpdateScreen';

import * as firebase from 'firebase';

var firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  databaseURL: config.firebase.databaseURL,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId
};

firebase.initializeApp(firebaseConfig);

/* --- Navigation - START --- */

const AuthStack = createStackNavigator({
  SignInScreen: { screen: SignInScreen },
  SignUpScreen: { screen: SignUpScreen },
  ForgotScreen: { screen: ForgotScreen }
});

const AppStack = createStackNavigator({
  HomeScreen: { screen: HomeScreen },
  CreateGroupScreen: { screen: CreateGroupScreen },
  UpdateScreen: { screen: UpdateScreen },
  GroupScreens: { screen: GroupScreens },
  GroupInviteScreen: { screen: GroupInviteScreen },
  GroupMembersScreen: { screen: GroupMembersScreen },
  GroupUpdateScreen: { screen: GroupUpdateScreen }
});

export default createAppContainer(
  createSwitchNavigator(
    {
      LoadingScreen: LoadingScreen,
      AuthStack: AuthStack,
      AppStack: AppStack,
    },
    {
      initialRouteName: 'LoadingScreen'
    }
  )
);

/* --- Navigation - END --- */

//Remove timer warnings
import { YellowBox } from 'react-native';
import _ from 'lodash';

YellowBox.ignoreWarnings(['Setting a timer']);

const _console = _.clone(console);

console.warn = message => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};