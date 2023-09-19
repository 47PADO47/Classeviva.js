# Rest class

```javascript
    const { Rest, Enums } = require('classeviva.js');

    const classeviva = new Rest({
        username: 'USERNAME / EMAIL',
        password: 'PASSWORD',
        app: Enums.Apps.Students, //Optional: default is Enums.Apps.Students
        state: Enums.States.Italy, //Optional: default is Enums.States.Italy
        debug: false, //Optional: default is false, if true it will log some info
        saveTempFile: true, //Optional: default is true, it will save a file with login temp token to avoid hitting the server again if not expired
        keepAlive: true, //Optional: default is true, if true will attempt to automatically log you in when the token expires
    });

    (async () => {
        await classeviva.login();

        classeviva.getAbsences()
        .then(absences => {
            console.log(`You were absent in school ${absences.length} times`);
        });

        setTimeout(() => {
            classeviva.logout();
            process.exit();
        }, 3500);
    })();
```