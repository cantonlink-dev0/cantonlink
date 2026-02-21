import { writeFileSync, mkdirSync } from "fs";
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function d58(s){const b=[];for(const c of s){let carry=BASE58.indexOf(c);if(carry<0)throw new Error("Invalid base58: "+c);for(let j=0;j<b.length;j++){carry+=b[j]*58;b[j]=carry&0xff;carry>>=8;}while(carry>0){b.push(carry&0xff);carry>>=8;}}for(const c of s){if(c!=="1")break;b.push(0);}return new Uint8Array(b.reverse());}
const key=process.argv[2];
if(!key){console.log("Usage: node import-solana-key.mjs YOUR_BASE58_PRIVATE_KEY");process.exit(1);}
const decoded=d58(key);
console.log("Decoded "+decoded.length+" bytes");
const dir=process.env.USERPROFILE+"\\.config\\solana";
mkdirSync(dir,{recursive:true});
const out=dir+"\\id.json";
writeFileSync(out,JSON.stringify(Array.from(decoded)));
console.log("Saved to "+out);
