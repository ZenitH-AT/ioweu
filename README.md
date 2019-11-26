# I Owe U
ITSP300 group project

### **Required/recommended tools for development**
- Android SDK and an Android Virtual Device or Android emulator
Android Studio (for the SDK, Gradle and optional AVD)
> Instead of the AVD, you may use your Android device with USB debugging enabled, or an emulator (e.g. Genymotion)
- Node.js
- A code editor, such as Visual Studio Code

### **Setting up the app**
- Open Android Studio > Configure > AVD Manager and create a new virtual device
> Reccomended: Google Pixel 2 with Android 10
- Start the newly-created AVD
- Create a new react native app:
  - Create a new folder and open a console window at its location
  - Type npm install -g create-react-native-app
  - Type create-react-native-app ioweu
  - Select "Plain JavaScript"
  - Set the name to "I Owe U" ("ioweu" is the slug)
  - Type `expo eject` and select "Blank"
- Download the GitHub repository (project files)
- Merge the repository with your existing app files
- Create the android/local.properties file with the following contents:
> Example (Windows): `sdk.dir=C\:\\Users\\your_user_folder_here\\AppData\\Local\\Android\\Sdk`
- Set up the config.json file with your own Firebase and SendGrid configuration
> Use these ![rules](https://rentry.co/dq3uq) for your realtime database
- Open a terminal ("Ctrl + \`" in VS Code) and run the following commands:
> `npm install`
> `cd android`
> `./gradlew clean`
> `cd ..`
> `npm start`
> `npm run android`
- If you encounter any additional issues, see ![here](https://rentry.co/tpvus)
