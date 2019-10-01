# I Owe U
ITSP300 group project

### **Setting the development entironment**
Download the and install the following:
- Android Studio (for the SDK and AVD)
> You may also use your device with USB debugging turned on, or another emulator, such as Genymotion
- Node.js
- A code editor, such as Visual Studio Code

### **Setting up the app**
- Open Android Studio, navigate to the AVD manager and create a new virtual device
> Reccomended: Google Pixel 2 with Android 10
- Start the newly-created AVD
- Download the GitHub repository (project files)
- Open the project folder in your code editor
- Open a terminal ("Ctrl + \`" in VS Code) and run the following commands:
> `npm install`
> `cd android`
> `./gradlew clean`
> `cd ..`
> `npm run android`
