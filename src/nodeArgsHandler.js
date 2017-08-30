const argv = require('yargs')
.option('db_user',{
    alias: 'u',
    describe: 'The username to make the mysql connection. (Requires `CREATE` access on the database).'
})
.option('db_pass',{
    alias: 'p',
    describe: 'The password for the mysql connection'
})
.option('db_host', {
    alias: 'h',
    describe: 'The host for the mysql connection. Defaults to localhost'
})
.option('db_name',{
    alias: 'd',
    describe: 'The name of the database to connect to'
})
.option('config',{
    alias: 'c',
    describe: 'The path to the config file.'
})
.option('verbose',{
    alias: 'v',
    describe: 'Set how verbose the output is'
})
.option('initial_data_file',{
    alias: 'i',
    describe: 'JSON file containing initial data to populate the database.'
})
/*
.option('',{
    alias: ''
})
*/
.demandOption(['db_user'], 'Please Specify the user name for the db conenction.')
.demandOption(['config'], 'You must specify a configuration file for the database.')
.argv;


module.exports= argv;
