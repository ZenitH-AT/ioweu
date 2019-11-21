import React, { Component } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import SplashScreen from 'react-native-splash-screen';

import * as firebase from 'firebase';

export default class LoadingScreen extends Component {
    componentDidMount() {
        SplashScreen.hide();

        firebase.auth().onAuthStateChanged(user => {
            this.props.navigation.navigate(user ? 'AppStack' : 'AuthStack');
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.subtitle}>Loading...</Text>
                <ActivityIndicator size='large'></ActivityIndicator>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#273238'
    },
    subtitle: {
        fontSize: 18,
        color: '#b5cad5',
        color: '#b5cad5'
    }
});