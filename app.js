const http = require("http");
const port = process.env.PORT || 8080;
const { MongoClient } = require("mongodb");
const faker = require("faker");

const cluster = require("cluster");
const os = require("os");
const pid = process.pid;

let url =
  "mongodb+srv://vitaliyalimov505:vitasy0005@cluster0.ds66f.mongodb.net";
// let url = "mongodb://localhost:27017";
const client = new MongoClient(url);
let dbName = "usersBank";

async function main() {
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  const collection = db.collection("users");
  let randomUsers = [];
  let randomName, randomEmail, randomPassword, randomCountry;
  let i = 1;
  while (i <= 500000) {
    randomName = faker.name.findName();
    randomEmail = faker.internet.email();
    randomPassword = faker.internet.password();
    randomCountry = faker.address.country();
    randomUsers.push({
      _id: i,
      name: randomName,
      email: randomEmail,
      password: randomPassword,
      country: randomCountry,
    });
    i++;
  }
  return collection.insertMany(randomUsers);
}

if (cluster.isMaster) {
  const cpusCount = os.cpus().length;
  console.log(`CPUs: ${cpusCount}`);
  console.log(`Master started. Pid: ${pid}`);
  for (let i = 0; i < cpusCount - 1; i++) {
    const worker = cluster.fork();
  }
  cluster.on("exit", (worker, code) => {
    console.log(`Worker died! Pid: ${worker.process.pid}. Code: ${code}`);
  });
}
if (cluster.isWorker) {
  http
    .createServer((req, res) => {
      if (req.method == "GET") {
        res.end("ok");
      } else {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          console.time();
          main()
            .then(console.log)
            .catch(console.error)
            .finally(() => client.close());

          res.end("ok POST");
          console.timeEnd();
        });
      }
    })
    .listen(port, () => {
      console.log(`server start ${port}`);
    });
}
