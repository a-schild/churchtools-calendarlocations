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
git clone https://github.com/a-schild/churchtools-calendarlocations.git
cd churchtools-calendarlocations
npm install
```

## Configuration
Copy over `config.sample.json` to `config.json` and adapt the config values.

Then you have to specify the addresses associated with the resources.

For this you can use the `Locations.ods` file, just open it in your spread sheet software
and add/modify the locations.
On the last line, in the last column, you will have the generated json config part
to be put in your `config.json` file.

(Just make sure that the numeric format it using iso format, and not the , as decimal separator)

## Running
```bash
node main.js [option]
```
Usually you start this every day, every hour with a cron job

### Options
- -h Help, show this help
- -c List all calendars the user has read rights
- -r List all resources the user has read rights
- --dry-run Process all entries, but don't apply changes to calendar (Simulation mode)
- -d Turn on debug mode, overrides config file settings

We use this JS client to interact with the CT installation

https://github.com/churchtools/churchtools-js-client
