
import { v3_add, v3_sub, v3_min, v3_max, Model } from "@croquet/worldcore-kernel";

// The voxel database. Voxel are stored as run-length compressed columns to save snapshot size.

//------------------------------------------------------------------------------------------
//-- VoxelColumn ---------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class VoxelColumn   {

    constructor(counts = [Voxels.sizeZ], types = [0]) {
        this.counts = new Uint16Array(counts);
        this.types = new Uint8Array(types);
    }

    asConstructorArgs() {
        const empty = this.types[0] === 0 && this.types.length === 1;
        return empty ? [] : [[...this.counts], [...this.types]];
    }

    set(z, type) {
        const expand = this.expand();
        if (expand[z] === type) return false;
        expand[z] = type;
        this.compress(expand);
        return true;
    }

    get(z) {
        return this.types[this.counts.findIndex(count => { z -= count; return z<0; })];
    }

    expand() {
        const out = [];
        this.counts.forEach((count, n) => {
            const type = this.types[n];
            while (count-- > 0) { out.push(type);}
        });
        return out;
    }

    compress(source) {
        let n = 1;
        let previous = source[0];
        source.forEach(entry => {
            if (entry !== previous) n++;
            previous = entry;
        });
        this.counts = new Uint16Array(n);
        this.types = new Uint8Array(n);
        n = 0;
        previous = source[0];
        let count = 0;
        source.forEach(entry => {
            if (entry !== previous) {
                this.counts[n] = count;
                this.types[n] = previous;
                count = 0;
                n++;
                previous = entry;
            }
            count++;
        });
        this.counts[n] = count;
        this.types[n] = previous;
    }
}

