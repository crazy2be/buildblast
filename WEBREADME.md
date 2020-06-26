
Copy `server_config.template.json` to `server_config.json` and enter the following:

```
{
    "host": "localhost",
    "port": 8080,
    "client_assets": ".",
    "persist_enabled": true,
    "world_base_dir": "../world/",

    "db_pass": "",
    "mail_pass": "",
    "cookie_key_pairs": [
        "",
        ""
    ]
}
```

Then:

    ./runserver --config="../server_config.json"

 Linux:

- Follow instructions to add apt-get repository and install postgresql-9.4 at [postgresql.org](http://www.postgresql.org/download/linux/ubuntu/)
- `sudo apt-get install nodejs`
- `sudo apt-get install ruby-full`
- `sudo apt-get install libgemplugin-ruby`
- `sudo gem install compass`
- Change the db port to 5566:
  - `sudo vim /etc/postgresql/9.4/main/postgresql.conf`
- `sudo service postgresql start`
- `sudo -u postgres psql -p 5566`
- `ALTER USER postgres WITH ENCRYPTED PASSWORD '<generate a password>';`
- `\q`
- Create a user with no password
  - `sudo adduser buildblast`
- `sudo -u postgres createuser -S -D -R -l -P -E -e -h localhost -p 5566 buildblast`
  - (It will ask to create a password, generate one. The password it asks for afterwards is for the postgres user created above)
- `sudo -u postgres createdb -p 5566 --encoding=unicode --owner buildblast buildblast`
- Go to `/src/buildblast/db/`
  - `./execsql schema-000.sql (etc… for each schema in order)`
  
Copy the `server_config.template.json` to `server_config.json` and enter the following:
```
{
    "host": "localhost",
    "port": 8080,
    "client_assets": "./client",
    "persist_enabled": true,
    "world_base_dir": "~/buildblast-world/",

    "db_pass": "<ENTER PASSWORD>",
    "mail_pass": "",
    "cookie_key_pairs": [
        "<ENTER A GENERATED AUTH KEY, 64 CHAR HEX STRING>",
        "<ENTER A GENERATED ENCR KEY, 64 CHAR HEX STRING>"
    ]
}
```

- `./prod-build`
- `cd ~/buildblast-production/`
- Start both servers (different terminal sessions)
  - `./server`
  - `cd www-content && ../www --config="../server_config.json"`

Note: Confirmation emails will not work, since it's set to use the buildblast.com domain accounts.