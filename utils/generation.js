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

    secondsToTime: (seconds) => {
        var hh = Math.floor(seconds / 3600);
        var mm = Math.floor((seconds - (hh * 3600)) / 60);
        var ss = seconds - (hh * 3600) - (mm * 60);

        if (hh < 10) { hh = '0' + hh; }
        if (mm < 10) { mm = '0' + mm; }
        if (ss < 10) { ss = '0' + ss; }

        return hh + ':' + mm + ':' + ss;
    }
}

export default generation;