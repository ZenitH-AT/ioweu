import React from 'react';
import { View } from 'react-native';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { HeaderBackButton } from 'react-navigation-stack';

import GroupHomeScreen from '../screens/GroupHomeScreen';
import GroupMessagesScreen from '../screens/GroupMessagesScreen';
import GroupLedgerScreen from '../screens/GroupLedgerScreen';
import GroupChartsScreen from '../screens/GroupChartsScreen';

import GroupMenu from './GroupMenu';
import RequestButton from './RequestButton';

/*
TODO:

- Some screens may need componentWillUnmount to recalculate certain data
- Center tabs correctly without wrapping; tab widths should be as long as needed
- When on messages screen, request button should not be shown (pass requestButtonVisible prop)

*/

const GroupScreens = createMaterialTopTabNavigator(
  {
    GroupHomeScreen: { screen: GroupHomeScreen, navigationOptions: { title: 'Home' } },
    GroupMessagesScreen: { screen: GroupMessagesScreen, navigationOptions: { title: 'Messages' } },
    GroupLedgerScreen: { screen: GroupLedgerScreen, navigationOptions: { title: 'Ledger' } },
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
        <View>
          <GroupMenu
            groupUid={() => { return navigation.getParam('groupUid'); }}
            groupName={() => { return navigation.getParam('groupName'); }}
            userUid={() => { return navigation.getParam('userUid'); }}
            inviteUsersClick={() => { navigation.navigate('GroupInviteScreen', { groupUid: navigation.getParam('groupUid') }); }}
            viewMembersClick={() => { navigation.navigate('GroupMembersScreen', { groupUid: navigation.getParam('groupUid'), userUid: navigation.getParam('userUid') }); }}
            updateGroupClick={() => { navigation.navigate('GroupUpdateScreen', { groupUid: navigation.getParam('groupUid') }); }}
            leaveGroup={() => { navigation.navigate('HomeScreen', { recalculateGroupsData: true }); }}
          />
          <RequestButton groupUid={navigation.getParam('groupUid')} />
        </View>
      )
    }),
    tabBarOptions: {
      activeTintColor: '#b5cad5',
      inactiveTintColor: '#76868e',
      pressColor: '#485c67',
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
  }
);

export default GroupScreens;