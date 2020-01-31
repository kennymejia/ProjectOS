import {Hardware} from "./Hardware";
import {Interrupt} from "./imp/Interrupt";
import {ClockListener} from "./imp/ClockListener";
import {Cpu} from "./Cpu";


export class InterruptController extends Hardware implements ClockListener{

    constructor(cpu: Cpu) {

        super(0, "IRC");
        this.log("Interrupt Controller Created");
        this.irqHardware = [];
        this.irqRequests = [];
        this.cpu = cpu;

    }

    public isExecuting: boolean = false;

    // Contains all IRQ enabled hardware
    private irqHardware: Interrupt[];

    // Contains a buffer of IRQ hardware currently requesting a interrupt
    private irqRequests: Interrupt[];

    // The interrupt controller needs to know how to talk to the CPU, to send interrupts
    private cpu: Cpu;

    public init(): void {
        this.isExecuting = false;
    }

    /*
    Hardware that wishes to be assigned an IRQ number is added here.
     */
    public addIrq(irqHardware: Interrupt) {

        //assign the irq number based on the index in the irqHardware array assigned.
        irqHardware.irq = this.irqHardware.length;

        this.irqHardware.push(irqHardware);

    }

    public acceptInterrupt(interrupt: Interrupt) {
        this.irqRequests.push(interrupt);
    }

    /*

     */
    pulse(): void {

        this.log("Received Clock Pulse" + " - " + "Current Queue: " + this.irqRequests.length);

    }
}