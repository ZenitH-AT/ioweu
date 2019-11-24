import { Clipboard } from 'react-native';
import { WToast } from 'react-native-smart-tip';
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';

import * as firebase from 'firebase';

const storage = {
    chooseImage: (self) => {
        const options = {
            title: 'Choose image',

            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        ImagePicker.showImagePicker(options, response => {
            console.log('response', response);

            if (response.uri) {
                //Resizing image
                ImageResizer.createResizedImage(response.uri, 250, 250, 'JPEG', 100).then((newResponse) => {
                    self.setState({ image: newResponse });
                }).catch((err) => {
                    self.setState({ errorMessage: 'An error occurred while selecting the proifle picture. Please try again.' });
                });
            }
        });
    },

    uploadImage: async (image, imageName) => {
        try {
            const response = await fetch(image.uri);
            const blob = await response.blob();

            const snap = await firebase.storage().ref(imageName).put(blob, { cacheControl: 'max-age=31536000', contentType: `${image.mime}` });

            const downloadURL = await snap.ref.getDownloadURL();

            console.log(`Successfully uploaded image: ${downloadURL}`);
            return downloadURL;
        } catch (e) {
            console.log(`An error occurred while uploading the file.\n\n${e}`);
            throw e;
        }
    },

    copyText: async (value, message) => {
        WToast.show({
            textColor: '#ffffff',
            backgroundColor: '#3a4449',
            data: message
        });
        
        return await Clipboard.setString(value);
    },

    pasteText: async () => {
        return await Clipboard.getString();
    }
}

export default storage;