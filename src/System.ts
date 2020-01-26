// import statements for hardware
import {Cpu} from "./hardware/Cpu";
import {Memory} from "./hardware/Memory";
import Keyboard = require("./hardware/VirtualKeyboard");
import disk = require("./hardware/Disk");
import {Clock} from "./hardware/Clock";
import {Hardware} from "./hardware/Hardware";
import {InterruptController} from "./hardware/InterruptController";
import {VirtualKeyboard} from "./hardware/VirtualKeyboard";

// import statements for drivers

// import statements for kernel management components

// import statements for general kernel
const KERNEL: Kernel.Kernel = require("./kernel/Kernel");

/*
    Constants
 */
// Initialization Parameters for Hardware
// Clock cycle interval
const CLOCK_INTERVAL= 500;               // This is in ms (milliseconds) so 1000 = 1 second, 100 = 1/10 second
                                        // A setting of 100 is equivalent to 10hz, 1 would be 1,000hz or 1khz,
                                        // .001 would be 1,000,000 or 1mhz. Obviously you will want to keep this
                                        // small, I recommend a setting of 100, if you want to slow things down
                                        // make it larger.


export class System extends Hardware {

    private _CPU : Cpu = null;
    private _MEMORY: Memory = null;
    private _IRQ_CONTROLLER: InterruptController = null;
    private _CLOCK: Clock = null;
    private _KEYBOARD: VirtualKeyboard;

    public running: boolean = false;

    constructor() {
        super(0, "SYS");
        console.log("Hello TSIRAM!");

        this.log("[****************** System Initialization started]");

        /*
        Initialize all the hardware to the system (analogous to you assembling the physical components together)
         */
        this.log("[****************** Hardware Initialization - Begin]");

        this._CPU = new Cpu();
        this._MEMORY = new Memory();
        this._IRQ_CONTROLLER = new InterruptController(this._CPU);
        // the clock gets passed all of the hardware listening for clock pulses
        this._CLOCK = new Clock(this._CPU, this._MEMORY, this._IRQ_CONTROLLER);

        // create IO Hardware
        this._KEYBOARD = new VirtualKeyboard(this._IRQ_CONTROLLER);

        // register the keyboard with the interrupt controller
        // create interrupts

        this.log("[****************** Hardware Initialization - Complete]");

        /*
        Start the system (Analogous to pressing the power button and having voltages flow through the components)
        When power is applied to the system clock (_CLOCK), it begins sending pulses to all clock observing hardware
        components so they can act on each clock cycle.
         */
        this.log("[****************** Starting System (applying power)]");
        this.startSystem();
        this.log("System running status: " + this.running);

    }

    public startSystem(): boolean {


        return false;
    }

    public stopSystem(): boolean {

        return false;

    }
}

let system: System = new System();