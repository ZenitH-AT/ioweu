import * as firebase from 'firebase';

const miscellaneous = {
    getEmailFromUsername: async (username) => {
        var email;

        return await firebase.database().ref('users').orderByChild('usernameLower').equalTo(username).limitToFirst(1).once('value', snap => {
            snap.forEach(data => {
                email = data.child('email').val();
            });
        }).then(() => {
            return email;
        });
    },

    setMember: async (userUid, groupUid, type) => {
        const db = firebase.database();

        await db.ref(`members/${userUid}/${groupUid}`).set(type); //To find the groups of a given member
        await db.ref(`groups/${groupUid}/members/${userUid}`).set(type); //To find the members of a given group
    },

    setInvite: async (inviteCode, groupUid) => {
        const db = firebase.database();
        const expireTime = Math.round(new Date().getTime() / 1000) + 24 * 60 * 60; //Current UNIX timestamp + 24 hours

        await db.ref(`invites/${inviteCode}`).set({ expireTime, groupUid }); //To find the group of a given invite
        await db.ref(`groups/${groupUid}/invites/${inviteCode}`).set({ expireTime, uses: 0 }); //To find the invites of a given group
    },

    useInvite: async (inviteCode, groupUid) => {
        const db = firebase.database();
        var currentUses;

        return await db.ref(`groups/${groupUid}/invites/${inviteCode}`).once('value', snap => {
            currentUses = snap.child('uses').val();
        }).then(async () => {
            await db.ref(`groups/${groupUid}/invites/${inviteCode}/uses`).set(currentUses + 1);
        });
    },

    getGroupName: async (groupUid) => {
        var groupName;

        return await firebase.database().ref(`groups/${groupUid}`).once('value', snap => {
            groupName = snap.child('groupName').val();
        }).then(() => {
            return groupName;
        });
    },

    getMembers: async (groupUid) => {
        var members = [];

        return await firebase.database().ref(`groups/${groupUid}/members`).once('value', snap => {
            snap.forEach(data => {
                members.push({ uid: data.key, type: data.val() });
            });
        }).then(() => {
            return members;
        });
    }
}

export default miscellaneous;