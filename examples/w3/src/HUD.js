// import { ImageWidget, ToggleSet, ToggleWidget, Widget, SliderWidget, ButtonWidget, TextWidget, EmptyWidget, BoxWidget } from "@croquet/worldcore";

// import { m4_translation, v3_multiply, ViewService } from "@croquet/worldcore-kernel";
import { ImageWidget, ToggleSet, ToggleWidget, Widget, SliderWidget, ButtonWidget, TextWidget, EmptyWidget, BoxWidget, ControlWidget, PanelWidget, HorizontalWidget } from "@croquet/worldcore-widget"

import { Voxels } from "./Voxels";
import { GetTopLayer, SetTopLayer } from "./Globals";

import digOnIcon from "../assets/digOnIcon.png";
import digOffIcon from "../assets/digOffIcon.png";
import fillOnIcon from "../assets/fillOnIcon.png";
import fillOffIcon from "../assets/fillOffIcon.png";
import spawnOnIcon from "../assets/spawnOnIcon.png";
import spawnOffIcon from "../assets/spawnOffIcon.png";
import treeOnIcon from "../assets/treeOnIcon.png";
import treeOffIcon from "../assets/treeOffIcon.png";
import waterOnIcon from "../assets/waterOnIcon.png";
import waterOffIcon from "../assets/waterOffIcon.png";
import sourceOnIcon from "../assets/sourceOnIcon.png";
import sourceOffIcon from "../assets/sourceOffIcon.png";
// import sinkOnIcon from "../assets/sinkOnIcon.png";
// import sinkOffIcon from "../assets/sinkOffIcon.png";
import roadOnIcon from "../assets/roadOnIcon.png";
import roadOffIcon from "../assets/roadOffIcon.png";

import walkOnIcon from "../assets/walkOnIcon.png";
import walkOffIcon from "../assets/walkOffIcon.png";
import helpOnIcon from "../assets/helpOnIcon.png";
import helpOffIcon from "../assets/helpOffIcon.png";
import resetIcon from "../assets/resetIcon.png";

import kwark from "../assets/kwark.otf";

// Manages all the UI controls.

