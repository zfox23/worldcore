import { RegisterMixin, WorldcoreModel, Shuffle } from "@croquet/worldcore-kernel";

import * as Worldcore from "@croquet/worldcore-kernel";

//------------------------------------------------------------------------------------------
//-- Behavioral ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

 // Mixin to allow actors to use behavior trees.

// StartBehavior sets the actor's current root behavior.

export const AM_Behavioral = superclass => class extends superclass {

    init(...args) {
        super.init(...args);
        this.listen("setBehaviorCode", this.setBehaviorCode);
    }

    destroy() {
        super.destroy();
        if (this.behavior) this.behavior.destroy();
    }

    startBehavior(behavior, options = {}) {
        if (this.behavior) this.behavior.destroy();
        options.actor = this;
        const target = behavior.create(options);
        this.behavior = target;
    }

    setBehaviorCode(code) {
        this.behavior.set({code: code});
    }

}
RegisterMixin(AM_Behavioral);

//Mixin to allow pawns to get and set the behavior code snippets of their actors

export const PM_Behavioral = superclass => class extends superclass {

    get behaviorCode() { return this.actor.behavior.code }
    set behaviorCode(code) { this.say("setBehaviorCode", code); }

}

//------------------------------------------------------------------------------------------
//-- BehaviorHandler -----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

//This is the default handler for the behavior proxies. It traps all method calls
// and uses the code instead. If you want to call the base behavior methods from the code,
// you can with "this.base.onStart()" (for example)

class BehaviorHandler  {

    get(target, prop, receiver) {
        if(this[prop]) return this[prop];
        if(prop === "base") return target;
        return Reflect.get(...arguments);
    }

    onStart() {
        this.base.onStart(); // Fall thru to the behavior.
    }

    do(delta) {
        this.base.do(delta); // Fall thru to the behavior.
    }

}

//------------------------------------------------------------------------------------------
//-- Behavior ------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class Behavior extends WorldcoreModel {
    init(options) {
        super.init();

        this.set(options);
        if (this.parent) this.parent.addChild(this);

        if (this.tickRate) {
            const firstDelta = Math.random() * this.tickRate;
            this.future(firstDelta).tick(firstDelta);
        }

        this.proxy.onStart();

    }

    get proxy() {
        if (!this.$proxy) {

            const factoryCode = `return class extends superclass { ${this.code} }`;
            const factory = new Function('superclass', 'WC', factoryCode);

            this.$proxy = new Proxy(this, factory(BehaviorHandler, Worldcore).prototype);
        }
        return this.$proxy;
    }

    get code() { return this._code}

    destroy() {
        super.destroy();
        if (this.children) new Set(this.children).forEach(child => child.destroy());
        if (this.parent) this.parent.removeChild(this);
        this.doomed = true;
    }

    set(options = {}) {
        const sorted = Object.entries(options).sort((a,b) => { return b[0] < a[0] ? 1 : -1 } );
        for (const option of sorted) {
            this["_" + option[0]] = option[1];
            if(option[0] === "code") this.$proxy = null;
        }
    }

    get actor() { return this._actor}
    get parent() { return this._parent}
    get tickRate() { return this._tickRate || 100}

    tick(delta) {
        if (this.doomed) return;
        this.proxy.do(delta);
        if (!this.doomed) this.future(this.tickRate).tick(this.tickRate);
    }

    startChild(behavior, options = {}) {
        options.actor = this.actor;
        options.parent = this;
        behavior.create(options);
    }

    addChild(child) {
        if (!this.children) this.children = new Set();
        this.children.add(child);
    }

    removeChild(child) {
        if (this.children) this.children.delete(child);
    }

    succeed(data) {
        if (this.parent) this.parent.proxy.onSucceed(this, data);
        this.destroy();
    }

    fail(data) {
        if (this.parent) this.parent.proxy.onFail(this, data);
        this.destroy();
    }

    onStart() {}
    do(delta) {}
    onSucceed(child, data) {this.succeed(data)};
    onFail(child, data) { this.fail(data)};

}
Behavior.register('Behavior');

