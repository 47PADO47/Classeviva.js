# Web class

**⚠️ If you don't know what the optional parameters do, don't use them.**

```javascript
    const { Web } = require('classeviva.js');

    const classeviva = new Web({
        uid: 'USERNAME / EMAIL',
        pwd: 'PASSWORD',
        cid: 'CUSTOMERID', //OPTIONAL
        pin: 'PIN', //OPTIONAL
        target: 'TARGET' //OPTIONAL
    });

    (async () => {
        await classeviva.login();

        classeviva.exportXmlAgenda(new Date('2020-10-12'), new Date('2020-20-12'))
            .then((xml) => writeFileSync('agenda.xml', xml));

        setTimeout(() => {
            classeviva.logout();
            process.exit();
        }, 3500);
    })();
```