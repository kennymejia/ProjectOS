import {Hardware} from "./Hardware";
import {Interrupt} from "./imp/Interrupt";
import {ClockListener} from "./imp/ClockListener";
import {Cpu} from "./Cpu";
import { getPriority } from "os";
import { stringify } from "querystring";


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
        
        this.log( "IRQ: " + this.irqHardware[irqHardware.irq].irq + 
                  " Assigned to Name: " + this.irqHardware[irqHardware.irq].name + 
                  " Added - Priority: " + this.irqHardware[irqHardware.irq].priority );

    }

    public acceptInterrupt(interrupt: Interrupt) {

        this.irqRequests.push(interrupt);
        
        // highest priority interrupt is on top and lowest is on the bottom 
        if(this.irqRequests[this.irqRequests.length-1].priority == 2) {

        }

        else if(this.irqRequests[this.irqRequests.length-1].priority == 1) {
                
        }

        else if(this.irqRequests[this.irqRequests.length-1].priority == 0) {        

            // sending the interrupt to the CPU
            this.cpu.setInterrupt(this.irqRequests[this.irqRequests.length-1]);
        }

        else if(this.irqRequests[this.irqRequests.length-1].priority == -1) {
                
        }

        this.irqRequests.pop();

    }

    /*

     */
    pulse(): void {

        if (this.irqRequests.length > 0)
            this.log("Received Clock Pulse" + " - " + "Current Queue Size: " + this.irqRequests.length);
        
    }
}