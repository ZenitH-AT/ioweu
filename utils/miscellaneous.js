import * as firebase from 'firebase';
import validation from './validation';

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

        await db.ref(`members/${userUid}/${groupUid}`).set({ type }); //To find the groups of a given member
        await db.ref(`groups/${groupUid}/members/${userUid}`).set({ type }); //To find the members of a given group
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

    getInvites: async (groupUid) => {
        var invites = [];

        return await firebase.database().ref(`groups/${groupUid}/invites`).once('value', snap => {
            snap.forEach(data => {
                invites.push({
                    inviteCode: data.key,
                    expireTime: data.child('expireTime').val(),
                    uses: data.child('type').val()
                });
            });
        }).then(() => {
            return invites;
        });
    },

    getMembers: async (groupUid) => {
        var members = [];

        return await firebase.database().ref(`groups/${groupUid}/members`).once('value', snap => {
            snap.forEach(data => {
                members.push({
                    uid: data.key,
                    type: data.child('type').val()
                });
            });
        }).then(() => {
            return members;
        });
    },

    removeGroup: async (groupUid) => {
        const db = firebase.database();

        //Removing all invites
        (await miscellaneous.getInvites(groupUid)).forEach(async (invite) => {
            await db.ref(`invites/${invite.inviteCode}`).remove();
        });

        //Removing all members
        (await miscellaneous.getMembers(groupUid)).forEach(async (member) => {
            await db.ref(`members/${member.uid}/${groupUid}`).remove();
        });

        //Removing group
        await db.ref(`groups/${groupUid}`).remove();
    },

    removeMember: (userUid, groupUids) => {
        groupUids.forEach(async (groupUid) => {
            const db = firebase.database();
            var type; //1: Admin; 0: Regular member

            await db.ref(`members/${userUid}/${groupUid}`).once('value', snap => {
                type = snap.child('type').val();
            }).then(async () => {
                //Removing member
                await db.ref(`members/${userUid}/${groupUid}`).remove();
                await db.ref(`groups/${groupUid}/members/${userUid}`).remove();

                //If no members remain, remove the group
                if (!await validation.keyExists(`groups/${groupUid}`, 'members')) {
                    await miscellaneous.removeGroup(groupUid);
                } else if (type == 1) {
                    //If no other admins exist in the group, set the first regular member as an admin
                    if (!await validation.valueExists(`groups/${groupUid}/members`, 'type', 1)) {
                        await db.ref(`groups/${groupUid}/members`).orderByKey().limitToFirst(1).once('value', snap => {
                            snap.forEach(async (data) => {
                                await miscellaneous.setMember(data.key, groupUid, 1);
                            });
                        });
                    }
                }
            });
        });
    }
}

export default miscellaneous;