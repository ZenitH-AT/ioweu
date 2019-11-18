const config = require('../config.json');

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
    }
}

export default communication;