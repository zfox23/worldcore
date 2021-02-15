import { Actor, Pawn, mix, AM_Smoothed, PM_Smoothed, PM_InstancedVisible, GetNamedView, v3_scale, UnitCube, Material, InstancedDrawCall, AM_RapierPhysics,
    sphericalRandom, CachedObject, AM_Spatial, PM_Spatial, PM_Visible, DrawCall, v3_transform, v3_add, m4_rotationQ, Cylinder, Cone } from "@croquet/worldcore";
import paper from "../assets/paper.jpg";

//------------------------------------------------------------------------------------------
// CubeSprayActor
//------------------------------------------------------------------------------------------

export class CubeSprayActor extends mix(Actor).with(AM_Smoothed, AM_RapierPhysics) {
    init(options) {
        this.index = Math.floor(Math.random() * 30);

        super.init("CubeSprayPawn", options);

        this.addRigidBody({type: 'dynamic'});

        this.addBoxCollider({
            size: [0.5, 0.5, 0.5],
            density: 1,
            friction: 1,
            restitution: 0.1
        });

    }

}
CubeSprayActor.register('CubeSprayActor');

//------------------------------------------------------------------------------------------
// CubeSprayPawn
//------------------------------------------------------------------------------------------

class CubeSprayPawn extends mix(Pawn).with(PM_Smoothed, PM_InstancedVisible) {
    constructor(...args) {
        super(...args);
        this.setDrawCall(CachedObject("cubeDrawCall" + this.actor.index, () => this.buildDraw()));
    }

    buildDraw() {
        const mesh = CachedObject("cubeMesh" + this.actor.index, () => this.buildMesh());
        const material = CachedObject("instancedPaperMaterial", this.buildMaterial);
        const draw = new InstancedDrawCall(mesh, material);

        GetNamedView('ViewRoot').render.scene.addDrawCall(draw);

        return draw;
    }

    buildMesh() {


        const modelRoot = GetNamedView('ViewRoot').model;
        const color = modelRoot.colors[this.actor.index];
        const mesh = UnitCube();

        mesh.setColor(color);
        mesh.load();
        mesh.clear();
        return mesh;
    }

    buildMaterial() {
        const material = new Material();
        material.pass = 'instanced';
        material.texture.loadFromURL(paper);
        return material;
    }

}
CubeSprayPawn.register('CubeSprayPawn');

//------------------------------------------------------------------------------------------
// CylinderSprayActor
//------------------------------------------------------------------------------------------

export class CylinderSprayActor extends mix(Actor).with(AM_Smoothed, AM_RapierPhysics) {
    init(options) {
        this.index = Math.floor(Math.random() * 30);

        super.init("CylinderSprayPawn", options);

        this.addRigidBody({type: 'dynamic'});

        this.addCylinderCollider({
            radius: 0.5,
            halfHeight: 0.5,
            density: 1.5,
            friction: 1,
            restitution: 0.1
        });

    }

}
CylinderSprayActor.register('CylinderSprayActor');



//------------------------------------------------------------------------------------------
// CylinderSprayPawn
//------------------------------------------------------------------------------------------

class CylinderSprayPawn extends mix(Pawn).with(PM_Smoothed, PM_InstancedVisible) {
    constructor(...args) {
        super(...args);
        this.setDrawCall(CachedObject("cylinderDrawCall" + this.actor.index, () => this.buildDraw()));
    }

    buildDraw() {
        const mesh = CachedObject("cylinderMesh" + this.actor.index, () => this.buildMesh());
        const material = CachedObject("instancedPaperMaterial", this.buildMaterial);
        const draw = new InstancedDrawCall(mesh, material);

        GetNamedView('ViewRoot').render.scene.addDrawCall(draw);

        return draw;
    }

    buildMesh() {


        const modelRoot = GetNamedView('ViewRoot').model;
        const color = modelRoot.colors[this.actor.index];
        const mesh = Cylinder(0.5, 1, 12, color);

        mesh.setColor(color);
        mesh.load();
        mesh.clear();
        return mesh;
    }

    buildMaterial() {
        const material = new Material();
        material.pass = 'instanced';
        material.texture.loadFromURL(paper);
        return material;
    }

}
CylinderSprayPawn.register('CylinderSprayPawn');

//------------------------------------------------------------------------------------------
// ConeSprayActor
//------------------------------------------------------------------------------------------

