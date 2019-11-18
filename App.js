const config = require('./config.json');

import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import LoadingScreen from './screens/LoadingScreen';
import SignInScreen from './screens/SignInScreen';
import ForgotScreen from './screens/ForgotScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
//ProfilePaymentScreen - within edit profile
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupHomeScreen from './screens/GroupHomeScreen';
import GroupMembersScreen from './screens/GroupMembersScreen';
//EditGroupScreen + EditGroupPaymentScreen

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

const AppStack = createStackNavigator({
  HomeScreen: { screen: HomeScreen },
  ProfileScreen: { screen: ProfileScreen },
  CreateGroupScreen: { screen: CreateGroupScreen },
  GroupHomeScreen: { screen: GroupHomeScreen },
  GroupMembersScreen: { screen: GroupMembersScreen }
});

const AuthStack = createStackNavigator({
  SignInScreen: { screen: SignInScreen },
  SignUpScreen: { screen: SignUpScreen },
  ForgotScreen: { screen: ForgotScreen }
});

export default createAppContainer(
  createSwitchNavigator(
    {
      LoadingScreen: LoadingScreen,
      AppStack: AppStack,
      AuthStack: AuthStack
    },
    {
      initialRouteName: 'LoadingScreen'
    }
  )
);

/* --- Navigation - END --- */