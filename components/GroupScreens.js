import React from 'react';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { HeaderBackButton } from 'react-navigation-stack';

import GroupMessagesScreen from '../screens/GroupMessagesScreen';
import GroupRequestsScreen from '../screens/GroupRequestsScreen';
import GroupResponsesScreen from '../screens/GroupResponsesScreen';
import GroupChartsScreen from '../screens/GroupChartsScreen';

import GroupMenu from './GroupMenu';

/*
TODO:

- Some screens may need componentWillUnmount to recalculate certain data

*/

const GroupScreens = createMaterialTopTabNavigator(
  {
    GroupMessagesScreen: { screen: GroupMessagesScreen, navigationOptions: { title: 'Messages' } },
    GroupRequestsScreen: { screen: GroupRequestsScreen, navigationOptions: { title: 'Requests' } },
    GroupResponsesScreen: { screen: GroupResponsesScreen, navigationOptions: { title: 'Responses' } },
    GroupChartsScreen: { screen: GroupChartsScreen, navigationOptions: { title: 'Charts' } }
  },
  {
    navigationOptions: ({ navigation }) => ({
      title: navigation.getParam('groupName'),
      headerStyle: {
        backgroundColor: '#273238',
        borderBottomWidth: 1,
        borderBottomColor: '#496f82',
      },
      headerTintColor: '#b5cad5',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerLeft: () => (
        <HeaderBackButton tintColor={'#b5cad5'} onPress={() => {
          navigation.navigate('HomeScreen', {
            //To recalculate groups data on pressing the back button (if newly created/joined group)
            recalculateGroupsData: navigation.getParam('inviteCode') ? true : navigation.getParam('newMember') ? true : false
          });
        }} />
      ),
      headerRight: () => (
        <GroupMenu
          groupUid={() => { return navigation.getParam('groupUid'); }}
          groupName={() => { return navigation.getParam('groupName'); }}
          userUid={() => { return navigation.getParam('userUid'); }}
          inviteUsersClick={() => { navigation.navigate('GroupInviteScreen', { groupUid: navigation.getParam('groupUid') }); }}
          viewMembersClick={() => { navigation.navigate('GroupMembersScreen', { groupUid: navigation.getParam('groupUid'), userUid: navigation.getParam('userUid') }); }}
          updateGroupClick={() => { navigation.navigate('GroupUpdateScreen', { groupUid: navigation.getParam('groupUid') }); }}
          leaveGroup={() => { navigation.navigate('HomeScreen', { recalculateGroupsData: true }); }}
        />
      )
    }),
    tabBarOptions: {
      activeTintColor: '#b5cad5',
      inactiveTintColor: '#76868e',
      pressColor: '#485c67',
      scrollEnabled: true,
      upperCaseLabel: false,
      style: {
        backgroundColor: '#273238',
        borderBottomWidth: 1,
        borderBottomColor: '#496f82',
        elevation: 0, //Removes shadow on Android
        shadowOpacity: 0 //Removes shadow on iOS
      },
      indicatorStyle: {
        backgroundColor: '#496f82',
        borderColor: '#496f82',
        borderWidth: 2,
        borderRadius: 50
      },
      labelStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      },
      tabStyle: {
        width: 'auto'
      }
    }
  },
);

export default GroupScreens;