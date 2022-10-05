## About

Backend API service for YouTube chat history written in NestJS. Requires a configured MongoDB instance to connect to.

Swagger documents will also be generated automatically when running.

This was started as a practice project to learn NestJS and JS/TS in general. Some things about it may strange or incorrect, feel free to point out any issues.

## Limitations
Currently, this supports one Youtube channel per active process, determined by the `YTCHAT_CHANNELID` environment variable. 

This means supporting multiple channels will require multiple containers each with their own port. 

Also, the swagger documentation is currently auto-generated and needs to be filled out more clearly.

## Installation

```bash
# from the source directory
$ npm install
```

## Configuration
Before launching, set any necessary environment variables. 
```bash
# bash
YTCHAT_CHANNELID=...
```

```bash
# powershell
$env:YTCHAT_CHANNELID = "..."
```


#### Supported variables
| Variable                   | Purpose                                                                                                                                                               | Default                                     |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| YTCHAT_CHANNELID           | Which MongoDB collection should be queried.                                                                                                                           | `UCrPseYLGpNygVi34QpGNqpA` (Ludwig)         |
| YTCHAT_BACKEND_PORT        | Which port the backend API should listen on.                                                                                                                          | `3000`                                      |
| YTCHAT_BACKEND_MONGOSTRING | The [MongoDB Connection String](https://www.mongodb.com/docs/manual/reference/connection-string/). The DB is selected with the above `YTCHAT_CHANNELID` env variable. | `'mongodb://user:password@127.0.0.1:27017'` |
 
#### API Keys/Authentication
The backend uses API keys with associated permissions for authentication. Each channel DB should have a collection called `users` that stores these API keys/permisisons. There's currently no built-in method for generating keys/permissions, so they will have to be inserted into the DB manually.

An example user (in JSON format) is as follows:
```json
{
  "name": "user's name",
  "apikey": "any_unique_string",
  "isAdmin": false,
  "perms": {
    "view": true,
    "comment": false,
  }
}
```

##### Permissions:
`isAdmin`: Should override all other permissions, and allow full access to viewing/commenting/etc.  
`view`: Can read chat history for users/perform queries on the filtered page.  
`comment`: Can leave mod comments for users.


## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

This was started as a personal practice project, so I didn't write any unit tests even though I definitely should have. 

NestJS will generate some boilerplate unit tests if you'd like to add some, feel free to submit a pull request if so!

## Support

Feel free to submit any issues or pull requests. No warranty or support is guaranteed beyond that. 

## License

This code is under the [MIT license](LICENSE).
