import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { PM_Visible, PM_Camera, RenderManager } from "@croquet/worldcore-kernel";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

//------------------------------------------------------------------------------------------
//-- ThreeVisible  -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
export const PM_ThreeVisible = superclass => class extends PM_Visible(superclass) {

    constructor(...args) {
        super(...args);
        this.listen("viewGlobalChanged", this.refreshDrawTransform);
    }

    destroy() {
        super.destroy();
        const render = this.service("ThreeRenderManager");
        if (render && render.scene) render.scene.remove(this.renderObject);
    }

    refreshDrawTransform() {
        if(this.renderObject){
            this.renderObject.matrix.fromArray(this.global);
            this.renderObject.matrixWorldNeedsUpdate = true;
        }
    }

    setRenderObject(renderObject) {
        const render = this.service("ThreeRenderManager");
        renderObject.wcPawn = this;
        this.renderObject = renderObject;
        this.renderObject.matrixAutoUpdate = false;
        this.renderObject.matrix.fromArray(this.global);
        this.renderObject.matrixWorldNeedsUpdate = true;
        if (render && render.scene) render.scene.add(this.renderObject);
        if (this.onSetRenderObject) this.onSetRenderObject(renderObject);
    }

};



//------------------------------------------------------------------------------------------
//-- ThreeCamera  --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export const PM_ThreeCamera = superclass => class extends PM_Camera(superclass) {
    constructor(...args) {
        super(...args);

        if (this.isMyPlayerPawn) {
            const render = this.service("ThreeRenderManager");
            render.camera.matrix.fromArray(this.lookGlobal);
            render.camera.matrixAutoUpdate = false;
            render.camera.matrixWorldNeedsUpdate = true;

            this.listen("lookGlobalChanged", this.refreshCameraTransform);
            this.listen("viewGlobalChanged", this.refreshCameraTransform);
        }
    }

    refreshCameraTransform() {
        const render = this.service("ThreeRenderManager");
        render.camera.matrix.fromArray(this.lookGlobal);
        render.camera.matrixWorldNeedsUpdate = true;
    }

    setRayCast(xy){
        const x = ( xy[0] / window.innerWidth ) * 2 - 1;
        const y = - ( xy[1] / window.innerHeight ) * 2 + 1;
        const render = this.service("ThreeRenderManager");
        if (!this.raycaster) this.raycaster = new THREE.Raycaster();
        this.raycaster.setFromCamera({x: x, y: y}, render.camera);
        return this.raycaster;
    }

    pointerRaycast(xy, targets, optStrictTargets) {
        this.setRayCast(xy);
        const render = this.service("ThreeRenderManager");
        const h = this.raycaster.intersectObjects(targets || render.threeLayer("pointer"));
        if (h.length === 0) return {};
 
        let hit;
        if (optStrictTargets) {
            for (let i = 0; i < h.length; i++) {
                if (targets.indexOf(h[i].object) >= 0) {
                    hit = h[i];
                    break;
                }
            }
        }

        if (!hit) {
            hit = h[0];
        }

        let normal;
        if(hit.face) normal = hit.face.normal;
        if(normal){
            let m = new THREE.Matrix3().getNormalMatrix( hit.object.matrixWorld );
            normal = normal.clone().applyMatrix3( m ).normalize();
        }else normal = new THREE.Vector3(0,1,0);
        return {
            pawn: this.getPawn(hit.object),
            xyz: hit.point.toArray(),
            uv: hit.uv?hit.uv.toArray():undefined,
            normal: normal.toArray(),
            distance: hit.distance
        };
    }

    getPawn(object) {
        let o = object;
        while(!o.wcPawn) {
            if (!o.parent) return null;
            o = o.parent;
        };
        return o.wcPawn;
    }

};

//------------------------------------------------------------------------------------------
//-- ThreeRenderManager --------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// The top render interface that controls the execution of draw passes.

export class ThreeRenderManager extends RenderManager {
    constructor(options = {}, name) {
        super(options, name || "ThreeRenderManager");

        this.threeLayers = {}; // Three-specific layers

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);

        if (!options.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = "ThreeCanvas";
            this.canvas.style.cssText = "position: absolute; left: 0; top: 0; z-index: 0";
            document.body.insertBefore(this.canvas, null);
            options.canvas = this.canvas;
        }

        this.renderer = new THREE.WebGLRenderer(options);
        this.renderer.shadowMap.enabled = true;

        this.composer = new EffectComposer( this.renderer );

        this.renderPass = new RenderPass( this.scene, this.camera );
        this.composer.addPass( this.renderPass );

        this.useBVH = options.useBVH;
        if (options.useBVH) {
            this.setupBVH();
        }

        this.resize();
        this.subscribe("input", "resize", () => this.resize());
        this.setRender(true);
    }

    setupBVH() {
        console.log(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);
    }

    setRender(bool){this.doRender = bool; }
    destroy() {
        super.destroy();
        this.renderer.dispose();
        if (this.canvas) this.canvas.remove();
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight)
    }

    dirtyLayer(name) {
        this.threeLayers[name] = null;
    }

    threeLayer(name) {
        if (!this.layers[name]) return [];
        if (!this.threeLayers[name]) {
            this.threeLayers[name] = Array.from(this.layers[name]).map(p => p.renderObject);
        }
        return this.threeLayers[name];
    }

    threeLayerUnion(...names) {
        let result = [];
        while (names.length > 0) {
            const a = this.threeLayer(names.pop());
            result = result.concat(a.filter(x => result.indexOf(x) < 0))
        }
        return result;
    }

    update() {
        if(this.doRender)this.composer.render();
    }

}
