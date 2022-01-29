# Classeviva.js
A lightweight Node.js module for Classeviva / Spaggiari electronic register 📚

## Table Of Contents
  - [Installation](#installation)
  - [Example](#example)
  - [Methods](#methods)

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

## Methods

- **Note:** Almost all methods return a Promise.

> login

> logout

> getCards

> getGrades

> getAbsences

> getAgenda

> getDocuments

> getNoticeboard

> getSchoolBooks

> getCalendar

> getLessons

> getNotes

> getPeriods

> getSubjects

> getDidactics

> getMethods

> getParentsOptions

> getOverallTalks

> getTalks

> getTicket

> getAvatar

> getOverview

> checkDocument
