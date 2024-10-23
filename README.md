# algod-catchpoint-lister

List catchpoint IDs from algod data directory

Install dependencies:

`pnpm i`

Then run with the _network_ data directory:

`node index.js /var/lib/algorand/mainnet-v1.0`

In case your current user does not have access to the network data directory, you will see something like:

`While reading /var/lib/algorand/fnet-v1/catchpoints: EACCES: permission denied, scandir '/var/lib/algorand/fnet-v1/catchpoints'`

In which case you can usually run this with `sudo`.
