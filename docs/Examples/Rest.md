# Rest class

```javascript
    const { Rest, Enums } = require('classeviva.js');

    const classeviva = new Rest({
        username: 'USERNAME / EMAIL',
        password: 'PASSWORD',
        app: Enums.Apps.Students, //Optional: default is Enums.Apps.Students
        state: Enums.States.Italy, //Optional: default is Enums.States.Italy
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