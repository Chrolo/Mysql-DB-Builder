# MyMySQL builder
_oh my~~~~~~SQL_

## What is it?
A table builder/intialiser for mysql. You supply a config and a connection, it'll go and make sure the database is configured in that way.
Currently it'll just drop tables if it finds they are unsuitable.

## Docs
This module has `yargs`, so you can see a list of options and commands by entering a blank command.
Check out the `docs\schemas` to see how you should format your table definitions.
_note_: the module currently does not validate the database config passed to it and may error in weird ways if the config is not correctly formatted.

### Example use
"I want to create the database from information in `./db_config.json`, the program can use the user `notRoot` @ `8.8.8.8` to connect and add the tables."
```
node src/main.js -u notRoot -h 8.8.8.8 -c ./db_config.json
```
