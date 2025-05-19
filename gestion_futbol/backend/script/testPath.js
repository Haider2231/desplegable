const fs = require("fs");
const path = require("path");

const indexPath = path.resolve(__dirname, "./frontend/dist");
console.log("Ruta resuelta:", indexPath);
console.log("Existe:", fs.existsSync(indexPath));
