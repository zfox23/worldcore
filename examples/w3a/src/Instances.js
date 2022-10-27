

import { ViewService, Constants, THREE, m4_THREE, toRad} from "@croquet/worldcore";

class InstancedMesh {
    constructor(geometry, material, count=10){
        this.mesh = new THREE.InstancedMesh( geometry, material, count );
        this.pawns = [];
        this.free = [];
        for (let n = count-1; n>= 0; n--) {
            this.free.push(n);
        }
    }

    use(pawn) {
        const index = this.free.pop();
        this.pawns[index] = pawn;
        return index;
    }

    release(index) {
        this.pawns[index] = null;
        this.updateMatrix(index, null);
        this.free.push(index);
    }

    updateMatrix(index, m) {
        this.mesh.setMatrixAt(index, m4_THREE(m));
        this.mesh.instanceMatrix.needsUpdate = true;
    }

}

export class InstanceManager extends ViewService {
    constructor() {
        super("InstanceManager");
        console.log("InstanceManager");
        this.instances = new Map();

        this.buildAll();

        console.log(this.instances.get("yellow"));
    }

    destroy() {
        super.destroy();
    }

    get(name) {
        return this.instances.get(name);
    }

    build(name, geometry, material, count=10) {
        const render = this.service("ThreeRenderManager");
        if(this.instances.has(name)) {console.warn("Instanced Mesh " + name + "already exists"); return;}
        const instance = new InstancedMesh(geometry, material, count);
        this.instances.set(name, instance);
        render.scene.add(instance.mesh);
        return instance.mesh;
    }

    buildAll() {
        // const geometry = new THREE.BoxGeometry( 1, 1, 1 );

        const geometry = new THREE.CylinderGeometry( 0.5,0.5, 10, 7);
        geometry.rotateX(toRad(90));
        geometry.translate(0,0,5-1); // Extend below surface.

        const material = new THREE.MeshStandardMaterial( {color: new THREE.Color(1,1,0)} );

        material.side = THREE.DoubleSide;
        material.shadowSide = THREE.DoubleSide;

        const m = this.build("yellow", geometry, material);
        m.receiveShadow = true;
        m.castShadow = true;
    }

}