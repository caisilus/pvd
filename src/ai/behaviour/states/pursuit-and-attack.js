import Vector2 from 'phaser/src/math/Vector2.js';
import SteeringManager from 'src/ai/steerings/steering-manager.js';
import Unit from 'src/objects/Unit.js';
import { State } from '../state.js';
import { Pursuit } from 'src/ai/steerings/pursuit.js';

function findMinBy(array, fn) {
  return array.reduce((maxElem, currentElem) => {
    return fn(currentElem) < fn(maxElem) ? currentElem : maxElem;
  });
}

export class PursuitAndAttackState extends State {
    /** @type {SteeringManager} */ steeringManager;
    /** @type {any} */ context;
    /** @type {Unit} */ target;
    /** @type {any} */ lastAttackTime = 0;
    
    constructor(owner, loseTargetRange, attackRange) {
        super(owner);
        this.steeringManager = owner.steeringManager;
        this.loseTargetRange = loseTargetRange;
        this.attackRange = attackRange;
    }

    onStateEnter = (context) => {
        this.context = context;
        this.target = this.findClosestTarget();
        this.pursuitSteering = new Pursuit(this.owner, this.context.gameObjects, 40, this.attackRange);
        this.pursuitSteering.target = this.target;
        this.owner.targetAcquired(this.target);

        this.steeringManager.addSteering(this.pursuitSteering);
    }

    onStateExit = (context) => {
        this.steeringManager.removeLastSteering();
        // this.steeringManager.removeMoveForce();
        this.pursuitSteering = null;
    }

    update(time, delta) {
        const target = this.findClosestTarget();
        if (target !== this.target) {
            console.log("New target!");
            this.target = target;
            this.pursuitSteering.target = target;
        }
        this.steeringManager.update();
        if (this.owner.bodyVelocity.length() < 10) {
            this.enqueAttack(time, delta)
        }
    }

    findClosestTarget() {
        return findMinBy(this.context.enemies, (enemy) => {
            enemy.bodyPosition.distance(this.owner.bodyPosition);
        });
    }

    enqueAttack(time, delta) {
        const diff = time - this.lastAttackTime;
        if (diff > 2000){
            this.owner.attack(this.target);
            this.lastAttackTime = time;
        }
    }

    shouldLoseTarget = (context) => {
        return this.owner.distance(this.target) > this.loseTargetRange;
    }
}