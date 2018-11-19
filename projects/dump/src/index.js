import fs from 'fs';
import path from 'path';
import os from 'os';

import { loadResources, loadResourceEntry } from '@castaway/lifeboat/src/resources';

import { TTMCommandType } from '../../../node_modules/@castaway/lifeboat/src/resources/data/scripting';

function dumpResourceIndex(filepath, resindex) {
    const dumppath = path.join(filepath,'dump');
    if (!fs.existsSync(dumppath)){
        fs.mkdirSync(dumppath);
    }
    fs.writeFileSync(path.join(dumppath, 'resindex.json'), JSON.stringify(resindex, null, 2) , 'utf-8');    
}

function dumpResourceEntriesCompressed(filepath, resindex) {
    const dumppath = path.join(filepath,'dump/compressed');
    if (!fs.existsSync(dumppath)){
        fs.mkdirSync(dumppath);
    }
    const res = resindex.resources[0];
    for (let e = 0; e < res.numEntries; e++) {
        const entry = res.entries[e];
        fs.writeFileSync(path.join(dumppath, entry.name), Buffer.from(entry.buffer) , 'utf-8');
    }
} 

function dumpAvailableTypes(filepath, resindex) {
    const types = [];
    const res = resindex.resources[0];
    for (let e = 0; e < res.numEntries; e++) {
        const entry = res.entries[e];
        if (!types.find(f => f === entry.type)) {
            types.push(entry.type);
        }
    }
    const dumppath = path.join(filepath,'dump');
    fs.writeFileSync(path.join(dumppath, 'restypes.json'), JSON.stringify({ types }, null, 2) , 'utf-8');
}

function dumpImages(filepath, resindex) {
    const dumppath = path.join(filepath,'dump','images');
    if (!fs.existsSync(dumppath)){
        fs.mkdirSync(dumppath);
    }
    const res = resindex.resources[0];
    for (let e = 0; e < res.numEntries; e++) { 
        const entry = res.entries[e];
        if (entry.type === 'BMP') {
            const e = loadResourceEntry(entry);
            for (let i = 0; i < e.numImages; i++) {
                fs.writeFileSync(path.join(dumppath, `${e.name}_img_${i}.json`), JSON.stringify(e.images[i], null, 2) , 'utf-8');
                fs.writeFileSync(path.join(dumppath, `${e.name}_img_${i}.raw`), Buffer.from(e.images[i].buffer));
            }
        }
    }
}

function dumpMovieScripts(filepath, resindex) {
    const dumppath = path.join(filepath,'dump','scripts');
    if (!fs.existsSync(dumppath)){
        fs.mkdirSync(dumppath);
    }
    const res = resindex.resources[0];
    for (let e = 0; e < res.numEntries; e++) { 
        const entry = res.entries[e];
        if (entry.type === 'TTM') {
            const e = loadResourceEntry(entry);
            fs.writeFileSync(path.join(dumppath, `${e.name}_script.txt`), '');
            fs.writeFileSync(path.join(dumppath, `${e.name}_script.raw`), Buffer.from(entry.buffer));
            for (let i = 0; i < e.scripts.length; i++) {
                const c = e.scripts[i];
                const type = TTMCommandType.find(ct => ct.opcode === c.opcode);
                let command = ''; // [0x${c.opcode.toString(16)}] 
                if (type !== undefined) {
                    if (type.command === 'SET_SCENE') {
                        command += os.EOL;
                    }
                    command += `${type.command} `;
                } else {
                    comand = 'UNKNOWN ';
                }
                for (let p = 0; p < c.params.length; p++) {
                    command += `${c.params[p]} `;
                }
                if (c.name) {
                    command += c.name
                }
                command += os.EOL;
                fs.appendFileSync(path.join(dumppath, `${e.name}_script.txt`), command);
            }
        }
    }
}

const filepath = path.join(__dirname,'../../../data');
const fc = fs.readFileSync(path.join(filepath, 'RESOURCE.MAP'));
const buffer = fc.buffer.slice(fc.byteOffset, fc.byteOffset + fc.byteLength);

// read resource file to get extra content like name for easy identification of the asset
const resfn = path.join(filepath, 'RESOURCE.001');
const resfc = fs.readFileSync(resfn);
const resbuffer = resfc.buffer.slice(resfc.byteOffset, resfc.byteOffset + resfc.byteLength);

const resindex = loadResources(buffer, resbuffer);

// Export Resource Index in JSON file
dumpResourceIndex(filepath, resindex);
dumpResourceEntriesCompressed(filepath, resindex);
dumpAvailableTypes(filepath, resindex);
// dumpImages(filepath, resindex);
dumpMovieScripts(filepath, resindex);

console.log('Dump Complete!!');