//------------------------------------------------------------------------------------------
//-- CompositeBehavior ---------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class CompositeBehavior extends Behavior {

    get tickRate() { return 0 }
    get behaviors() {return []}
    get isParallel() { return this._parallel }
    get isShuffle() { return this._shuffle }

    onStart() {
        this.n = 0;
        this.pending = this.behaviors.length;
        if (this.isShuffle) this.deck = Shuffle(this.behaviors.length);
        this.isParallel ? this.startAll() : this.startNext();
    }

    startAll() {
        for (let i = 0; i < this.behaviors.length; i++ ) {
            if (this.doomed) return;
            this.isShuffle ? this.startChild(this.behaviors[this.deck[i]]) : this.startChild(this.behaviors[i]);
        }
    }

    startNext() {
        if (this.isParallel) return;
        this.isShuffle ? this.startChild(this.behaviors[this.deck[this.n++]]) : this.startChild(this.behaviors[this.n++]);
    }

    onSucceed(child, data) {};
    onFail(child, data) {};


}
CompositeBehavior.register('CompositeBehavior');

//------------------------------------------------------------------------------------------
//-- DecoratorBehavior ---------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class DecoratorBehavior extends Behavior {

    get tickRate() { return 0 }
    get behavior() { return null }

    onStart() { this.startChild(this.behavior); }

    onSucceed(child, data) {};
    onFail(child, data) {};


}
DecoratorBehavior.register('DecoratorBehavior');

//------------------------------------------------------------------------------------------
//-- SequenceBehavior ----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Executes a sequence of behaviors in order. Fails if any of them fails. Nothing is
// executed after the first fail. Succeeds if all of them succeed.

// The equivalent of a logical AND

export class SequenceBehavior extends CompositeBehavior {

    onSucceed() { --this.pending ? this.startNext() : this.succeed(); }
    onFail() { this.fail(); }

}
SequenceBehavior.register('SequenceBehavior');

//------------------------------------------------------------------------------------------
//-- SelectorBehavior ----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Executes behaviors in order. Succeeds if any of them succeeds. Nothing is executed after
// the first success. Fails if all of them fail.

// The equivalent of a logical OR

export class SelectorBehavior extends CompositeBehavior {

    onSucceed() { this.succeed(); }
    onFail() { --this.pending ? this.startNext() : this.fail(); }


}
SelectorBehavior.register('SelectorBehavior');

//------------------------------------------------------------------------------------------
//-- InvertBehavior ------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Inverts completion status when child finishes.

export class InvertBehavior extends DecoratorBehavior {

    onSucceed(child, data) {this.fail(data)};
    onFail(child, data) {this.succeed(data)};

}
InvertBehavior.register('InvertBehavior');

//------------------------------------------------------------------------------------------
//-- SucceedBehavior -----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Always returns success when the child finishes.

export class SucceedBehavior extends DecoratorBehavior {

    onSucceed(child, data) {this.succeed(data)};
    onFail(child, data) {this.succeed(data)};

}
SucceedBehavior.register('SucceedBehavior');

//------------------------------------------------------------------------------------------
//-- FailBehavior --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Always returns fail when the child finishes.

export class FailBehavior extends DecoratorBehavior {

    onSucceed(child, data) {this.fail(data)};
    onFail(child, data) {this.fail(data)};

}
FailBehavior.register('FailBehavior');

//------------------------------------------------------------------------------------------
//-- DelayBehavior -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Succeeds when delay time is reached.

export class DelayBehavior extends Behavior {

    get tickRate() { return 0 }
    get delay() { return this._delay || 1000};

    onStart() {
        this.future(this.delay).succeed();
    }

}
DelayBehavior.register("DelayBehavior");

//------------------------------------------------------------------------------------------
//-- LoopBehavior --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Holds a single child behavior. Will repeatedly execute it until count is reached, as long
// as it succeeds. If it fails, the loop returns failure. If the count is set to 0, it executes indefinitely.


export class LoopBehavior extends DecoratorBehavior {

    get count() {return this._count || 0}

    onStart() {
        this.n = 0;
        this.startChild(this.behavior);
    }

    onSucceed() { ++this.n === this.count ? this.succeed() : this.startChild(this.behavior);   }
    onFail() { this.fail(); }

}
LoopBehavior.register('LoopBehavior');
