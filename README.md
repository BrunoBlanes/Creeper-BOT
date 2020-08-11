# Creeper-bot
This is a bot that I created with the idea of automating my GitHub repositories. Currently it only supports automation for my [Average-CRM](https://github.com/BrunoBlanes/Average-CRM "Average-CRM") repository.

## About it
Creeper-bot was originaly typed in pure JavaScript as a way for me to learn the language, however, once I was familiar with that, I decided to move it to TypeScript.
If you are intereseted in seeing how that was done, feel free to go sniff its commit timeline.

## How it works
The bot is hosted on a private Azure account as a Free App Service. It is connected to my personal account through a private key. It listens for webhook events and uses the GitHub REST API v3 to interact with the repositories.

### Workflow
Below you can see all the workflows this bot is capable of performing on my repos:

#### Issues
![Issues](https://github.com/BrunoBlanes/Creeper-Bot/raw/migration/typescript/Average-CRM/Creeper-bot%20-%20Issue.png "Issues")

#### Project card
![Project card](https://github.com/BrunoBlanes/Creeper-Bot/raw/migration/typescript/Average-CRM/Creeper-bot%20-%20Project%20Card.png "Project card")

#### Push
![Push](https://github.com/BrunoBlanes/Creeper-Bot/raw/migration/typescript/Average-CRM/Creeper-bot%20-%20Push.png "Push")

#### Pull request
![Pull request](https://github.com/BrunoBlanes/Creeper-Bot/raw/migration/typescript/Average-CRM/Creeper-bot%20-%20Pull%20Request.png "Pull request")