export class ConeSprayActor extends mix(Actor).with(AM_Smoothed, AM_RapierPhysics) {
    init(options) {
        this.index = Math.floor(Math.random() * 30);

        super.init("ConeSprayPawn", options);

        this.addRigidBody({type: 'dynamic'});

        this.addConeCollider({
            radius: 0.5,
            halfHeight: 0.5,
            density: 3,
            friction: 1,
            restitution: 0.1
        });


    }

}
ConeSprayActor.register('ConeSprayActor');

//------------------------------------------------------------------------------------------
// ConeSprayPawn
//------------------------------------------------------------------------------------------

class ConeSprayPawn extends mix(Pawn).with(PM_Smoothed, PM_InstancedVisible) {
    constructor(...args) {
        super(...args);
        this.setDrawCall(CachedObject("coneDrawCall" + this.actor.index, () => this.buildDraw()));
    }

    buildDraw() {
        const mesh = CachedObject("coneMesh" + this.actor.index, () => this.buildMesh());
        const material = CachedObject("instancedPaperMaterial", this.buildMaterial);
        const draw = new InstancedDrawCall(mesh, material);

        GetNamedView('ViewRoot').render.scene.addDrawCall(draw);

        return draw;
    }

    buildMesh() {


        const modelRoot = GetNamedView('ViewRoot').model;
        const color = modelRoot.colors[this.actor.index];

        const mesh = Cone(0.5, 0.01, 1, 12, color);

        mesh.setColor(color);
        mesh.load();
        mesh.clear();
        return mesh;
    }

    buildMaterial() {
        const material = new Material();
        material.pass = 'instanced';
        material.texture.loadFromURL(paper);
        return material;
    }

}
ConeSprayPawn.register('ConeSprayPawn');

//------------------------------------------------------------------------------------------
// FountainActor
//------------------------------------------------------------------------------------------

export class FountainActor extends mix(Actor).with(AM_Spatial, AM_RapierPhysics) {
    init(options) {
        super.init("FountainPawn", options);
        this.spray = [];
        this.spawnLimit = 150;
        this.future(0).tick();

        this.addRigidBody({type: 'static'});

        this.addCylinderCollider({
            radius: 1,
            halfHeight: 3,
            density: 1.5,
            friction: 1,
            restitution: 0.1
        });

        this.subscribe("hud", "pause", this.pause);
    }

    pause(p) {
        this.isPaused = p;
    }

    tick() {
        if (!this.isPaused) {
            if (this.spray.length >= this.spawnLimit) {
                const doomed = this.spray.shift();
                doomed.destroy();
            }
            let p;
            const r = Math.random();
            const origin = v3_add(this.translation, [0,3.5,0]);
            if (r < 0.4) {
                p = CubeSprayActor.create({translation: origin});
            } else if (r < 0.8) {
                p = CylinderSprayActor.create({translation: origin});
            } else {
                p = ConeSprayActor.create({translation: origin});
            }
            const spin = v3_scale(sphericalRandom(),Math.random() * 0.5);
            const rotationMatrix = m4_rotationQ(this.rotation);
            const force = v3_transform([0, 18 + 5 * Math.random(), 0], rotationMatrix);
            p.applyTorqueImpulse(spin);
            p.applyImpulse(force);
            this.spray.push(p);
        }
        this.future(250).tick();
    }

}
FountainActor.register('FountainActor');

export class FountainPawn extends mix(Pawn).with(PM_Spatial, PM_Visible) {
    constructor(...args) {
        super(...args);
        this.buildDraw();
    }

    buildDraw() {
        const mesh = this.buildMesh();
        const material = this.buildMaterial();
        const draw = new DrawCall(mesh, material);
        GetNamedView('ViewRoot').render.scene.addDrawCall(draw);
        return draw;
    }

    buildMesh() {
        // const modelRoot = GetNamedView('ViewRoot').model;
        // const color = modelRoot.colors[this.actor.index];
        const mesh = Cylinder(1, 6, 12, [0.3,0.3,0.3,1]);

        // mesh.setColor(color);
        mesh.load();
        mesh.clear();
        return mesh;
    }

    buildMaterial() {
        const material = new Material();
        material.pass = 'opaque';
        material.texture.loadFromURL(paper);
        return material;
    }
}
FountainPawn.register('FountainPawn');

