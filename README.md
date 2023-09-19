# churchtools-calendarlocations
Update calendar event location based on bookes resources


Churchtool has a calendar system, where you can specify the
location of a calendar entry via the web UI.

It also has the option to create templates for these calendar entries.
Unfortunally the location is not stored in the template and the process
to add a location to a calendar entry is not that simple.

When you book resources (More precise some rooms), then you know
the location of this/these room(s) and churchtool could
fill in the location from this place.

Since churchtool does not do this, we have written this script which
looks for public calendar entries with no location and then 
checks if some resources have been booked and fills in the
location from the resource location

It does not process past calendar entries, no reason to change
the history.


## Installation
```bash
npm install
```

We use this JS client to interact with the CT installation

https://github.com/churchtools/churchtools-js-client
