const config = require('../config.json');

import * as firebase from 'firebase';

const communication = {
    sendEmail: (email, username, subject, body) => {
        fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + config.sendgrid.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'personalizations': [{
                    'to': [{
                        'email': email,
                        'name': username
                    }],
                    'subject': subject
                }],
                'from': {
                    'email': config.sendgrid.fromEmail,
                    'name': config.sendgrid.fromName
                },
                'content': [{
                    'type': 'text/html',
                    'value': body
                }]
            }),
        }).then((response) => {
            console.log(`${response.status} - ${response.ok}`);
        });
    },

    parseMessage: (message) => {
        const { key: _id } = message;
        const { user, text, createdAt = new Date(createdAt) } = message.val();

        return {
            _id,
            createdAt,
            text,
            user
        };
    },

    getMesssages: (groupUid, callback) => {
        firebase.database().ref(`groups/${groupUid}/messages`).on('child_added', snap => callback(communication.parseMessage(snap)));
    },

    sendMessages: (groupUid, messages) => {
        messages.forEach(item => {
            const message = {
                text: item.text,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                user: item.user
            };

            firebase.database().ref(`groups/${groupUid}/messages`).push(message);
        });
    },

    offMessages: (groupUid) => {
        firebase.database().ref(`groups/${groupUid}/messages`).off();
    }
}

export default communication;