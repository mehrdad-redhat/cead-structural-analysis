module.exports = {
  apps : [
    {
      name   : "cead-backend",
      script : "./src/server.js",
      output: "./logs/cead-backend-out.log",
      error: "./logs/cead-backend-error.log"
    }
  ]
}
