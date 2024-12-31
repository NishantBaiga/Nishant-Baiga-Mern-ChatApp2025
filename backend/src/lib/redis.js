import Redis from "ioredis";

const client = new Redis(
  "rediss://default:AW3RAAIjcDEyMTBiNTQ1NzQxYTI0MDFiYWU4NzkyYTNkMjUxZWM4MXAxMA@pure-panther-28113.upstash.io:6379"
);

client.on("connect", () => {
  console.log("Redis Client Connected");
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
  process.exit(1);
});

client.on("ready", () => {
  console.log("Redis Client is ready!");
});

await client.set("foo", "bar");

export default client;