//------------------------------------------------------------------------------------------
//-- Voxels --------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class Voxels extends Model {

    //-- Snapshot Types --

    static types() {
        return { "W3:VoxelColumn": VoxelColumn };
    }

    //-- Constants --

    static get sizeX() { return 64; }
    static get sizeY() { return 64; }
    static get sizeZ() { return 32; }
    static get size() { return [Voxels.sizeX, Voxels.sizeY, Voxels.sizeZ]; }

    static get scaleX() { return 1; }
    static get scaleY() { return 1; }
    static get scaleZ() { return 1; }
    static get scale() { return [Voxels.scaleX, Voxels.scaleY, Voxels.scaleZ]; }

    //-- Directions --

    static get north() { return 0; }
    static get east() { return 1; }
    static get south() { return 2; }
    static get west() { return 3; }
    static get above() { return 4; }
    static get below() { return 5; }

    //-- Helper Methods --

    static isValid(x, y, z) {
        if (x < 0) return false;
        if (x >= Voxels.sizeX) return false;
        if (y < 0) return false;
        if (y >= Voxels.sizeY) return false;
        if (z < 0) return false;
        if (z >= Voxels.sizeZ) return false;
        return true;
    }

    static canEdit(x, y, z) {
        if (x < 1) return false;
        if (x >= Voxels.sizeX-1) return false;
        if (y < 1) return false;
        if (y >= Voxels.sizeY-1) return false;
        if (z < 0) return false;
        if (z >= Voxels.sizeZ-1) return false;
        return true;
    }

    // Id are packed voxel coordinates that can be used as unique identifiers.

    static packID(x,y,z) {
        return (((x << 10) | y) << 10) | z;
    }

    static unpackID(id) {
        const y = id >>> 10;
        const x = y >>> 10;
        return [x & 0x3FF, y & 0x3FF, id & 0x3FF];
    }

    static adjacent(x,y,z, direction) {
        const out = [x,y,z];
        switch (direction) {
            case 0: // North
                out[1]++;
                break;
            case 1: // East
                out[0]++;
                break;
            case 2: // South
                out[1]--;
                break;
            case 3: // West
                out[0]--;
                break;
            case 4: // Above
                out[2]++;
                break;
            case 5: // Below
                out[2]--;
                break;
                default:
        }
        return out;
    }

    // Executes a callback for every valid adjacent xyz. Callback arguments are (x, y, z, direction)
    // (Does not look up the contents of the voxel.)

    static forValidAdjacent(x, y, z, callback) {
        const x0 = x-1, x1 = x+1;
        const y0 = y-1, y1 = y+1;
        const z0 = z-1, z1 = z+1;
        if (x0 >= 0) callback(x0, y, z, 3);             // West
        if (x1 < Voxels.sizeX) callback(x1, y, z, 1);   // East
        if (y0 >= 0) callback(x, y0, z, 2);             // South
        if (y1 < Voxels.sizeY) callback(x, y1, z, 0);   // North
        if (z0 >= 0) callback(x, y, z0, 5);             // Below
        if (z1 < Voxels.sizeZ) callback(x, y, z1, 4);   // Above
    }

    static baseTriangles(x,y,z) {
        return [[[x,y,z], [x+1,y,z], [x+1,y+1,z]], [[x,y,z], [x+1,y+1,z], [x,y+1,z]]];
    }

    static toWorldXYZ(x,y,z) {
        return [x * Voxels.scaleX, y * Voxels.scaleY, z * Voxels.scaleZ];
    }

    static toVoxelXYZ(x,y,z) {
        return [x / Voxels.scaleX, y / Voxels.scaleY, z / Voxels.scaleZ];
    }

    // Given a set of voxel ids, expands it by one in every direction including diagonally.
    static expandIDSet(set) {
        const out = new Set();
        set.forEach(id => Voxels.expandID(id).forEach(idd => out.add(idd)));
        return out;
    }

    // Given a voxel id, returns a set expanded by one in every direction including diagonally.
    static expandID(id) {
        const out = new Set();
        const xyz = Voxels.unpackID(id);
        const x0 = Math.max(xyz[0]-1, 0);
        const x1 = Math.min(xyz[0]+1, 64);
        const y0 = Math.max(xyz[1]-1, 0);
        const y1 = Math.min(xyz[1]+1, Voxels.sizeY-1);
        const z0 = Math.max(xyz[2]-1, 0);
        const z1 = Math.min(xyz[2]+1, Voxels.sizeZ-1);
        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                for (let z = z0; z <= z1; z++) {
                    out.add(Voxels.packID(x,y,z));
                }
            }
        }
        return out;
    }

    //-- Class Methods --

    init(persistedVoxels) {
        super.init();
        this.beWellKnownAs('Voxels');
        this.voxels = persistedVoxels
            ? this.fromPersistentVoxels(persistedVoxels)
            : Array.from(Array(Voxels.sizeX), ()=>Array.from(Array(Voxels.sizeY), ()=>new VoxelColumn()));
        this.subscribe("hud", "newLevel", () => this.generate());
        this.subscribe("edit", "setVoxel", data => this.set(...data.xyz, data.type));
    }

    get(x, y, z) {
        return this.voxels[x][y].get(z);
    }

    set(x, y, z, type) {
        const column = this.voxels[x][y];
        const old = column.get(z);
        if (type === old || !column.set(z, type)) return false;
        this.publish("voxels", "changed", {xyz: [x,y,z], type, old});
        return true;
    }

    generate() {
        const raw = new RawVoxels();
        raw.generate();
        this.compress(raw);
        this.publish("voxels", "newLevel");
    }

    compress(raw) {
        for (let x = 0; x < Voxels.sizeX; x++) {
            for (let y = 0; y < Voxels.sizeY; y++) {
                this.voxels[x][y].compress(raw.voxels[x][y]);
            }
        }
    }

    // Executes a callback for every voxel. Callback arguments are (type, x, y, z)

    forEach(callback) {
        for (let x = 0; x < Voxels.sizeX; x++) {
            for (let y = 0; y < Voxels.sizeY; y++) {
                const expanded = this.voxels[x][y].expand();
                expanded.forEach((type, z) => callback(type, x, y, z));
            }
        }
    }

    // Executes a callback for every adjacent voxel. Callback arguments are (type, x, y, z, direction)

    forAdjacent(x, y, z, callback) {
        const x0 = x-1, x1 = x+1;
        const y0 = y-1, y1 = y+1;
        const z0 = z-1, z1 = z+1;
        if (x0 >= 0) callback(this.get(x0, y, z), x0, y, z, 3);             // West
        if (x1 < Voxels.sizeX) callback(this.get(x1, y, z), x1, y, z, 1);   // East
        if (y0 >= 0) callback(this.get(x, y0, z), x, y0, z, 2);             // South
        if (y1 < Voxels.sizeY) callback(this.get(x, y1, z), x, y1, z, 0);   // North
        if (z0 >= 0) callback(this.get(x, y, z0), x, y, z0, 5);             // Below
        if (z1 < Voxels.sizeZ) callback(this.get(x, y, z1), x, y, z1, 4);   // Above
    }

    // Executes a callback for every horizontally adjacent voxel. Callback arguments are (type, x, y, z, direction)

    // Executes a callback for every voxel in a box around xyz.
    // Offset is subtracted from xyz to find start, and size is dimensions of box
    // Callback arguments are (type, x, y, z)

    forBox(xyz, offset, size, callback) {
        const start = v3_sub(xyz, offset);
        const xyz0 = v3_max([0,0,0], start);
        const xyz1 = v3_min([Voxels.sizeX, Voxels.sizeY, Voxels.sizeZ], v3_add(start, size));
        for (let x = xyz0[0]; x < xyz1[0]; x++) {
            for (let y = xyz0[1]; y < xyz1[1]; y++) {
                const expanded = this.voxels[x][y].expand();
                for (let z = xyz0[2]; z < xyz1[2]; z++) {
                    callback(expanded[z], x, y, z);
                }
            }
        }
    }

    // persistence

    toPersistentVoxels() {
        return this.voxels.map(row => row.map(col => col.asConstructorArgs()));
    }

    fromPersistentVoxels(data) {
        return data.map(row => row.map(args => new VoxelColumn(...args)));
    }
}
Voxels.register("Voxels");
