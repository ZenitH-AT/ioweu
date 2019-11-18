import * as firebase from 'firebase';

const validation = {
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

    validateUsername: (name) => {
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
        const snap = await firebase.database().ref(parent).orderByChild(child).equalTo(value.toLowerCase()).limitToFirst(1).once('value');

        if (await snap.val()) {
            return true;
        }

        return false;
    },

    //Checks if the child key exists (e.g. an invite code)
    childExists: async (parent, child) => {
        firebase.database().ref(parent).child(child).once('value', snap => {
            if (snap.exists()) {
                return true;
            }
        });

        return false;
    },

    inviteValid: async (inviteCode) => {
        //check if invite exists

        //if it exists, check if its expire time is valid

        //if its expire time is valid, return the group uid (to join group)

        //otherwise, delete the invite from the database

        //run this method every time a group is opened to clean up old invites

        //return false;
    }
}

export default validation;