Take double the payback LINE BOT using Node.js and Heroku
==========================================================



Require
-------

* LINE Business Account and BOT API Trial Account
* Heroku Account

Environment
-----------

| Key | Value | Description |
|---|---|---|
| `LINEBOT_CHANNEL_ID` | Channel ID |  |
| `LINEBOT_CHANNEL_SECRET` | Channel Secret |  |
| `LINEBOT_MID` | MID |  |
| `FIXIE_URL` | Fixie URL | Heroku Add-on |


Setup
-----

### Git clone

```
$ git clone <url>
```

### Heroku create

```
$ heroku create
$ heroku git:remote -a <app name>
```


### BOT Setting

* `LINEBOT_CHANNEL_ID`
* `LINEBOT_CHANNEL_SECRET`
* `LINEBOT_MID`
* Callback URL - heroku app url + `/callback`


### Static IP

using fixie add-on

```
$ heroku addons:create fixie:tricycle
Creating fixie-hogehoge-99999... done, (free)
Adding fixie-hogehoge-99999 to fugafuga-piyopiyo-9999... done
Setting FIXIE_URL and restarting fugafuga-piyopiyo-9999... done, v3
Your IP addresses are xxx.xxx.xxx.xxx, xxx.xxx.xxx.xxx
Use `heroku addons:docs fixie` to view documentation.
```


add ip to LINE BOT setting


### Push

```
$ git push heroku master
```

