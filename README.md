# I Owe U
ITSP300 group project

### **Setting the development entironment**
Download the and install the following:
- Android Studio (for the SDK and AVD)
> You may also use your device with USB debugging turned on, or another emulator, such as Genymotion
- Node.js
- A code editor, such as Visual Studio Code

### **Setting up the app**
- Open Android Studio > Configure > AVD Manager and create a new virtual device
> Reccomended: Google Pixel 2 with Android 10
- Start the newly-created AVD
- Download the GitHub repository (project files)
- Open the project folder in your code editor
- Set up the config.json file with your own Firebase and SendGrid configuration
- Open a terminal ("Ctrl + \`" in VS Code) and run the following commands:
> `npm install`
> `cd android`
> `./gradlew clean`
> `cd ..`
> `npm run android`
- If android/local.properties was not created, create the file with the following contents:
> Example (Windows): `sdk.dir=C\:\\Users\\your_user_folder_here\\AppData\\Local\\Android\\Sdk`
