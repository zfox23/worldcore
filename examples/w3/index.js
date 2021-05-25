// Wide Wide World
//
// Croquet Studios, 2021

import { Session} from "@croquet/croquet";
import { ModelRoot, ViewRoot, UIManager, q_axisAngle, toRad, m4_scalingRotationTranslation,
    ActorManager, RenderManager, PawnManager, PlayerManager, InputManager, v3_normalize } from "@croquet/worldcore";
import { Voxels } from "./src/Voxels";
import { Surfaces } from "./src/Surfaces";
import { Paths } from "./src/Paths";
import { VoxelRender } from "./src/VoxelRender";
import { VoxelCursor } from "./src/VoxelCursor";
import { Editor } from "./src/Editor";
import { HUD } from "./src/HUD";
import { GodView } from "./src/GodView";
import { PathRender, RouteRender } from "./src/Debug";
import { Plants } from "./src/Plants";

//------------------------------------------------------------------------------------------
// MyModelRoot
//------------------------------------------------------------------------------------------

class MyModelRoot extends ModelRoot {
    init(...args) {
        super.init(...args);
        console.log("Start Model!!!");

        this.voxels = Voxels.create();
        this.surfaces = Surfaces.create();
        this.paths = Paths.create();
        this.plants = Plants.create();
        this.voxels.generate();
    }

    createManagers() {
        this.playerManager = this.addManager(PlayerManager.create());
        this.actorManager = this.addManager(ActorManager.create());
    }
}
MyModelRoot.register("MyModelRoot");

//------------------------------------------------------------------------------------------
// MyViewRoot
//------------------------------------------------------------------------------------------

class MyViewRoot extends ViewRoot {
    constructor(model) {
        super(model);

        this.HUD = new HUD(this.ui.root, {autoSize: [1,1]});

        this.render.setBackground([0.45, 0.8, 0.8, 1.0]);
        this.render.lights.setAmbientColor([0.6, 0.6, 0.6]);
        this.render.lights.setDirectionalColor([0.3, 0.3, 0.3]);
        this.render.lights.setDirectionalAim(v3_normalize([0.1,0.2,-1]));

        const ao = this.render.aoShader;
        if (ao) {
            ao.setRadius(0.1);
            ao.density = 0.5;
            ao.falloff = 1;
        }

    }

    createManagers() {
        this.input = this.addManager(new InputManager(this.model));
        this.render = this.addManager(new RenderManager(this.model));
        this.voxelRender = this.addManager(new VoxelRender(this.model));
        this.ui = this.addManager(new UIManager(this.model));
        this.voxelCursor = this.addManager(new VoxelCursor(this.model));
        this.godView = this.addManager(new GodView(this.model));
        this.editor = this.addManager((new Editor(this.model)));
        // this.pathRender = this.addManager(new PathRender(this.model));
        // this.routeRender = this.addManager(new RouteRender(this.model));
        this.pawnManager = this.addManager(new PawnManager(this.model));
    }

}

async function go() {

    const session = await Session.join({
        appId: 'io.croquet.w3',
        name: 'w3',
        model: MyModelRoot,
        view: MyViewRoot,
        tps: 15,
    });
}

go();
