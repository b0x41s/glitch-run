// public/ is canonical. Root copies support the existing source-based Pages host.
import {cp,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
for(const name of ['shared','scores','world-debugger'])await cp(new URL('public/'+name+'/',root),new URL(name+'/',root),{recursive:true,force:true});
const html=await readFile(new URL('world-debugger/index.html',root),'utf8');
if(!html.includes('../shared/score-client.js')||!html.includes('Alle spellen'))throw new Error('Biomes integration entry is incomplete');
console.log('Static Pages routes synchronized from public/');
