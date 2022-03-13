# Classeviva.js
A lightweight Node.js module for Classeviva / Spaggiari electronic register 📚

## Table Of Contents
  - [Installation](#installation)
  - [Example](#example)
  - [Docs](#docs)

## Installation

```sh
    npm install classeviva.js
```

## Example

```javascript
    const { Classeviva } = require('classeviva.js');

    const classeviva = new Classeviva('USERNAME / EMAIL', 'PASSWORD');

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

## Docs

Head over to [docs](/docs/) if you want some information about the `Classeviva` class.