const generation = {
    generateRandomString: async (length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;

        //Generating string
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    },

    appendLeadingZeroes: (n) => {
        return n < 10 ? '0' + n : n;
    },

    secondsToTime: (seconds) => {
        var hh = Math.floor(seconds / 3600);
        var mm = Math.floor((seconds - (hh * 3600)) / 60);
        var ss = seconds - (hh * 3600) - (mm * 60);

        return generation.appendLeadingZeroes(hh) + ':' +
            generation.appendLeadingZeroes(mm) + ':' +
            generation.appendLeadingZeroes(ss);
    },

    secondsToDateTime: (seconds) => {
        var dateTime = new Date(0);

        dateTime.setSeconds(seconds);

        return dateTime.getFullYear() + '-' +
            generation.appendLeadingZeroes(dateTime.getMonth() + 1) + '-' +
            generation.appendLeadingZeroes(dateTime.getDate()) + ' ' +
            generation.appendLeadingZeroes(dateTime.getHours()) + ':' +
            generation.appendLeadingZeroes(dateTime.getMinutes()) + ':' +
            generation.appendLeadingZeroes(dateTime.getSeconds());
    }
}

export default generation;