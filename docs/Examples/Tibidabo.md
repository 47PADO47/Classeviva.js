# Tibidabo class

```javascript
    const { Tibidabo } = require('classeviva.js');

    const classeviva = new Tibidabo({
        //Support for username might come in the future, for now it's not implemented for developer ease
        email: 'EMAIL',
        password: 'PASSWORD',
    });

    (async () => {
        await classeviva.login();

        const addresses = await classeviva.getAddressBook()
        console.log(`You have a total of ${Object.keys(addresses).length} saved addresses`);

        setTimeout(() => {
            classeviva.logout();
            process.exit();
        }, 3500);
    })();
```