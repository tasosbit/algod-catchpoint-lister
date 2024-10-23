import * as tar from 'tar';
import msgpack from 'algo-msgpack-with-bigint';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

function die(...args) { console.error(...args); process.exit(1); }

function readDirectory(path) {
  try {
    return readdirSync(path);
  } catch(e) {
    die(`While reading ${path}: ${e.message}`);
  }
}

const { ALGORAND_DATA } = process.env;
const networkId = process.argv[2];

if (!ALGORAND_DATA) {
  die(`Please set the ALGORAND_DATA environment variable to the data directory, e.g. /var/lib/algorand/mainnet-v1.0`);
}

if (!networkId) {
  die(`Please provide network ID as the first argument`);
}

console.warn('Using', { ALGORAND_DATA, networkId });

let errors = [];
const labels = [];

const networkPath = join(ALGORAND_DATA, networkId);
const catchpointsPath = join(networkPath, 'catchpoints');
for(const level1 of readDirectory(catchpointsPath)) {
  const level2 = join(catchpointsPath, level1);
  for(const path of readDirectory(level2)) {
    const level3 = join(level2, path);
    for(const path of readDirectory(level3)) {
      const filename = join(level3, path);
      if (filename.endsWith('.catchpoint')) {
        try {
          labels.push(
            await processCatchpoint(filename)
          );
        } catch(e) {
          errors.push(e);
        }
      }
    }
  }
}

console.warn("Labels:", labels.length);
console.log(labels.join("\n"));

if (errors.length) {
  console.warn("Errors:", errors.length);
  console.error(errors.join("\n\n"));
}

function processCatchpoint(filename) {
  let resolve, reject;
  const resolver = new Promise((rs, rj) => {
    resolve = rs;
    reject = rj;
  });
  try {
    tar.t({
      file: filename,
      gzip: true,
      sync: true,
      filter: path => { return path === 'content.msgpack' },
      onReadEntry: async entry => {
        try {
          const buffers = [];
          for await (const data of entry) {
            buffers.push(data);
          }
          const buffer = Buffer.concat(buffers);
          const { catchpoint: c } = msgpack.decode(buffer);
          if (!c) {
            throw new Error("Catchpoint not found in "+filename);
          }
          resolve(c);
        } catch(e) {
          reject(`While reading ${filename}: ${e.message}`);
        }
      }
    });
  } catch(e) {
    reject(`While reading ${filename}: ${e.message}`);
  }
  return resolver;
}