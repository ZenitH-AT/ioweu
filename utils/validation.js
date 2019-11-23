import * as firebase from 'firebase';

const validation = {
    emptyOrWhitespace: (string) => {
        return string === null || string.match(/^ *$/) !== null;
    },

    scorePassword: (pass) => {
        var score = 0;

        if (!pass) {
            return '';
        }

        if (pass.length < 8) {
            return 'Strength: too short!';
        }

        //Award every unique letter until 5 repetitions
        var letters = new Object();

        for (var i = 0; i < pass.length; i++) {
            letters[pass[i]] = (letters[pass[i]] || 0) + 1;
            score += 5.0 / letters[pass[i]];
        }

        //Award additional points for variation
        var variations = {
            digits: /\d/.test(pass),
            lower: /[a-z]/.test(pass),
            upper: /[A-Z]/.test(pass),
            nonWords: /\W/.test(pass),
        }

        variationCount = 0;

        for (var check in variations) {
            variationCount += (variations[check] == true) ? 1 : 0;
        }

        score += (variationCount - 1) * 10;

        score = parseInt(score);

        if (score > 60) {
            return 'Strength: strong';
        } else if (score > 40) {
            return 'Strength: good';
        } else if (score <= 40) {
            return 'Strength: weak';
        }
    },

    validateName: (name) => {
        return !(name.length < 5 || name.length > 30);
    },

    validateEmail: (email) => {
        //RFC5322 email regex
        var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return regex.test(email);
    },

    validatePassword: (pass) => {
        var regex = /^(.{0,7}|[^0-9]*|[^A-Z]*|[a-zA-Z0-9]*)$/;

        return !regex.test(pass); //regex evaluates to false when the password is valid
    },

    comparePasswords: (pass, confirm) => {
        return pass === confirm;
    },

    valueExists: async (parent, child, value) => {
        const snap = await firebase.database().ref(parent).orderByChild(child).equalTo(value).limitToFirst(1).once('value');

        return await snap.val() ? true : false;
    },

    keyExists: async (parent, child) => {
        const snap = await firebase.database().ref(parent).child(child).once('value');

        return snap.exists();
    },

    inviteExpired: async (inviteCode) => {
        const dbRef = firebase.database().ref(`invites/${inviteCode}`);
        var inviteExpired;
        var groupUid;

        return await dbRef.once('value', snap => {
            inviteExpired = Math.round(new Date().getTime() / 1000) > parseInt(snap.child('expireTime').val());
            groupUid = snap.child('groupUid').val();
        }).then(() => {
            //Delete invite code and return true if expired, else return groupUid
            if (inviteExpired) {
                dbRef.remove();
                firebase.database().ref(`groups/${groupUid}/invites/${inviteCode}`).remove();

                return true;
            } else {
                return groupUid;
            }
        });
    }
}

export default validation;