# Tibidabo class

```javascript
    const { Tibidabo } = require('classeviva.js');

    const classeviva = new Tibidabo({
        //Username support might come in the future, as of now it's not implemented for developer ease
        email: 'EMAIL',
        password: 'PASSWORD',
    });

    (async () => {
        await classeviva.login();

        const groups = await classeviva.getGroups();
        const addresses = await classeviva.getAddressBook();

        const className = "__";
        const classId = parseInt(groups.find(g => g.gruppo_nome === className).id);
        
        const allUsersIds = Object.keys(addresses);
        const students = allUsersIds.filter(uid => uid.startsWith('S'));

        const classmates = students
            .map(uid => addresses[uid])
            .filter((user) => user?.gruppi?.includes(classId));

        console.log(classmates);

        setTimeout(() => {
            classeviva.logout();
            process.exit();
        }, 3500);
    })();
```