export class HUD extends Widget {
    constructor(...args) {
        super(...args);

        const toggleSet = new ToggleSet();

        const digToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: digOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: digOffIcon}),
            local: [20,20],
            size:[50,50],
            toggleSet: toggleSet,
            onToggleOn: () => this.publish("hud", "editMode", "dig"),
            state: true
        });

        const fillToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: fillOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: fillOffIcon}),
            local: [80,20],
            size:[50,50],
            toggleSet: toggleSet,
            onToggleOn: () => this.publish("hud", "editMode", "fill")
        });

        const treeToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: treeOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: treeOffIcon}),
            local: [20,80],
            size:[50,50],
            toggleSet: toggleSet,
            onToggleOn: () => this.publish("hud", "editMode", "tree")
        });

        const spawnToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: spawnOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: spawnOffIcon}),
            local: [80,80],
            size:[50,50],
            toggleSet: toggleSet,
            onToggleOn: () => this.publish("hud", "editMode", "spawn")
        });

        const waterToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: waterOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: waterOffIcon}),
            local: [20,140],
            size:[50,50],
            toggleSet: toggleSet,
            onToggleOn: () => this.publish("hud", "editMode", "water")
        });

        // const roadToggle = new ToggleWidget({
        //     parent: this,
        //     normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
        //     normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
        //     hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
        //     hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
        //     pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
        //     pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
        //     labelOn: new ImageWidget({border: [5,5,5,5], url: roadOnIcon}),
        //     labelOff: new ImageWidget({border: [5,5,5,5], url: roadOffIcon}),
        //     local: [80,140],
        //     size:[50,50],
        //     toggleSet: toggleSet,
        //     onToggleOn: () => this.publish("hud", "editMode", "road")
        // });

        const animals = this.modelService("Animals");
        const counterBackground = new EmptyWidget({parent: this, local: [140,80], size: [100,50]} );
        this.spawnCounter = new TextWidget({
            parent: counterBackground,
            autoSize: [1,1],
            point: 20, color: [1,1,1],
            alignX: 'left',
            alignY: 'middle',
            text: animals.animals.size.toString()
        })

        this.helpPanel = new HelpPanel({
            parent: this,
            pivot: [0.5, 0.5],
            anchor: [0.5, 0.5],
            visible: true
        })

        const helpToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: helpOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: helpOffIcon}),
            anchor: [1,0],
            pivot: [1,0],
            local: [-20,20],
            size:[40,40],
            onToggleOn: () => this.helpPanel.show(),
            onToggleOff: () => this.helpPanel.hide()
        });

        const walkToggle = new ToggleWidget({
            parent: this,
            normalOn: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            normalOff: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOn: new BoxWidget({color: [0.5, 0.5, 0.5]}),
            hiliteOff: new BoxWidget({color: [0.6, 0.6, 0.6]}),
            pressedOn: new BoxWidget({color: [0.3, 0.3, 0.3]}),
            pressedOff: new BoxWidget({color: [0.4, 0.4, 0.4]}),
            labelOn: new ImageWidget({border: [5,5,5,5], url: walkOnIcon}),
            labelOff: new ImageWidget({border: [5,5,5,5], url: walkOffIcon}),
            anchor: [1,0],
            pivot: [1,0],
            local: [-70,20],
            size:[40,40],
            onToggleOn: () => this.publish("hud", "firstPerson", true),
            onToggleOff: () => this.publish("hud", "firstPerson", false)
        });

        const resetButton = new ButtonWidget({
            parent: this,
            visible: false,
            anchor: [1,0],
            pivot: [1,0],
            local: [-70,20],
            size: [40,40],
            label: new ImageWidget({border: [5,5,5,5], url: resetIcon}),
            onClick: () => this.publish("hud", "reset")
        })

        const cutawaySlider = new SliderWidget({
            parent: this,
            pivot: [1,1],
            anchor: [1,1],
            local: [-20,-20],
            size: [20,200],
            step: Voxels.sizeZ-2,
            percent: 1 - (GetTopLayer()-2) / (Voxels.sizeZ-3),
            onChange: p => {
                const topLayer = 2 + Math.round((1-p) * (Voxels.sizeZ-3));
                SetTopLayer(topLayer);
                this.publish("hud", "topLayer", topLayer);
            }
        });

        this.subscribe("animals", { event: "countChanged", handling: "oncePerFrame" }, this.onCountChanged)
    }

    onCountChanged(n) {
        this.spawnCounter.set({text: n.toString()})
    }

}

class HelpPanel extends PanelWidget {
    constructor(options) {
        super(options);
        this.set({
            size: [300,400]
        })

        const frame = new BoxWidget({
            parent: this,
            color: [0.2, 0.2, 0.2],
            autoSize: [1,1]
        })

        const panel = new BoxWidget({
            parent: frame,
            color: [0.8, 0.8, 0.8],
            border: [2,2,2,2],
            autoSize: [1,1]
        })

        const title = new TextWidget({
            parent: panel,
            pivot: [0.5,0],
            anchor: [0.5,0],
            local: [0,20],
            size: [300,50],
            point: 44,
            fontURL: kwark,
            text: "Wide Wide World"
        });

        const horizontal = new HorizontalWidget({
            parent: panel,
            autoSize: [1,1],
            border: [10,80,10,10]
        })

        const background = new BoxWidget({
            parent: horizontal,
            color: [1,1,1],
            size: [200,200],
            local: [10,80],
        });

        const clip = new Widget({
            parent: background,
            autoSize: [1,1],
            border: [5,5,5,5],
            clip: true
        });

        const text = new TextWidget({
            parent: clip,
            color: [0,0,0],
            autoSize: [1,1],
            point: 14,
            alignX: "left",
            alignY: "top",
            text: "blah blah blah. Lots of stuff to say. blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say.blah blah blah. Lots of stuff to say. this is the end."
        })

        const slider = new SliderWidget({
            parent: horizontal,
            width: 20,
            size: [20, 20],
            onChange: p => {
                const textHeight = text.textHeight;
                const offset = p*(textHeight - clip.size[1]);
                text.set({local:[0,-offset]});
            }
        })

        horizontal.addSlot(background);
        horizontal.addSlot(slider);
    }
}


