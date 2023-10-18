This is an old takehome challenge for an interview process I wrote once. The question was to implement an API for monetary transactions with GraphQL in Node.js.

Below is what I wrote at the time when I submitted this code challenge.

# Installation

Get it running:

1. Copy sample.env to .env
2. Edit .env to pick one of two datastores. 
    * If using DynamoDB, you will need valid AWS credentials for a user with DynamoDB access. **WARNING**: the DynamoDB backend begins by deleting a table called `Transactions`, if it exists.
3. Start with `docker compose up --build`.

I take the output of the above process as a fulfillment of the requirement to have a console that demonstrates the output of my microservice.

# Tests

I was going to write tests, but I ran out of time. All that made it out is one small unit test. You may run it as

```shell
cd app
npm install --dev
npm run test
```

However, the application comes with a `make-requests.sh` script that will be executed in the containerised environment above. I take this as a manual verification that the happy path works. With a little bit more time, I would have written more tests.

# Rationale and discussion

We may chat more about this if this code pleases you, but you may notice from my commit messages that I made this by copying over a similar example I had previously written for New Relic, my former employer. I decided to keep the overall structure of that code, so it wasn't too onerous: containerised, using two datastores, and using the Dataloader (kind of superfluous in the current design).

I tried to follow your tech stack as much as seemed reasonable, but I did skimp on the typescript. I know how to do type annotations and interfaces, though. Maybe we can discuss how to do that in the interview, in case you want to hear my thoughts on the matter.

It is my sincere hope that you are at least delighted by the DynamoDB backend. I find it more cumbersome than Mongo, but since I know you use Dynamo, I wanted to prove to you that I know how to use it too. Dynamo has its upsides: scales infinitely and long queries die quickly and let you know about it. Easier on the wallet. :)

I took a bit longer than the estimated 3 hours. I worked in bursts over the past two days, in the middle of other duties. I wanted to show off at least some of the things I can do well.

Thank you for reading my code!
