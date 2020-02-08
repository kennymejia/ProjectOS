import {Hardware} from "./Hardware";
import {Interrupt} from "./imp/Interrupt";
import {ClockListener} from "./imp/ClockListener";
import {Cpu} from "./Cpu";
import {getPriority} from "os";
import {stringify} from "querystring";

export class InterruptController extends Hardware implements ClockListener {

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
    public irqRequests: Interrupt[];

    // The interrupt controller needs to know how to talk to the CPU, to send interrupts
    public cpu: Cpu;

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

    // accepting the interrupt from other devices
    public acceptInterrupt(interrupt: Interrupt) {

        console.log(interrupt.outputBuffer.printQueue());

        // accepting the interrupt from the hardware
        this.irqRequests.push(interrupt);
    }

    /*
        Interrupt Controller acts on the clock pulse, implementation goes here.
     */
    pulse(): void {

        // sending irq requests to the cpu one at a time
        if (this.irqRequests.length > 0) {

            // logging the queue size and confirmation about the pulse
            this.log("Received Clock Pulse" + " - " + "Current Queue Size: " + this.irqRequests.length);
            
            // looping through the priorities starting with the highest
            for (let priority = 2; priority > -2; priority--) {
                
                // looping each irqRequest starting with the first one to see if its the highest priority
                for (let index = 0; index < this.irqRequests.length; index++) {
    
                    // check current element to see if its the highest priority
                    if(this.irqRequests[index].priority == priority) {
                        // sending the interrupt to the CPU and removing it from the irqRequests
                        this.cpu.setInterrupt(this.irqRequests[index]);
                        this.irqRequests.splice(index,1);
                        break;
                    }
                        
                }
            }                
        }
    }
}